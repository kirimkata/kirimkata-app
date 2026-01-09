const crypto = require('crypto');

// Generate 32-byte (256-bit) encryption key
const encryptionKey = crypto.randomBytes(32).toString('hex');

// Generate JWT secret
const jwtSecret = crypto.randomBytes(64).toString('hex');

console.log('Add these to your .env file:\n');
console.log(`ENCRYPTION_KEY=${encryptionKey}`);
console.log(`JWT_SECRET=${jwtSecret}`);
