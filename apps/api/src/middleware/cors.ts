import { cors } from 'hono/cors';

/**
 * CORS middleware configuration
 * Allows requests from Vercel-hosted frontends
 */
export const corsMiddleware = cors({
    origin: [
        'https://invitation.kirimkata.com',
        'https://guestbook.kirimkata.com',
        'http://localhost:3000',
        'http://localhost:3001',
        // Add preview deployments pattern
        /https:\/\/.*\.vercel\.app$/,
    ],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'x-client-id'],
    credentials: true,
    maxAge: 86400, // 24 hours
});
