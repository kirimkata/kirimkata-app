import { Hono } from 'hono';
import type { Env } from '@/lib/types';
import { clientAuthMiddleware } from '@/middleware/auth';
import { eventRepository } from '@/repositories/eventRepository';

const events = new Hono<{ Bindings: Env; Variables: { clientId: string; jwtPayload: any } }>();

/**
 * POST /v1/events
 * Create new event (requires client auth)
 */
events.post('/', clientAuthMiddleware, async (c) => {
    try {
        const body = await c.req.json();
        const clientId = c.get('clientId');

        if (!clientId) {
            return c.json(
                { success: false, error: 'Client ID not found in token' },
                401
            );
        }

        const { name, event_date, location, slug } = body;

        // Validate required fields
        if (!name || !event_date) {
            return c.json(
                { success: false, error: 'Name and event_date are required' },
                400
            );
        }

        // Validate slug if provided
        if (slug) {
            // Check slug format
            if (!/^[a-z0-9-]+$/.test(slug)) {
                return c.json(
                    { success: false, error: 'Slug can only contain lowercase letters, numbers, and hyphens' },
                    400
                );
            }

            // Check slug availability
            const isAvailable = await eventRepository.isSlugAvailable(slug, c.env);
            if (!isAvailable) {
                return c.json(
                    { success: false, error: 'Slug is already taken' },
                    409
                );
            }
        }

        // Create event
        const event = await eventRepository.create(
            {
                client_id: clientId,
                name,
                event_date,
                location,
                slug,
                has_invitation: body.has_invitation ?? true,
                has_guestbook: body.has_guestbook ?? false,
            },
            c.env
        );

        return c.json({
            success: true,
            data: event,
            message: 'Event created successfully',
        });
    } catch (error: any) {
        console.error('Create event error:', error);
        return c.json(
            { success: false, error: error.message || 'Failed to create event' },
            500
        );
    }
});

/**
 * GET /v1/events
 * Get all events for authenticated client
 */
events.get('/', clientAuthMiddleware, async (c) => {
    try {
        const clientId = c.get('clientId');

        if (!clientId) {
            return c.json(
                { success: false, error: 'Client ID not found in token' },
                401
            );
        }

        const events = await eventRepository.findByClientId(clientId, c.env);

        return c.json({
            success: true,
            data: events,
        });
    } catch (error: any) {
        console.error('Get events error:', error);
        return c.json(
            { success: false, error: error.message || 'Failed to fetch events' },
            500
        );
    }
});

/**
 * GET /v1/events/:id
 * Get specific event by ID (requires client auth and ownership)
 */
events.get('/:id', clientAuthMiddleware, async (c) => {
    try {
        const clientId = c.get('clientId');
        const eventId = c.req.param('id');

        if (!clientId) {
            return c.json(
                { success: false, error: 'Client ID not found in token' },
                401
            );
        }

        const event = await eventRepository.findById(eventId, c.env);

        if (!event) {
            return c.json(
                { success: false, error: 'Event not found' },
                404
            );
        }

        // Verify ownership
        if (event.client_id !== clientId) {
            return c.json(
                { success: false, error: 'Access denied' },
                403
            );
        }

        return c.json({
            success: true,
            data: event,
        });
    } catch (error: any) {
        console.error('Get event error:', error);
        return c.json(
            { success: false, error: error.message || 'Failed to fetch event' },
            500
        );
    }
});

/**
 * PUT /v1/events/:id
 * Update event (requires client auth and ownership)
 */
events.put('/:id', clientAuthMiddleware, async (c) => {
    try {
        const clientId = c.get('clientId');
        const eventId = c.req.param('id');
        const body = await c.req.json();

        if (!clientId) {
            return c.json(
                { success: false, error: 'Client ID not found in token' },
                401
            );
        }

        // Check event exists and ownership
        const existingEvent = await eventRepository.findById(eventId, c.env);

        if (!existingEvent) {
            return c.json(
                { success: false, error: 'Event not found' },
                404
            );
        }

        if (existingEvent.client_id !== clientId) {
            return c.json(
                { success: false, error: 'Access denied' },
                403
            );
        }

        // Validate slug if being updated
        if (body.slug && body.slug !== existingEvent.slug) {
            if (!/^[a-z0-9-]+$/.test(body.slug)) {
                return c.json(
                    { success: false, error: 'Slug can only contain lowercase letters, numbers, and hyphens' },
                    400
                );
            }

            const isAvailable = await eventRepository.isSlugAvailable(body.slug, c.env);
            if (!isAvailable) {
                return c.json(
                    { success: false, error: 'Slug is already taken' },
                    409
                );
            }
        }

        // Update event
        const updatedEvent = await eventRepository.update(
            eventId,
            {
                name: body.name,
                event_date: body.event_date,
                location: body.location,
                slug: body.slug,
                has_invitation: body.has_invitation,
                has_guestbook: body.has_guestbook,
                is_active: body.is_active,
            },
            c.env
        );

        return c.json({
            success: true,
            data: updatedEvent,
            message: 'Event updated successfully',
        });
    } catch (error: any) {
        console.error('Update event error:', error);
        return c.json(
            { success: false, error: error.message || 'Failed to update event' },
            500
        );
    }
});

/**
 * DELETE /v1/events/:id
 * Delete event (requires client auth and ownership)
 */
events.delete('/:id', clientAuthMiddleware, async (c) => {
    try {
        const clientId = c.get('clientId');
        const eventId = c.req.param('id');

        if (!clientId) {
            return c.json(
                { success: false, error: 'Client ID not found in token' },
                401
            );
        }

        // Check event exists and ownership
        const event = await eventRepository.findById(eventId, c.env);

        if (!event) {
            return c.json(
                { success: false, error: 'Event not found' },
                404
            );
        }

        if (event.client_id !== clientId) {
            return c.json(
                { success: false, error: 'Access denied' },
                403
            );
        }

        // Delete event
        await eventRepository.delete(eventId, c.env);

        return c.json({
            success: true,
            message: 'Event deleted successfully',
        });
    } catch (error: any) {
        console.error('Delete event error:', error);
        return c.json(
            { success: false, error: error.message || 'Failed to delete event' },
            500
        );
    }
});

export default events;
