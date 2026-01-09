import { Hono } from 'hono';
import type { Env } from '@/lib/types';
import { adminAuthMiddleware } from '@/middleware/auth';
import { getSupabaseClient } from '@/lib/supabase';
import { hashPassword, comparePassword } from '@/services/encryption';

const admin = new Hono<{
    Bindings: Env;
    Variables: {
        adminId: string;
        jwtPayload: any;
    };
}>();

// All admin routes require authentication
admin.use('*', adminAuthMiddleware);

/**
 * GET /v1/admin/clients
 * List all clients
 */
admin.get('/clients', async (c) => {
    try {
        const supabase = getSupabaseClient(c.env);

        const { data: clients, error } = await supabase
            .from('clients')
            .select('id, username, email, slug, guestbook_access, quota_photos, quota_music, quota_videos, created_at, updated_at')
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        return c.json({
            success: true,
            clients: clients || [],
        });
    } catch (error) {
        console.error('Error fetching clients:', error);
        return c.json(
            { error: 'Internal server error' },
            500
        );
    }
});

/**
 * POST /v1/admin/clients
 * Create new client
 */
admin.post('/clients', async (c) => {
    try {
        const body = await c.req.json();
        const { username, password, email, slug } = body;

        if (!username || !password) {
            return c.json(
                { error: 'Username and password are required' },
                400
            );
        }

        const supabase = getSupabaseClient(c.env);

        // Hash password
        const hashedPassword = await hashPassword(password, c.env.ENCRYPTION_KEY);

        // Create client with default quotas
        const { data: client, error } = await supabase
            .from('clients')
            .insert({
                username,
                password_encrypted: hashedPassword,
                email: email || null,
                slug: slug || null,
                quota_photos: 10,
                quota_music: 5,
                quota_videos: 3,
                guestbook_access: true,
            })
            .select('id, username, email, slug, created_at')
            .single();

        if (error) {
            console.error('Error creating client:', error);
            return c.json(
                { error: 'Failed to create client', message: error.message },
                500
            );
        }

        return c.json({
            success: true,
            client,
        });
    } catch (error: any) {
        console.error('Error creating client:', error);
        return c.json(
            { error: 'Internal server error', message: error.message },
            500
        );
    }
});

/**
 * PUT /v1/admin/clients/:id
 * Update client
 */
admin.put('/clients/:id', async (c) => {
    try {
        const clientId = c.req.param('id');
        const body = await c.req.json();
        const { username, password, email, slug } = body;

        const supabase = getSupabaseClient(c.env);

        // Build update object
        const updateData: any = {};
        if (username !== undefined) updateData.username = username;
        if (email !== undefined) updateData.email = email;
        if (slug !== undefined) updateData.slug = slug;

        // Hash password if provided
        if (password) {
            updateData.password_encrypted = await hashPassword(password, c.env.ENCRYPTION_KEY);
        }

        const { data: client, error } = await supabase
            .from('clients')
            .update(updateData)
            .eq('id', clientId)
            .select('id, username, email, slug, updated_at')
            .single();

        if (error) {
            console.error('Error updating client:', error);
            return c.json(
                { error: 'Failed to update client' },
                500
            );
        }

        return c.json({
            success: true,
            client,
        });
    } catch (error) {
        console.error('Error updating client:', error);
        return c.json(
            { error: 'Internal server error' },
            500
        );
    }
});

/**
 * DELETE /v1/admin/clients/:id
 * Delete client
 */
admin.delete('/clients/:id', async (c) => {
    try {
        const clientId = c.req.param('id');
        const supabase = getSupabaseClient(c.env);

        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', clientId);

        if (error) {
            console.error('Error deleting client:', error);
            return c.json(
                { error: 'Failed to delete client' },
                500
            );
        }

        return c.json({
            success: true,
            message: 'Client deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting client:', error);
        return c.json(
            { error: 'Internal server error' },
            500
        );
    }
});

/**
 * GET /v1/admin/clients/:id/quota
 * Get client quota
 */
admin.get('/clients/:id/quota', async (c) => {
    try {
        const clientId = c.req.param('id');
        const supabase = getSupabaseClient(c.env);

        const { data, error } = await supabase
            .from('clients')
            .select('quota_photos, quota_music, quota_videos')
            .eq('id', clientId)
            .single();

        if (error || !data) {
            return c.json({ error: 'Client not found' }, 404);
        }

        return c.json({
            quota_photos: data.quota_photos,
            quota_music: data.quota_music,
            quota_videos: data.quota_videos,
        });
    } catch (error: any) {
        console.error('Get quota error:', error);
        return c.json({
            error: 'Failed to get quota',
            message: error.message
        }, 500);
    }
});

/**
 * PATCH /v1/admin/clients/:id/quota
 * Update client quota
 */
admin.patch('/clients/:id/quota', async (c) => {
    try {
        const clientId = c.req.param('id');
        const body = await c.req.json();
        const supabase = getSupabaseClient(c.env);

        const { quota_photos, quota_music, quota_videos } = body;

        // Validate values
        if (quota_photos !== undefined && (quota_photos < 0 || quota_photos > 100)) {
            return c.json({ error: 'quota_photos must be between 0 and 100' }, 400);
        }
        if (quota_music !== undefined && (quota_music < 0 || quota_music > 100)) {
            return c.json({ error: 'quota_music must be between 0 and 100' }, 400);
        }
        if (quota_videos !== undefined && (quota_videos < 0 || quota_videos > 100)) {
            return c.json({ error: 'quota_videos must be between 0 and 100' }, 400);
        }

        // Build update object
        const updates: any = {};
        if (quota_photos !== undefined) updates.quota_photos = quota_photos;
        if (quota_music !== undefined) updates.quota_music = quota_music;
        if (quota_videos !== undefined) updates.quota_videos = quota_videos;

        if (Object.keys(updates).length === 0) {
            return c.json({ error: 'No quota values provided' }, 400);
        }

        const { data, error } = await supabase
            .from('clients')
            .update(updates)
            .eq('id', clientId)
            .select('quota_photos, quota_music, quota_videos')
            .single();

        if (error || !data) {
            return c.json({ error: 'Client not found' }, 404);
        }

        return c.json({
            success: true,
            quota: data
        });
    } catch (error: any) {
        console.error('Update quota error:', error);
        return c.json({
            error: 'Failed to update quota',
            message: error.message
        }, 500);
    }
});

/**
 * POST /v1/admin/invitations
 * Create new invitation
 */
admin.post('/invitations', async (c) => {
    try {
        const payload = await c.req.json();

        // Validate required fields
        if (!payload.slug || !payload.themeKey) {
            return c.json(
                { success: false, error: 'Slug and theme are required' },
                400
            );
        }

        const supabase = getSupabaseClient(c.env);

        // Check if slug already exists
        const { data: existing } = await supabase
            .from('invitation_contents')
            .select('slug')
            .eq('slug', payload.slug)
            .single();

        if (existing) {
            return c.json(
                { success: false, error: `Slug "${payload.slug}" sudah digunakan` },
                400
            );
        }

        // Prepare eventCloud from event data
        const eventCloud = {
            holyMatrimony: payload.event?.holyMatrimony || {},
            reception: payload.event?.reception || {},
            streaming: {
                description: '',
                url: '',
                buttonLabel: 'Watch Live',
            },
        };

        // Insert new invitation
        const { data, error } = await supabase
            .from('invitation_contents')
            .insert({
                slug: payload.slug,
                theme_key: payload.themeKey,
                client_profile: payload.clientProfile || {},
                bride: payload.bride || {},
                groom: payload.groom || {},
                event: {
                    fullDateLabel: payload.event?.fullDateLabel || '',
                    isoDate: payload.event?.isoDate || '',
                    countdownDateTime: payload.event?.countdownDateTime || '',
                },
                clouds: {},
                event_cloud: eventCloud,
                love_story: payload.loveStory || [],
                gallery: payload.gallery || [],
                wedding_gift: payload.weddingGift || {},
                background_music: payload.backgroundMusic || {},
                closing: payload.closing || {},
            })
            .select()
            .single();

        if (error) {
            console.error('Error inserting invitation:', error);
            return c.json(
                { success: false, error: 'Failed to create invitation: ' + error.message },
                500
            );
        }

        return c.json({
            success: true,
            data: {
                slug: data.slug,
                themeKey: data.theme_key,
            },
        });
    } catch (error: any) {
        console.error('Error in POST invitations:', error);
        return c.json(
            { success: false, error: error.message || 'Internal server error' },
            500
        );
    }
});

/**
 * GET /v1/admin/slugs
 * Get available slugs (slugs that exist in invitation_contents but not assigned to clients)
 */
admin.get('/slugs', async (c) => {
    try {
        const supabase = getSupabaseClient(c.env);

        // Get all slugs from invitation_contents
        const { data: invitations, error: invError } = await supabase
            .from('invitation_contents')
            .select('slug');

        if (invError) {
            throw invError;
        }

        // Get all assigned slugs from clients
        const { data: clients, error: clientError } = await supabase
            .from('clients')
            .select('slug')
            .not('slug', 'is', null);

        if (clientError) {
            throw clientError;
        }

        const assignedSlugs = new Set(clients?.map(c => c.slug) || []);
        const availableSlugs = invitations
            ?.filter(inv => !assignedSlugs.has(inv.slug))
            .map(inv => inv.slug) || [];

        return c.json({
            success: true,
            slugs: availableSlugs,
        });
    } catch (error) {
        console.error('Error fetching slugs:', error);
        return c.json(
            { error: 'Internal server error' },
            500
        );
    }
});

/**
 * PUT /v1/admin/settings
 * Update admin settings (password change)
 */
admin.put('/settings', async (c) => {
    try {
        const adminId = c.get('adminId') as string;
        const body = await c.req.json();
        const { currentPassword, newPassword } = body;

        // Validate input
        if (!currentPassword || !newPassword) {
            return c.json(
                { success: false, error: 'Current password and new password are required' },
                400
            );
        }

        if (newPassword.length < 6) {
            return c.json(
                { success: false, error: 'New password must be at least 6 characters' },
                400
            );
        }

        const supabase = getSupabaseClient(c.env);

        // Get current admin data
        const { data: admin, error: fetchError } = await supabase
            .from('admins')
            .select('password_encrypted')
            .eq('id', adminId)
            .single();

        if (fetchError || !admin) {
            return c.json(
                { success: false, error: 'Admin not found' },
                404
            );
        }

        // Verify current password
        const isValid = await comparePassword(
            currentPassword,
            admin.password_encrypted,
            c.env.ENCRYPTION_KEY
        );

        if (!isValid) {
            return c.json(
                { success: false, error: 'Current password is incorrect' },
                400
            );
        }

        // Hash new password
        const hashedPassword = await hashPassword(newPassword, c.env.ENCRYPTION_KEY);

        // Update password
        const { error: updateError } = await supabase
            .from('admins')
            .update({ password_encrypted: hashedPassword })
            .eq('id', adminId);

        if (updateError) {
            throw updateError;
        }

        return c.json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        console.error('Error in admin settings API:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

export default admin;
