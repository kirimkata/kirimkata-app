import { Hono } from 'hono';
import type { Env } from '@/lib/types';
import { getSupabaseClient } from '@/lib/supabase';
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

        const supabase = getSupabaseClient(c.env);

        // Verify guest exists and belongs to client
        const { data: guest, error: guestError } = await supabase
            .from('invitation_guests')
            .select('id, client_id, event_id, guest_name, guest_phone')
            .eq('id', guestId)
            .single();

        if (guestError || !guest) {
            return c.json(
                { success: false, error: 'Guest not found' },
                404
            );
        }

        // Check ownership
        if (guest.client_id !== clientId) {
            return c.json(
                { success: false, error: 'Access denied' },
                403
            );
        }

        // Generate QR token (JWT with guest info)
        const qrPayload = {
            type: 'QR',
            guest_id: guest.id,
            event_id: guest.event_id,
            guest_name: guest.guest_name,
            issued_at: Date.now(),
        };

        const qrToken = await generateToken(qrPayload as any, c.env.JWT_SECRET, '365d'); // Valid for 1 year

        // Update guest with QR token
        const { data: updatedGuest, error: updateError } = await supabase
            .from('invitation_guests')
            .update({ qr_token: qrToken })
            .eq('id', guestId)
            .select()
            .single();

        if (updateError || !updatedGuest) {
            console.error('Error updating guest with QR token:', updateError);
            return c.json(
                { success: false, error: 'Failed to generate QR code' },
                500
            );
        }

        return c.json({
            success: true,
            data: {
                guest_id: updatedGuest.id,
                guest_name: updatedGuest.guest_name,
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

        const supabase = getSupabaseClient(c.env);

        // Verify all guests belong to client
        const { data: guests, error: guestsError } = await supabase
            .from('invitation_guests')
            .select('id, client_id, event_id, guest_name')
            .in('id', guest_ids);

        if (guestsError || !guests) {
            return c.json(
                { success: false, error: 'Failed to fetch guests' },
                500
            );
        }

        // Check ownership
        const unauthorizedGuests = guests.filter(g => g.client_id !== clientId);
        if (unauthorizedGuests.length > 0) {
            return c.json(
                { success: false, error: 'Access denied to some guests' },
                403
            );
        }

        // Generate QR tokens for all guests
        let successCount = 0;
        const results = [];

        for (const guest of guests) {
            try {
                const qrPayload = {
                    type: 'QR',
                    guest_id: guest.id,
                    event_id: guest.event_id,
                    guest_name: guest.guest_name,
                    issued_at: Date.now(),
                };

                const qrToken = await generateToken(qrPayload as any, c.env.JWT_SECRET, '365d');

                // Update guest
                const { error: updateError } = await supabase
                    .from('invitation_guests')
                    .update({ qr_token: qrToken })
                    .eq('id', guest.id);

                if (!updateError) {
                    successCount++;
                    results.push({
                        guest_id: guest.id,
                        guest_name: guest.guest_name,
                        qr_token: qrToken,
                        success: true,
                    });
                } else {
                    results.push({
                        guest_id: guest.id,
                        guest_name: guest.guest_name,
                        success: false,
                        error: updateError.message,
                    });
                }
            } catch (err) {
                results.push({
                    guest_id: guest.id,
                    guest_name: guest.guest_name,
                    success: false,
                    error: 'Failed to generate QR token',
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

        const supabase = getSupabaseClient(c.env);

        // Verify event belongs to client
        const { data: event, error: eventError } = await supabase
            .from('events')
            .select('id, client_id')
            .eq('id', event_id)
            .eq('client_id', clientId)
            .single();

        if (eventError || !event) {
            return c.json(
                { success: false, error: 'Event not found or access denied' },
                404
            );
        }

        // Find guest by QR token
        const { data: guest, error: guestError } = await supabase
            .from('invitation_guests')
            .select('*')
            .eq('qr_token', qr_token)
            .eq('event_id', event_id)
            .single();

        if (guestError || !guest) {
            return c.json(
                { success: false, error: 'Invalid QR code or guest not found' },
                404
            );
        }

        // Check if already checked in
        if (guest.is_checked_in) {
            return c.json(
                { 
                    success: false, 
                    error: 'Guest already checked in',
                    checked_in_at: guest.checked_in_at,
                },
                400
            );
        }

        // Perform check-in
        const updateData: any = {
            is_checked_in: true,
            checked_in_at: new Date().toISOString(),
        };

        // Update actual companions if provided
        if (actual_companions !== undefined && actual_companions !== null) {
            updateData.actual_companions = actual_companions;
        }

        const { data: updatedGuest, error: updateError } = await supabase
            .from('invitation_guests')
            .update(updateData)
            .eq('id', guest.id)
            .select()
            .single();

        if (updateError || !updatedGuest) {
            console.error('Error checking in guest:', updateError);
            return c.json(
                { success: false, error: 'Failed to check in guest' },
                500
            );
        }

        return c.json({
            success: true,
            data: {
                guest_id: updatedGuest.id,
                guest_name: updatedGuest.guest_name,
                guest_phone: updatedGuest.guest_phone,
                max_companions: updatedGuest.max_companions,
                actual_companions: updatedGuest.actual_companions,
                checked_in_at: updatedGuest.checked_in_at,
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
