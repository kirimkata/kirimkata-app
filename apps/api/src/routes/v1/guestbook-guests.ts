import { Hono } from 'hono';
import type { Env } from '@/lib/types';
import { clientAuthMiddleware } from '@/middleware/auth';
import { getDb } from '@/db';
import { guests, guestbookEvents } from '@/db/schema';
import { eq, desc, inArray, and } from 'drizzle-orm';
import { generateRandomString } from '@/services/encryption';

const guestbookGuests = new Hono<{
    Bindings: Env;
    Variables: {
        clientId: string;
        jwtPayload: any;
    };
}>();

// All routes require client authentication
guestbookGuests.use('*', clientAuthMiddleware);

/**
 * GET /v1/guestbook/guests?event_id=xxx
 * Get all guests for an event
 */
guestbookGuests.get('/', async (c) => {
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

        // Get guests
        const guestsList = await db
            .select()
            .from(guests)
            .where(eq(guests.eventId, eventId))
            .orderBy(desc(guests.createdAt));

        return c.json({
            success: true,
            data: guestsList || [],
        });
    } catch (error) {
        console.error('Get guests error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * POST /v1/guestbook/guests
 * Create new guest
 */
guestbookGuests.post('/', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const body = await c.req.json();
        const {
            event_id,
            guest_name,
            guest_phone,
            guest_email,
            guest_type_id,
            guest_group,
            max_companions,
            seating_config_id,
            source
        } = body;

        // Note: Frontend might still be sending snake_case properties like guest_name.
        // We map them to new schema 'name', 'phone', etc.

        if (!event_id || !guest_name) {
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

        const [newGuest] = await db
            .insert(guests)
            .values({
                clientId: clientId,
                eventId: event_id,
                name: guest_name,
                phone: guest_phone || null,
                email: guest_email || null,
                guestTypeId: guest_type_id || null,
                guestGroup: guest_group || null,
                maxCompanions: max_companions || 0,
                actualCompanions: 0,
                seatingConfigId: seating_config_id || null,
                source: source || 'manual',
                isCheckedIn: false,
                sent: false,
            })
            .returning();

        return c.json({
            success: true,
            data: newGuest,
        });
    } catch (error: any) {
        console.error('Create guest error:', error);
        return c.json(
            { success: false, error: 'Internal server error', message: error.message },
            500
        );
    }
});

/**
 * PUT /v1/guestbook/guests/:guestId
 * Update guest
 */
guestbookGuests.put('/:guestId', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const guestId = c.req.param('guestId');
        const body = await c.req.json();
        const db = getDb(c.env);

        // Verify access
        const [existingGuest] = await db
            .select({ id: guests.id })
            .from(guests)
            .where(and(
                eq(guests.id, guestId),
                eq(guests.clientId, clientId)
            ))
            .limit(1);

        if (!existingGuest) {
            return c.json(
                { success: false, error: 'Guest not found or access denied' },
                404
            );
        }

        // Map incoming body to schema columns
        const updateData: any = {};
        if (body.guest_name !== undefined) updateData.name = body.guest_name;
        if (body.guest_phone !== undefined) updateData.phone = body.guest_phone;
        if (body.guest_email !== undefined) updateData.email = body.guest_email;
        if (body.guest_type_id !== undefined) updateData.guestTypeId = body.guest_type_id;
        if (body.guest_group !== undefined) updateData.guestGroup = body.guest_group;
        if (body.max_companions !== undefined) updateData.maxCompanions = body.max_companions;
        if (body.seating_config_id !== undefined) updateData.seatingConfigId = body.seating_config_id;
        if (body.invitation_sent !== undefined) updateData.sent = body.invitation_sent;
        if (body.is_checked_in !== undefined) updateData.isCheckedIn = body.is_checked_in;
        if (body.source !== undefined) updateData.source = body.source;

        updateData.updatedAt = new Date().toISOString();

        const [updatedGuest] = await db
            .update(guests)
            .set(updateData)
            .where(eq(guests.id, guestId))
            .returning();

        return c.json({
            success: true,
            data: updatedGuest,
        });
    } catch (error) {
        console.error('Update guest error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * DELETE /v1/guestbook/guests/:guestId
 * Delete guest
 */
guestbookGuests.delete('/:guestId', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const guestId = c.req.param('guestId');
        const db = getDb(c.env);

        // Verify access
        const [existingGuest] = await db
            .select({ id: guests.id })
            .from(guests)
            .where(and(
                eq(guests.id, guestId),
                eq(guests.clientId, clientId)
            ))
            .limit(1);

        if (!existingGuest) {
            return c.json(
                { success: false, error: 'Guest not found or access denied' },
                404
            );
        }

        // Delete guest
        await db
            .delete(guests)
            .where(eq(guests.id, guestId));

        return c.json({
            success: true,
            message: 'Guest deleted successfully',
        });
    } catch (error) {
        console.error('Delete guest error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * POST /v1/guestbook/guests/:guestId/generate-qr
 * Generate QR code token for guest
 */
guestbookGuests.post('/:guestId/generate-qr', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const guestId = c.req.param('guestId');
        const db = getDb(c.env);

        // Verify guest exists and belongs to client
        const [existingGuest] = await db
            .select({
                client_id: guests.clientId,
                event_id: guests.eventId,
                guest_name: guests.name
            })
            .from(guests)
            .where(eq(guests.id, guestId))
            .limit(1);

        if (!existingGuest || existingGuest.client_id !== clientId) {
            return c.json(
                { success: false, error: 'Guest not found or access denied' },
                404
            );
        }

        // Generate QR token
        const qrToken = `QR-${guestId}-${generateRandomString(16)}`;

        // Update guest with QR token
        const [updatedGuest] = await db
            .update(guests)
            .set({ qrCode: qrToken }) // Schema has qrCode, code had qr_token. Using schema qrCode per instructions.
            .where(eq(guests.id, guestId))
            .returning();

        return c.json({
            success: true,
            data: updatedGuest,
            qr_token: qrToken,
        });
    } catch (error) {
        console.error('Generate QR error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * POST /v1/guestbook/guests/bulk-delete
 * Bulk delete guests
 */
guestbookGuests.post('/bulk-delete', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const body = await c.req.json();
        const { guest_ids } = body;

        if (!Array.isArray(guest_ids) || guest_ids.length === 0) {
            return c.json(
                { success: false, error: 'Guest IDs array required' },
                400
            );
        }

        const db = getDb(c.env);

        // Delete guests (only those belonging to client)
        await db
            .delete(guests)
            .where(
                and(
                    inArray(guests.id, guest_ids),
                    eq(guests.clientId, clientId)
                )
            );

        return c.json({
            success: true,
            message: `Successfully deleted ${guest_ids.length} guests`,
        });
    } catch (error) {
        console.error('Bulk delete error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * GET /v1/guestbook/guests/export?event_id=xxx
 * Export guests to CSV format
 */
guestbookGuests.get('/export', async (c) => {
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

        // Get all guests
        const guestsList = await db
            .select()
            .from(guests)
            .where(eq(guests.eventId, eventId))
            .orderBy(desc(guests.createdAt));

        // Create CSV
        const headers = ['Name', 'Phone', 'Email', 'Type', 'Group', 'Max Companions', 'Checked In', 'Invitation Sent'];
        const rows = guestsList.map(g => [
            g.name,
            g.phone || '',
            g.email || '',
            g.guestTypeId || '',
            g.guestGroup || '',
            g.maxCompanions || 0,
            g.isCheckedIn ? 'Yes' : 'No',
            g.sent ? 'Yes' : 'No'
        ]);

        const csv = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        return new Response(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="guests-${event.name}-${Date.now()}.csv"`,
            },
        });
    } catch (error) {
        console.error('Export guests error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

export default guestbookGuests;
