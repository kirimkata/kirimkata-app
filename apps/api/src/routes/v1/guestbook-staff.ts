
import { Hono } from 'hono';
import type { Env } from '@/lib/types';
import { clientAuthMiddleware } from '@/middleware/auth';
import { getDb } from '@/db';
import { guestbookStaff, guestbookEvents } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { hashPassword, comparePassword } from '@/services/encryption';

const staffRoute = new Hono<{
    Bindings: Env;
    Variables: {
        clientId: string;
        jwtPayload: any;
    };
}>();

// All routes require client authentication
staffRoute.use('*', clientAuthMiddleware);

/**
 * GET /v1/guestbook/staff?event_id=xxx
 * Get all staff for an event
 */
staffRoute.get('/', async (c) => {
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

        // Get staff
        const staffList = await db
            .select()
            .from(guestbookStaff)
            .where(and(
                eq(guestbookStaff.eventId, eventId),
                eq(guestbookStaff.isActive, true)
            ))
            .orderBy(desc(guestbookStaff.createdAt));

        return c.json({
            success: true,
            data: staffList,
        });
    } catch (error) {
        console.error('Get staff error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * POST /v1/guestbook/staff
 * Create new staff
 */
staffRoute.post('/', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const body = await c.req.json();
        const { event_id, username, password, full_name, phone, permissions } = body;

        if (!event_id || !username || !password || !full_name) {
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

        // Check for duplicate username in this event
        const [existing] = await db
            .select({ id: guestbookStaff.id })
            .from(guestbookStaff)
            .where(and(
                eq(guestbookStaff.eventId, event_id),
                eq(guestbookStaff.username, username)
            ))
            .limit(1);

        if (existing) {
            return c.json(
                { success: false, error: 'Username sudah digunakan' },
                400
            );
        }

        // Hash password
        const passwordEncrypted = await hashPassword(password, c.env.ENCRYPTION_KEY);

        // Create staff
        const [staff] = await db
            .insert(guestbookStaff)
            .values({
                clientId,
                eventId: event_id,
                username,
                passwordEncrypted,
                fullName: full_name,
                phone: phone || null,
                canCheckin: permissions?.can_checkin ?? false,
                canRedeemSouvenir: permissions?.can_redeem_souvenir ?? false,
                canRedeemSnack: permissions?.can_redeem_snack ?? false,
                canAccessVipLounge: permissions?.can_access_vip_lounge ?? false,
                isActive: true,
            })
            .returning();

        if (!staff) {
            return c.json(
                { success: false, error: 'Failed to create staff' },
                500
            );
        }

        return c.json({
            success: true,
            data: staff,
        });
    } catch (error: any) {
        console.error('Create staff error:', error);
        return c.json(
            { success: false, error: error.message || 'Internal server error' },
            500
        );
    }
});

/**
 * PUT /v1/guestbook/staff/:staffId
 * Update staff
 */
staffRoute.put('/:staffId', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const staffId = c.req.param('staffId');
        const body = await c.req.json();
        const { full_name, phone, permissions, is_active } = body;

        const db = getDb(c.env);

        // Get existing staff to check ownership
        const [existingStaff] = await db
            .select({ id: guestbookStaff.id, eventId: guestbookStaff.eventId })
            .from(guestbookStaff)
            .where(eq(guestbookStaff.id, staffId))
            .limit(1);

        if (!existingStaff) {
            return c.json(
                { success: false, error: 'Staff not found' },
                404
            );
        }

        // Verify event ownership
        // Note: eventId can be null in DB but strictly shouldn't be for staff. 
        if (!existingStaff.eventId) {
            return c.json({ success: false, error: 'Staff has no event assigned' }, 400);
        }

        const [event] = await db
            .select({ id: guestbookEvents.id })
            .from(guestbookEvents)
            .where(and(
                eq(guestbookEvents.id, existingStaff.eventId),
                eq(guestbookEvents.clientId, clientId)
            ))
            .limit(1);

        if (!event) {
            return c.json(
                { success: false, error: 'Access denied' },
                403
            );
        }

        // Build update object
        const updates: any = {};
        if (full_name !== undefined) updates.fullName = full_name;
        if (phone !== undefined) updates.phone = phone;
        if (is_active !== undefined) updates.isActive = is_active;

        if (permissions) {
            if (permissions.can_checkin !== undefined) updates.canCheckin = permissions.can_checkin;
            if (permissions.can_redeem_souvenir !== undefined) updates.canRedeemSouvenir = permissions.can_redeem_souvenir;
            if (permissions.can_redeem_snack !== undefined) updates.canRedeemSnack = permissions.can_redeem_snack;
            if (permissions.can_access_vip_lounge !== undefined) updates.canAccessVipLounge = permissions.can_access_vip_lounge;
        }

        // Add updatedAt
        updates.updatedAt = new Date().toISOString();

        const [updatedStaff] = await db
            .update(guestbookStaff)
            .set(updates)
            .where(eq(guestbookStaff.id, staffId))
            .returning();

        return c.json({
            success: true,
            data: updatedStaff,
        });
    } catch (error) {
        console.error('Update staff error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * DELETE /v1/guestbook/staff/:staffId
 * Delete staff
 */
staffRoute.delete('/:staffId', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const staffId = c.req.param('staffId');
        const db = getDb(c.env);

        // Verify access
        const [existingStaff] = await db
            .select({ id: guestbookStaff.id, eventId: guestbookStaff.eventId })
            .from(guestbookStaff)
            .where(eq(guestbookStaff.id, staffId))
            .limit(1);

        if (!existingStaff) {
            return c.json(
                { success: false, error: 'Staff not found' },
                404
            );
        }

        if (!existingStaff.eventId) {
            return c.json({ success: false, error: 'Staff has no event assigned' }, 400);
        }

        const [event] = await db
            .select({ id: guestbookEvents.id })
            .from(guestbookEvents)
            .where(and(
                eq(guestbookEvents.id, existingStaff.eventId),
                eq(guestbookEvents.clientId, clientId)
            ))
            .limit(1);

        if (!event) {
            return c.json(
                { success: false, error: 'Access denied' },
                403
            );
        }

        // Delete staff
        await db
            .delete(guestbookStaff)
            .where(eq(guestbookStaff.id, staffId));

        return c.json({
            success: true,
            message: 'Staff berhasil dihapus',
        });
    } catch (error) {
        console.error('Delete staff error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

export default staffRoute;
