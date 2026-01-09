import { Hono } from 'hono';
import type { Env } from '@/lib/types';
import { clientAuthMiddleware } from '@/middleware/auth';
import { getSupabaseClient } from '@/lib/supabase';
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

        const supabase = getSupabaseClient(c.env);

        // Verify access to event
        const { data: event, error: eventError } = await supabase
            .from('guestbook_events')
            .select('id')
            .eq('id', eventId)
            .eq('client_id', clientId)
            .single();

        if (eventError || !event) {
            return c.json(
                { success: false, error: 'Event not found or access denied' },
                404
            );
        }

        // Get guests
        const { data: guests, error } = await supabase
            .from('invitation_guests')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Get guests error:', error);
            return c.json(
                { success: false, error: 'Failed to fetch guests' },
                500
            );
        }

        return c.json({
            success: true,
            data: guests || [],
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

        if (!event_id || !guest_name) {
            return c.json(
                { success: false, error: 'Missing required fields' },
                400
            );
        }

        const supabase = getSupabaseClient(c.env);

        // Verify access to event
        const { data: event, error: eventError } = await supabase
            .from('guestbook_events')
            .select('id')
            .eq('id', event_id)
            .eq('client_id', clientId)
            .single();

        if (eventError || !event) {
            return c.json(
                { success: false, error: 'Event not found or access denied' },
                404
            );
        }

        const insertData: any = {
            client_id: clientId,
            event_id,
            guest_name,
            guest_phone: guest_phone || null,
            guest_email: guest_email || null,
            guest_type_id: guest_type_id || null,
            guest_group: guest_group || null,
            max_companions: max_companions || 0,
            actual_companions: 0,
            seating_config_id: seating_config_id || null,
            source: source || 'manual',
            is_checked_in: false,
            invitation_sent: false,
        };

        const { data: guest, error } = await supabase
            .from('invitation_guests')
            .insert(insertData)
            .select()
            .single();

        if (error || !guest) {
            console.error('Create guest error:', error);
            return c.json(
                { success: false, error: 'Failed to create guest' },
                500
            );
        }

        return c.json({
            success: true,
            data: guest,
        });
    } catch (error) {
        console.error('Create guest error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
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
        const supabase = getSupabaseClient(c.env);

        // Verify access
        const { data: existingGuest, error: fetchError } = await supabase
            .from('invitation_guests')
            .select('id')
            .eq('id', guestId)
            .eq('client_id', clientId)
            .single();

        if (fetchError || !existingGuest) {
            return c.json(
                { success: false, error: 'Guest not found or access denied' },
                404
            );
        }

        // Update guest
        const { data: guest, error } = await supabase
            .from('invitation_guests')
            .update(body)
            .eq('id', guestId)
            .select()
            .single();

        if (error) {
            console.error('Error updating guest:', error);
            return c.json(
                { success: false, error: 'Failed to update guest' },
                500
            );
        }

        return c.json({
            success: true,
            data: guest,
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
        const supabase = getSupabaseClient(c.env);

        // Verify access
        const { data: existingGuest, error: fetchError } = await supabase
            .from('invitation_guests')
            .select('id')
            .eq('id', guestId)
            .eq('client_id', clientId)
            .single();

        if (fetchError || !existingGuest) {
            return c.json(
                { success: false, error: 'Guest not found or access denied' },
                404
            );
        }

        // Delete guest
        const { error } = await supabase
            .from('invitation_guests')
            .delete()
            .eq('id', guestId);

        if (error) {
            console.error('Error deleting guest:', error);
            return c.json(
                { success: false, error: 'Failed to delete guest' },
                500
            );
        }

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
        const supabase = getSupabaseClient(c.env);

        // Verify guest exists and belongs to client
        const { data: existingGuest } = await supabase
            .from('invitation_guests')
            .select('client_id, event_id, guest_name')
            .eq('id', guestId)
            .single();

        if (!existingGuest || existingGuest.client_id !== clientId) {
            return c.json(
                { success: false, error: 'Guest not found or access denied' },
                404
            );
        }

        // Generate QR token (simple random string for now)
        // In production, you might want to use JWT with guest info
        const qrToken = `QR-${guestId}-${generateRandomString(16)}`;

        // Update guest with QR token
        const { data: guest, error } = await supabase
            .from('invitation_guests')
            .update({ qr_token: qrToken })
            .eq('id', guestId)
            .select()
            .single();

        if (error || !guest) {
            console.error('Generate QR error:', error);
            return c.json(
                { success: false, error: 'Failed to generate QR code' },
                500
            );
        }

        return c.json({
            success: true,
            data: guest,
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

        const supabase = getSupabaseClient(c.env);

        // Delete guests (only those belonging to client)
        const { error } = await supabase
            .from('invitation_guests')
            .delete()
            .in('id', guest_ids)
            .eq('client_id', clientId);

        if (error) {
            console.error('Bulk delete error:', error);
            return c.json(
                { success: false, error: 'Failed to delete guests' },
                500
            );
        }

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
 * Note: Excel export would require additional library
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

        const supabase = getSupabaseClient(c.env);

        // Verify access to event
        const { data: event, error: eventError } = await supabase
            .from('guestbook_events')
            .select('id, name')
            .eq('id', eventId)
            .eq('client_id', clientId)
            .single();

        if (eventError || !event) {
            return c.json(
                { success: false, error: 'Event not found or access denied' },
                404
            );
        }

        // Get all guests
        const { data: guests, error } = await supabase
            .from('invitation_guests')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: true });

        if (error) {
            throw error;
        }

        // Create CSV
        const headers = ['Name', 'Phone', 'Email', 'Type', 'Group', 'Max Companions', 'Checked In', 'Invitation Sent'];
        const rows = guests?.map(g => [
            g.guest_name,
            g.guest_phone || '',
            g.guest_email || '',
            g.guest_type_id || '',
            g.guest_group || '',
            g.max_companions || 0,
            g.is_checked_in ? 'Yes' : 'No',
            g.invitation_sent ? 'Yes' : 'No'
        ]) || [];

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
