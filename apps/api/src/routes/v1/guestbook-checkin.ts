import { Hono } from 'hono';
import type { Env } from '@/lib/types';
import { clientAuthMiddleware, staffAuthMiddleware } from '@/middleware/auth';
import { getDb } from '@/db';
import { guests, guestbookEvents, staffLogs, guestbookStaff } from '@/db/schema';
import { eq, and, desc, sql, or, ilike, isNotNull } from 'drizzle-orm';

const guestbookCheckin = new Hono<{
    Bindings: Env;
    Variables: {
        clientId?: string;
        staffId?: string;
        jwtPayload: any;
    };
}>();

/**
 * POST /v1/guestbook/checkin
 * Check in a guest (requires staff or client auth)
 */
guestbookCheckin.post('/', async (c) => {
    try {
        const body = await c.req.json();
        const { guest_id, actual_companions } = body;

        if (!guest_id) {
            return c.json(
                { success: false, error: 'Guest ID required' },
                400
            );
        }

        const db = getDb(c.env);

        // Update guest check-in status
        const [guest] = await db
            .update(guests)
            .set({
                isCheckedIn: true,
                checkedInAt: new Date().toISOString(),
                actualCompanions: actual_companions || 0,
            })
            .where(eq(guests.id, guest_id))
            .returning();

        if (!guest) {
            return c.json(
                { success: false, error: 'Failed to check in guest' },
                500
            );
        }

        return c.json({
            success: true,
            data: guest,
            message: 'Guest checked in successfully',
            updated: true, // Marker to indicate valid response
        });
    } catch (error) {
        console.error('Checkin error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * GET /v1/guestbook/checkin/logs?event_id=xxx&limit=20
 * Get check-in logs
 */
guestbookCheckin.get('/logs', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const eventId = c.req.query('event_id');
        const limit = parseInt(c.req.query('limit') || '20');

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

        // Get logs
        // Join staffLogs with guests and guestbookStaff
        // Condition: guests.eventId = eventId AND actionType = 'checkin'

        const logs = await db
            .select({
                id: staffLogs.id,
                created_at: staffLogs.createdAt,
                notes: staffLogs.notes,
                guest_name: guests.name,
                staff_full_name: guestbookStaff.fullName,
            })
            .from(staffLogs)
            .innerJoin(guests, eq(staffLogs.guestId, guests.id))
            .leftJoin(guestbookStaff, eq(staffLogs.staffId, guestbookStaff.id))
            .where(and(
                eq(guests.eventId, eventId),
                eq(staffLogs.actionType, 'checkin')
            ))
            .orderBy(desc(staffLogs.createdAt))
            .limit(limit);

        // Transform data to match expected format
        const formattedLogs = logs.map(log => ({
            id: log.id,
            guest_name: log.guest_name,
            staff_name: log.staff_full_name || 'System',
            checkin_method: log.notes?.includes('QR') ? 'QR_SCAN' : 'MANUAL_SEARCH',
            checked_in_at: log.created_at
        }));

        return c.json({
            success: true,
            data: formattedLogs || []
        });
    } catch (error) {
        console.error('Get checkin logs error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * POST /v1/guestbook/checkin/qr
 * Check in guest using QR code
 */
guestbookCheckin.post('/qr', async (c) => {
    try {
        const body = await c.req.json();
        const { qr_token, actual_companions } = body;

        if (!qr_token) {
            return c.json(
                { success: false, error: 'QR token required' },
                400
            );
        }

        const db = getDb(c.env);

        // Find guest by QR token (schema uses qrCode)
        const [guest] = await db
            .select()
            .from(guests)
            .where(eq(guests.qrCode, qr_token))
            .limit(1);

        if (!guest) {
            return c.json(
                { success: false, error: 'Invalid QR code' },
                404
            );
        }

        // Check if already checked in
        if (guest.isCheckedIn) {
            return c.json(
                { success: false, error: 'Guest already checked in' },
                400
            );
        }

        // Update check-in status
        const [updatedGuest] = await db
            .update(guests)
            .set({
                isCheckedIn: true,
                checkedInAt: new Date().toISOString(),
                actualCompanions: actual_companions || 0,
            })
            .where(eq(guests.id, guest.id))
            .returning();

        if (!updatedGuest) {
            console.error('QR checkin error: Failed update');
            return c.json(
                { success: false, error: 'Failed to check in guest' },
                500
            );
        }

        return c.json({
            success: true,
            data: updatedGuest,
            message: 'Guest checked in successfully via QR',
        });
    } catch (error) {
        console.error('QR checkin error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * GET /v1/guestbook/checkin/search?event_id=xxx&query=xxx
 * Search guests for check-in
 */
guestbookCheckin.get('/search', async (c) => {
    try {
        const eventId = c.req.query('event_id');
        const query = c.req.query('query');

        if (!eventId || !query) {
            return c.json(
                { success: false, error: 'Event ID and search query required' },
                400
            );
        }

        const db = getDb(c.env);

        // Search guests by name or phone
        // ILIKE requires string interpolation %query%
        const searchPattern = `%${query}%`;

        const guestsList = await db
            .select()
            .from(guests)
            .where(and(
                eq(guests.eventId, eventId),
                or(
                    ilike(guests.name, searchPattern),
                    ilike(guests.phone, searchPattern)
                )
            ))
            .limit(20);

        return c.json({
            success: true,
            data: guestsList || [],
        });
    } catch (error) {
        console.error('Search guests error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * GET /v1/guestbook/checkin/stats?event_id=xxx
 * Get check-in statistics
 */
guestbookCheckin.get('/stats', clientAuthMiddleware, async (c) => {
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

        // Get stats in parallel or single query? Parallel is fine.

        // Total Guests
        const [totalGuestsRes] = await db
            .select({ count: sql<number>`count(*)` })
            .from(guests)
            .where(eq(guests.eventId, eventId));
        const totalGuests = Number(totalGuestsRes?.count || 0);

        // Checked In
        const [checkedInRes] = await db
            .select({ count: sql<number>`count(*)` })
            .from(guests)
            .where(and(
                eq(guests.eventId, eventId),
                eq(guests.isCheckedIn, true)
            ));
        const checkedIn = Number(checkedInRes?.count || 0);

        // Total Companions
        const [companionsRes] = await db
            .select({ sum: sql<number>`sum(${guests.actualCompanions})` })
            .from(guests)
            .where(and(
                eq(guests.eventId, eventId),
                eq(guests.isCheckedIn, true)
            ));
        const totalCompanions = Number(companionsRes?.sum || 0);

        return c.json({
            success: true,
            data: {
                total_guests: totalGuests,
                checked_in: checkedIn,
                not_checked_in: totalGuests - checkedIn,
                total_companions: totalCompanions,
                total_attendees: checkedIn + totalCompanions,
                checkin_rate: totalGuests ? (checkedIn / totalGuests * 100).toFixed(2) : 0,
            },
        });
    } catch (error) {
        console.error('Get checkin stats error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * GET /v1/guestbook/reports/stats?event_id=xxx
 * Get comprehensive reports statistics
 */
guestbookCheckin.get('/reports/stats', clientAuthMiddleware, async (c) => {
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
            .select({
                id: guestbookEvents.id,
                name: guestbookEvents.eventName,
                event_date: guestbookEvents.eventDate
            })
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

        // Stats
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

        return c.json({
            success: true,
            data: {
                event_name: event.name,
                event_date: event.event_date,
                total_guests: totalGuests,
                checked_in: checkedIn,
                invitations_sent: invitationsSent,
                seats_assigned: seatsAssigned,
                checkin_rate: totalGuests ? (checkedIn / totalGuests * 100).toFixed(2) : 0,
            },
        });
    } catch (error) {
        console.error('Get reports stats error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * GET /v1/guestbook/reports/export?event_id=xxx
 * Export comprehensive report to CSV
 */
guestbookCheckin.get('/reports/export', clientAuthMiddleware, async (c) => {
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
            .select({ id: guestbookEvents.id, name: guestbookEvents.eventName })
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

        // Get all guests with related data
        const guestsList = await db
            .select()
            .from(guests)
            .where(eq(guests.eventId, eventId))
            .orderBy(desc(guests.createdAt));

        // Create CSV
        const headers = [
            'Name', 'Phone', 'Email', 'Group', 'Max Companions', 'Actual Companions',
            'Checked In', 'Checkin Time', 'Invitation Sent', 'Has Seat', 'Source'
        ];
        const rows = guestsList.map(g => [
            g.name,
            g.phone || '',
            g.email || '',
            g.guestGroup || '',
            g.maxCompanions || 0,
            g.actualCompanions || 0,
            g.isCheckedIn ? 'Yes' : 'No',
            g.checkedInAt || '',
            g.sent ? 'Yes' : 'No',
            g.seatingConfigId ? 'Yes' : 'No',
            g.source || 'manual'
        ]);

        const csv = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        return new Response(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="report-${event.name}-${Date.now()}.csv"`,
            },
        });
    } catch (error) {
        console.error('Export report error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

export default guestbookCheckin;
