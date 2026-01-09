import { Hono } from 'hono';
import type { Env } from '@/lib/types';
import { clientAuthMiddleware } from '@/middleware/auth';
import { getSupabaseClient } from '@/lib/supabase';

const guestbookSeating = new Hono<{
    Bindings: Env;
    Variables: {
        clientId: string;
        jwtPayload: any;
    };
}>();

// All routes require client authentication
guestbookSeating.use('*', clientAuthMiddleware);

/**
 * GET /v1/guestbook/seating?event_id=xxx
 * Get all seating configurations for event
 */
guestbookSeating.get('/', async (c) => {
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

        // Get seating configs
        const { data: seating, error } = await supabase
            .from('seating_configs')
            .select('*')
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
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * POST /v1/guestbook/seating
 * Create seating configuration
 */
guestbookSeating.post('/', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const body = await c.req.json();
        const { event_id, table_number, table_name, max_capacity } = body;

        if (!event_id || !table_number) {
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

        const { data: seating, error } = await supabase
            .from('seating_configs')
            .insert({
                client_id: clientId,
                event_id,
                table_number,
                table_name: table_name || `Table ${table_number}`,
                max_capacity: max_capacity || 10,
                current_occupancy: 0,
            })
            .select()
            .single();

        if (error || !seating) {
            console.error('Create seating error:', error);
            return c.json(
                { success: false, error: 'Failed to create seating' },
                500
            );
        }

        return c.json({
            success: true,
            data: seating,
        });
    } catch (error) {
        console.error('Create seating error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * PUT /v1/guestbook/seating/:configId
 * Update seating configuration
 */
guestbookSeating.put('/:configId', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const configId = c.req.param('configId');
        const body = await c.req.json();
        const supabase = getSupabaseClient(c.env);

        // Verify access
        const { data: existing, error: fetchError } = await supabase
            .from('seating_configs')
            .select('id')
            .eq('id', configId)
            .eq('client_id', clientId)
            .single();

        if (fetchError || !existing) {
            return c.json(
                { success: false, error: 'Seating config not found or access denied' },
                404
            );
        }

        const { data: seating, error } = await supabase
            .from('seating_configs')
            .update(body)
            .eq('id', configId)
            .select()
            .single();

        if (error) {
            console.error('Update seating error:', error);
            return c.json(
                { success: false, error: 'Failed to update seating' },
                500
            );
        }

        return c.json({
            success: true,
            data: seating,
        });
    } catch (error) {
        console.error('Update seating error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * DELETE /v1/guestbook/seating/:configId
 * Delete seating configuration
 */
guestbookSeating.delete('/:configId', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const configId = c.req.param('configId');
        const supabase = getSupabaseClient(c.env);

        // Verify access
        const { data: existing, error: fetchError } = await supabase
            .from('seating_configs')
            .select('id')
            .eq('id', configId)
            .eq('client_id', clientId)
            .single();

        if (fetchError || !existing) {
            return c.json(
                { success: false, error: 'Seating config not found or access denied' },
                404
            );
        }

        const { error } = await supabase
            .from('seating_configs')
            .delete()
            .eq('id', configId);

        if (error) {
            console.error('Delete seating error:', error);
            return c.json(
                { success: false, error: 'Failed to delete seating' },
                500
            );
        }

        return c.json({
            success: true,
            message: 'Seating deleted successfully',
        });
    } catch (error) {
        console.error('Delete seating error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * POST /v1/guestbook/seating/auto-assign
 * Auto-assign guests to seats based on algorithm
 */
guestbookSeating.post('/auto-assign', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const body = await c.req.json();
        const { event_id } = body;

        if (!event_id) {
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
            .eq('id', event_id)
            .eq('client_id', clientId)
            .single();

        if (eventError || !event) {
            return c.json(
                { success: false, error: 'Event not found or access denied' },
                404
            );
        }

        // Get unassigned guests
        const { data: guests, error: guestsError } = await supabase
            .from('invitation_guests')
            .select('id, max_companions')
            .eq('event_id', event_id)
            .is('seating_config_id', null)
            .order('created_at', { ascending: true });

        if (guestsError) {
            throw guestsError;
        }

        // Get available seating
        const { data: seating, error: seatingError } = await supabase
            .from('seating_configs')
            .select('id, max_capacity, current_occupancy')
            .eq('event_id', event_id)
            .order('table_number', { ascending: true });

        if (seatingError) {
            throw seatingError;
        }

        // Simple auto-assign algorithm: fill tables sequentially
        let assignedCount = 0;
        let currentTableIndex = 0;

        for (const guest of guests || []) {
            const guestSize = 1 + (guest.max_companions || 0);

            // Find a table with enough space
            while (currentTableIndex < (seating?.length || 0)) {
                const table = seating![currentTableIndex];
                const availableSpace = table.max_capacity - (table.current_occupancy || 0);

                if (availableSpace >= guestSize) {
                    // Assign guest to this table
                    await supabase
                        .from('invitation_guests')
                        .update({ seating_config_id: table.id })
                        .eq('id', guest.id);

                    // Update table occupancy
                    await supabase
                        .from('seating_configs')
                        .update({ current_occupancy: (table.current_occupancy || 0) + guestSize })
                        .eq('id', table.id);

                    assignedCount++;
                    break;
                }

                currentTableIndex++;
            }

            if (currentTableIndex >= (seating?.length || 0)) {
                // No more tables available
                break;
            }
        }

        return c.json({
            success: true,
            message: `Assigned ${assignedCount} guests to seats`,
            assigned_count: assignedCount,
            total_guests: guests?.length || 0,
        });
    } catch (error) {
        console.error('Auto-assign error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * POST /v1/guestbook/seating/bulk
 * Bulk assign guests to specific table
 */
guestbookSeating.post('/bulk', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const body = await c.req.json();
        const { guest_ids, seating_config_id } = body;

        if (!Array.isArray(guest_ids) || !seating_config_id) {
            return c.json(
                { success: false, error: 'Invalid request data' },
                400
            );
        }

        const supabase = getSupabaseClient(c.env);

        // Verify seating config belongs to client
        const { data: seating, error: seatingError } = await supabase
            .from('seating_configs')
            .select('id')
            .eq('id', seating_config_id)
            .eq('client_id', clientId)
            .single();

        if (seatingError || !seating) {
            return c.json(
                { success: false, error: 'Seating config not found or access denied' },
                404
            );
        }

        // Update guests
        const { error } = await supabase
            .from('invitation_guests')
            .update({ seating_config_id })
            .in('id', guest_ids)
            .eq('client_id', clientId);

        if (error) {
            console.error('Bulk assign error:', error);
            return c.json(
                { success: false, error: 'Failed to assign guests' },
                500
            );
        }

        return c.json({
            success: true,
            message: `Assigned ${guest_ids.length} guests to table`,
        });
    } catch (error) {
        console.error('Bulk assign error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * GET /v1/guestbook/seating/stats?event_id=xxx
 * Get seating statistics
 */
guestbookSeating.get('/stats', async (c) => {
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

        // Get total seats
        const { data: seating } = await supabase
            .from('seating_configs')
            .select('max_capacity, current_occupancy')
            .eq('event_id', eventId);

        const totalCapacity = seating?.reduce((sum, s) => sum + (s.max_capacity || 0), 0) || 0;
        const totalOccupied = seating?.reduce((sum, s) => sum + (s.current_occupancy || 0), 0) || 0;

        // Get assigned guests count
        const { count: assignedGuests } = await supabase
            .from('invitation_guests')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId)
            .not('seating_config_id', 'is', null);

        // Get unassigned guests count
        const { count: unassignedGuests } = await supabase
            .from('invitation_guests')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId)
            .is('seating_config_id', null);

        return c.json({
            success: true,
            data: {
                total_capacity: totalCapacity,
                total_occupied: totalOccupied,
                available_seats: totalCapacity - totalOccupied,
                assigned_guests: assignedGuests || 0,
                unassigned_guests: unassignedGuests || 0,
                total_tables: seating?.length || 0,
            },
        });
    } catch (error) {
        console.error('Get seating stats error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

export default guestbookSeating;
