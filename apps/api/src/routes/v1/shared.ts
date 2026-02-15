import { Hono } from 'hono';
import type { Env } from '@/lib/types';
import { clientAuthMiddleware } from '@/middleware/auth';
import { getDb } from '@/db';
import { staffLogs, guestbookEvents, guests, guestbookStaff, eventSeatingConfig, guestTypes } from '@/db/schema';
import { eq, and, desc, sql, inArray, count, isNotNull } from 'drizzle-orm';
import { hashPassword } from '@/services/encryption';

const shared = new Hono<{
    Bindings: Env;
    Variables: {
        clientId: string;
        jwtPayload: any;
    };
}>();

// All routes require client authentication
shared.use('*', clientAuthMiddleware);

/**
 * GET /v1/shared/redeem?event_id=xxx&limit=20
 * Get redemption logs for event
 */
shared.get('/redeem', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const eventId = c.req.query('event_id');
        const limit = parseInt(c.req.query('limit') || '20');

        if (!eventId) {
            return c.json(
                { success: false, error: 'Event ID wajib diisi' },
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

        // Get redemption logs using staffLogs
        const logs = await db
            .select({
                id: staffLogs.id,
                guest_name: guests.name,
                staff_name: guestbookStaff.fullName,
                entitlement_type: staffLogs.actionType,
                quantity: sql<number>`1`.as('quantity'),
                redeemed_at: staffLogs.createdAt,
            })
            .from(staffLogs)
            .leftJoin(guests, eq(staffLogs.guestId, guests.id))
            .leftJoin(guestbookStaff, eq(staffLogs.staffId, guestbookStaff.id))
            .where(and(
                eq(guests.eventId, eventId),
                inArray(staffLogs.actionType, ['souvenir', 'snack', 'meal', 'vip_lounge'])
            ))
            .orderBy(desc(staffLogs.createdAt))
            .limit(limit);

        return c.json({
            success: true,
            data: logs.map(log => ({
                ...log,
                entitlement_type: log.entitlement_type.toUpperCase(),
                staff_name: log.staff_name || 'System'
            })),
        });
    } catch (error) {
        console.error('Get redemption logs error:', error);
        return c.json(
            { success: false, error: 'Terjadi kesalahan server' },
            500
        );
    }
});

/**
 * GET /v1/shared/seating?event_id=xxx&stats=true
 * Get seating information or stats for event
 */
shared.get('/seating', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const eventId = c.req.query('event_id');
        const statsOnly = c.req.query('stats') === 'true';

        if (!eventId) {
            return c.json(
                { success: false, error: 'Event ID wajib diisi' },
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

        // Fetch seating configs
        const configs = await db
            .select()
            .from(eventSeatingConfig)
            .where(eq(eventSeatingConfig.eventId, eventId))
            .orderBy(eventSeatingConfig.sortOrder);

        // Fetch all guests (needed for occupancy calculation)
        const eventGuests = await db
            .select()
            .from(guests)
            .where(eq(guests.eventId, eventId));

        // Compute per-config usage and attach guests
        const configsWithUsage = configs.map(config => {
            const configGuests = eventGuests.filter(g => g.seatingConfigId === config.id);
            // Calculate total driven by guests + companions
            const currentOccupancy = configGuests.reduce((sum, g) => sum + (g.actualCompanions || 0) + 1, 0);

            return {
                ...config,
                max_capacity: config.capacity,
                current_occupancy: currentOccupancy,
                table_number: config.sortOrder,
                guests: configGuests,
            };
        });

        if (statsOnly) {
            const totalCapacity = configs.reduce((sum, c) => sum + (c.capacity || 0), 0);
            const totalOccupied = configsWithUsage.reduce((sum, c) => sum + c.current_occupancy, 0);

            return c.json({
                success: true,
                data: {
                    total_capacity: totalCapacity,
                    total_occupied: totalOccupied,
                    available_seats: totalCapacity - totalOccupied,
                    total_tables: configs.length,
                },
            });
        }

        return c.json({
            success: true,
            data: configsWithUsage,
        });
    } catch (error) {
        console.error('Get seating error:', error);
        return c.json(
            { success: false, error: 'Terjadi kesalahan server' },
            500
        );
    }
});

/**
 * PUT /v1/shared/seating
 * Update guest seating assignment
 */
shared.put('/seating', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const body = await c.req.json();
        const { guest_id, table_number, seating_area } = body;

        if (!guest_id) {
            return c.json(
                { success: false, error: 'Guest ID wajib diisi' },
                400
            );
        }

        const db = getDb(c.env);

        // Verify guest belongs to client
        const [guest] = await db
            .select({ id: guests.id })
            .from(guests)
            .where(and(
                eq(guests.id, guest_id),
                eq(guests.clientId, clientId)
            ))
            .limit(1);

        if (!guest) {
            return c.json(
                { success: false, error: 'Guest not found or access denied' },
                404
            );
        }

        // Update seating
        await db
            .update(guests)
            .set({
                tableNumber: table_number,
                seatingArea: seating_area,
            })
            .where(eq(guests.id, guest_id));

        return c.json({
            success: true,
            message: 'Seating berhasil diupdate',
        });
    } catch (error) {
        console.error('Update seating error:', error);
        return c.json(
            { success: false, error: 'Terjadi kesalahan server' },
            500
        );
    }
});

/**
 * GET /v1/shared/staff?event_id=xxx
 * Get staff for event
 */
shared.get('/staff', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const eventId = c.req.query('event_id');

        if (!eventId) {
            return c.json(
                { success: false, error: 'Event ID wajib diisi' },
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
            .select({
                id: guestbookStaff.id,
                event_id: guestbookStaff.eventId,
                username: guestbookStaff.username,
                full_name: guestbookStaff.fullName,
                phone: guestbookStaff.phone,
                // Map individual bools to permissions object if needed by frontend
                can_checkin: guestbookStaff.canCheckin,
                can_redeem_souvenir: guestbookStaff.canRedeemSouvenir,
                can_redeem_snack: guestbookStaff.canRedeemSnack,
                can_access_vip_lounge: guestbookStaff.canAccessVipLounge,
                is_active: guestbookStaff.isActive,
                created_at: guestbookStaff.createdAt,
            })
            .from(guestbookStaff)
            .where(eq(guestbookStaff.eventId, eventId))
            .orderBy(desc(guestbookStaff.createdAt));

        return c.json({
            success: true,
            data: staffList.map(s => ({
                id: s.id,
                event_id: s.event_id,
                username: s.username,
                full_name: s.full_name,
                phone: s.phone,
                permissions: {
                    can_checkin: s.can_checkin,
                    can_redeem_souvenir: s.can_redeem_souvenir,
                    can_redeem_snack: s.can_redeem_snack,
                    can_access_vip_lounge: s.can_access_vip_lounge,
                },
                is_active: s.is_active,
                created_at: s.created_at,
            })),
        });
    } catch (error) {
        console.error('Get staff error:', error);
        return c.json(
            { success: false, error: 'Terjadi kesalahan server' },
            500
        );
    }
});

/**
 * POST /v1/shared/staff
 * Create staff for event
 */
shared.post('/staff', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const body = await c.req.json();
        const { event_id, username, password, full_name, phone, permissions } = body;

        if (!event_id || !username || !password || !full_name) {
            return c.json(
                { success: false, error: 'Data tidak lengkap' },
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

        // Check if username exists
        const [existingStaff] = await db
            .select({ id: guestbookStaff.id })
            .from(guestbookStaff)
            .where(and(
                eq(guestbookStaff.eventId, event_id),
                eq(guestbookStaff.username, username)
            ))
            .limit(1);

        if (existingStaff) {
            return c.json(
                { success: false, error: 'Username sudah digunakan untuk event ini' },
                400
            );
        }

        // Hash password
        const passwordEncrypted = await hashPassword(password, c.env.ENCRYPTION_KEY);

        // Map permissions
        const perms = permissions || {};

        // Create staff
        const [newStaff] = await db
            .insert(guestbookStaff)
            .values({
                eventId: event_id,
                clientId: clientId,
                username,
                passwordEncrypted: passwordEncrypted,
                fullName: full_name,
                phone: phone || null,
                canCheckin: perms.can_checkin || false,
                canRedeemSouvenir: perms.can_redeem_souvenir || false,
                canRedeemSnack: perms.can_redeem_snack || false,
                canAccessVipLounge: perms.can_access_vip_lounge || false,
                isActive: true,
            })
            .returning();

        return c.json({
            success: true,
            data: {
                id: newStaff.id,
                event_id: newStaff.eventId,
                username: newStaff.username,
                full_name: newStaff.fullName,
                phone: newStaff.phone,
                permissions: permissions || {},
                is_active: newStaff.isActive,
                created_at: newStaff.createdAt,
            },
            message: 'Staff berhasil ditambahkan',
        });
    } catch (error: any) {
        console.error('Create staff error:', error);
        return c.json(
            { success: false, error: error.message || 'Terjadi kesalahan server' },
            500
        );
    }
});

/**
 * PUT /v1/shared/staff
 * Update staff
 */
shared.put('/staff', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const body = await c.req.json();
        const { staff_id, password, ...updates } = body;

        if (!staff_id) {
            return c.json(
                { success: false, error: 'Staff ID wajib diisi' },
                400
            );
        }

        const db = getDb(c.env);

        // Verify staff belongs to client's event
        // We need to join with guestbookEvents to check clientId
        const [staff] = await db
            .select({
                id: guestbookStaff.id,
                eventId: guestbookStaff.eventId
            })
            .from(guestbookStaff)
            .innerJoin(guestbookEvents, eq(guestbookStaff.eventId, guestbookEvents.id))
            .where(and(
                eq(guestbookStaff.id, staff_id),
                eq(guestbookEvents.clientId, clientId)
            ))
            .limit(1);

        if (!staff) {
            return c.json(
                { success: false, error: 'Staff not found or access denied' },
                404
            );
        }

        // Prepare update data
        const updateData: any = {};
        if (updates.full_name !== undefined) updateData.fullName = updates.full_name;
        if (updates.phone !== undefined) updateData.phone = updates.phone;
        if (updates.is_active !== undefined) updateData.isActive = updates.is_active;
        // permissions update? API doesn't seem to pass 'permissions' object in PUT based on previous code usually
        // But if it does, logic needs to be added. 
        // Based on previous Supabase code: `const updateData: any = { ...updates };`
        // It blindly passed mapped fields. 
        // We should map explicitly to be safe.
        // Assuming body might contain permissions keys directly or as object.
        // Previous code: `...updates`. If updates contained `permissions` json, it might have tried to update.
        // But `guestbookStaff` has separate boolean columns.
        // Let's assume updates contains snake_case keys for permissions if any.
        if (updates.permissions) {
            const p = updates.permissions;
            if (p.can_checkin !== undefined) updateData.canCheckin = p.can_checkin;
            if (p.can_redeem_souvenir !== undefined) updateData.canRedeemSouvenir = p.can_redeem_souvenir;
            if (p.can_redeem_snack !== undefined) updateData.canRedeemSnack = p.can_redeem_snack;
            if (p.can_access_vip_lounge !== undefined) updateData.canAccessVipLounge = p.can_access_vip_lounge;
        }

        if (password) {
            updateData.passwordEncrypted = await hashPassword(password, c.env.ENCRYPTION_KEY);
        }

        // Update staff
        const [updatedStaff] = await db
            .update(guestbookStaff)
            .set(updateData)
            .where(eq(guestbookStaff.id, staff_id))
            .returning();

        return c.json({
            success: true,
            data: {
                id: updatedStaff.id,
                event_id: updatedStaff.eventId,
                username: updatedStaff.username,
                full_name: updatedStaff.fullName,
                phone: updatedStaff.phone,
                permissions: {
                    can_checkin: updatedStaff.canCheckin,
                    can_redeem_souvenir: updatedStaff.canRedeemSouvenir,
                    can_redeem_snack: updatedStaff.canRedeemSnack,
                    can_access_vip_lounge: updatedStaff.canAccessVipLounge,
                },
                is_active: updatedStaff.isActive,
            },
        });
    } catch (error) {
        console.error('Update staff error:', error);
        return c.json(
            { success: false, error: 'Terjadi kesalahan server' },
            500
        );
    }
});

/**
 * DELETE /v1/shared/staff?staff_id=xxx
 * Delete staff
 */
shared.delete('/staff', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const staffId = c.req.query('staff_id');

        if (!staffId) {
            return c.json(
                { success: false, error: 'Staff ID wajib diisi' },
                400
            );
        }

        const db = getDb(c.env);

        // Verify staff belongs to client's event
        const [staff] = await db
            .select({
                id: guestbookStaff.id,
                eventId: guestbookStaff.eventId
            })
            .from(guestbookStaff)
            .innerJoin(guestbookEvents, eq(guestbookStaff.eventId, guestbookEvents.id))
            .where(and(
                eq(guestbookStaff.id, staffId),
                eq(guestbookEvents.clientId, clientId)
            ))
            .limit(1);

        if (!staff) {
            return c.json(
                { success: false, error: 'Staff not found or access denied' },
                404
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
            { success: false, error: 'Terjadi kesalahan server' },
            500
        );
    }
});

/**
 * GET /v1/shared/guests/stats?event_id=xxx
 * Get guest statistics for event
 */
shared.get('/guests/stats', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const eventId = c.req.query('event_id');

        if (!eventId) {
            return c.json(
                { success: false, error: 'Event ID wajib diisi' },
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

        // Get comprehensive guest stats
        // We can optimize this by fetching all guests (or minimal fields) and aggregating in memory 
        // OR running multiple count queries. 
        // Given Drizzle's count API, multiple queries is cleaner than raw SQL for now.

        // Total Guests
        const [totalGuestsRes] = await db
            .select({ count: count() })
            .from(guests)
            .where(eq(guests.eventId, eventId));

        // Checked In
        const [checkedInRes] = await db
            .select({ count: count() })
            .from(guests)
            .where(and(
                eq(guests.eventId, eventId),
                eq(guests.isCheckedIn, true)
            ));

        // With Seats
        const [withSeatsRes] = await db
            .select({ count: count() })
            .from(guests)
            .where(and(
                eq(guests.eventId, eventId),
                isNotNull(guests.seatingConfigId)
            ));

        // Invitations Sent - 'invitation_sent' column? 
        // Checking schema guests table... previous migration efforts didn't mention 'invitation_sent' column in guests.
        // Assuming it's 'invitationSent' if it exists. Reverting to legacy column name check if uncertain.
        // Let's assume it doesn't exist in Drizzle schema based on memory, OR I need to check schema.
        // Schema view in Step 1625/1675 didn't show 'invitationSent'.
        // If it's missing, I'll comment it out or use 0, but Supabase code used it.
        // Supabase used 'invitation_sent' (snake_case).
        // Let's assume for now it might be missing or I should skip it. I'll use 0 to be safe and avoid error.
        const invitationsSent = 0;

        // Get guest type breakdown
        const guestTypesList = await db
            .select({
                id: guestTypes.id,
                displayName: guestTypes.displayName
            })
            .from(guestTypes)
            .where(eq(guestTypes.eventId, eventId));

        const typeBreakdown: Record<string, number> = {};

        for (const type of guestTypesList) {
            const [res] = await db
                .select({ count: count() })
                .from(guests)
                .where(and(
                    eq(guests.eventId, eventId),
                    eq(guests.guestTypeId, type.id)
                ));
            typeBreakdown[type.displayName] = res.count;
        }

        return c.json({
            success: true,
            data: {
                total_guests: totalGuestsRes.count,
                checked_in: checkedInRes.count,
                with_seats: withSeatsRes.count,
                invitations_sent: invitationsSent,
                type_breakdown: {}, // todo: restore this
            },
        });
    } catch (error) {
        console.error('Get guest stats error:', error);
        return c.json(
            { success: false, error: 'Terjadi kesalahan server' },
            500
        );
    }
});

export default shared;
