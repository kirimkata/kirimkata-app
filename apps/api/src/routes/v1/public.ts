import { Hono } from 'hono';
import type { Env } from '../../lib/types';
import { getDb } from '../../db';
import { InvitationRepository } from '../../repositories/invitationRepository';
import { fetchFullInvitationContent } from '../../repositories/invitationContentRepository';

const app = new Hono<{ Bindings: Env }>();

/**
 * GET /v1/public/:slug
 * Get public invitation data by slug (no authentication required)
 */
app.get('/:slug', async (c) => {
    try {
        const slug = c.req.param('slug');

        // Check if invitation exists and is active
        const db = getDb(c.env);
        const invitationRepo = new InvitationRepository(db, c.env);
        const invitation = await invitationRepo.findBySlug(slug);

        if (!invitation) {
            return c.json({
                success: false,
                error: 'Invitation not found'
            }, 404);
        }

        // Check if invitation is active
        if (!invitation.isActive) {
            return c.json({
                success: false,
                error: 'Invitation is not active'
            }, 403);
        }

        // Check if invitation has expired
        if (invitation.activeUntil) {
            const expiryDate = new Date(invitation.activeUntil);
            const today = new Date();
            if (expiryDate < today) {
                return c.json({
                    success: false,
                    error: 'Invitation has expired'
                }, 403);
            }
        }

        // Fetch full invitation content (uses cache if available)
        const content = await fetchFullInvitationContent(c.env, slug);

        return c.json({
            success: true,
            data: {
                ...content,
                activeUntil: invitation.activeUntil,
                verificationStatus: invitation.verificationStatus,
            }
        });
    } catch (error: any) {
        console.error('Error fetching public invitation:', error);
        return c.json({
            success: false,
            error: error.message
        }, 500);
    }
});

/**
 * GET /v1/public/:slug/status
 * Get invitation status (lighter endpoint, no full content)
 */
app.get('/:slug/status', async (c) => {
    try {
        const slug = c.req.param('slug');

        const db = getDb(c.env);
        const invitationRepo = new InvitationRepository(db, c.env);
        const invitation = await invitationRepo.findBySlug(slug);

        if (!invitation) {
            return c.json({
                success: false,
                error: 'Invitation not found'
            }, 404);
        }

        const status = {
            exists: true,
            isActive: invitation.isActive,
            activeUntil: invitation.activeUntil,
            verificationStatus: invitation.verificationStatus,
            slug: invitation.slug,
        };

        return c.json({
            success: true,
            data: status
        });
    } catch (error: any) {
        console.error('Error fetching invitation status:', error);
        return c.json({
            success: false,
            error: error.message
        }, 500);
    }
});

export default app;
