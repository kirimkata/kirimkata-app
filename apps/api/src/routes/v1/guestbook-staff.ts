
import { Hono } from 'hono';
import type { Env } from '@/lib/types';
import { clientAuthMiddleware } from '@/middleware/auth';
import { getSupabaseClient } from '@/lib/supabase';
import { hashPassword, comparePassword } from '@/services/encryption';

const guestbookStaff = new Hono<{
    Bindings: Env;
    Variables: {
        clientId: string;
        jwtPayload: any;
    };
}>();

// All routes require client authentication
guestbookStaff.use('*', clientAuthMiddleware);

/**
 * GET /v1/guestbook/staff?event_id=xxx
 * Get all staff for an event
 */
guestbookStaff.get('/', async (c) => {
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

        // Get staff
        const { data: staff, error } = await supabase
            .from('guestbook_staff')
            .select('*')
            .eq('event_id', eventId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Get staff error:', error);
            return c.json(
                { success: false, error: 'Failed to fetch staff' },
                500
            );
        }

        return c.json({
            success: true,
            data: staff || [],
        });
    } catch (error) {
        console.error('Get staff error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * POST /v1/guestbook/staff
 * Create new staff
 */
guestbookStaff.post('/', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const body = await c.req.json();
        const { event_id, username, password, full_name, phone, permissions } = body;

        if (!event_id || !username || !password || !full_name) {
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

        // Check for duplicate username in this event
        const { data: existing } = await supabase
            .from('guestbook_staff')
            .select('id')
            .eq('event_id', event_id)
            .eq('username', username)
            .single();

        if (existing) {
            return c.json(
                { success: false, error: 'Username sudah digunakan' },
                400
            );
        }

        // Hash password
        const hashedPassword = await hashPassword(password, c.env.ENCRYPTION_KEY);

        // Create staff
        const { data: staff, error } = await supabase
            .from('guestbook_staff')
            .insert({
                event_id,
                username,
                password_encrypted: hashedPassword,
                full_name,
                phone: phone || null,
                can_checkin: permissions?.can_checkin ?? false,
                can_redeem_souvenir: permissions?.can_redeem_souvenir ?? false,
                can_redeem_snack: permissions?.can_redeem_snack ?? false,
                can_access_vip_lounge: permissions?.can_access_vip_lounge ?? false,
                is_active: true,
            })
            .select()
            .single();

        if (error || !staff) {
            console.error('Create staff error:', error);
            return c.json(
                { success: false, error: 'Failed to create staff' },
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
            { success: false, error: error.message || 'Internal server error' },
            500
        );
    }
});

/**
 * PUT /v1/guestbook/staff/:staffId
 * Update staff
 */
guestbookStaff.put('/:staffId', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const staffId = c.req.param('staffId');
        const body = await c.req.json();
        const { full_name, phone, permissions, is_active } = body;
        // Note: Password update not implemented in original API, but could be added here if needed.
        // Original repository only updates profile fields.

        const supabase = getSupabaseClient(c.env);

        // Verify access (join with event to check client_id)
        // Since we can't do deep joins easily for auth check in one go with simple RLS logic if RLS isn't set up perfectly or we want explicit check:
        // First get staff to get event_id
        const { data: existingStaff, error: fetchError } = await supabase
            .from('guestbook_staff')
            .select('id, event_id')
            .eq('id', staffId)
            .single();

        if (fetchError || !existingStaff) {
            return c.json(
                { success: false, error: 'Staff not found' },
                404
            );
        }

        // Check if event belongs to client
        const { data: event, error: eventError } = await supabase
            .from('guestbook_events')
            .select('id')
            .eq('id', existingStaff.event_id)
            .eq('client_id', clientId)
            .single();

        if (eventError || !event) {
            return c.json(
                { success: false, error: 'Access denied' },
                403
            );
        }

        // Build update object
        const updates: any = {};
        if (full_name !== undefined) updates.full_name = full_name;
        if (phone !== undefined) updates.phone = phone;
        if (is_active !== undefined) updates.is_active = is_active;

        if (permissions) {
            if (permissions.can_checkin !== undefined) updates.can_checkin = permissions.can_checkin;
            if (permissions.can_redeem_souvenir !== undefined) updates.can_redeem_souvenir = permissions.can_redeem_souvenir;
            if (permissions.can_redeem_snack !== undefined) updates.can_redeem_snack = permissions.can_redeem_snack;
            if (permissions.can_access_vip_lounge !== undefined) updates.can_access_vip_lounge = permissions.can_access_vip_lounge;
        }

        const { data: staff, error } = await supabase
            .from('guestbook_staff')
            .update(updates)
            .eq('id', staffId)
            .select()
            .single();

        if (error) {
            console.error('Update staff error:', error);
            return c.json(
                { success: false, error: 'Failed to update staff' },
                500
            );
        }

        return c.json({
            success: true,
            data: staff,
        });
    } catch (error) {
        console.error('Update staff error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * DELETE /v1/guestbook/staff/:staffId
 * Delete staff
 */
guestbookStaff.delete('/:staffId', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const staffId = c.req.param('staffId');
        const supabase = getSupabaseClient(c.env);

        // Verify access similar to PUT
        const { data: existingStaff, error: fetchError } = await supabase
            .from('guestbook_staff')
            .select('id, event_id')
            .eq('id', staffId)
            .single();

        if (fetchError || !existingStaff) {
            return c.json(
                { success: false, error: 'Staff not found' },
                404
            );
        }

        const { data: event, error: eventError } = await supabase
            .from('guestbook_events')
            .select('id')
            .eq('id', existingStaff.event_id)
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
            .from('guestbook_staff')
            .delete()
            .eq('id', staffId);

        if (error) {
            console.error('Delete staff error:', error);
            return c.json(
                { success: false, error: 'Failed to delete staff' },
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
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

export default guestbookStaff;
