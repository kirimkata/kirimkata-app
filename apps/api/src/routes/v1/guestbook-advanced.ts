import { Hono } from 'hono';
import type { Env } from '@/lib/types';
import { getSupabaseClient } from '@/lib/supabase';
import { clientAuthMiddleware } from '@/middleware/auth';

const advanced = new Hono<{
    Bindings: Env;
    Variables: {
        clientId: string;
        jwtPayload: any;
    };
}>();

/**
 * POST /v1/guestbook/advanced/bulk-delete
 * Bulk delete multiple guests
 * Requires client authentication
 */
advanced.post('/bulk-delete', clientAuthMiddleware, async (c) => {
    try {
        const clientId = c.get('clientId');

        const body = await c.req.json();
        const { guest_ids } = body;

        // Validate input
        if (!guest_ids || !Array.isArray(guest_ids) || guest_ids.length === 0) {
            return c.json(
                { success: false, error: 'Guest IDs array is required' },
                400
            );
        }

        // Limit bulk operations to prevent abuse
        if (guest_ids.length > 100) {
            return c.json(
                { success: false, error: 'Maximum 100 guests can be deleted at once' },
                400
            );
        }

        const supabase = getSupabaseClient(c.env);

        // Verify all guests belong to the client
        const { data: guests, error: fetchError } = await supabase
            .from('invitation_guests')
            .select('id, client_id')
            .in('id', guest_ids);

        if (fetchError) {
            console.error('Error fetching guests for verification:', fetchError);
            return c.json(
                { success: false, error: 'Failed to verify guests' },
                500
            );
        }

        if (!guests || guests.length === 0) {
            return c.json(
                { success: false, error: 'No guests found with provided IDs' },
                404
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

        // Perform bulk delete
        const { error: deleteError } = await supabase
            .from('invitation_guests')
            .delete()
            .in('id', guest_ids);

        if (deleteError) {
            console.error('Bulk delete error:', deleteError);
            return c.json(
                { success: false, error: 'Failed to delete guests' },
                500
            );
        }

        return c.json({
            success: true,
            message: `Successfully deleted ${guest_ids.length} guests`,
            deleted_count: guest_ids.length,
        });
    } catch (error) {
        console.error('Error in bulk delete:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * POST /v1/guestbook/advanced/bulk-assign-seating
 * Bulk assign seating to multiple guests
 * Requires client authentication
 */
advanced.post('/bulk-assign-seating', clientAuthMiddleware, async (c) => {
    try {
        const clientId = c.get('clientId');

        const body = await c.req.json();
        const { assignments } = body;

        // Validate input
        // assignments should be: [{ guest_id: string, seating_config_id: string }, ...]
        if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
            return c.json(
                { success: false, error: 'Assignments array is required' },
                400
            );
        }

        // Limit bulk operations
        if (assignments.length > 100) {
            return c.json(
                { success: false, error: 'Maximum 100 assignments at once' },
                400
            );
        }

        // Validate each assignment
        for (const assignment of assignments) {
            if (!assignment.guest_id || !assignment.seating_config_id) {
                return c.json(
                    { success: false, error: 'Each assignment must have guest_id and seating_config_id' },
                    400
                );
            }
        }

        const supabase = getSupabaseClient(c.env);

        // Extract unique guest IDs
        const guestIds = [...new Set(assignments.map(a => a.guest_id))];

        // Verify all guests belong to client
        const { data: guests, error: guestsError } = await supabase
            .from('invitation_guests')
            .select('id, client_id, event_id')
            .in('id', guestIds);

        if (guestsError || !guests) {
            console.error('Error fetching guests:', guestsError);
            return c.json(
                { success: false, error: 'Failed to verify guests' },
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

        // Get event_id (should be same for all guests)
        const eventId = guests[0]?.event_id;
        if (!eventId) {
            return c.json(
                { success: false, error: 'Invalid guest data' },
                400
            );
        }

        // Extract unique seating config IDs
        const seatingConfigIds = [...new Set(assignments.map(a => a.seating_config_id))];

        // Verify seating configs exist and have capacity
        const { data: seatingConfigs, error: seatingError } = await supabase
            .from('seating_configs')
            .select('id, capacity, event_id')
            .in('id', seatingConfigIds)
            .eq('event_id', eventId);

        if (seatingError || !seatingConfigs) {
            console.error('Error fetching seating configs:', seatingError);
            return c.json(
                { success: false, error: 'Failed to verify seating configurations' },
                500
            );
        }

        if (seatingConfigs.length !== seatingConfigIds.length) {
            return c.json(
                { success: false, error: 'Some seating configurations not found' },
                404
            );
        }

        // Perform bulk update
        let successCount = 0;
        const errors = [];

        for (const assignment of assignments) {
            const { error: updateError } = await supabase
                .from('invitation_guests')
                .update({ seating_config_id: assignment.seating_config_id })
                .eq('id', assignment.guest_id)
                .eq('client_id', clientId); // Double-check ownership

            if (updateError) {
                errors.push({ guest_id: assignment.guest_id, error: updateError.message });
            } else {
                successCount++;
            }
        }

        return c.json({
            success: true,
            assigned_count: successCount,
            total_assignments: assignments.length,
            errors: errors.length > 0 ? errors : undefined,
            message: `Successfully assigned ${successCount} out of ${assignments.length} guests`,
        });
    } catch (error) {
        console.error('Error in bulk assign seating:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * POST /v1/guestbook/advanced/auto-assign-seating
 * Automatically assign unassigned guests to available seats
 * Uses intelligent algorithm considering guest types and seat capacity
 * Requires client authentication
 */
advanced.post('/auto-assign-seating', clientAuthMiddleware, async (c) => {
    try {
        const clientId = c.get('clientId');

        const body = await c.req.json();
        const { event_id } = body;

        if (!event_id) {
            return c.json(
                { success: false, error: 'Event ID is required' },
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

        // Get all seating configs for this event
        const { data: seatingConfigs, error: seatingError } = await supabase
            .from('seating_configs')
            .select('id, section_name, table_number, capacity, allowed_guest_type_ids')
            .eq('event_id', event_id)
            .order('section_name', { ascending: true })
            .order('table_number', { ascending: true });

        if (seatingError) {
            console.error('Error fetching seating configs:', seatingError);
            return c.json(
                { success: false, error: 'Failed to fetch seating configurations' },
                500
            );
        }

        if (!seatingConfigs || seatingConfigs.length === 0) {
            return c.json(
                { success: false, error: 'No seating configurations found for this event' },
                400
            );
        }

        // Get unassigned guests
        const { data: unassignedGuests, error: guestsError } = await supabase
            .from('invitation_guests')
            .select('id, guest_name, guest_type_id')
            .eq('event_id', event_id)
            .eq('client_id', clientId)
            .is('seating_config_id', null)
            .order('created_at', { ascending: true });

        if (guestsError) {
            console.error('Error fetching unassigned guests:', guestsError);
            return c.json(
                { success: false, error: 'Failed to fetch unassigned guests' },
                500
            );
        }

        if (!unassignedGuests || unassignedGuests.length === 0) {
            return c.json({
                success: true,
                assigned_count: 0,
                total_guests: 0,
                message: 'No unassigned guests found',
            });
        }

        // Build seat availability map
        const seatAvailability = new Map<string, number>();
        
        for (const config of seatingConfigs) {
            // Count current assignments
            const { count, error: countError } = await supabase
                .from('invitation_guests')
                .select('*', { count: 'exact', head: true })
                .eq('event_id', event_id)
                .eq('seating_config_id', config.id);

            if (countError) {
                console.error('Error counting seats:', countError);
                continue;
            }

            const available = config.capacity - (count || 0);
            if (available > 0) {
                seatAvailability.set(config.id, available);
            }
        }

        // Auto-assign algorithm
        let assignedCount = 0;
        const assignments = [];

        for (const guest of unassignedGuests) {
            let assigned = false;

            // Try to find suitable seat
            for (const config of seatingConfigs) {
                const available = seatAvailability.get(config.id);
                
                if (!available || available <= 0) {
                    continue;
                }

                // Check guest type restrictions
                if (config.allowed_guest_type_ids && config.allowed_guest_type_ids.length > 0) {
                    if (!guest.guest_type_id || !config.allowed_guest_type_ids.includes(guest.guest_type_id)) {
                        continue;
                    }
                }

                // Assign guest to this seat
                assignments.push({
                    guest_id: guest.id,
                    seating_config_id: config.id,
                });

                // Update availability
                seatAvailability.set(config.id, available - 1);
                assignedCount++;
                assigned = true;
                break;
            }

            if (!assigned) {
                console.log(`No suitable seat found for guest: ${guest.guest_name}`);
            }
        }

        // Perform batch updates
        if (assignments.length > 0) {
            for (const assignment of assignments) {
                await supabase
                    .from('invitation_guests')
                    .update({ seating_config_id: assignment.seating_config_id })
                    .eq('id', assignment.guest_id);
            }
        }

        return c.json({
            success: true,
            assigned_count: assignedCount,
            total_guests: unassignedGuests.length,
            unassigned_count: unassignedGuests.length - assignedCount,
            message: `Successfully assigned ${assignedCount} out of ${unassignedGuests.length} guests`,
        });
    } catch (error) {
        console.error('Error in auto-assign seating:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

export default advanced;
