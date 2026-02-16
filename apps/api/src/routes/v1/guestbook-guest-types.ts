import { Hono } from 'hono';
import type { Env } from '@/lib/types';
import { clientAuthMiddleware } from '@/middleware/auth';
import { getDb } from '@/db';
import { guestTypes, guests, guestbookEvents } from '@/db/schema';
import { eq, desc, and, sql, asc } from 'drizzle-orm';

const guestTypesRouter = new Hono<{
    Bindings: Env;
    Variables: {
        clientId: string;
        jwtPayload: any;
    };
}>();

// All routes require client authentication
guestTypesRouter.use('*', clientAuthMiddleware);

/**
 * GET /v1/guestbook/guest-types?event_id=xxx
 * Get all guest types for an event
 */
guestTypesRouter.get('/', async (c) => {
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

        // Get guest types
        const types = await db
            .select()
            .from(guestTypes)
            .where(eq(guestTypes.eventId, eventId))
            .orderBy(asc(guestTypes.priorityOrder));

        return c.json({
            success: true,
            data: types || [],
        });
    } catch (error) {
        console.error('Get guest types error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * POST /v1/guestbook/guest-types
 * Create new guest type
 */
guestTypesRouter.post('/', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const body = await c.req.json();
        const { event_id, type_name, display_name, color_code } = body;

        if (!event_id || !type_name || !display_name || !color_code) {
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

        // Get current guest types to determine priority order
        const [existingType] = await db
            .select({ priorityOrder: guestTypes.priorityOrder })
            .from(guestTypes)
            .where(eq(guestTypes.eventId, event_id))
            .orderBy(desc(guestTypes.priorityOrder))
            .limit(1);

        const maxPriority = existingType?.priorityOrder || 0;

        // Create guest type
        const [newGuestType] = await db
            .insert(guestTypes)
            .values({
                clientId: clientId,
                eventId: event_id,
                typeName: type_name,
                displayName: display_name,
                colorCode: color_code,
                priorityOrder: maxPriority + 1,
            })
            .returning();

        return c.json({
            success: true,
            data: newGuestType,
        });
    } catch (error) {
        console.error('Create guest type error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * PUT /v1/guestbook/guest-types/:typeId
 * Update guest type
 */
guestTypesRouter.put('/:typeId', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const typeId = c.req.param('typeId');
        const body = await c.req.json();
        const db = getDb(c.env);

        // Verify access
        const [existingType] = await db
            .select({ id: guestTypes.id })
            .from(guestTypes)
            .where(and(
                eq(guestTypes.id, typeId),
                eq(guestTypes.clientId, clientId)
            ))
            .limit(1);

        if (!existingType) {
            return c.json(
                { success: false, error: 'Guest type not found or access denied' },
                404
            );
        }

        // Update guest type
        const updateData: any = {};
        if (body.type_name) updateData.typeName = body.type_name;
        if (body.display_name) updateData.displayName = body.display_name;
        if (body.color_code) updateData.colorCode = body.color_code;
        if (body.priority_order !== undefined) updateData.priorityOrder = body.priority_order;

        const [updatedType] = await db
            .update(guestTypes)
            .set(updateData)
            .where(eq(guestTypes.id, typeId))
            .returning();

        return c.json({
            success: true,
            data: updatedType,
        });
    } catch (error: any) {
        console.error('Update guest type error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * DELETE /v1/guestbook/guest-types/:typeId
 * Delete guest type
 */
guestTypesRouter.delete('/:typeId', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const typeId = c.req.param('typeId');
        const db = getDb(c.env);

        // Verify access
        const [existingType] = await db
            .select({ id: guestTypes.id })
            .from(guestTypes)
            .where(and(
                eq(guestTypes.id, typeId),
                eq(guestTypes.clientId, clientId)
            ))
            .limit(1);

        if (!existingType) {
            return c.json(
                { success: false, error: 'Guest type not found or access denied' },
                404
            );
        }

        // Delete guest type
        await db
            .delete(guestTypes)
            .where(eq(guestTypes.id, typeId));

        return c.json({
            success: true,
            message: 'Guest type deleted successfully',
        });
    } catch (error) {
        console.error('Delete guest type error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * GET /v1/guestbook/guest-types/stats?event_id=xxx
 * Get guest types statistics
 */
guestTypesRouter.get('/stats', async (c) => {
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

        // Get guest types
        const types = await db
            .select({
                id: guestTypes.id,
                typeName: guestTypes.typeName,
                displayName: guestTypes.displayName,
                colorCode: guestTypes.colorCode,
                priorityOrder: guestTypes.priorityOrder,
            })
            .from(guestTypes)
            .where(eq(guestTypes.eventId, eventId))
            .orderBy(asc(guestTypes.priorityOrder));

        // Get counts by guest type
        const typeCounts = await db
            .select({
                typeId: guests.guestTypeId,
                count: sql<number>`count(*)`
            })
            .from(guests)
            .where(eq(guests.eventId, eventId))
            .groupBy(guests.guestTypeId);

        const stats = types.map(type => {
            const countRec = typeCounts.find(tc => tc.typeId === type.id);
            return {
                ...type,
                guest_count: Number(countRec?.count || 0),
            };
        });

        return c.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        console.error('Get guest types stats error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

export default guestTypesRouter;
