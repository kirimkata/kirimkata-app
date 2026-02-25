import { Hono } from 'hono';
import type { AppEnv } from '../../lib/types';
import { getDb } from '../../db';
import { GuestbookAddonRepository } from '../../repositories/GuestbookAddonRepository';
import { InvitationRepository } from '../../repositories/invitationRepository';
import { clientAuthMiddleware, adminAuthMiddleware } from '../../middleware/auth';

const app = new Hono<AppEnv>();

/**
 * GET /v1/invitations/:invitationId/guestbook
 * Get guestbook addon status for invitation (requires auth)
 */
app.get('/:invitationId', clientAuthMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const guestbookRepo = new GuestbookAddonRepository(db, c.env);

        const invitationId = c.req.param('invitationId');
        const addon = await guestbookRepo.findByInvitationId(invitationId);

        if (!addon) {
            return c.json({
                success: false,
                error: 'Guestbook addon not found for this invitation'
            }, 404);
        }

        // Verify ownership
        const invitationRepo = new InvitationRepository(db, c.env);
        const invitation = await invitationRepo.findById(invitationId);

        if (!invitation) {
            return c.json({ success: false, error: 'Invitation not found' }, 404);
        }

        const payload = c.get('jwtPayload') as any;
        const userId = payload.userId || payload.client_id;

        if (invitation.clientId !== userId && payload.type !== 'ADMIN') {
            return c.json({ success: false, error: 'Unauthorized' }, 403);
        }

        return c.json({ success: true, data: addon });
    } catch (error: any) {
        console.error('Error fetching guestbook addon:', error);
        return c.json({ success: false, error: error.message }, 500);
    }
});

/**
 * POST /v1/invitations/:invitationId/guestbook/enable
 * Enable guestbook for invitation (requires auth)
 */
app.post('/:invitationId/enable', clientAuthMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const guestbookRepo = new GuestbookAddonRepository(db, c.env);
        const invitationRepo = new InvitationRepository(db, c.env);

        const invitationId = c.req.param('invitationId');

        // Verify ownership
        const invitation = await invitationRepo.findById(invitationId);
        if (!invitation) {
            return c.json({ success: false, error: 'Invitation not found' }, 404);
        }

        const payload = c.get('jwtPayload') as any;
        const userId = payload.userId || payload.client_id;

        if (invitation.clientId !== userId) {
            return c.json({ success: false, error: 'Unauthorized' }, 403);
        }

        // Check if addon already exists
        let addon = await guestbookRepo.findByInvitationId(invitationId);

        if (!addon) {
            // Create new addon
            addon = await guestbookRepo.create({
                invitationId,
                isEnabled: true,
            });
        } else {
            // Enable existing addon
            addon = await guestbookRepo.enable(invitationId);
        }

        return c.json({ success: true, data: addon });
    } catch (error: any) {
        console.error('Error enabling guestbook:', error);
        return c.json({ success: false, error: error.message }, 400);
    }
});

/**
 * POST /v1/invitations/:invitationId/guestbook/disable
 * Disable guestbook for invitation (requires auth)
 */
app.post('/:invitationId/disable', clientAuthMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const guestbookRepo = new GuestbookAddonRepository(db, c.env);
        const invitationRepo = new InvitationRepository(db, c.env);

        const invitationId = c.req.param('invitationId');

        // Verify ownership
        const invitation = await invitationRepo.findById(invitationId);
        if (!invitation) {
            return c.json({ success: false, error: 'Invitation not found' }, 404);
        }

        const payload = c.get('jwtPayload') as any;
        const userId = payload.userId || payload.client_id;

        if (invitation.clientId !== userId) {
            return c.json({ success: false, error: 'Unauthorized' }, 403);
        }

        const addon = await guestbookRepo.disable(invitationId);

        if (!addon) {
            return c.json({ success: false, error: 'Guestbook addon not found' }, 404);
        }

        return c.json({ success: true, data: addon });
    } catch (error: any) {
        console.error('Error disabling guestbook:', error);
        return c.json({ success: false, error: error.message }, 400);
    }
});

/**
 * POST /v1/invitations/:invitationId/guestbook/payment-proof
 * Upload payment proof for guestbook addon (requires auth)
 */
app.post('/:invitationId/payment-proof', clientAuthMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const guestbookRepo = new GuestbookAddonRepository(db, c.env);
        const invitationRepo = new InvitationRepository(db, c.env);

        const invitationId = c.req.param('invitationId');
        const body = await c.req.json();
        const { paymentProofUrl, paymentAmount } = body;

        if (!paymentProofUrl || !paymentAmount) {
            return c.json({
                success: false,
                error: 'Missing required fields: paymentProofUrl, paymentAmount'
            }, 400);
        }

        // Verify ownership
        const invitation = await invitationRepo.findById(invitationId);
        if (!invitation) {
            return c.json({ success: false, error: 'Invitation not found' }, 404);
        }

        const payload = c.get('jwtPayload') as any;
        const userId = payload.userId || payload.client_id;

        if (invitation.clientId !== userId) {
            return c.json({ success: false, error: 'Unauthorized' }, 403);
        }

        const addon = await guestbookRepo.uploadPaymentProof(invitationId, {
            paymentProofUrl,
            paymentAmount,
        });

        if (!addon) {
            return c.json({ success: false, error: 'Guestbook addon not found' }, 404);
        }

        return c.json({ success: true, data: addon });
    } catch (error: any) {
        console.error('Error uploading payment proof:', error);
        return c.json({ success: false, error: error.message }, 400);
    }
});

/**
 * POST /v1/invitations/:invitationId/guestbook/verify
 * Admin: Verify guestbook payment (requires admin auth)
 */
app.post('/:invitationId/verify', adminAuthMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const guestbookRepo = new GuestbookAddonRepository(db, c.env);

        const invitationId = c.req.param('invitationId');
        const payload = c.get('jwtPayload') as any;
        const adminId = payload.admin_id || payload.userId;

        const addon = await guestbookRepo.verifyPayment(invitationId, adminId);

        if (!addon) {
            return c.json({ success: false, error: 'Guestbook addon not found' }, 404);
        }

        return c.json({ success: true, data: addon });
    } catch (error: any) {
        console.error('Error verifying guestbook payment:', error);
        return c.json({ success: false, error: error.message }, 400);
    }
});

/**
 * PATCH /v1/invitations/:invitationId/guestbook/config
 * Update guestbook configuration (requires auth)
 */
app.patch('/:invitationId/config', clientAuthMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const guestbookRepo = new GuestbookAddonRepository(db, c.env);
        const invitationRepo = new InvitationRepository(db, c.env);

        const invitationId = c.req.param('invitationId');
        const body = await c.req.json();
        const { seatingMode, staffQuota, config } = body;

        // Verify ownership
        const invitation = await invitationRepo.findById(invitationId);
        if (!invitation) {
            return c.json({ success: false, error: 'Invitation not found' }, 404);
        }

        const payload = c.get('jwtPayload') as any;
        const userId = payload.userId || payload.client_id;

        if (invitation.clientId !== userId) {
            return c.json({ success: false, error: 'Unauthorized' }, 403);
        }

        let addon = await guestbookRepo.findByInvitationId(invitationId);

        if (!addon) {
            return c.json({ success: false, error: 'Guestbook addon not found' }, 404);
        }

        // Update fields as needed
        if (seatingMode) {
            addon = await guestbookRepo.updateSeatingMode(invitationId, seatingMode) || addon;
        }

        if (staffQuota !== undefined) {
            addon = await guestbookRepo.updateStaffQuota(invitationId, staffQuota) || addon;
        }

        if (config) {
            addon = await guestbookRepo.updateConfig(invitationId, config) || addon;
        }

        return c.json({ success: true, data: addon });
    } catch (error: any) {
        console.error('Error updating guestbook config:', error);
        return c.json({ success: false, error: error.message }, 400);
    }
});

export default app;
