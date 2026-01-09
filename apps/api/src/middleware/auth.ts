import { Context, Next } from 'hono';
import type { Env } from '@/lib/types';
import { verifyToken, extractTokenFromHeader } from '@/services/jwt';

/**
 * Authentication middleware
 * Verifies JWT token and attaches payload to context
 */
export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
    const authHeader = c.req.header('Authorization');
    const token = extractTokenFromHeader(authHeader || null);

    if (!token) {
        return c.json(
            { success: false, error: 'Unauthorized - no token provided' },
            401
        );
    }

    const payload = await verifyToken(token, c.env.JWT_SECRET);

    if (!payload) {
        return c.json(
            { success: false, error: 'Unauthorized - invalid token' },
            401
        );
    }

    // Attach payload to context for use in route handlers
    c.set('jwtPayload', payload);

    await next();
}

/**
 * Client authentication middleware
 * Ensures user is authenticated as CLIENT
 */
export async function clientAuthMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
    const authHeader = c.req.header('Authorization');
    const token = extractTokenFromHeader(authHeader || null);

    if (!token) {
        return c.json(
            { success: false, error: 'Unauthorized - no token provided' },
            401
        );
    }

    const payload = await verifyToken(token, c.env.JWT_SECRET);

    if (!payload || payload.type !== 'CLIENT') {
        return c.json(
            { success: false, error: 'Unauthorized - client access required' },
            401
        );
    }

    c.set('jwtPayload', payload);
    c.set('clientId', payload.client_id);

    await next();
}

/**
 * Staff authentication middleware
 * Ensures user is authenticated as STAFF
 */
export async function staffAuthMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
    const authHeader = c.req.header('Authorization');
    const token = extractTokenFromHeader(authHeader || null);

    if (!token) {
        return c.json(
            { success: false, error: 'Unauthorized - no token provided' },
            401
        );
    }

    const payload = await verifyToken(token, c.env.JWT_SECRET);

    if (!payload || payload.type !== 'STAFF') {
        return c.json(
            { success: false, error: 'Unauthorized - staff access required' },
            401
        );
    }

    c.set('jwtPayload', payload);
    c.set('staffId', payload.staff_id);
    c.set('clientId', payload.client_id);

    await next();
}

/**
 * Admin authentication middleware
 * Ensures user is authenticated as ADMIN
 */
export async function adminAuthMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
    const authHeader = c.req.header('Authorization');
    const token = extractTokenFromHeader(authHeader || null);

    if (!token) {
        return c.json(
            { success: false, error: 'Unauthorized - no token provided' },
            401
        );
    }

    const payload = await verifyToken(token, c.env.JWT_SECRET);

    if (!payload || payload.type !== 'ADMIN') {
        return c.json(
            { success: false, error: 'Unauthorized - admin access required' },
            401
        );
    }

    c.set('jwtPayload', payload);

    await next();
}

/**
 * Optional authentication middleware
 * Does not fail if no token provided, but attaches payload if valid
 */
export async function optionalAuthMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
    const authHeader = c.req.header('Authorization');
    const token = extractTokenFromHeader(authHeader || null);

    if (token) {
        const payload = await verifyToken(token, c.env.JWT_SECRET);
        if (payload) {
            c.set('jwtPayload', payload);

            if (payload.type === 'CLIENT') {
                c.set('clientId', payload.client_id);
            } else if (payload.type === 'STAFF') {
                c.set('staffId', payload.staff_id);
                c.set('clientId', payload.client_id);
            }
        }
    }

    await next();
}
