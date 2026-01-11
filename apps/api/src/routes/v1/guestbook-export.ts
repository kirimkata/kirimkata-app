import { Hono } from 'hono';
import type { Env } from '@/lib/types';
import { getSupabaseClient } from '@/lib/supabase';
import { clientAuthMiddleware } from '@/middleware/auth';

const exportRoutes = new Hono<{
    Bindings: Env;
    Variables: {
        clientId: string;
        jwtPayload: any;
    };
}>();

/**
 * GET /v1/guestbook/export/guests?event_id=xxx
 * Export guests to CSV format
 * Requires client authentication
 */
exportRoutes.get('/guests', clientAuthMiddleware, async (c) => {
    try {
        const clientId = c.get('clientId');
        const eventId = c.req.query('event_id');

        if (!eventId) {
            return c.json(
                { success: false, error: 'Event ID is required' },
                400
            );
        }

        const supabase = getSupabaseClient(c.env);

        // Verify event belongs to client
        const { data: event, error: eventError } = await supabase
            .from('events')
            .select('id, client_id, name')
            .eq('id', eventId)
            .eq('client_id', clientId)
            .single();

        if (eventError || !event) {
            return c.json(
                { success: false, error: 'Event not found or access denied' },
                404
            );
        }

        // Fetch all guests for this event
        const { data: guests, error: guestsError } = await supabase
            .from('invitation_guests')
            .select(`
                id,
                guest_name,
                guest_phone,
                guest_email,
                guest_group,
                max_companions,
                actual_companions,
                is_checked_in,
                checked_in_at,
                invitation_sent,
                qr_token,
                source,
                created_at
            `)
            .eq('event_id', eventId)
            .eq('client_id', clientId)
            .order('created_at', { ascending: true });

        if (guestsError) {
            console.error('Error fetching guests for export:', guestsError);
            return c.json(
                { success: false, error: 'Failed to fetch guests' },
                500
            );
        }

        // Generate CSV content
        const headers = [
            'ID',
            'Name',
            'Phone',
            'Email',
            'Group',
            'Max Companions',
            'Actual Companions',
            'Checked In',
            'Checked In At',
            'Invitation Sent',
            'Has QR Code',
            'Source',
            'Created At'
        ];

        const csvRows = [headers.join(',')];

        for (const guest of guests || []) {
            const row = [
                guest.id,
                `"${(guest.guest_name || '').replace(/"/g, '""')}"`,
                `"${(guest.guest_phone || '').replace(/"/g, '""')}"`,
                `"${(guest.guest_email || '').replace(/"/g, '""')}"`,
                `"${(guest.guest_group || '').replace(/"/g, '""')}"`,
                guest.max_companions || 0,
                guest.actual_companions || 0,
                guest.is_checked_in ? 'Yes' : 'No',
                guest.checked_in_at ? new Date(guest.checked_in_at).toLocaleString('en-US') : '',
                guest.invitation_sent ? 'Yes' : 'No',
                guest.qr_token ? 'Yes' : 'No',
                `"${(guest.source || '').replace(/"/g, '""')}"`,
                new Date(guest.created_at).toLocaleString('en-US')
            ];
            csvRows.push(row.join(','));
        }

        const csvContent = csvRows.join('\n');
        const filename = `guests_${event.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.csv`;

        // Return CSV file
        return new Response(csvContent, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('Error in export guests:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * GET /v1/guestbook/export/report?event_id=xxx&type=overview|checkin|seating
 * Export comprehensive report in CSV format
 * Requires client authentication
 */
exportRoutes.get('/report', clientAuthMiddleware, async (c) => {
    try {
        const clientId = c.get('clientId');
        const eventId = c.req.query('event_id');
        const reportType = c.req.query('type') || 'overview';

        if (!eventId) {
            return c.json(
                { success: false, error: 'Event ID is required' },
                400
            );
        }

        const supabase = getSupabaseClient(c.env);

        // Verify event belongs to client
        const { data: event, error: eventError } = await supabase
            .from('events')
            .select('id, client_id, name')
            .eq('id', eventId)
            .eq('client_id', clientId)
            .single();

        if (eventError || !event) {
            return c.json(
                { success: false, error: 'Event not found or access denied' },
                404
            );
        }

        let csvContent = '';
        let filename = '';

        if (reportType === 'overview' || reportType === 'checkin') {
            // Fetch guests with check-in data
            const { data: guests, error: guestsError } = await supabase
                .from('invitation_guests')
                .select(`
                    guest_name,
                    guest_phone,
                    guest_email,
                    guest_group,
                    max_companions,
                    actual_companions,
                    is_checked_in,
                    checked_in_at,
                    created_at
                `)
                .eq('event_id', eventId)
                .eq('client_id', clientId)
                .order('checked_in_at', { ascending: false, nullsFirst: false });

            if (guestsError) {
                console.error('Error fetching guests:', guestsError);
                return c.json(
                    { success: false, error: 'Failed to fetch guests' },
                    500
                );
            }

            const headers = [
                'Name',
                'Phone',
                'Email',
                'Group',
                'Max Companions',
                'Actual Companions',
                'Checked In',
                'Checked In At',
                'Registered At'
            ];

            const csvRows = [headers.join(',')];

            for (const guest of guests || []) {
                const row = [
                    `"${(guest.guest_name || '').replace(/"/g, '""')}"`,
                    `"${(guest.guest_phone || '').replace(/"/g, '""')}"`,
                    `"${(guest.guest_email || '').replace(/"/g, '""')}"`,
                    `"${(guest.guest_group || '').replace(/"/g, '""')}"`,
                    guest.max_companions || 0,
                    guest.actual_companions || 0,
                    guest.is_checked_in ? 'Yes' : 'No',
                    guest.checked_in_at ? new Date(guest.checked_in_at).toLocaleString('en-US') : '',
                    new Date(guest.created_at).toLocaleString('en-US')
                ];
                csvRows.push(row.join(','));
            }

            csvContent = csvRows.join('\n');
            filename = `report_${reportType}_${event.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.csv`;

        } else if (reportType === 'seating') {
            // Fetch guests with seating information
            const { data: guests, error: guestsError } = await supabase
                .from('invitation_guests')
                .select(`
                    guest_name,
                    guest_phone,
                    max_companions,
                    actual_companions,
                    seating_config_id,
                    is_checked_in
                `)
                .eq('event_id', eventId)
                .eq('client_id', clientId)
                .order('seating_config_id', { ascending: true, nullsFirst: false });

            if (guestsError) {
                console.error('Error fetching guests:', guestsError);
                return c.json(
                    { success: false, error: 'Failed to fetch guests' },
                    500
                );
            }

            // Fetch seating configs
            const { data: seatingConfigs } = await supabase
                .from('seating_configs')
                .select('id, section_name, table_number')
                .eq('event_id', eventId);

            const seatingMap = new Map(
                (seatingConfigs || []).map(s => [s.id, `${s.section_name} - Table ${s.table_number}`])
            );

            const headers = [
                'Name',
                'Phone',
                'Max Companions',
                'Actual Companions',
                'Seating Assignment',
                'Checked In'
            ];

            const csvRows = [headers.join(',')];

            for (const guest of guests || []) {
                const seating = guest.seating_config_id 
                    ? seatingMap.get(guest.seating_config_id) || 'Unknown'
                    : 'Not Assigned';

                const row = [
                    `"${(guest.guest_name || '').replace(/"/g, '""')}"`,
                    `"${(guest.guest_phone || '').replace(/"/g, '""')}"`,
                    guest.max_companions || 0,
                    guest.actual_companions || 0,
                    `"${seating}"`,
                    guest.is_checked_in ? 'Yes' : 'No'
                ];
                csvRows.push(row.join(','));
            }

            csvContent = csvRows.join('\n');
            filename = `report_seating_${event.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.csv`;

        } else {
            return c.json(
                { success: false, error: 'Invalid report type. Use: overview, checkin, or seating' },
                400
            );
        }

        // Return CSV file
        return new Response(csvContent, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('Error in export report:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * GET /v1/guestbook/export/statistics?event_id=xxx
 * Export event statistics as JSON
 * Requires client authentication
 */
exportRoutes.get('/statistics', clientAuthMiddleware, async (c) => {
    try {
        const clientId = c.get('clientId');
        const eventId = c.req.query('event_id');

        if (!eventId) {
            return c.json(
                { success: false, error: 'Event ID is required' },
                400
            );
        }

        const supabase = getSupabaseClient(c.env);

        // Verify event belongs to client
        const { data: event, error: eventError } = await supabase
            .from('events')
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

        // Get total guests
        const { count: totalGuests } = await supabase
            .from('invitation_guests')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId);

        // Get checked-in guests
        const { count: checkedInGuests } = await supabase
            .from('invitation_guests')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId)
            .eq('is_checked_in', true);

        // Get guests with QR codes
        const { count: guestsWithQR } = await supabase
            .from('invitation_guests')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId)
            .not('qr_token', 'is', null);

        // Get guests with seating assigned
        const { count: guestsWithSeating } = await supabase
            .from('invitation_guests')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId)
            .not('seating_config_id', 'is', null);

        // Get total companions
        const { data: companionData } = await supabase
            .from('invitation_guests')
            .select('max_companions, actual_companions')
            .eq('event_id', eventId);

        const maxCompanionsTotal = (companionData || []).reduce((sum, g) => sum + (g.max_companions || 0), 0);
        const actualCompanionsTotal = (companionData || []).reduce((sum, g) => sum + (g.actual_companions || 0), 0);

        const statistics = {
            event: {
                id: event.id,
                name: event.name,
                date: event.event_date,
                location: event.location,
            },
            guests: {
                total: totalGuests || 0,
                checked_in: checkedInGuests || 0,
                pending: (totalGuests || 0) - (checkedInGuests || 0),
                with_qr_code: guestsWithQR || 0,
                with_seating: guestsWithSeating || 0,
            },
            companions: {
                max_total: maxCompanionsTotal,
                actual_total: actualCompanionsTotal,
            },
            percentages: {
                check_in_rate: totalGuests ? ((checkedInGuests || 0) / totalGuests * 100).toFixed(2) : '0.00',
                qr_coverage: totalGuests ? ((guestsWithQR || 0) / totalGuests * 100).toFixed(2) : '0.00',
                seating_coverage: totalGuests ? ((guestsWithSeating || 0) / totalGuests * 100).toFixed(2) : '0.00',
            },
            generated_at: new Date().toISOString(),
        };

        return c.json({
            success: true,
            data: statistics,
        });
    } catch (error) {
        console.error('Error in export statistics:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

export default exportRoutes;
