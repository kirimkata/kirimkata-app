import { Hono } from 'hono';
import type { Env } from '@/lib/types';
import { clientAuthMiddleware } from '@/middleware/auth';
import { getDb } from '@/db';
import { clients, invitationPages, invitationWishes, guests } from '@/db/schema';
import { eq, desc, count, isNotNull } from 'drizzle-orm';
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
        const db = getDb(c.env);

        const [clientData] = await db
            .select({
                id: clients.id,
                username: clients.username,
                email: clients.email,
                guestbook_access: clients.guestbookAccess,
                message_template: clients.messageTemplate,
                created_at: clients.createdAt,
            })
            .from(clients)
            .where(eq(clients.id, clientId))
            .limit(1);

        // Fetch slug from invitationPages
        const [invitationData] = await db
            .select({ slug: invitationPages.slug })
            .from(invitationPages)
            .where(eq(invitationPages.clientId, clientId))
            .limit(1);

        const clientWithSlug = {
            ...clientData,
            slug: invitationData?.slug || null
        };

        if (!clientData) {
            return c.json(
                { success: false, error: 'Client not found' },
                404
            );
        }

        return c.json({
            success: true,
            client: clientWithSlug,
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
 * GET /v1/client/invitations/:slug
 * Get invitation status (isActive, activeUntil) for the authenticated client
 */
client.get('/invitations/:slug', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const slug = c.req.param('slug');
        const db = getDb(c.env);

        const [invitation] = await db
            .select({
                id: invitationPages.id,
                slug: invitationPages.slug,
                isActive: invitationPages.isActive,
                activeUntil: invitationPages.activeUntil,
                themeKey: invitationPages.themeKey,
                verificationStatus: invitationPages.verificationStatus,
                clientId: invitationPages.clientId,
                createdAt: invitationPages.createdAt,
                updatedAt: invitationPages.updatedAt,
            })
            .from(invitationPages)
            .where(eq(invitationPages.slug, slug))
            .limit(1);

        if (!invitation) {
            return c.json({ success: false, error: 'Invitation not found' }, 404);
        }

        if (invitation.clientId && invitation.clientId !== clientId) {
            return c.json({ success: false, error: 'Unauthorized' }, 403);
        }

        return c.json({ success: true, data: invitation });
    } catch (error) {
        console.error('Error fetching invitation status:', error);
        return c.json({ success: false, error: 'Internal server error' }, 500);
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

        const db = getDb(c.env);

        // Get current client data
        const [currentClient] = await db
            .select()
            .from(clients)
            .where(eq(clients.id, clientId))
            .limit(1);

        if (!currentClient) {
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
                currentClient.passwordEncrypted,
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
            updateData.passwordEncrypted = hashedPassword;
        }

        // Add updated_at timestamp
        if (Object.keys(updateData).length > 0) {
            updateData.updatedAt = new Date().toISOString();
        } else {
            // No changes
            return c.json({
                success: true,
                client: {
                    username: currentClient.username,
                    email: currentClient.email,
                    guestbook_access: currentClient.guestbookAccess
                }
            });
        }

        // Update client
        const [updatedClient] = await db
            .update(clients)
            .set(updateData)
            .where(eq(clients.id, clientId))
            .returning({
                id: clients.id,
                username: clients.username,
                email: clients.email,
                guestbook_access: clients.guestbookAccess
            });

        if (!updatedClient) {
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
        const db = getDb(c.env);

        const [clientData] = await db
            .select({
                messageTemplate: clients.messageTemplate
            })
            .from(clients)
            .where(eq(clients.id, clientId))
            .limit(1);

        if (!clientData) {
            return c.json(
                { success: false, error: 'Failed to fetch template' },
                500
            );
        }

        return c.json({
            success: true,
            template: clientData.messageTemplate || DEFAULT_TEMPLATE,
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

        const db = getDb(c.env);

        const [updatedClient] = await db
            .update(clients)
            .set({
                messageTemplate: template,
                updatedAt: new Date().toISOString()
            })
            .where(eq(clients.id, clientId))
            .returning({ id: clients.id });

        if (!updatedClient) {
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
        const db = getDb(c.env);

        // Get client slug from invitationPages
        const [clientData] = await db
            .select({ slug: invitationPages.slug })
            .from(invitationPages)
            .where(eq(invitationPages.clientId, clientId))
            .limit(1);

        if (!clientData || !clientData.slug) {
            return c.json(
                { success: false, error: 'Invitation not found' },
                404
            );
        }

        const [invitation] = await db
            .select()
            .from(invitationPages)
            .where(eq(invitationPages.slug, clientData.slug))
            .limit(1);

        if (!invitation) {
            return c.json(
                { success: false, error: 'Invitation content not found' },
                404
            );
        }

        return c.json({
            success: true,
            content: invitation,
        });
    } catch (error) {
        console.error('Error fetching invitation content:', error);
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
        const body = await c.req.json();

        // Sanitize body to remove system fields if present
        const { id, slug, created_at, updated_at, ...updateData } = body;

        const db = getDb(c.env);

        // Get client slug from invitationPages
        const [clientData] = await db
            .select({ slug: invitationPages.slug })
            .from(invitationPages)
            .where(eq(invitationPages.clientId, clientId))
            .limit(1);

        if (!clientData || !clientData.slug) {
            return c.json(
                { success: false, error: 'Invitation not found' },
                404
            );
        }

        // Add updated_at
        const dataToUpdate: any = {
            updatedAt: new Date().toISOString()
        };

        if (updateData.bride) dataToUpdate.bride = updateData.bride;
        if (updateData.groom) dataToUpdate.groom = updateData.groom;

        // Handle event data
        if (updateData.event) {
            dataToUpdate.event = {
                fullDateLabel: updateData.event.fullDateLabel,
                isoDate: updateData.event.isoDate,
                countdownDateTime: updateData.event.countdownDateTime,
                eventTitle: `The Wedding of ${updateData.bride?.name || ''} & ${updateData.groom?.name || ''}`.trim(),
            };

            // Map legacy event_details if needed or just use what's passed
            if (!updateData.eventDetails) {
                dataToUpdate.eventDetails = {
                    holyMatrimony: updateData.event.holyMatrimony || {},
                    reception: updateData.event.reception || {},
                };
            }
        }

        if (updateData.eventDetails) dataToUpdate.eventDetails = updateData.eventDetails;
        if (updateData.loveStory) dataToUpdate.loveStory = updateData.loveStory;
        if (updateData.gallery) dataToUpdate.gallery = updateData.gallery;
        if (updateData.weddingGift) dataToUpdate.weddingGift = updateData.weddingGift;
        if (updateData.musicSettings) dataToUpdate.musicSettings = updateData.musicSettings;
        if (updateData.closing) dataToUpdate.closing = updateData.closing;
        if (updateData.profile) dataToUpdate.profile = updateData.profile;

        const [updatedInvitation] = await db
            .update(invitationPages)
            .set(dataToUpdate)
            .where(eq(invitationPages.slug, clientData.slug))
            .returning();

        if (!updatedInvitation) {
            return c.json(
                { success: false, error: 'Failed to update invitation content' },
                500
            );
        }

        return c.json({
            success: true,
            message: 'Invitation content updated successfully',
            content: updatedInvitation,
        });
    } catch (error) {
        console.error('Error updating invitation content:', error);
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
        const page = Number(c.req.query('page')) || 1;
        const limit = Number(c.req.query('limit')) || 10;
        const offset = (page - 1) * limit;

        const db = getDb(c.env);

        // Get client slug from invitationPages
        const [clientData] = await db
            .select({ slug: invitationPages.slug })
            .from(invitationPages)
            .where(eq(invitationPages.clientId, clientId))
            .limit(1);

        if (!clientData || !clientData.slug) {
            return c.json(
                { success: false, error: 'Invitation not found' },
                404
            );
        }

        // Get total count
        const [totalResult] = await db
            .select({ count: count() })
            .from(invitationWishes)
            .where(eq(invitationWishes.invitationSlug, clientData.slug));

        const total = totalResult ? Number(totalResult.count) : 0;

        // Get messages
        const messages = await db
            .select()
            .from(invitationWishes)
            .where(eq(invitationWishes.invitationSlug, clientData.slug))
            .orderBy(desc(invitationWishes.createdAt))
            .limit(limit)
            .offset(offset);

        return c.json({
            success: true,
            messages,
            pagination: {
                page,
                limit,
                total,
                total_pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

export default client;
