import { Hono } from 'hono';
import type { Env } from '@/lib/types';
import { clientAuthMiddleware, staffAuthMiddleware } from '@/middleware/auth';
import { getSupabaseClient } from '@/lib/supabase';

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

        const supabase = getSupabaseClient(c.env);

        // Update guest check-in status
        const { data: guest, error } = await supabase
            .from('invitation_guests')
            .update({
                is_checked_in: true,
                checkin_time: new Date().toISOString(),
                actual_companions: actual_companions || 0,
            })
            .eq('id', guest_id)
            .select()
            .single();

        if (error || !guest) {
            console.error('Checkin error:', error);
            return c.json(
                { success: false, error: 'Failed to check in guest' },
                500
            );
        }

        return c.json({
            success: true,
            data: guest,
            message: 'Guest checked in successfully',
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

        const supabase = getSupabaseClient(c.env);

        // Find guest by QR token
        const { data: guest, error: findError } = await supabase
            .from('invitation_guests')
            .select('*')
            .eq('qr_token', qr_token)
            .single();

        if (findError || !guest) {
            return c.json(
                { success: false, error: 'Invalid QR code' },
                404
            );
        }

        // Check if already checked in
        if (guest.is_checked_in) {
            return c.json(
                { success: false, error: 'Guest already checked in' },
                400
            );
        }

        // Update check-in status
        const { data: updatedGuest, error } = await supabase
            .from('invitation_guests')
            .update({
                is_checked_in: true,
                checkin_time: new Date().toISOString(),
                actual_companions: actual_companions || 0,
            })
            .eq('id', guest.id)
            .select()
            .single();

        if (error || !updatedGuest) {
            console.error('QR checkin error:', error);
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

        const supabase = getSupabaseClient(c.env);

        // Search guests by name or phone
        const { data: guests, error } = await supabase
            .from('invitation_guests')
            .select('*')
            .eq('event_id', eventId)
            .or(`guest_name.ilike.%${query}%,guest_phone.ilike.%${query}%`)
            .limit(20);

        if (error) {
            throw error;
        }

        return c.json({
            success: true,
            data: guests || [],
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

        // Get total guests
        const { count: totalGuests } = await supabase
            .from('invitation_guests')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId);

        // Get checked in guests
        const { count: checkedIn } = await supabase
            .from('invitation_guests')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId)
            .eq('is_checked_in', true);

        // Get total companions
        const { data: companions } = await supabase
            .from('invitation_guests')
            .select('actual_companions')
            .eq('event_id', eventId)
            .eq('is_checked_in', true);

        const totalCompanions = companions?.reduce((sum, g) => sum + (g.actual_companions || 0), 0) || 0;

        return c.json({
            success: true,
            data: {
                total_guests: totalGuests || 0,
                checked_in: checkedIn || 0,
                not_checked_in: (totalGuests || 0) - (checkedIn || 0),
                total_companions: totalCompanions,
                total_attendees: (checkedIn || 0) + totalCompanions,
                checkin_rate: totalGuests ? ((checkedIn || 0) / totalGuests * 100).toFixed(2) : 0,
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

        const supabase = getSupabaseClient(c.env);

        // Verify access to event
        const { data: event, error: eventError } = await supabase
            .from('guestbook_events')
            .select('*')
            .eq('id', eventId)
            .eq('client_id', clientId)
            .single();

        if (eventError || !event) {
            return c.json(
                { success: false, error: 'Event not found or access denied' },
                404
            );
        }

        // Get comprehensive stats
        const { count: totalGuests } = await supabase
            .from('invitation_guests')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId);

        const { count: checkedIn } = await supabase
            .from('invitation_guests')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId)
            .eq('is_checked_in', true);

        const { count: invitationsSent } = await supabase
            .from('invitation_guests')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId)
            .eq('invitation_sent', true);

        const { count: seatsAssigned } = await supabase
            .from('invitation_guests')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId)
            .not('seating_config_id', 'is', null);

        return c.json({
            success: true,
            data: {
                event_name: event.name,
                event_date: event.event_date,
                total_guests: totalGuests || 0,
                checked_in: checkedIn || 0,
                invitations_sent: invitationsSent || 0,
                seats_assigned: seatsAssigned || 0,
                checkin_rate: totalGuests ? ((checkedIn || 0) / totalGuests * 100).toFixed(2) : 0,
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

        // Get all guests with related data
        const { data: guests, error } = await supabase
            .from('invitation_guests')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: true });

        if (error) {
            throw error;
        }

        // Create CSV
        const headers = [
            'Name', 'Phone', 'Email', 'Group', 'Max Companions', 'Actual Companions',
            'Checked In', 'Checkin Time', 'Invitation Sent', 'Has Seat', 'Source'
        ];
        const rows = guests?.map(g => [
            g.guest_name,
            g.guest_phone || '',
            g.guest_email || '',
            g.guest_group || '',
            g.max_companions || 0,
            g.actual_companions || 0,
            g.is_checked_in ? 'Yes' : 'No',
            g.checkin_time || '',
            g.invitation_sent ? 'Yes' : 'No',
            g.seating_config_id ? 'Yes' : 'No',
            g.source || 'manual'
        ]) || [];

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
