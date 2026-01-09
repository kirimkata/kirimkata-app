const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

// Read .env file manually
function loadEnv() {
    const envPath = path.join(__dirname, '..', '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};

    envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
                envVars[key.trim()] = valueParts.join('=').trim();
            }
        }
    });

    return envVars;
}

const env = loadEnv();

function encrypt(text) {
    const key = env.ENCRYPTION_KEY;
    if (!key || key.length !== 64) {
        throw new Error('ENCRYPTION_KEY must be 64 hex characters in .env file');
    }

    const keyBuffer = Buffer.from(key, 'hex');
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
}

// Encrypt password 'admin123'
const encryptedPassword = encrypt('admin123');

console.log('\n=== Admin User SQL ===\n');
console.log('Copy and paste this SQL into your Supabase SQL Editor:\n');
console.log(`INSERT INTO admins (username, password_encrypted, email)
VALUES ('admin', '${encryptedPassword}', 'admin@kirimkata.com')
ON CONFLICT (username) DO NOTHING;`);
console.log('\n');
