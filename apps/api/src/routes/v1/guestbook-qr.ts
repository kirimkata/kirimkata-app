import { Hono } from 'hono';
import type { Env } from '@/lib/types';
import { getDb } from '@/db';
import { guests, guestbookCheckins, guestbookEvents } from '@/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { clientAuthMiddleware } from '@/middleware/auth';
import { generateToken } from '@/services/jwt';

const qr = new Hono<{
    Bindings: Env;
    Variables: {
        clientId: string;
        jwtPayload: any;
    };
}>();

/**
 * POST /v1/guestbook/qr/generate/:guestId
 * Generate QR code token for a specific guest
 * Requires client authentication
 */
qr.post('/generate/:guestId', clientAuthMiddleware, async (c) => {
    try {
        const clientId = c.get('clientId');
        const guestId = c.req.param('guestId');

        if (!guestId) {
            return c.json(
                { success: false, error: 'Guest ID is required' },
                400
            );
        }

        const db = getDb(c.env);

        // Verify guest exists and belongs to client
        const [guest] = await db
            .select({
                id: guests.id,
                clientId: guests.clientId,
                eventId: guests.eventId,
                name: guests.name,
                phone: guests.phone,
            })
            .from(guests)
            .where(eq(guests.id, guestId))
            .limit(1);

        if (!guest) {
            return c.json(
                { success: false, error: 'Guest not found' },
                404
            );
        }

        // Check ownership
        if (guest.clientId !== clientId) {
            return c.json(
                { success: false, error: 'Access denied' },
                403
            );
        }

        // Generate QR token (JWT with guest info)
        const qrPayload = {
            type: 'QR',
            guest_id: guest.id,
            event_id: guest.eventId,
            guest_name: guest.name,
            issued_at: Date.now(),
        };

        const qrToken = await generateToken(qrPayload as any, c.env.JWT_SECRET, '365d'); // Valid for 1 year

        // Update guest with QR token
        const [updatedGuest] = await db
            .update(guests)
            .set({ qrCode: qrToken })
            .where(eq(guests.id, guestId))
            .returning();

        return c.json({
            success: true,
            data: {
                guest_id: updatedGuest.id,
                guest_name: updatedGuest.name,
                qr_token: qrToken,
            },
            message: 'QR code generated successfully',
        });
    } catch (error) {
        console.error('Error in QR generation:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * POST /v1/guestbook/qr/bulk-generate
 * Generate QR codes for multiple guests
 * Requires client authentication
 */
qr.post('/bulk-generate', clientAuthMiddleware, async (c) => {
    try {
        const clientId = c.get('clientId');
        const body = await c.req.json();
        const { guest_ids } = body;

        if (!guest_ids || !Array.isArray(guest_ids) || guest_ids.length === 0) {
            return c.json(
                { success: false, error: 'Guest IDs array is required' },
                400
            );
        }

        // Limit bulk operations
        if (guest_ids.length > 100) {
            return c.json(
                { success: false, error: 'Maximum 100 guests at once' },
                400
            );
        }

        const db = getDb(c.env);

        // Verify all guests belong to client
        const guestsList = await db
            .select({
                id: guests.id,
                clientId: guests.clientId,
                eventId: guests.eventId,
                name: guests.name,
            })
            .from(guests)
            .where(inArray(guests.id, guest_ids));

        // Check ownership
        const unauthorizedGuests = guestsList.filter((g: any) => g.clientId !== clientId);
        if (unauthorizedGuests.length > 0) {
            return c.json(
                { success: false, error: 'Access denied to some guests' },
                403
            );
        }

        // Generate QR tokens for all guests
        let successCount = 0;
        const results = [];

        for (const guest of guestsList) {
            try {
                const qrPayload = {
                    type: 'QR',
                    guest_id: guest.id,
                    event_id: guest.eventId,
                    guest_name: guest.name,
                    issued_at: Date.now(),
                };

                const qrToken = await generateToken(qrPayload as any, c.env.JWT_SECRET, '365d');

                // Update guest
                await db
                    .update(guests)
                    .set({ qrCode: qrToken })
                    .where(eq(guests.id, guest.id));

                successCount++;
                results.push({
                    guest_id: guest.id,
                    guest_name: guest.name,
                    qr_token: qrToken,
                    success: true,
                });
            } catch (err) {
                results.push({
                    guest_id: guest.id,
                    guest_name: guest.name,
                    success: false,
                    error: err instanceof Error ? err.message : 'Unknown error',
                });
            }
        }

        return c.json({
            success: true,
            generated_count: successCount,
            total_guests: guest_ids.length,
            results,
            message: `Successfully generated ${successCount} out of ${guest_ids.length} QR codes`,
        });
    } catch (error) {
        console.error('Error in bulk QR generation:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * POST /v1/guestbook/qr/checkin
 * Check in a guest using QR code
 * Requires client authentication
 */
qr.post('/checkin', clientAuthMiddleware, async (c) => {
    try {
        const clientId = c.get('clientId');
        const body = await c.req.json();
        const { qr_token, event_id, actual_companions } = body;

        if (!qr_token || !event_id) {
            return c.json(
                { success: false, error: 'QR token and event ID are required' },
                400
            );
        }

        const db = getDb(c.env);

        // Verify event belongs to client
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

        // Find guest by QR token
        const [guest] = await db
            .select()
            .from(guests)
            .where(and(
                eq(guests.qrCode, qr_token),
                eq(guests.eventId, event_id)
            ))
            .limit(1);

        if (!guest) {
            return c.json(
                { success: false, error: 'Invalid QR code or guest not found' },
                404
            );
        }

        // Check if already checked in
        if (guest.isCheckedIn) {
            return c.json(
                {
                    success: false,
                    error: 'Guest already checked in',
                    checked_in_at: guest.checkedInAt,
                },
                400
            );
        }

        // Perform check-in
        const updateData: any = {
            isCheckedIn: true,
            checkedInAt: new Date().toISOString(),
        };

        // Update actual companions if provided
        if (actual_companions !== undefined && actual_companions !== null) {
            updateData.actualCompanions = actual_companions;
        }

        const [updatedGuest] = await db
            .update(guests)
            .set(updateData)
            .where(eq(guests.id, guest.id))
            .returning();

        // Log check-in
        await db
            .insert(guestbookCheckins)
            .values({
                guestId: guest.id,
                checkedInAt: new Date().toISOString(),
                checkinMethod: 'qr_scan',
            });

        return c.json({
            success: true,
            data: {
                guest_id: updatedGuest.id,
                guest_name: updatedGuest.name,
                guest_phone: updatedGuest.phone,
                max_companions: updatedGuest.maxCompanions,
                actual_companions: updatedGuest.actualCompanions,
                checked_in_at: updatedGuest.checkedInAt,
            },
            message: 'Guest checked in successfully',
        });
    } catch (error) {
        console.error('Error in QR check-in:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

export default qr;
