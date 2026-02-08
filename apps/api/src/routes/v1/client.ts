import { Hono } from 'hono';
import type { Env } from '@/lib/types';
import { clientAuthMiddleware } from '@/middleware/auth';
import { getSupabaseClient } from '@/lib/supabase';
import { comparePassword, hashPassword } from '@/services/encryption';

const client = new Hono<{
    Bindings: Env;
    Variables: {
        clientId: string;
        jwtPayload: any;
    };
}>();

// All client routes require authentication
client.use('*', clientAuthMiddleware);

// Default message template
const DEFAULT_TEMPLATE = `Halo {nama},

Kami mengundang Anda untuk hadir di acara spesial kami.

Silakan buka undangan di:
{link}

Terima kasih!`;

/**
 * GET /v1/client/profile
 * Get profile for authenticated client
 */
client.get('/profile', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const supabase = getSupabaseClient(c.env);

        const { data: clientData, error } = await supabase
            .from('clients')
            .select('id, username, email, slug, guestbook_access, message_template, created_at')
            .eq('id', clientId)
            .single();

        if (error || !clientData) {
            return c.json(
                { success: false, error: 'Client not found' },
                404
            );
        }

        return c.json({
            success: true,
            client: clientData,
        });
    } catch (error) {
        console.error('Error fetching client profile:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * PUT /v1/client/settings
 * Update client settings (email, password)
 */
client.put('/settings', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const body = await c.req.json();
        const { email, currentPassword, newPassword } = body;

        const supabase = getSupabaseClient(c.env);

        // Get current client data
        const { data: currentClient, error: fetchError } = await supabase
            .from('clients')
            .select('*')
            .eq('id', clientId)
            .single();

        if (fetchError || !currentClient) {
            return c.json(
                { success: false, error: 'Client not found' },
                404
            );
        }

        // Prepare update data
        const updateData: any = {};

        if (email !== undefined) {
            updateData.email = email;
        }

        // If changing password
        if (newPassword) {
            if (!currentPassword) {
                return c.json(
                    { success: false, error: 'Current password is required to set new password' },
                    400
                );
            }

            // Verify current password
            const isValid = await comparePassword(
                currentPassword,
                currentClient.password_encrypted,
                c.env.ENCRYPTION_KEY
            );

            if (!isValid) {
                return c.json(
                    { success: false, error: 'Password saat ini salah' },
                    400
                );
            }

            // Hash new password
            const hashedPassword = await hashPassword(newPassword, c.env.ENCRYPTION_KEY);
            updateData.password_encrypted = hashedPassword;
        }

        // Update client
        const { data: updatedClient, error: updateError } = await supabase
            .from('clients')
            .update(updateData)
            .eq('id', clientId)
            .select('id, username, email, slug, guestbook_access')
            .single();

        if (updateError) {
            console.error('Error updating settings:', updateError);
            return c.json(
                { success: false, error: 'Failed to update settings' },
                500
            );
        }

        return c.json({
            success: true,
            client: updatedClient,
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * GET /v1/client/template
 * Get message template for client
 */
client.get('/template', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const supabase = getSupabaseClient(c.env);

        const { data: clientData, error } = await supabase
            .from('clients')
            .select('message_template')
            .eq('id', clientId)
            .single();

        if (error) {
            console.error('Error fetching template:', error);
            return c.json(
                { success: false, error: 'Failed to fetch template' },
                500
            );
        }

        return c.json({
            success: true,
            template: clientData?.message_template || DEFAULT_TEMPLATE,
        });
    } catch (error) {
        console.error('Error in GET /v1/client/template:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * POST /v1/client/template
 * Save message template for client
 */
client.post('/template', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const body = await c.req.json();
        const { template } = body;

        if (typeof template !== 'string') {
            return c.json(
                { success: false, error: 'Invalid template data' },
                400
            );
        }

        const supabase = getSupabaseClient(c.env);

        const { error } = await supabase
            .from('clients')
            .update({ message_template: template })
            .eq('id', clientId);

        if (error) {
            console.error('Error saving template:', error);
            return c.json(
                { success: false, error: 'Failed to save template' },
                500
            );
        }

        return c.json({
            success: true,
            message: 'Template saved successfully',
        });
    } catch (error) {
        console.error('Error in POST /v1/client/template:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * GET /v1/client/invitation-content
 * Get invitation content for client
 */
client.get('/invitation-content', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const supabase = getSupabaseClient(c.env);

        // Get client's slug
        const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('slug')
            .eq('id', clientId)
            .single();

        if (clientError || !clientData || !clientData.slug) {
            return c.json(
                { success: false, error: 'Client has no assigned invitation' },
                404
            );
        }

        // Get invitation content by slug
        const { data: content, error: contentError } = await supabase
            .from('invitation_contents')
            .select('*')
            .eq('slug', clientData.slug)
            .single();

        if (contentError || !content) {
            return c.json(
                { success: false, error: 'Invitation content not found' },
                404
            );
        }

        return c.json({
            success: true,
            content: {
                slug: content.slug,
                bride: content.bride,
                groom: content.groom,
                event: content.event,
                eventDetails: content.event_details,
                loveStory: content.love_story,
                gallery: content.gallery,
                weddingGift: content.wedding_gift,
                closing: content.closing,
                musicSettings: content.music_settings,
                profile: content.profile,
            },
        });
    } catch (error) {
        console.error('Error in GET invitation-content:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * PUT /v1/client/invitation-content
 * Update invitation content for client
 */
client.put('/invitation-content', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const supabase = getSupabaseClient(c.env);

        // Get client's slug
        const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('slug')
            .eq('id', clientId)
            .single();

        if (clientError || !clientData || !clientData.slug) {
            return c.json(
                { success: false, error: 'Client has no assigned invitation' },
                404
            );
        }

        // Parse request body
        const body = await c.req.json();

        // Build update object (only update provided fields)
        const updateData: any = {
            updated_at: new Date().toISOString(),
        };

        if (body.bride) {
            updateData.bride = body.bride;
        }
        if (body.groom) {
            updateData.groom = body.groom;
        }

        // Handle event data - map to both event and event_cloud for compatibility
        if (body.event) {
            updateData.event = {
                fullDateLabel: body.event.fullDateLabel,
                isoDate: body.event.isoDate,
                countdownDateTime: body.event.countdownDateTime,
                eventTitle: `The Wedding of ${body.bride?.name || ''} & ${body.groom?.name || ''}`.trim(),
            };

            // Also update event_details for backward compatibility
            updateData.event_details = {
                holyMatrimony: body.event.holyMatrimony || {},
                reception: body.event.reception || {},
            };
        }

        if (body.eventDetails) {
            updateData.event_details = body.eventDetails;
        }
        if (body.loveStory) {
            updateData.love_story = body.loveStory;
        }
        if (body.gallery) {
            updateData.gallery = body.gallery;
        }
        if (body.weddingGift) {
            updateData.wedding_gift = body.weddingGift;
        }
        if (body.musicSettings) {
            updateData.music_settings = body.musicSettings;
        }
        if (body.closing) {
            updateData.closing = body.closing;
        }
        if (body.profile) {
            updateData.profile = body.profile;
        }

        // Update invitation content
        const { data, error } = await supabase
            .from('invitation_contents')
            .update(updateData)
            .eq('slug', clientData.slug)
            .select()
            .single();

        if (error) {
            console.error('Error updating invitation content:', error);
            return c.json(
                { success: false, error: 'Failed to update invitation content' },
                500
            );
        }

        return c.json({
            success: true,
            message: 'Invitation content updated successfully',
            content: data,
        });
    } catch (error) {
        console.error('Error in PUT invitation-content:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * GET /v1/client/messages
 * Get wishes/messages for client's invitation
 */
client.get('/messages', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const supabase = getSupabaseClient(c.env);

        // Get client's slug
        const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('slug')
            .eq('id', clientId)
            .single();

        if (clientError || !clientData || !clientData.slug) {
            return c.json(
                { success: false, error: 'Client not found or no slug assigned' },
                404
            );
        }

        // Parse pagination params
        const page = parseInt(c.req.query('page') || '1');
        const limit = parseInt(c.req.query('limit') || '10');
        const offset = (page - 1) * limit;

        console.log(`Fetching wishes for slug: ${clientData.slug}, page: ${page}, limit: ${limit}`);

        // Fetch wishes with pagination
        const { data: wishes, error: wishesError, count } = await supabase
            .from('wishes')
            .select('*', { count: 'exact' })
            .eq('invitation_slug', clientData.slug)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (wishesError) {
            console.error('Error fetching wishes:', wishesError);
            return c.json(
                {
                    success: false,
                    error: 'Failed to fetch messages',
                    details: {
                        message: wishesError.message,
                        code: wishesError.code,
                        details: wishesError.details,
                        hint: wishesError.hint
                    }
                },
                500
            );
        }

        const total = count || 0;
        const totalPages = Math.ceil(total / limit);

        return c.json({
            success: true,
            wishes: wishes || [],
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return c.json(
            {
                success: false,
                error: 'Internal server error',
                details: error instanceof Error ? error.message : String(error)
            },
            500
        );
    }
});

export default client;
