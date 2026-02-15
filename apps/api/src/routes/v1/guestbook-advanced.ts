import { Hono } from 'hono';
import type { Env } from '@/lib/types';
import { clientAuthMiddleware } from '@/middleware/auth';
import { getDb } from '@/db';
import { guests, guestbookEvents, eventSeatingConfig } from '@/db/schema';
import { eq, inArray, and, isNull, count, sql } from 'drizzle-orm';

const advanced = new Hono<{
    Bindings: Env;
    Variables: {
        clientId: string;
        jwtPayload: any;
    };
}>();

/**
 * POST /v1/guestbook/advanced/bulk-delete
 * Bulk delete multiple guests
 * Requires client authentication
 */
advanced.post('/bulk-delete', clientAuthMiddleware, async (c) => {
    try {
        const clientId = c.get('clientId');

        const body = await c.req.json();
        const { guest_ids } = body;

        // Validate input
        if (!guest_ids || !Array.isArray(guest_ids) || guest_ids.length === 0) {
            return c.json(
                { success: false, error: 'Guest IDs array is required' },
                400
            );
        }

        // Limit bulk operations to prevent abuse
        if (guest_ids.length > 100) {
            return c.json(
                { success: false, error: 'Maximum 100 guests can be deleted at once' },
                400
            );
        }

        const db = getDb(c.env);

        // Verify all guests belong to the client
        const guestsVerification = await db
            .select({ id: guests.id, clientId: guests.clientId })
            .from(guests)
            .where(inArray(guests.id, guest_ids));

        if (!guestsVerification || guestsVerification.length === 0) {
            return c.json(
                { success: false, error: 'No guests found with provided IDs' },
                404
            );
        }

        // Check ownership
        const unauthorizedGuests = guestsVerification.filter(g => g.clientId !== clientId);
        if (unauthorizedGuests.length > 0) {
            return c.json(
                { success: false, error: 'Access denied to some guests' },
                403
            );
        }

        // Perform bulk delete
        await db
            .delete(guests)
            .where(inArray(guests.id, guest_ids));

        return c.json({
            success: true,
            message: `Successfully deleted ${guest_ids.length} guests`,
            deleted_count: guest_ids.length,
        });
    } catch (error) {
        console.error('Error in bulk delete:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * POST /v1/guestbook/advanced/bulk-assign-seating
 * Bulk assign seating to multiple guests
 * Requires client authentication
 */
advanced.post('/bulk-assign-seating', clientAuthMiddleware, async (c) => {
    try {
        const clientId = c.get('clientId');

        const body = await c.req.json();
        const { assignments } = body;

        // Validate input
        // assignments should be: [{ guest_id: string, seating_config_id: string }, ...]
        if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
            return c.json(
                { success: false, error: 'Assignments array is required' },
                400
            );
        }

        // Limit bulk operations
        if (assignments.length > 100) {
            return c.json(
                { success: false, error: 'Maximum 100 assignments at once' },
                400
            );
        }

        // Validate each assignment
        for (const assignment of assignments) {
            if (!assignment.guest_id || !assignment.seating_config_id) {
                return c.json(
                    { success: false, error: 'Each assignment must have guest_id and seating_config_id' },
                    400
                );
            }
        }

        const db = getDb(c.env);

        // Extract unique guest IDs
        const guestIds = [...new Set(assignments.map((a: any) => a.guest_id))] as string[];

        // Verify all guests belong to client
        const guestsVerification = await db
            .select({ id: guests.id, clientId: guests.clientId, eventId: guests.eventId })
            .from(guests)
            .where(inArray(guests.id, guestIds));

        if (!guestsVerification || guestsVerification.length === 0) {
            return c.json(
                { success: false, error: 'Failed to verify guests' },
                500
            );
        }

        // Check ownership
        const unauthorizedGuests = guestsVerification.filter(g => g.clientId !== clientId);
        if (unauthorizedGuests.length > 0) {
            return c.json(
                { success: false, error: 'Access denied to some guests' },
                403
            );
        }

        // Get event_id (should be same for all guests)
        const eventId = guestsVerification[0]?.eventId;
        if (!eventId) {
            return c.json(
                { success: false, error: 'Invalid guest data' },
                400
            );
        }

        // Extract unique seating config IDs
        const seatingConfigIds = [...new Set(assignments.map((a: any) => a.seating_config_id))] as string[];

        // Verify seating configs exist and have capacity
        const seatingConfigs = await db
            .select({
                id: eventSeatingConfig.id,
                capacity: eventSeatingConfig.capacity,
                eventId: eventSeatingConfig.eventId
            })
            .from(eventSeatingConfig)
            .where(and(
                inArray(eventSeatingConfig.id, seatingConfigIds),
                eq(eventSeatingConfig.eventId, eventId)
            ));

        if (!seatingConfigs || seatingConfigs.length !== seatingConfigIds.length) {
            return c.json(
                { success: false, error: 'Some seating configurations not found' },
                404
            );
        }

        // Perform bulk update
        let successCount = 0;
        const errors: any[] = [];

        // Note: Drizzle doesn't support bulk update with different values easily in one query
        // so we iterate. For < 100 items, this is acceptable.
        for (const assignment of assignments) {
            try {
                await db
                    .update(guests)
                    .set({ seatingConfigId: assignment.seating_config_id })
                    .where(and(
                        eq(guests.id, assignment.guest_id),
                        eq(guests.clientId, clientId)
                    ));
                successCount++;
            } catch (updateError: any) {
                errors.push({ guest_id: assignment.guest_id, error: updateError.message });
            }
        }

        return c.json({
            success: true,
            assigned_count: successCount,
            total_assignments: assignments.length,
            errors: errors.length > 0 ? errors : undefined,
            message: `Successfully assigned ${successCount} out of ${assignments.length} guests`,
        });
    } catch (error) {
        console.error('Error in bulk assign seating:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * POST /v1/guestbook/advanced/auto-assign-seating
 * Automatically assign unassigned guests to available seats
 * Uses intelligent algorithm considering guest types and seat capacity
 * Requires client authentication
 */
advanced.post('/auto-assign-seating', clientAuthMiddleware, async (c) => {
    try {
        const clientId = c.get('clientId');

        const body = await c.req.json();
        const { event_id } = body;

        if (!event_id) {
            return c.json(
                { success: false, error: 'Event ID is required' },
                400
            );
        }

        const db = getDb(c.env);

        // Verify event belongs to client
        const [event] = await db
            .select({ id: guestbookEvents.id, clientId: guestbookEvents.clientId })
            .from(guestbookEvents)
            .where(and(
                eq(guestbookEvents.id, event_id),
                eq(guestbookEvents.clientId, clientId)
            ))
            .limit(1);

        if (!event) {
            return c.json(
                { success: false, error: 'Event not found or access denied' },
                404
            );
        }

        // Get all seating configs for this event
        const seatingConfigs = await db
            .select({
                id: eventSeatingConfig.id,
                section_name: eventSeatingConfig.name, // Mapping name to section_name/table_number concept if needed, or just usage
                table_number: eventSeatingConfig.sortOrder,
                capacity: eventSeatingConfig.capacity,
                allowed_guest_type_ids: eventSeatingConfig.allowedGuestTypeIds
            })
            .from(eventSeatingConfig)
            .where(eq(eventSeatingConfig.eventId, event_id))
            .orderBy(eventSeatingConfig.name, eventSeatingConfig.sortOrder);

        if (!seatingConfigs || seatingConfigs.length === 0) {
            return c.json(
                { success: false, error: 'No seating configurations found for this event' },
                400
            );
        }

        // Get unassigned guests
        const unassignedGuests = await db
            .select({
                id: guests.id,
                guest_name: guests.name,
                guest_type_id: guests.guestTypeId
            })
            .from(guests)
            .where(and(
                eq(guests.eventId, event_id),
                eq(guests.clientId, clientId),
                isNull(guests.seatingConfigId)
            ))
            .orderBy(guests.createdAt);

        if (!unassignedGuests || unassignedGuests.length === 0) {
            return c.json({
                success: true,
                assigned_count: 0,
                total_guests: 0,
                message: 'No unassigned guests found',
            });
        }

        // Build seat availability map
        const seatAvailability = new Map<string, number>();

        for (const config of seatingConfigs) {
            // Count current assignments
            const [countResult] = await db
                .select({ count: count() })
                .from(guests)
                .where(and(
                    eq(guests.eventId, event_id),
                    eq(guests.seatingConfigId, config.id)
                ));

            const currentCount = countResult?.count || 0;
            const available = (config.capacity || 0) - currentCount;
            if (available > 0) {
                seatAvailability.set(config.id, available);
            }
        }

        // Auto-assign algorithm
        let assignedCount = 0;
        const assignments: { guest_id: string; seating_config_id: string }[] = [];

        for (const guest of unassignedGuests) {
            let assigned = false;

            // Try to find suitable seat
            for (const config of seatingConfigs) {
                const available = seatAvailability.get(config.id);

                if (!available || available <= 0) {
                    continue;
                }

                // Check guest type restrictions
                if (config.allowed_guest_type_ids && config.allowed_guest_type_ids.length > 0) {
                    if (!guest.guest_type_id || !config.allowed_guest_type_ids.includes(guest.guest_type_id)) {
                        continue;
                    }
                }

                // Assign guest to this seat
                assignments.push({
                    guest_id: guest.id,
                    seating_config_id: config.id,
                });

                // Update availability
                seatAvailability.set(config.id, available - 1);
                assignedCount++;
                assigned = true;
                break;
            }

            if (!assigned) {
                // console.log(`No suitable seat found for guest: ${guest.guest_name}`);
            }
        }

        // Perform batch updates
        if (assignments.length > 0) {
            for (const assignment of assignments) {
                await db
                    .update(guests)
                    .set({ seatingConfigId: assignment.seating_config_id })
                    .where(eq(guests.id, assignment.guest_id));
            }
        }

        return c.json({
            success: true,
            assigned_count: assignedCount,
            total_guests: unassignedGuests.length,
            unassigned_count: unassignedGuests.length - assignedCount,
            message: `Successfully assigned ${assignedCount} out of ${unassignedGuests.length} guests`,
        });
    } catch (error) {
        console.error('Error in auto-assign seating:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

export default advanced;

