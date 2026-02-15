import { Hono } from 'hono';
import type { Env } from '@/lib/types';
import { adminAuthMiddleware } from '@/middleware/auth';
import { getDb } from '@/db';
import { clients, admins, invitationPages } from '@/db/schema'; // Updated import
import { eq, desc, and, isNull } from 'drizzle-orm';
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
        const db = getDb(c.env);

        const clientsList = await db
            .select({
                id: clients.id,
                username: clients.username,
                email: clients.email,

                guestbook_access: clients.guestbookAccess,
                quota_photos: clients.quotaPhotos,
                quota_music: clients.quotaMusic,
                quota_videos: clients.quotaVideos,
                created_at: clients.createdAt,
                updated_at: clients.updatedAt,
            })
            .from(clients)
            .orderBy(desc(clients.createdAt));

        return c.json({
            success: true,
            clients: clientsList,
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
        const { username, password, email } = body;

        if (!username || !password) {
            return c.json(
                { error: 'Username and password are required' },
                400
            );
        }

        const db = getDb(c.env);

        // Hash password
        const passwordEncrypted = await hashPassword(password, c.env.ENCRYPTION_KEY);

        // Create client with default quotas
        const [newClient] = await db
            .insert(clients)
            .values({
                username,
                passwordEncrypted: passwordEncrypted,
                email: email || null,

                quotaPhotos: 10,
                quotaMusic: 5,
                quotaVideos: 3,
                guestbookAccess: true,
            })
            .returning({
                id: clients.id,
                username: clients.username,
                email: clients.email,

                created_at: clients.createdAt,
            });

        return c.json({
            success: true,
            client: newClient,
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

        const db = getDb(c.env);

        // Build update object
        const updateData: any = {};
        if (username !== undefined) updateData.username = username;
        if (email !== undefined) updateData.email = email;


        // Hash password if provided
        if (password) {
            updateData.passwordEncrypted = await hashPassword(password, c.env.ENCRYPTION_KEY);
        }

        // Add updated_at timestamp
        updateData.updatedAt = new Date().toISOString();

        const [updatedClient] = await db
            .update(clients)
            .set(updateData)
            .where(eq(clients.id, clientId))
            .returning({
                id: clients.id,
                username: clients.username,
                email: clients.email,

                updated_at: clients.updatedAt,
            });

        if (!updatedClient) {
            return c.json(
                { error: 'Client not found or update failed' },
                404
            );
        }

        return c.json({
            success: true,
            client: updatedClient,
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
        const db = getDb(c.env);

        await db
            .delete(clients)
            .where(eq(clients.id, clientId));

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
        const db = getDb(c.env);

        const [data] = await db
            .select({
                quota_photos: clients.quotaPhotos,
                quota_music: clients.quotaMusic,
                quota_videos: clients.quotaVideos,
            })
            .from(clients)
            .where(eq(clients.id, clientId))
            .limit(1);

        if (!data) {
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
/**
 * PATCH /v1/admin/clients/:id/quota
 * Update client quota
 */
admin.patch('/clients/:id/quota', async (c) => {
    try {
        const clientId = c.req.param('id');
        const body = await c.req.json();
        const db = getDb(c.env);

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
        if (quota_photos !== undefined) updates.quotaPhotos = quota_photos;
        if (quota_music !== undefined) updates.quotaMusic = quota_music;
        if (quota_videos !== undefined) updates.quotaVideos = quota_videos;

        if (Object.keys(updates).length === 0) {
            return c.json({ error: 'No quota values provided' }, 400);
        }

        const [updatedClient] = await db
            .update(clients)
            .set(updates)
            .where(eq(clients.id, clientId))
            .returning({
                quota_photos: clients.quotaPhotos,
                quota_music: clients.quotaMusic,
                quota_videos: clients.quotaVideos,
            });

        if (!updatedClient) {
            return c.json({ error: 'Client not found' }, 404);
        }

        return c.json({
            success: true,
            quota: updatedClient
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

        const db = getDb(c.env);

        // Check if slug already exists
        const [existing] = await db
            .select({ slug: invitationPages.slug })
            .from(invitationPages)
            .where(eq(invitationPages.slug, payload.slug))
            .limit(1);

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
        const [newInvitation] = await db
            .insert(invitationPages)
            .values({
                slug: payload.slug,
                themeKey: payload.themeKey,
                profile: payload.clientProfile || {}, // Mapped to profile
                bride: payload.bride || {},
                groom: payload.groom || {},
                event: { // Mapped to jsonb event field
                    fullDateLabel: payload.event?.fullDateLabel || '',
                    isoDate: payload.event?.isoDate || '',
                    countdownDateTime: payload.event?.countdownDateTime || '',
                    ...eventCloud, // Includes holyMatrimony etc if strictly following schema structure
                },
                // Note: Schema has explicit columns for some, but payload structure from legacy code 
                // seemed to group some things. 
                // Let's look at schema: 
                // profile, bride, groom, event, greetings, eventDetails, loveStory, gallery, weddingGift, closing, musicSettings
                // Legacy insert: 
                // client_profile -> profile
                // event (with internal structure) -> event
                // event_cloud -> ? Schema doesn't have event_cloud. 
                // It seems legacy `event_cloud` was merged into `event` or `eventDetails` in new schema?
                // Start with direct mapping based on schema names

                greetings: {}, // detailed greetings structure not in payload? payload has 'clouds'?
                eventDetails: {}, // explicit event details if different from 'event'

                // ADJUSTMENT based on payload keys:
                // payload.loveStory -> loveStory
                loveStory: payload.loveStory || [],

                // payload.gallery -> gallery
                gallery: payload.gallery || [],

                // payload.weddingGift -> weddingGift
                weddingGift: payload.weddingGift || {},

                // payload.backgroundMusic -> musicSettings
                musicSettings: payload.backgroundMusic || {},

                // payload.closing -> closing
                closing: payload.closing || {},

                // event_cloud in legacy was likely specific structure. 
                // In new schema 'event' is a jsonb column. We can put it there.
            })
            .returning();

        // Wait, I need to be careful with JSONB columns. Drizzle/Postgres expects correct JSON structure.
        // And I need to verify if I missed any required columns.
        // Schema:
        // slug, profile, bride, groom, event, greetings, eventDetails, loveStory, gallery, weddingGift, closing
        // All NOT NULL.
        // I must provide default empty objects/arrays if payload is missing them.

        const [data] = await db
            .insert(invitationPages)
            .values({
                slug: payload.slug,
                themeKey: payload.themeKey,
                profile: payload.clientProfile || {},
                bride: payload.bride || {},
                groom: payload.groom || {},
                event: {
                    fullDateLabel: payload.event?.fullDateLabel || '',
                    isoDate: payload.event?.isoDate || '',
                    countdownDateTime: payload.event?.countdownDateTime || '',
                    ...eventCloud
                },
                greetings: {},
                eventDetails: {}, // New schema field, providing empty object
                loveStory: payload.loveStory || [],
                gallery: payload.gallery || [],
                weddingGift: payload.weddingGift || {},
                closing: payload.closing || {},
                musicSettings: payload.backgroundMusic || {},
            })
            .returning({
                slug: invitationPages.slug,
                themeKey: invitationPages.themeKey,
            });

        return c.json({
            success: true,
            data: {
                slug: data.slug,
                themeKey: data.themeKey, // mapped from theme_key
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
/**
 * GET /v1/admin/slugs
 * Get available slugs (slugs that exist in invitation_contents but not assigned to clients)
 */
admin.get('/slugs', async (c) => {
    try {
        const db = getDb(c.env);

        // Get slugs from invitationPages where clientId is NULL (unassigned)
        const availableInvitations = await db
            .select({ slug: invitationPages.slug })
            .from(invitationPages)
            .where(isNull(invitationPages.clientId));

        const availableSlugs = availableInvitations.map(inv => inv.slug);

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

        const db = getDb(c.env);

        // Get current admin data
        const [adminData] = await db
            .select({ passwordEncrypted: admins.passwordEncrypted })
            .from(admins)
            .where(eq(admins.id, adminId))
            .limit(1);

        if (!adminData) {
            return c.json(
                { success: false, error: 'Admin not found' },
                404
            );
        }

        // Verify current password
        const isValid = await comparePassword(
            currentPassword,
            adminData.passwordEncrypted,
            c.env.ENCRYPTION_KEY
        );

        if (!isValid) {
            return c.json(
                { success: false, error: 'Current password is incorrect' },
                400
            );
        }

        // Hash new password
        const passwordEncrypted = await hashPassword(newPassword, c.env.ENCRYPTION_KEY);

        // Update password
        await db
            .update(admins)
            .set({ passwordEncrypted: passwordEncrypted })
            .where(eq(admins.id, adminId));

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
