import { SignJWT, jwtVerify } from 'jose';
import type { Env } from '@/lib/types';
import type { JWTPayload, ClientJWTPayload, StaffJWTPayload, AdminJWTPayload } from '@/lib/types';

/**
 * Generate JWT token
 */
export async function generateToken(
    payload: JWTPayload,
    secret: string,
    expiresIn: string = '7d'
): Promise<string> {
    const secretKey = new TextEncoder().encode(secret);

    const jwt = await new SignJWT(payload as any)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(expiresIn)
        .sign(secretKey);

    return jwt;
}

/**
 * Verify JWT token and return payload
 */
export async function verifyToken(
    token: string,
    secret: string
): Promise<JWTPayload | null> {
    try {
        const secretKey = new TextEncoder().encode(secret);
        const { payload } = await jwtVerify(token, secretKey);

        return payload as JWTPayload;
    } catch (error) {
        console.error('JWT verification error:', error);
        return null;
    }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader) return null;

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }

    return parts[1];
}

/**
 * Verify QR token (for guest check-in)
 * QR token is just the guest ID
 */
export function verifyQRToken(qrToken: string): string | null {
    // In the current implementation, QR token is just the guest ID
    // You can enhance this with encryption/signing if needed
    return qrToken;
}
