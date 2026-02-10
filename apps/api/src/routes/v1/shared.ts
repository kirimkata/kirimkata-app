import { Hono } from 'hono';
import type { Env } from '@/lib/types';
import { clientAuthMiddleware } from '@/middleware/auth';
import { getSupabaseClient } from '@/lib/supabase';
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

        // Get redemption logs using staff_logs
        // Matching logic from local logRepository.ts
        const { data: logs, error } = await supabase
            .from('staff_logs')
            .select(`
                *,
                invitation_guests!inner(
                    id,
                    event_id,
                    guest_name,
                    guest_phone,
                    guest_type_id
                ),
                guestbook_staff(
                    id,
                    username,
                    full_name
                )
            `)
            .eq('invitation_guests.event_id', eventId)
            .in('action', ['souvenir', 'snack', 'meal', 'vip_lounge'])
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            throw error;
        }

        // Transform data
        const formattedLogs = logs?.map(log => ({
            id: log.id,
            guest_name: log.invitation_guests?.guest_name,
            staff_name: log.guestbook_staff?.full_name || 'System',
            entitlement_type: log.action.toUpperCase(),
            quantity: 1, // Default to 1 as staff_logs doesn't seem to have quantity
            redeemed_at: log.created_at
        }));

        return c.json({
            success: true,
            data: formattedLogs || [],
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

        if (statsOnly) {
            // Get seating stats
            const { data: seating } = await supabase
                .from('seating_configs')
                .select('max_capacity, current_occupancy')
                .eq('event_id', eventId);

            const totalCapacity = seating?.reduce((sum, s) => sum + (s.max_capacity || 0), 0) || 0;
            const totalOccupied = seating?.reduce((sum, s) => sum + (s.current_occupancy || 0), 0) || 0;

            return c.json({
                success: true,
                data: {
                    total_capacity: totalCapacity,
                    total_occupied: totalOccupied,
                    available_seats: totalCapacity - totalOccupied,
                    total_tables: seating?.length || 0,
                },
            });
        }

        // Get seating with guests
        const { data: seating, error } = await supabase
            .from('seating_configs')
            .select(`
                *,
                guests:invitation_guests(*)
            `)
            .eq('event_id', eventId)
            .order('table_number', { ascending: true });

        if (error) {
            throw error;
        }

        return c.json({
            success: true,
            data: seating || [],
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

        const supabase = getSupabaseClient(c.env);

        // Verify guest belongs to client
        const { data: guest, error: guestError } = await supabase
            .from('invitation_guests')
            .select('id')
            .eq('id', guest_id)
            .eq('client_id', clientId)
            .single();

        if (guestError || !guest) {
            return c.json(
                { success: false, error: 'Guest not found or access denied' },
                404
            );
        }

        // Update seating (simplified - just update table_number and seating_area fields)
        const { error } = await supabase
            .from('invitation_guests')
            .update({
                table_number: table_number || null,
                seating_area: seating_area || null,
            })
            .eq('id', guest_id);

        if (error) {
            console.error('Update seating error:', error);
            return c.json(
                { success: false, error: 'Gagal update seating' },
                500
            );
        }

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

        // Get staff (exclude password)
        const { data: staff, error } = await supabase
            .from('event_staff')
            .select('id, event_id, username, full_name, phone, permissions, is_active, created_at')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        return c.json({
            success: true,
            data: staff || [],
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

        // Hash password
        const hashedPassword = await hashPassword(password, c.env.ENCRYPTION_KEY);

        // Create staff
        const { data: staff, error } = await supabase
            .from('event_staff')
            .insert({
                event_id,
                username,
                password_encrypted: hashedPassword,
                full_name,
                phone: phone || null,
                permissions: permissions || {},
                is_active: true,
            })
            .select('id, event_id, username, full_name, phone, permissions, is_active, created_at')
            .single();

        if (error || !staff) {
            console.error('Create staff error:', error);
            return c.json(
                { success: false, error: 'Gagal membuat staff' },
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

        const supabase = getSupabaseClient(c.env);

        // Verify staff belongs to client's event
        const { data: staff, error: staffError } = await supabase
            .from('event_staff')
            .select('event_id')
            .eq('id', staff_id)
            .single();

        if (staffError || !staff) {
            return c.json(
                { success: false, error: 'Staff not found' },
                404
            );
        }

        // Verify event belongs to client
        const { data: event, error: eventError } = await supabase
            .from('guestbook_events')
            .select('id')
            .eq('id', staff.event_id)
            .eq('client_id', clientId)
            .single();

        if (eventError || !event) {
            return c.json(
                { success: false, error: 'Access denied' },
                403
            );
        }

        // Prepare update data
        const updateData: any = { ...updates };
        if (password) {
            updateData.password_encrypted = await hashPassword(password, c.env.ENCRYPTION_KEY);
        }

        // Update staff
        const { data: updatedStaff, error } = await supabase
            .from('event_staff')
            .update(updateData)
            .eq('id', staff_id)
            .select('id, event_id, username, full_name, phone, permissions, is_active')
            .single();

        if (error || !updatedStaff) {
            console.error('Update staff error:', error);
            return c.json(
                { success: false, error: 'Gagal update staff' },
                500
            );
        }

        return c.json({
            success: true,
            data: updatedStaff,
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

        const supabase = getSupabaseClient(c.env);

        // Verify staff belongs to client's event
        const { data: staff, error: staffError } = await supabase
            .from('event_staff')
            .select('event_id')
            .eq('id', staffId)
            .single();

        if (staffError || !staff) {
            return c.json(
                { success: false, error: 'Staff not found' },
                404
            );
        }

        // Verify event belongs to client
        const { data: event, error: eventError } = await supabase
            .from('guestbook_events')
            .select('id')
            .eq('id', staff.event_id)
            .eq('client_id', clientId)
            .single();

        if (eventError || !event) {
            return c.json(
                { success: false, error: 'Access denied' },
                403
            );
        }

        // Delete staff
        const { error } = await supabase
            .from('event_staff')
            .delete()
            .eq('id', staffId);

        if (error) {
            console.error('Delete staff error:', error);
            return c.json(
                { success: false, error: 'Gagal hapus staff' },
                500
            );
        }

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

        // Get comprehensive guest stats
        const { count: totalGuests } = await supabase
            .from('invitation_guests')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId);

        const { count: checkedIn } = await supabase
            .from('invitation_guests')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId)
            .eq('is_checked_in', true);

        const { count: withSeats } = await supabase
            .from('invitation_guests')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId)
            .not('seating_config_id', 'is', null);

        const { count: invitationsSent } = await supabase
            .from('invitation_guests')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId)
            .eq('invitation_sent', true);

        // Get guest type breakdown
        const { data: guestTypes } = await supabase
            .from('guest_types')
            .select('id, display_name')
            .eq('event_id', eventId);

        const typeBreakdown: Record<string, number> = {};

        if (guestTypes) {
            for (const type of guestTypes) {
                const { count } = await supabase
                    .from('invitation_guests')
                    .select('*', { count: 'exact', head: true })
                    .eq('event_id', eventId)
                    .eq('guest_type_id', type.id);

                typeBreakdown[type.display_name] = count || 0;
            }
        }

        return c.json({
            success: true,
            data: {
                total_guests: totalGuests || 0,
                checked_in: checkedIn || 0,
                with_seats: withSeats || 0,
                invitations_sent: invitationsSent || 0,
                type_breakdown: typeBreakdown,
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
