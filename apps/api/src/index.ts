import { Hono } from 'hono';
import type { Env } from './lib/types';
import { corsMiddleware } from './middleware/cors';
import { loggerMiddleware } from './middleware/logger';
import { initEnv } from './lib/supabase';

// Import route modules
import authRoutes from './routes/v1/auth';
import guestsRoutes from './routes/v1/guests';
import checkinRoutes from './routes/v1/checkin';
import clientRoutes from './routes/v1/client';
import mediaRoutes from './routes/v1/media';
import adminRoutes from './routes/v1/admin';
import wishesRoutes from './routes/v1/wishes';
import guestbookEventsRoutes from './routes/v1/guestbook-events';
import guestbookGuestTypesRoutes from './routes/v1/guestbook-guest-types';
import guestbookGuestsRoutes from './routes/v1/guestbook-guests';
import guestbookBenefitsRoutes from './routes/v1/guestbook-benefits';
import guestbookSeatingRoutes from './routes/v1/guestbook-seating';
import guestbookCheckinRoutes from './routes/v1/guestbook-checkin';
import guestbookAdvancedRoutes from './routes/v1/guestbook-advanced';
import guestbookQrRoutes from './routes/v1/guestbook-qr';
import guestbookExportRoutes from './routes/v1/guestbook-export';
import sharedRoutes from './routes/v1/shared';
import registrationRoutes from './routes/v1/registration';
import invitationsRoutes from './routes/v1/invitations';
import eventsRoutes from './routes/v1/events';

// Create main Hono app
const app = new Hono<{ Bindings: Env }>();

// Initialize env for each request (must be first)
app.use('*', async (c, next) => {
    initEnv(c.env);
    await next();
});

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

// Public routes (no authentication required)
app.route('/v1/wishes', wishesRoutes);

// Guestbook routes
app.route('/v1/guestbook/events', guestbookEventsRoutes);
app.route('/v1/guestbook/guest-types', guestbookGuestTypesRoutes);
app.route('/v1/guestbook/guests', guestbookGuestsRoutes);
app.route('/v1/guestbook/benefits', guestbookBenefitsRoutes);
app.route('/v1/guestbook/seating', guestbookSeatingRoutes);
app.route('/v1/guestbook/checkin', guestbookCheckinRoutes);

// Guestbook advanced features (Phase 2)
app.route('/v1/guestbook/advanced', guestbookAdvancedRoutes);
app.route('/v1/guestbook/qr', guestbookQrRoutes);
app.route('/v1/guestbook/export', guestbookExportRoutes);

// Shared routes
app.route('/v1/shared', sharedRoutes);

// Wedding invitation routes
app.route('/v1/registration', registrationRoutes);
app.route('/v1/invitations', invitationsRoutes);
app.route('/v1/events', eventsRoutes);

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
