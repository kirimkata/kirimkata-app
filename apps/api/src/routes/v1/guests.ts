import { Hono } from 'hono';
import type { Env } from '@/lib/types';
import { clientAuthMiddleware } from '@/middleware/auth';
import { getSupabaseClient } from '@/lib/supabase';

const guests = new Hono<{ Bindings: Env }>();

// All guests routes require client authentication
guests.use('*', clientAuthMiddleware);

/**
 * GET /v1/guests
 * Get all guests for authenticated client
 */
guests.get('/', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const supabase = getSupabaseClient(c.env);

        const { data: guestsList, error } = await supabase
            .from('invitation_guests')
            .select('id, name, phone, sent')
            .eq('client_id', clientId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching guests:', error);
            return c.json(
                { success: false, error: 'Failed to fetch guests' },
                500
            );
        }

        return c.json({
            success: true,
            guests: guestsList || [],
        });
    } catch (error) {
        console.error('Error in GET /v1/guests:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * POST /v1/guests
 * Create or replace all guests for client
 */
guests.post('/', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const body = await c.req.json();
        const { guests: guestsData } = body;

        if (!Array.isArray(guestsData)) {
            return c.json(
                { success: false, error: 'Invalid guests data' },
                400
            );
        }

        const supabase = getSupabaseClient(c.env);

        // Delete all existing guests for this client
        const { error: deleteError } = await supabase
            .from('invitation_guests')
            .delete()
            .eq('client_id', clientId);

        if (deleteError) {
            console.error('Error deleting guests:', deleteError);
            return c.json(
                { success: false, error: 'Failed to delete existing guests' },
                500
            );
        }

        // Insert new guests if any
        if (guestsData.length > 0) {
            const guestsToInsert = guestsData.map((guest: any) => ({
                client_id: clientId,
                name: guest.name,
                phone: guest.phone,
                sent: guest.sent || false,
            }));

            const { data: insertedGuests, error: insertError } = await supabase
                .from('invitation_guests')
                .insert(guestsToInsert)
                .select('id, name, phone, sent');

            if (insertError) {
                console.error('Error inserting guests:', insertError);
                return c.json(
                    { success: false, error: 'Failed to save guests' },
                    500
                );
            }

            return c.json({
                success: true,
                message: 'Guests saved successfully',
                guests: insertedGuests || [],
            });
        }

        return c.json({
            success: true,
            message: 'All guests deleted successfully',
            guests: [],
        });
    } catch (error) {
        console.error('Error in POST /v1/guests:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * GET /v1/guests/stats
 * Get guest statistics for client
 */
guests.get('/stats', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const supabase = getSupabaseClient(c.env);

        const { count: totalGuests = 0 } = await supabase
            .from('invitation_guests')
            .select('id', { count: 'exact', head: true })
            .eq('client_id', clientId);

        const { count: checkedInGuests = 0 } = await supabase
            .from('guestbook_checkins')
            .select('id', { count: 'exact', head: true })
            .eq('client_id', clientId);

        return c.json({
            success: true,
            data: {
                total_guests: totalGuests ?? 0,
                checked_in_guests: checkedInGuests ?? 0,
            },
        });
    } catch (error) {
        console.error('Error fetching guest stats:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

export default guests;
