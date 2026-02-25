import { Hono } from 'hono';
import type { Env } from '../../lib/types';
import { getDb } from '../../db';
import { weddingRegistrationRepo } from '../../repositories/weddingRegistrationRepository';
import { InvitationRepository } from '../../repositories/invitationRepository';
import { invitationCompiler } from '../../services-invitation/invitationCompilerService';
import { clientAuthMiddleware } from '../../middleware/auth';
import { RateLimiter } from '../../middleware/rateLimit';

const router = new Hono<{ Bindings: Env; Variables: { clientId: string } }>();

const registrationRateLimiter = new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 requests per minute
    message: 'Too many registration requests from this IP.'
});

// Apply rate limiting to all routes
router.use('*', registrationRateLimiter.middleware());

/**
 * POST /v1/registration
 * Create new wedding registration
 * Requires authentication
 */
router.post('/', clientAuthMiddleware, async (c) => {
    try {
        const body = await c.req.json();
        const clientId = c.get('clientId') as string; // Get from JWT token

        // Validate required fields (removed client_id from required fields)
        const requiredFields = ['slug', 'bride_name', 'bride_full_name', 'groom_name', 'groom_full_name', 'event1_date', 'event1_time'];
        for (const field of requiredFields) {
            if (!body[field]) {
                return c.json({ error: `Missing required field: ${field}` }, 400);
            }
        }

        // Check if slug is available
        const slugAvailable = await weddingRegistrationRepo.isSlugAvailable(c.env, body.slug);
        if (!slugAvailable) {
            return c.json({ error: 'Slug already exists' }, 409);
        }

        // Create wedding registration (use clientId from JWT)
        const registration = await weddingRegistrationRepo.create(c.env, {
            client_id: clientId, // Use authenticated client_id
            slug: body.slug,
            event_type: body.event_type || 'islam',
            custom_event1_label: body.custom_event1_label,
            custom_event2_label: body.custom_event2_label,
            bride_name: body.bride_name,
            bride_full_name: body.bride_full_name,
            bride_father_name: body.bride_father_name,
            bride_mother_name: body.bride_mother_name,
            bride_instagram: body.bride_instagram,
            groom_name: body.groom_name,
            groom_full_name: body.groom_full_name,
            groom_father_name: body.groom_father_name,
            groom_mother_name: body.groom_mother_name,
            groom_instagram: body.groom_instagram,
            event1_date: body.event1_date,
            event2_same_date: body.event2_same_date ?? false,
            event2_date: body.event2_date,
            timezone: body.timezone || 'WIB',
            event1_time: body.event1_time,
            event1_end_time: body.event1_end_time,
            event1_venue_name: body.event1_venue_name,
            event1_venue_address: body.event1_venue_address,
            event1_venue_city: body.event1_venue_city,
            event1_venue_province: body.event1_venue_province,
            event1_maps_url: body.event1_maps_url,
            event2_same_venue: body.event2_same_venue ?? false,
            event2_time: body.event2_time,
            event2_end_time: body.event2_end_time,
            event2_venue_name: body.event2_venue_name,
            event2_venue_address: body.event2_venue_address,
            event2_venue_city: body.event2_venue_city,
            event2_venue_province: body.event2_venue_province,
            event2_maps_url: body.event2_maps_url,
        });

        // Compile initial invitation content
        try {
            await invitationCompiler.compileAndCache(c.env, registration.slug);
        } catch (compileError) {
            console.error('Error compiling initial invitation:', compileError);
            // Don't fail the registration, just log the error
        }

        return c.json({
            success: true,
            data: registration,
            message: 'Wedding registration created successfully'
        });

    } catch (error: any) {
        console.error('Error creating wedding registration:', error);
        return c.json({
            error: error.message || 'Failed to create wedding registration'
        }, 500);
    }
});

/**
 * GET /v1/registration/:slug
 * Get wedding registration by slug
 * Requires authentication and ownership
 */
router.get('/:slug', clientAuthMiddleware, async (c) => {
    try {
        const slug = c.req.param('slug');
        const clientId = c.get('clientId') as string;

        const registration = await weddingRegistrationRepo.findBySlug(c.env, slug);

        if (!registration) {
            return c.json({ error: 'Registration not found' }, 404);
        }

        // Ownership validation
        if (registration.client_id !== clientId) {
            return c.json({ error: 'Unauthorized access to this registration' }, 403);
        }

        return c.json({
            success: true,
            data: registration
        });

    } catch (error: any) {
        console.error('Error fetching wedding registration:', error);
        return c.json({
            error: error.message || 'Failed to fetch wedding registration'
        }, 500);
    }
});

/**
 * PUT /v1/registration/:slug
 * Update wedding registration
 * Requires authentication and ownership
 */
router.put('/:slug', clientAuthMiddleware, async (c) => {
    try {
        const slug = c.req.param('slug');
        const clientId = c.get('clientId') as string;

        const registration = await weddingRegistrationRepo.findBySlug(c.env, slug);

        if (!registration) {
            return c.json({ error: 'Registration not found' }, 404);
        }

        // Ownership validation
        if (registration.client_id !== clientId) {
            return c.json({ error: 'Unauthorized access to this registration' }, 403);
        }

        const updates = await c.req.json();
        const updated = await weddingRegistrationRepo.update(c.env, registration.id, updates);

        // Recompile invitation after update
        try {
            await invitationCompiler.compileAndCache(c.env, slug);
        } catch (compileError) {
            console.error('Error recompiling invitation:', compileError);
        }

        return c.json({
            success: true,
            data: updated,
            message: 'Wedding registration updated successfully'
        });

    } catch (error: any) {
        console.error('Error updating wedding registration:', error);
        return c.json({
            error: error.message || 'Failed to update wedding registration'
        }, 500);
    }
});

/**
 * GET /v1/registration/:slug
 * Fetch wedding registration by slug
 * Requires authentication
 */
router.get('/:slug', clientAuthMiddleware, async (c) => {
    try {
        const slug = c.req.param('slug');
        const clientId = c.get('clientId') as string;

        const registration = await weddingRegistrationRepo.findBySlug(c.env, slug);
        if (!registration) {
            return c.json({ error: 'Registration not found' }, 404);
        }
        if (registration.client_id !== clientId) {
            return c.json({ error: 'Unauthorized' }, 403);
        }

        return c.json({ success: true, data: registration });
    } catch (error: any) {
        console.error('Error fetching wedding registration:', error);
        return c.json({ error: error.message || 'Failed to fetch wedding registration' }, 500);
    }
});

/**
 * POST /v1/registration/:slug/publish
 * Publish invitation (set isActive = true)
 * Requires authentication and ownership
 */
router.post('/:slug/publish', clientAuthMiddleware, async (c) => {
    try {
        const slug = c.req.param('slug');
        const clientId = c.get('clientId') as string;

        const invitationRepo = new InvitationRepository(getDb(c.env), c.env);

        const invitation = await invitationRepo.findBySlug(slug);
        if (!invitation) {
            return c.json({ error: 'Invitation not found' }, 404);
        }
        if (invitation.clientId && invitation.clientId !== clientId) {
            return c.json({ error: 'Unauthorized' }, 403);
        }

        // Compile latest data before publishing
        try {
            await invitationCompiler.compileAndCache(c.env, slug);
        } catch (compileError) {
            console.error('Error compiling before publish:', compileError);
        }

        await invitationRepo.activate(invitation.id);

        return c.json({ success: true, message: 'Invitation published successfully' });
    } catch (error: any) {
        console.error('Error publishing invitation:', error);
        return c.json({ error: error.message || 'Failed to publish invitation' }, 500);
    }
});

/**
 * POST /v1/registration/:slug/unpublish
 * Unpublish invitation (set isActive = false)
 * Requires authentication and ownership
 */
router.post('/:slug/unpublish', clientAuthMiddleware, async (c) => {
    try {
        const slug = c.req.param('slug');
        const clientId = c.get('clientId') as string;

        const invitationRepo = new InvitationRepository(getDb(c.env), c.env);

        const invitation = await invitationRepo.findBySlug(slug);
        if (!invitation) {
            return c.json({ error: 'Invitation not found' }, 404);
        }
        if (invitation.clientId && invitation.clientId !== clientId) {
            return c.json({ error: 'Unauthorized' }, 403);
        }

        await invitationRepo.deactivate(invitation.id);

        return c.json({ success: true, message: 'Invitation unpublished successfully' });
    } catch (error: any) {
        console.error('Error unpublishing invitation:', error);
        return c.json({ error: error.message || 'Failed to unpublish invitation' }, 500);
    }
});

export default router;
