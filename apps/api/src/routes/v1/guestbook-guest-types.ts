import { Hono } from 'hono';
import type { Env } from '@/lib/types';
import { clientAuthMiddleware } from '@/middleware/auth';
import { getSupabaseClient } from '@/lib/supabase';

const guestTypes = new Hono<{
    Bindings: Env;
    Variables: {
        clientId: string;
        jwtPayload: any;
    };
}>();

// All routes require client authentication
guestTypes.use('*', clientAuthMiddleware);

/**
 * GET /v1/guestbook/guest-types?event_id=xxx
 * Get all guest types for an event
 */
guestTypes.get('/', async (c) => {
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

        // Get guest types
        const { data: types, error } = await supabase
            .from('guest_types')
            .select('*')
            .eq('event_id', eventId)
            .order('priority_order', { ascending: true });

        if (error) {
            throw error;
        }

        return c.json({
            success: true,
            data: types || [],
        });
    } catch (error) {
        console.error('Get guest types error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * POST /v1/guestbook/guest-types
 * Create new guest type
 */
guestTypes.post('/', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const body = await c.req.json();
        const { event_id, type_name, display_name, color_code } = body;

        if (!event_id || !type_name || !display_name || !color_code) {
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

        // Get current guest types to determine priority order
        const { data: existingTypes } = await supabase
            .from('guest_types')
            .select('priority_order')
            .eq('event_id', event_id)
            .order('priority_order', { ascending: false })
            .limit(1);

        const maxPriority = existingTypes && existingTypes.length > 0
            ? existingTypes[0].priority_order
            : 0;

        // Create guest type
        const { data: guestType, error } = await supabase
            .from('guest_types')
            .insert({
                client_id: clientId,
                event_id,
                type_name,
                display_name,
                color_code,
                priority_order: maxPriority + 1,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating guest type:', error);
            return c.json(
                { success: false, error: 'Failed to create guest type' },
                500
            );
        }

        return c.json({
            success: true,
            data: guestType,
        });
    } catch (error) {
        console.error('Create guest type error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * PUT /v1/guestbook/guest-types/:typeId
 * Update guest type
 */
guestTypes.put('/:typeId', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const typeId = c.req.param('typeId');
        const body = await c.req.json();
        const supabase = getSupabaseClient(c.env);

        // Verify access
        const { data: existingType, error: fetchError } = await supabase
            .from('guest_types')
            .select('id')
            .eq('id', typeId)
            .eq('client_id', clientId)
            .single();

        if (fetchError || !existingType) {
            return c.json(
                { success: false, error: 'Guest type not found or access denied' },
                404
            );
        }

        // Update guest type
        const { data: guestType, error } = await supabase
            .from('guest_types')
            .update(body)
            .eq('id', typeId)
            .select()
            .single();

        if (error) {
            console.error('Error updating guest type:', error);
            return c.json(
                { success: false, error: 'Failed to update guest type' },
                500
            );
        }

        return c.json({
            success: true,
            data: guestType,
        });
    } catch (error) {
        console.error('Update guest type error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * DELETE /v1/guestbook/guest-types/:typeId
 * Delete guest type
 */
guestTypes.delete('/:typeId', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const typeId = c.req.param('typeId');
        const supabase = getSupabaseClient(c.env);

        // Verify access
        const { data: existingType, error: fetchError } = await supabase
            .from('guest_types')
            .select('id')
            .eq('id', typeId)
            .eq('client_id', clientId)
            .single();

        if (fetchError || !existingType) {
            return c.json(
                { success: false, error: 'Guest type not found or access denied' },
                404
            );
        }

        // Delete guest type
        const { error } = await supabase
            .from('guest_types')
            .delete()
            .eq('id', typeId);

        if (error) {
            console.error('Error deleting guest type:', error);
            return c.json(
                { success: false, error: 'Failed to delete guest type' },
                500
            );
        }

        return c.json({
            success: true,
            message: 'Guest type deleted successfully',
        });
    } catch (error) {
        console.error('Delete guest type error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * GET /v1/guestbook/guest-types/stats?event_id=xxx
 * Get guest types statistics
 */
guestTypes.get('/stats', async (c) => {
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

        // Get guest types with counts
        const { data: types, error } = await supabase
            .from('guest_types')
            .select('id, type_name, display_name, color_code')
            .eq('event_id', eventId);

        if (error) {
            throw error;
        }

        const stats = [];

        if (types) {
            for (const type of types) {
                const { count } = await supabase
                    .from('invitation_guests')
                    .select('*', { count: 'exact', head: true })
                    .eq('event_id', eventId)
                    .eq('guest_type_id', type.id);

                stats.push({
                    ...type,
                    guest_count: count || 0,
                });
            }
        }

        return c.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        console.error('Get guest types stats error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

export default guestTypes;
