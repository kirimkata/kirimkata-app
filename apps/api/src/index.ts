import { Hono } from 'hono';
import type { Env } from './lib/types';
import { corsMiddleware } from './middleware/cors';
import { loggerMiddleware } from './middleware/logger';

// Import route modules
import authRoutes from './routes/v1/auth';
import guestsRoutes from './routes/v1/guests';
import checkinRoutes from './routes/v1/checkin';

// Create main Hono app
const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', corsMiddleware);
app.use('*', loggerMiddleware);

// Health check endpoint
app.get('/health', (c) => {
    return c.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});

// API v1 routes
app.route('/v1/auth', authRoutes);
app.route('/v1/guests', guestsRoutes);
app.route('/v1/checkin', checkinRoutes);

// 404 handler
app.notFound((c) => {
    return c.json(
        {
            success: false,
            error: 'Not Found',
            path: c.req.path,
        },
        404
    );
});

// Error handler
app.onError((err, c) => {
    console.error('Unhandled error:', err);
    return c.json(
        {
            success: false,
            error: 'Internal Server Error',
            message: err.message,
        },
        500
    );
});

export default app;
