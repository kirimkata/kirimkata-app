import jwt, { SignOptions } from 'jsonwebtoken';

/**
 * Get JWT secret from environment variable
 */
function getJWTSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not set in environment variables');
    }
    return secret;
}

export interface JWTPayload {
    userId: string;
    username: string;
    type: 'admin' | 'client';
}

/**
 * Generate JWT token
 * @param payload - Data to encode in token
 * @param expiresIn - Token expiration time (default: 24h)
 * @returns JWT token string
 */
export function generateToken(payload: JWTPayload, expiresIn: string = '24h'): string {
    const secret = getJWTSecret();
    return jwt.sign(payload, secret, { expiresIn } as SignOptions);
}

/**
 * Verify and decode JWT token
 * @param token - JWT token to verify
 * @returns Decoded payload or null if invalid
 */
export function verifyToken(token: string): JWTPayload | null {
    try {
        const secret = getJWTSecret();
        const decoded = jwt.verify(token, secret) as JWTPayload;
        return decoded;
    } catch (error) {
        console.error('JWT Verification Error:', error);
        return null;
    }
}

/**
 * Extract token from Authorization header
 * @param authHeader - Authorization header value
 * @returns Token string or null
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader) return null;

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }

    return parts[1];
}
