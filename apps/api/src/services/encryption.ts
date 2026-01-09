/**
 * Encryption service for Cloudflare Workers
 * Uses Web Crypto API (edge-compatible)
 */

const ALGORITHM = 'AES-CBC';
const IV_LENGTH = 16;

/**
 * Get encryption key from environment
 */
function getEncryptionKey(keyHex: string): Promise<CryptoKey> {
    // Convert hex string to buffer
    const keyBuffer = hexToArrayBuffer(keyHex);

    return crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: ALGORITHM },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Convert hex string to ArrayBuffer
 */
function hexToArrayBuffer(hex: string): ArrayBuffer {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes.buffer;
}

/**
 * Convert ArrayBuffer to hex string
 */
function arrayBufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Encrypt text using AES-256-CBC
 */
export async function encrypt(text: string, encryptionKeyHex: string): Promise<string> {
    const key = await getEncryptionKey(encryptionKeyHex);
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    const encrypted = await crypto.subtle.encrypt(
        { name: ALGORITHM, iv },
        key,
        new TextEncoder().encode(text)
    );

    const ivHex = arrayBufferToHex(iv.buffer);
    const encryptedHex = arrayBufferToHex(encrypted);

    return `${ivHex}:${encryptedHex}`;
}

/**
 * Decrypt text using AES-256-CBC
 */
export async function decrypt(encryptedText: string, encryptionKeyHex: string): Promise<string> {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
        throw new Error('Invalid encrypted text format');
    }

    const key = await getEncryptionKey(encryptionKeyHex);
    const iv = hexToArrayBuffer(parts[0]);
    const encrypted = hexToArrayBuffer(parts[1]);

    const decrypted = await crypto.subtle.decrypt(
        { name: ALGORITHM, iv },
        key,
        encrypted
    );

    return new TextDecoder().decode(decrypted);
}

/**
 * Compare password with encrypted hash
 */
export async function comparePassword(
    password: string,
    encryptedPassword: string,
    encryptionKeyHex: string
): Promise<boolean> {
    try {
        const decrypted = await decrypt(encryptedPassword, encryptionKeyHex);
        return password === decrypted;
    } catch {
        return false;
    }
}

/**
 * Hash password using encryption
 */
export async function hashPassword(
    password: string,
    encryptionKeyHex: string
): Promise<string> {
    return encrypt(password, encryptionKeyHex);
}

/**
 * Generate random string
 */
export function generateRandomString(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomValues = crypto.getRandomValues(new Uint8Array(length));

    for (let i = 0; i < length; i++) {
        result += chars.charAt(randomValues[i] % chars.length);
    }

    return result;
}
