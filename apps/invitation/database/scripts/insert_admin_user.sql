-- Script to create initial admin user
-- Run this after adding ENCRYPTION_KEY to .env and running the migration

-- First, you need to encrypt 'admin123' using your encryption key
-- You can do this by running the Node.js script below in a separate file:

/*
const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
const ENCRYPTION_KEY = 'YOUR_ENCRYPTION_KEY_HERE'; // 64 hex characters

function encrypt(text) {
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${iv.toString('hex')}:${encrypted}`;
}

console.log('Encrypted password:', encrypt('admin123'));
*/

-- Then insert the admin user with the encrypted password:
-- INSERT INTO admins (username, password_encrypted, email)
-- VALUES ('admin', 'ENCRYPTED_PASSWORD_HERE', 'admin@kirimkata.com');
