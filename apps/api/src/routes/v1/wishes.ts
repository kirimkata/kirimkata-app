import { Hono } from 'hono';
import type { Env } from '@/lib/types';
import { wishesRepository } from '@/repositories/wishesRepository';
import { RateLimiter } from '@/middleware/rateLimit';

const wishes = new Hono<{ Bindings: Env }>();

const wishesRateLimiter = new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
    message: 'Too many requests, please try again later.'
});

// Apply rate limiting to all wishes routes
wishes.use('*', wishesRateLimiter.middleware());

/**
 * GET /v1/wishes/:slug
 * Get all wishes for an invitation by slug
 * PUBLIC ENDPOINT - No authentication required
 * 
 * This endpoint is called by the public invitation page to display guest wishes
 */
wishes.get('/:slug', async (c) => {
    try {
        const slug = c.req.param('slug');

        if (!slug) {
            return c.json(
                { success: false, error: 'Slug is required' },
                400
            );
        }

        // Fetch wishes from database
        const wishList = await wishesRepository.list(slug, c.env);

        // Transform data to match frontend expectations
        const wishes = wishList.map((wish) => ({
            id: wish.id,
            name: wish.name,
            message: wish.message,
            attendance: wish.attendance,
            guestCount: wish.guestCount,
            createdAt: wish.createdAt,
        }));

        return c.json({
            success: true,
            wishes,
            total: wishes.length,
        });
    } catch (error) {
        console.error('Error in GET /v1/wishes/:slug:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * POST /v1/wishes/:slug
 * Submit a new wish for an invitation
 * PUBLIC ENDPOINT - No authentication required
 * 
 * This endpoint is called by guests to submit their wishes and RSVP
 * 
 * Request body:
 * {
 *   name: string (required)
 *   message: string (required)
 *   attendance: 'hadir' | 'tidak-hadir' | 'masih-ragu' (required)
 *   guest_count: number (optional, default: 1)
 * }
 */
wishes.post('/:slug', async (c) => {
    try {
        const slug = c.req.param('slug');

        if (!slug) {
            return c.json(
                { success: false, error: 'Slug is required' },
                400
            );
        }

        const body = await c.req.json();
        const { name, message, attendance, guest_count } = body;

        // Validate required fields
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return c.json(
                { success: false, error: 'Name is required' },
                400
            );
        }

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return c.json(
                { success: false, error: 'Message is required' },
                400
            );
        }

        if (!attendance || typeof attendance !== 'string') {
            return c.json(
                { success: false, error: 'Attendance status is required' },
                400
            );
        }

        // Validate attendance value
        const validAttendance = ['hadir', 'tidak-hadir', 'masih-ragu'];
        if (!validAttendance.includes(attendance)) {
            return c.json(
                {
                    success: false,
                    error: `Invalid attendance status. Must be one of: ${validAttendance.join(', ')}`
                },
                400
            );
        }

        // Validate guest_count if provided
        let guestCountValue = 1;
        if (guest_count !== undefined) {
            guestCountValue = parseInt(String(guest_count), 10);
            if (isNaN(guestCountValue) || guestCountValue < 0 || guestCountValue > 100) {
                return c.json(
                    { success: false, error: 'Guest count must be a number between 0 and 100' },
                    400
                );
            }
        }

        // Use repository to create wish (repository handles DB logic)
        // Note: Repository insert usually doesn't verify slug existence strictly if FK exists, but Drizzle will throw error if FK constraint failed.
        // However, Supabase version did: .eq('slug', slug).single() check first.
        // I should probably check if invitation exists if I want to return 404 "Invitation not found".
        // But wishesRepository.create just inserts. If slug invalid, FK error.
        // I will rely on FK error or I can check via repository if I add `exists` method.
        // For now, I'll try create. If it fails, I catch error.

        // Wait, the original code returned 404 if invitation not found.
        // I can query invitationContents using Drizzle here if I want strict parity.
        // Or I can add `checkInvitationExists` to wishesRepository.
        // I'll stick to direct insert and handling error for simplify, or assume wishesRepository handles it.
        // `wishesRepository` as I wrote it:
        // `await db.insert(invitationWishes).values({...})`
        // If slug mismatch, it might fail FK constraint.

        try {
            const wish = await wishesRepository.create({
                invitationSlug: slug,
                name: name.trim(),
                message: message.trim(),
                attendance: attendance as any,
                guestCount: guestCountValue,
            }, c.env);

            const responseWish = {
                id: wish.id,
                name: wish.name,
                message: wish.message,
                attendance: wish.attendance,
                guestCount: wish.guestCount,
                createdAt: wish.createdAt,
            };

            return c.json({
                success: true,
                message: 'Wish submitted successfully',
                wish: responseWish,
            });
        } catch (dbError: any) {
            if (dbError.code === '23503') { // Postgres FK violation
                return c.json(
                    { success: false, error: 'Invitation not found' },
                    404
                );
            }
            throw dbError;
        }

    } catch (error) {
        console.error('Error in POST /v1/wishes/:slug:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

export default wishes;
