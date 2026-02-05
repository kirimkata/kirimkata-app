import { cors } from 'hono/cors';

/**
 * CORS middleware configuration
 * Allows requests from Vercel-hosted frontends
 */
export const corsMiddleware = cors({
    origin: (origin) => {
        const allowedOrigins = [
            'https://invitation.kirimkata.com',
            'https://guestbook.kirimkata.com',
            'https://kirimkata.com',
            'http://localhost:3000',
            'http://localhost:3001',
            'https://kirimkata-app-invitation.vercel.app',
        ];

        // Access allowed origins directly
        if (allowedOrigins.includes(origin)) {
            return origin;
        }

        // Check for Vercel preview deployments
        if (origin && /https:\/\/.*\.vercel\.app$/.test(origin)) {
            return origin;
        }

        return undefined; // Block other origins
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'x-client-id'],
    credentials: true,
    maxAge: 86400, // 24 hours
});
