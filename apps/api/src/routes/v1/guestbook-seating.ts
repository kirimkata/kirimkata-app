import { Hono } from 'hono';
import type { Env } from '@/lib/types';
import { clientAuthMiddleware } from '@/middleware/auth';
import { getDb } from '@/db';
import { eventSeatingConfig, guests, guestbookEvents } from '@/db/schema';
import { eq, and, isNull, count, sql, inArray } from 'drizzle-orm';

const guestbookSeating = new Hono<{
    Bindings: Env;
    Variables: {
        clientId: string;
        jwtPayload: any;
    };
}>();

// All routes require client authentication
guestbookSeating.use('*', clientAuthMiddleware);

/**
 * GET /v1/guestbook/seating?event_id=xxx
 * Get all seating configurations for event
 */
guestbookSeating.get('/', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const eventId = c.req.query('event_id');

        if (!eventId) {
            return c.json(
                { success: false, error: 'Event ID required' },
                400
            );
        }

        const db = getDb(c.env);

        // Verify access to event
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

        // Get seating configs
        const configs = await db
            .select()
            .from(eventSeatingConfig)
            .where(eq(eventSeatingConfig.eventId, eventId))
            .orderBy(eventSeatingConfig.sortOrder);

        // Get all guests for occupancy
        const eventGuests = await db
            .select({
                seatingConfigId: guests.seatingConfigId,
                actualCompanions: guests.actualCompanions,
            })
            .from(guests)
            .where(eq(guests.eventId, eventId));

        // Calculate occupancy
        const configsWithOccupancy = configs.map(config => {
            const configGuests = eventGuests.filter(g => g.seatingConfigId === config.id);
            const currentOccupancy = configGuests.reduce((sum, g) => sum + (g.actualCompanions || 0) + 1, 0);

            return {
                ...config,
                current_occupancy: currentOccupancy,
                // Map fields to match API response expectations if needed
                table_number: config.sortOrder,
                max_capacity: config.capacity,
                table_name: config.name,
            };
        });

        return c.json({
            success: true,
            data: configsWithOccupancy,
        });
    } catch (error) {
        console.error('Get seating error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * POST /v1/guestbook/seating
 * Create seating configuration
 */
guestbookSeating.post('/', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const body = await c.req.json();
        const { event_id, table_number, table_name, max_capacity } = body;

        if (!event_id || !table_number) {
            return c.json(
                { success: false, error: 'Missing required fields' },
                400
            );
        }

        const db = getDb(c.env);

        // Verify access to event
        const [event] = await db
            .select({ id: guestbookEvents.id })
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

        const [seating] = await db
            .insert(eventSeatingConfig)
            .values({
                eventId: event_id,
                seatingType: 'table',
                name: table_name || `Table ${table_number}`,
                capacity: max_capacity || 10,
                sortOrder: table_number,
            })
            .returning();

        return c.json({
            success: true,
            data: seating,
        });
    } catch (error) {
        console.error('Create seating error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * PUT /v1/guestbook/seating/:configId
 * Update seating configuration
 */
guestbookSeating.put('/:configId', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const configId = c.req.param('configId');
        const body = await c.req.json();
        const db = getDb(c.env);

        // Verify access - get seating config via event
        const [existing] = await db
            .select({ id: eventSeatingConfig.id, eventId: eventSeatingConfig.eventId })
            .from(eventSeatingConfig)
            .innerJoin(guestbookEvents, eq(eventSeatingConfig.eventId, guestbookEvents.id))
            .where(and(
                eq(eventSeatingConfig.id, configId),
                eq(guestbookEvents.clientId, clientId)
            ))
            .limit(1);

        if (!existing) {
            return c.json(
                { success: false, error: 'Seating config not found or access denied' },
                404
            );
        }

        // Prepare update data
        const updateData: any = {};
        if (body.table_name !== undefined) updateData.name = body.table_name;
        if (body.max_capacity !== undefined) updateData.capacity = body.max_capacity;
        if (body.table_number !== undefined) updateData.sortOrder = body.table_number;
        if (body.seating_type !== undefined) updateData.seatingType = body.seating_type;
        if (body.is_active !== undefined) updateData.isActive = body.is_active;

        const [seating] = await db
            .update(eventSeatingConfig)
            .set(updateData)
            .where(eq(eventSeatingConfig.id, configId))
            .returning();

        return c.json({
            success: true,
            data: seating,
        });
    } catch (error) {
        console.error('Update seating error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * DELETE /v1/guestbook/seating/:configId
 * Delete seating configuration
 */
guestbookSeating.delete('/:configId', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const configId = c.req.param('configId');
        const db = getDb(c.env);

        // Verify access by joining with guestbookEvents
        const [existing] = await db
            .select({ id: eventSeatingConfig.id })
            .from(eventSeatingConfig)
            .innerJoin(guestbookEvents, eq(eventSeatingConfig.eventId, guestbookEvents.id))
            .where(and(
                eq(eventSeatingConfig.id, configId),
                eq(guestbookEvents.clientId, clientId)
            ))
            .limit(1);

        if (!existing) {
            return c.json(
                { success: false, error: 'Seating config not found or access denied' },
                404
            );
        }

        await db
            .delete(eventSeatingConfig)
            .where(eq(eventSeatingConfig.id, configId));

        return c.json({
            success: true,
            message: 'Seating deleted successfully',
        });
    } catch (error) {
        console.error('Delete seating error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * POST /v1/guestbook/seating/auto-assign
 * Auto-assign guests to seats based on algorithm
 */
guestbookSeating.post('/auto-assign', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const body = await c.req.json();
        const { event_id } = body;

        if (!event_id) {
            return c.json(
                { success: false, error: 'Event ID required' },
                400
            );
        }

        const db = getDb(c.env);

        // Verify access to event
        const [event] = await db
            .select({ id: guestbookEvents.id })
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

        // Get unassigned guests
        const unassignedGuests = await db
            .select({
                id: guests.id,
                maxCompanions: guests.maxCompanions, // Note: Schema uses camelCase, ensure this matches
            })
            .from(guests)
            .where(and(
                eq(guests.eventId, event_id),
                isNull(guests.seatingConfigId)
            ))
            // .orderBy(guests.createdAt) // Assuming simplified ordering for now or add if critical
            ;

        // Get available seating
        const seatingConfigs = await db
            .select()
            .from(eventSeatingConfig)
            .where(eq(eventSeatingConfig.eventId, event_id))
            .orderBy(eventSeatingConfig.sortOrder);

        // Get current occupancy per config
        const occupancyMap = new Map<string, number>();
        const assignedStats = await db
            .select({
                configId: guests.seatingConfigId,
                count: count(guests.id), // This counts guests, but we need to account for companions?
                // Drizzle aggregation complex for sum(companions), doing manual sum for safety
            })
            .from(guests)
            .where(and(
                eq(guests.eventId, event_id),
                // isNotNull(guests.seatingConfigId) - implicit by grouping? no
            ))
            .groupBy(guests.seatingConfigId);

        // Refetch all guests to calculate accurate occupancy including companions
        const allGuests = await db
            .select({
                seatingConfigId: guests.seatingConfigId,
                actualCompanions: guests.actualCompanions,
            })
            .from(guests)
            .where(eq(guests.eventId, event_id));

        // Populate occupancy map
        seatingConfigs.forEach(config => {
            const configGuests = allGuests.filter(g => g.seatingConfigId === config.id);
            const totalOccupied = configGuests.reduce((sum, g) => sum + (g.actualCompanions || 0) + 1, 0);
            occupancyMap.set(config.id, totalOccupied);
        });

        // Simple auto-assign algorithm: fill tables sequentially
        let assignedCount = 0;
        let currentTableIndex = 0;

        for (const guest of unassignedGuests) {
            const guestSize = 1 + (guest.maxCompanions || 0);

            // Find a table with enough space
            while (currentTableIndex < seatingConfigs.length) {
                const table = seatingConfigs[currentTableIndex];
                const currentOccupancy = occupancyMap.get(table.id) || 0;
                const availableSpace = (table.capacity || 0) - currentOccupancy;

                if (availableSpace >= guestSize) {
                    // Assign guest to this table
                    await db
                        .update(guests)
                        .set({ seatingConfigId: table.id })
                        .where(eq(guests.id, guest.id));

                    // Update occupancy map
                    occupancyMap.set(table.id, currentOccupancy + guestSize);

                    assignedCount++;
                    break; // Move to next guest
                }

                currentTableIndex++; // Try next table
            }

            if (currentTableIndex >= seatingConfigs.length) {
                // No more tables available
                break;
            }
        }

        return c.json({
            success: true,
            message: `Assigned ${assignedCount} guests to seats`,
            assigned_count: assignedCount,
            total_guests: unassignedGuests.length,
        });
    } catch (error) {
        console.error('Auto-assign error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * POST /v1/guestbook/seating/bulk
 * Bulk assign guests to specific table
 */
guestbookSeating.post('/bulk', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const body = await c.req.json();
        const { guest_ids, seating_config_id } = body;

        if (!Array.isArray(guest_ids) || !seating_config_id) {
            return c.json(
                { success: false, error: 'Invalid request data' },
                400
            );
        }

        const db = getDb(c.env);

        // Verify seating config belongs to client (via event)
        const [seating] = await db
            .select({ id: eventSeatingConfig.id })
            .from(eventSeatingConfig)
            .innerJoin(guestbookEvents, eq(eventSeatingConfig.eventId, guestbookEvents.id))
            .where(and(
                eq(eventSeatingConfig.id, seating_config_id),
                eq(guestbookEvents.clientId, clientId)
            ))
            .limit(1);

        if (!seating) {
            return c.json(
                { success: false, error: 'Seating config not found or access denied' },
                404
            );
        }

        // Update guests
        await db
            .update(guests)
            .set({ seatingConfigId: seating_config_id })
            .where(and(
                inArray(guests.id, guest_ids),
                eq(guests.clientId, clientId)
            ));

        return c.json({
            success: true,
            message: `Assigned ${guest_ids.length} guests to table`,
        });
    } catch (error) {
        console.error('Bulk assign error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * GET /v1/guestbook/seating/stats?event_id=xxx
 * Get seating statistics
 */
guestbookSeating.get('/stats', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const eventId = c.req.query('event_id');

        if (!eventId) {
            return c.json(
                { success: false, error: 'Event ID required' },
                400
            );
        }

        const db = getDb(c.env);

        // Verify access to event
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

        // Get seating configs
        const configs = await db
            .select({
                capacity: eventSeatingConfig.capacity,
            })
            .from(eventSeatingConfig)
            .where(eq(eventSeatingConfig.eventId, eventId));

        // Get guests
        const eventGuests = await db
            .select({
                seatingConfigId: guests.seatingConfigId,
                actualCompanions: guests.actualCompanions,
            })
            .from(guests)
            .where(eq(guests.eventId, eventId));

        const totalCapacity = configs.reduce((sum, c) => sum + (c.capacity || 0), 0);

        // Calculate occupancy from assigned guests
        const assignedGuestsList = eventGuests.filter(g => g.seatingConfigId !== null);
        const unassignedGuestsCount = eventGuests.length - assignedGuestsList.length;
        const assignedGuestsCount = assignedGuestsList.length;

        // Total occupied = sum of (guests + companions) for assigned guests
        const totalOccupied = assignedGuestsList.reduce((sum, g) => sum + (g.actualCompanions || 0) + 1, 0);

        return c.json({
            success: true,
            data: {
                total_capacity: totalCapacity,
                total_occupied: totalOccupied,
                available_seats: Math.max(0, totalCapacity - totalOccupied),
                assigned_guests: assignedGuestsCount,
                unassigned_guests: unassignedGuestsCount,
                total_tables: configs.length,
            },
        });
    } catch (error) {
        console.error('Get seating stats error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

export default guestbookSeating;
