import { Hono } from 'hono';
import type { Env } from '@/lib/types';
import { clientAuthMiddleware } from '@/middleware/auth';
import { getSupabaseClient } from '@/lib/supabase';

const guestbookEvents = new Hono<{
    Bindings: Env;
    Variables: {
        clientId: string;
        jwtPayload: any;
    };
}>();

// All routes require client authentication
guestbookEvents.use('*', clientAuthMiddleware);

/**
 * GET /v1/guestbook/events
 * Get all events for client
 */
guestbookEvents.get('/', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const supabase = getSupabaseClient(c.env);

        const { data: events, error } = await supabase
            .from('guestbook_events')
            .select('*')
            .eq('client_id', clientId)
            .order('event_date', { ascending: false });

        if (error) {
            throw error;
        }

        return c.json({
            success: true,
            data: events || [],
        });
    } catch (error) {
        console.error('Get events error:', error);
        return c.json(
            { success: false, error: 'Terjadi kesalahan server' },
            500
        );
    }
});

/**
 * POST /v1/guestbook/events
 * Create new event
 */
guestbookEvents.post('/', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const body = await c.req.json();
        const supabase = getSupabaseClient(c.env);

        // Check if this is wizard-based creation (with modules)
        if (body.has_invitation !== undefined || body.has_guestbook !== undefined) {
            // New wizard format
            const {
                name,
                event_date,
                event_time,
                location,
                venue_address,
                timezone,
                has_invitation,
                has_guestbook,
                invitation_config,
                guestbook_config,
                seating_mode,
            } = body;

            // Validation
            if (!name || !event_date) {
                return c.json(
                    { success: false, error: 'Nama dan tanggal event wajib diisi' },
                    400
                );
            }

            if (!has_invitation && !has_guestbook) {
                return c.json(
                    { success: false, error: 'Pilih minimal 1 modul' },
                    400
                );
            }

            // Create event with modules
            const { data: event, error } = await supabase
                .from('guestbook_events')
                .insert({
                    client_id: clientId,
                    name,
                    event_date,
                    event_time: event_time || null,
                    location: location || null,
                    venue_address: venue_address || null,
                    timezone: timezone || 'Asia/Jakarta',
                    has_invitation: has_invitation || false,
                    has_guestbook: has_guestbook || false,
                    invitation_config: invitation_config || {},
                    guestbook_config: guestbook_config || {},
                    seating_mode: seating_mode || 'none',
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating event:', error);
                return c.json(
                    { success: false, error: 'Gagal membuat event' },
                    500
                );
            }

            return c.json({
                success: true,
                data: event,
            });
        } else {
            // Legacy format (backward compatibility)
            const { name, event_date, location, options } = body;

            if (!name) {
                return c.json(
                    { success: false, error: 'Nama event wajib diisi' },
                    400
                );
            }

            const { data: event, error } = await supabase
                .from('guestbook_events')
                .insert({
                    client_id: clientId,
                    name,
                    event_date: event_date || null,
                    location: location || null,
                    ...options,
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating event:', error);
                return c.json(
                    { success: false, error: 'Gagal membuat event' },
                    500
                );
            }

            return c.json({
                success: true,
                data: event,
            });
        }
    } catch (error) {
        console.error('Create event error:', error);
        return c.json(
            { success: false, error: 'Terjadi kesalahan server' },
            500
        );
    }
});

/**
 * PUT /v1/guestbook/events/:eventId
 * Update event
 */
guestbookEvents.put('/:eventId', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const eventId = c.req.param('eventId');
        const body = await c.req.json();
        const supabase = getSupabaseClient(c.env);

        // Verify access
        const { data: existingEvent, error: fetchError } = await supabase
            .from('guestbook_events')
            .select('id')
            .eq('id', eventId)
            .eq('client_id', clientId)
            .single();

        if (fetchError || !existingEvent) {
            return c.json(
                { success: false, error: 'Event not found or access denied' },
                404
            );
        }

        // Update event
        const { data: event, error } = await supabase
            .from('guestbook_events')
            .update(body)
            .eq('id', eventId)
            .select()
            .single();

        if (error) {
            console.error('Error updating event:', error);
            return c.json(
                { success: false, error: 'Gagal mengupdate event' },
                500
            );
        }

        return c.json({
            success: true,
            data: event,
        });
    } catch (error) {
        console.error('Update event error:', error);
        return c.json(
            { success: false, error: 'Terjadi kesalahan server' },
            500
        );
    }
});

/**
 * DELETE /v1/guestbook/events/:eventId
 * Delete event
 */
guestbookEvents.delete('/:eventId', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const eventId = c.req.param('eventId');
        const supabase = getSupabaseClient(c.env);

        // Verify access
        const { data: existingEvent, error: fetchError } = await supabase
            .from('guestbook_events')
            .select('id')
            .eq('id', eventId)
            .eq('client_id', clientId)
            .single();

        if (fetchError || !existingEvent) {
            return c.json(
                { success: false, error: 'Event not found or access denied' },
                404
            );
        }

        // Delete event (cascade will handle related data)
        const { error } = await supabase
            .from('guestbook_events')
            .delete()
            .eq('id', eventId);

        if (error) {
            console.error('Error deleting event:', error);
            return c.json(
                { success: false, error: 'Gagal menghapus event' },
                500
            );
        }

        return c.json({
            success: true,
            message: 'Event berhasil dihapus',
        });
    } catch (error) {
        console.error('Delete event error:', error);
        return c.json(
            { success: false, error: 'Terjadi kesalahan server' },
            500
        );
    }
});

/**
 * GET /v1/guestbook/events/:eventId/stats
 * Get event statistics
 */
guestbookEvents.get('/:eventId/stats', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const eventId = c.req.param('eventId');
        const supabase = getSupabaseClient(c.env);

        // Verify access
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

        // Get invitations sent
        const { count: invitationsSent } = await supabase
            .from('invitation_guests')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId)
            .eq('invitation_sent', true);

        // Get seats assigned
        const { count: seatsAssigned } = await supabase
            .from('invitation_guests')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId)
            .not('seating_config_id', 'is', null);

        // Get guest types breakdown
        const { data: guestTypes } = await supabase
            .from('guest_types')
            .select('id, type_name, display_name')
            .eq('event_id', eventId);

        const guestTypesBreakdown: Record<string, number> = {};

        if (guestTypes) {
            for (const guestType of guestTypes) {
                const { count } = await supabase
                    .from('invitation_guests')
                    .select('*', { count: 'exact', head: true })
                    .eq('event_id', eventId)
                    .eq('guest_type_id', guestType.id);

                guestTypesBreakdown[guestType.display_name] = count || 0;
            }
        }

        const stats = {
            total_guests: totalGuests || 0,
            checked_in: checkedIn || 0,
            invitations_sent: invitationsSent || 0,
            seats_assigned: seatsAssigned || 0,
            guest_types_breakdown: guestTypesBreakdown,
        };

        return c.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        console.error('Get event stats error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

export default guestbookEvents;
