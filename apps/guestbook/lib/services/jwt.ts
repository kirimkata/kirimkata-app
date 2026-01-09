import jwt from 'jsonwebtoken';
import { JWTPayload, QRTokenPayload } from '../types';

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

/**
 * Get QR JWT secret from environment variable
 */
function getQRJWTSecret(): string {
  const secret = process.env.QR_JWT_SECRET;
  if (!secret) {
    throw new Error('QR_JWT_SECRET is not set in environment variables');
  }
  return secret;
}

/**
 * Generate JWT token for client authentication (guestbook owner)
 */
export function generateClientToken(
  payload: Omit<import('../types').ClientJWTPayload, 'exp' | 'iat' | 'type'>,
  expiresIn: string = '8h'
): string {
  const secret = getJWTSecret();
  const fullPayload = {
    ...payload,
    type: 'CLIENT' as const,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (parseInt(expiresIn.replace('h', '')) * 60 * 60)
  };
  return jwt.sign(fullPayload, secret);
}

/**
 * Generate JWT token for staff authentication
 */
export function generateStaffToken(
  payload: Omit<import('../types').StaffJWTPayload, 'exp' | 'iat' | 'type'>,
  expiresIn: string = '8h'
): string {
  const secret = getJWTSecret();
  const fullPayload = {
    ...payload,
    type: 'STAFF' as const,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (parseInt(expiresIn.replace('h', '')) * 60 * 60)
  };
  return jwt.sign(fullPayload, secret);
}

/**
 * Verify and decode JWT token (client or staff)
 */
export function verifyToken(token: string): import('../types').JWTPayload | null {
  try {
    const secret = getJWTSecret();
    const decoded = jwt.verify(token, secret) as import('../types').JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Verify and decode client JWT token
 */
export function verifyClientToken(token: string): import('../types').ClientJWTPayload | null {
  try {
    const secret = getJWTSecret();
    const decoded = jwt.verify(token, secret) as import('../types').JWTPayload;
    if (decoded.type === 'CLIENT') {
      return decoded as import('../types').ClientJWTPayload;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Verify and decode staff JWT token
 */
export function verifyStaffToken(token: string): import('../types').StaffJWTPayload | null {
  try {
    const secret = getJWTSecret();
    const decoded = jwt.verify(token, secret) as import('../types').JWTPayload;
    if (decoded.type === 'STAFF') {
      return decoded as import('../types').StaffJWTPayload;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Generate QR token for guest check-in
 * Uses invitation_guests.id as the primary identifier
 */
export function generateQRToken(payload: Omit<QRTokenPayload, 'exp' | 'iat' | 'nonce'>): string {
  const secret = getQRJWTSecret();
  const nonce = Math.random().toString(36).substring(2, 15);
  const fullPayload: QRTokenPayload = {
    ...payload,
    nonce,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days for wedding events
  };
  
  return jwt.sign(fullPayload, secret);
}

/**
 * Verify and decode QR token
 */
export function verifyQRToken(token: string): QRTokenPayload | null {
  try {
    const secret = getQRJWTSecret();
    const decoded = jwt.verify(token, secret) as QRTokenPayload;
    return decoded;
  } catch (error) {
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
 * Generate a secure hash for QR token storage
 */
export function hashQRToken(token: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(token).digest('hex');
}
