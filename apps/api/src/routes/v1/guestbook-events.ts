import { Hono } from 'hono';
import type { Env } from '@/lib/types';
import { clientAuthMiddleware } from '@/middleware/auth';
import { getDb } from '@/db';
import { guestbookEvents, guests, guestTypes, invitationPages } from '@/db/schema';
import { eq, desc, and, sql, isNotNull } from 'drizzle-orm';

const guestbookEventsRouter = new Hono<{
    Bindings: Env;
    Variables: {
        clientId: string;
        jwtPayload: any;
    };
}>();

// All routes require client authentication
guestbookEventsRouter.use('*', clientAuthMiddleware);

/**
 * GET /v1/guestbook/events
 * Get all events for client
 */
guestbookEventsRouter.get('/', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const db = getDb(c.env);

        const events = await db
            .select()
            .from(guestbookEvents)
            .where(eq(guestbookEvents.clientId, clientId))
            .orderBy(desc(guestbookEvents.eventDate));

        return c.json({
            success: true,
            data: events || [],
        });
    } catch (error) {
        console.error('Get events error:', error);
        return c.json(
            { success: false, error: 'Terjadi kesalahan server' },
            500
        );
    }
});

/**
 * POST /v1/guestbook/events
 * Create new event
 */
guestbookEventsRouter.post('/', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const body = await c.req.json();
        const db = getDb(c.env);

        // Check if this is wizard-based creation (with modules)
        if (body.has_invitation !== undefined || body.has_guestbook !== undefined) {
            // New wizard format
            const {
                name,
                event_date,
                event_time,
                location,
                venue_address,
                timezone,
                has_invitation,
                has_guestbook,
                invitation_config,
                guestbook_config,
                seating_mode,
            } = body;

            // Validation
            if (!name || !event_date) {
                return c.json(
                    { success: false, error: 'Nama dan tanggal event wajib diisi' },
                    400
                );
            }

            if (!has_invitation && !has_guestbook) {
                return c.json(
                    { success: false, error: 'Pilih minimal 1 modul' },
                    400
                );
            }

            // Create event with modules
            const [newEvent] = await db
                .insert(guestbookEvents)
                .values({
                    clientId: clientId,
                    eventName: name, // Schema calls it eventName
                    eventDate: event_date,
                    eventTime: event_time || null,
                    venueName: location || null, // Schema calls it venueName
                    venueAddress: venue_address || null,
                    // timezone is not in schema guestbookEvents?
                    // Checking schema: eventName, eventDate, eventTime, venueName, venueAddress, isActive, staffQuota...
                    // No timezone. It might be in weddingRegistrations, but this is guestbookEvents.
                    // Ignoring timezone for now to follow schema.
                    hasInvitation: has_invitation || false,
                    hasGuestbook: has_guestbook || false,
                    invitationConfig: invitation_config || {},
                    guestbookConfig: guestbook_config || {},
                    seatingMode: seating_mode || 'no_seat', // Schema default 'no_seat'
                })
                .returning();

            return c.json({
                success: true,
                data: newEvent,
            });
        } else {
            // Legacy format (backward compatibility)
            const { name, event_date, location, options } = body;

            if (!name) {
                return c.json(
                    { success: false, error: 'Nama event wajib diisi' },
                    400
                );
            }

            const [newEvent] = await db
                .insert(guestbookEvents)
                .values({
                    clientId: clientId,
                    eventName: name,
                    eventDate: event_date || null,
                    venueName: location || null,
                    // spreading options might be dangerous if keys don't match schema
                    // explicit mapping is safer. Assuming options map to nothing important not covered
                })
                .returning();

            return c.json({
                success: true,
                data: newEvent,
            });
        }
    } catch (error) {
        console.error('Create event error:', error);
        return c.json(
            { success: false, error: 'Terjadi kesalahan server' },
            500
        );
    }
});

/**
 * PUT /v1/guestbook/events/:eventId
 * Update event
 */
guestbookEventsRouter.put('/:eventId', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const eventId = c.req.param('eventId');
        const body = await c.req.json();
        const db = getDb(c.env);

        // Verify access
        const [existingEvent] = await db
            .select({ id: guestbookEvents.id })
            .from(guestbookEvents)
            .where(and(
                eq(guestbookEvents.id, eventId),
                eq(guestbookEvents.clientId, clientId)
            ))
            .limit(1);

        if (!existingEvent) {
            return c.json(
                { success: false, error: 'Event not found or access denied' },
                404
            );
        }

        // Map body to schema
        const updateData: any = {};
        if (body.name) updateData.eventName = body.name;
        if (body.event_date) updateData.eventDate = body.event_date;
        if (body.event_time) updateData.eventTime = body.event_time;
        if (body.location) updateData.venueName = body.location;
        if (body.venue_address) updateData.venueAddress = body.venue_address;
        if (body.has_invitation !== undefined) updateData.hasInvitation = body.has_invitation;
        if (body.has_guestbook !== undefined) updateData.hasGuestbook = body.has_guestbook;
        if (body.invitation_config) updateData.invitationConfig = body.invitation_config;
        if (body.guestbook_config) updateData.guestbookConfig = body.guestbook_config;
        if (body.seating_mode) updateData.seatingMode = body.seating_mode;

        updateData.updatedAt = new Date().toISOString();

        const [updatedEvent] = await db
            .update(guestbookEvents)
            .set(updateData)
            .where(eq(guestbookEvents.id, eventId))
            .returning();

        return c.json({
            success: true,
            data: updatedEvent,
        });
    } catch (error) {
        console.error('Update event error:', error);
        return c.json(
            { success: false, error: 'Terjadi kesalahan server' },
            500
        );
    }
});

/**
 * DELETE /v1/guestbook/events/:eventId
 * Delete event
 */
guestbookEventsRouter.delete('/:eventId', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const eventId = c.req.param('eventId');
        const db = getDb(c.env);

        // Verify access
        const [existingEvent] = await db
            .select({ id: guestbookEvents.id })
            .from(guestbookEvents)
            .where(and(
                eq(guestbookEvents.id, eventId),
                eq(guestbookEvents.clientId, clientId)
            ))
            .limit(1);

        if (!existingEvent) {
            return c.json(
                { success: false, error: 'Event not found or access denied' },
                404
            );
        }

        // Delete event
        await db
            .delete(guestbookEvents)
            .where(eq(guestbookEvents.id, eventId));

        return c.json({
            success: true,
            message: 'Event berhasil dihapus',
        });
    } catch (error) {
        console.error('Delete event error:', error);
        return c.json(
            { success: false, error: 'Terjadi kesalahan server' },
            500
        );
    }
});

/**
 * GET /v1/guestbook/events/:eventId/stats
 * Get event statistics
 */
guestbookEventsRouter.get('/:eventId/stats', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const eventId = c.req.param('eventId');
        const db = getDb(c.env);

        // Verify access
        const [event] = await db
            .select({ id: guestbookEvents.id })
            .from(guestbookEvents)
            .where(and(
                eq(guestbookEvents.id, eventId),
                eq(guestbookEvents.clientId, clientId)
            ))
            .limit(1);

        if (!event) {
            return c.json(
                { success: false, error: 'Event not found or access denied' },
                404
            );
        }

        // Parallel stats queries
        const [totalGuestsRes] = await db
            .select({ count: sql<number>`count(*)` })
            .from(guests)
            .where(eq(guests.eventId, eventId));
        const totalGuests = Number(totalGuestsRes?.count || 0);

        const [checkedInRes] = await db
            .select({ count: sql<number>`count(*)` })
            .from(guests)
            .where(and(
                eq(guests.eventId, eventId),
                eq(guests.isCheckedIn, true)
            ));
        const checkedIn = Number(checkedInRes?.count || 0);

        const [invitationsSentRes] = await db
            .select({ count: sql<number>`count(*)` })
            .from(guests)
            .where(and(
                eq(guests.eventId, eventId),
                eq(guests.sent, true)
            ));
        const invitationsSent = Number(invitationsSentRes?.count || 0);

        const [seatsAssignedRes] = await db
            .select({ count: sql<number>`count(*)` })
            .from(guests)
            .where(and(
                eq(guests.eventId, eventId),
                isNotNull(guests.seatingConfigId)
            ));
        const seatsAssigned = Number(seatsAssignedRes?.count || 0);

        // Get guest types breakdown
        // 1. Get all guest types for this event
        const eventGuestTypes = await db
            .select({
                id: guestTypes.id,
                displayName: guestTypes.displayName
            })
            .from(guestTypes)
            .where(eq(guestTypes.eventId, eventId));

        // 2. Count guests per type
        const typeCounts = await db
            .select({
                typeId: guests.guestTypeId,
                count: sql<number>`count(*)`
            })
            .from(guests)
            .where(eq(guests.eventId, eventId))
            .groupBy(guests.guestTypeId);

        // 3. Map counts
        const guestTypesBreakdown: Record<string, number> = {};

        // Initialize with 0
        eventGuestTypes.forEach(t => {
            guestTypesBreakdown[t.displayName] = 0;
        });

        // Fill counts
        typeCounts.forEach(tc => {
            if (tc.typeId) {
                const typeName = eventGuestTypes.find(t => t.id === tc.typeId)?.displayName;
                if (typeName) {
                    guestTypesBreakdown[typeName] = Number(tc.count);
                }
            }
        });

        const stats = {
            total_guests: totalGuests,
            checked_in: checkedIn,
            invitations_sent: invitationsSent,
            seats_assigned: seatsAssigned,
            guest_types_breakdown: guestTypesBreakdown,
        };

        return c.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        console.error('Get event stats error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

export default guestbookEventsRouter;
