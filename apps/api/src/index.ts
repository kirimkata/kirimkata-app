import { Hono } from 'hono';
import type { Env } from './lib/types';
import { corsMiddleware } from './middleware/cors';
import { loggerMiddleware } from './middleware/logger';

// Import route modules
import authRoutes from './routes/v1/auth';
import guestsRoutes from './routes/v1/guests';
import checkinRoutes from './routes/v1/checkin';
import clientRoutes from './routes/v1/client';
import mediaRoutes from './routes/v1/media';
import adminRoutes from './routes/v1/admin';
import guestbookEventsRoutes from './routes/v1/guestbook-events';
import guestbookGuestTypesRoutes from './routes/v1/guestbook-guest-types';
import guestbookGuestsRoutes from './routes/v1/guestbook-guests';
import guestbookBenefitsRoutes from './routes/v1/guestbook-benefits';
import guestbookSeatingRoutes from './routes/v1/guestbook-seating';
import guestbookCheckinRoutes from './routes/v1/guestbook-checkin';
import sharedRoutes from './routes/v1/shared';

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
app.route('/v1/client', clientRoutes);
app.route('/v1/media', mediaRoutes);
app.route('/v1/admin', adminRoutes);

// Guestbook routes
app.route('/v1/guestbook/events', guestbookEventsRoutes);
app.route('/v1/guestbook/guest-types', guestbookGuestTypesRoutes);
app.route('/v1/guestbook/guests', guestbookGuestsRoutes);
app.route('/v1/guestbook/benefits', guestbookBenefitsRoutes);
app.route('/v1/guestbook/seating', guestbookSeatingRoutes);
app.route('/v1/guestbook/checkin', guestbookCheckinRoutes);

// Shared routes
app.route('/v1/shared', sharedRoutes);

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
