import { Hono } from 'hono';
import type { Env } from '@/lib/types';
import { getSupabaseClient } from '@/lib/supabase';
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

        const supabase = getSupabaseClient(c.env);

        // Fetch wishes from database
        const { data: wishList, error } = await supabase
            .from('wishes')
            .select('id, name, message, attendance, guest_count, created_at')
            .eq('invitation_slug', slug)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Error fetching wishes:', error);
            return c.json(
                { success: false, error: 'Failed to fetch wishes' },
                500
            );
        }

        // Transform data to match frontend expectations
        const wishes = (wishList || []).map((wish) => ({
            id: wish.id,
            name: wish.name,
            message: wish.message,
            attendance: wish.attendance,
            guestCount: wish.guest_count,
            createdAt: wish.created_at,
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

        const supabase = getSupabaseClient(c.env);

        // Verify that the invitation slug exists
        const { data: invitation, error: invitationError } = await supabase
            .from('invitation_contents')
            .select('slug')
            .eq('slug', slug)
            .single();

        if (invitationError || !invitation) {
            return c.json(
                { success: false, error: 'Invitation not found' },
                404
            );
        }

        // Insert the wish
        const { data: wish, error: insertError } = await supabase
            .from('wishes')
            .insert({
                invitation_slug: slug,
                name: name.trim(),
                message: message.trim(),
                attendance: attendance,
                guest_count: guestCountValue,
            })
            .select('id, name, message, attendance, guest_count, created_at')
            .single();

        if (insertError) {
            console.error('Error inserting wish:', insertError);
            return c.json(
                { success: false, error: 'Failed to submit wish' },
                500
            );
        }

        // Transform response to match frontend expectations
        const responseWish = {
            id: wish.id,
            name: wish.name,
            message: wish.message,
            attendance: wish.attendance,
            guestCount: wish.guest_count,
            createdAt: wish.created_at,
        };

        return c.json({
            success: true,
            message: 'Wish submitted successfully',
            wish: responseWish,
        });
    } catch (error) {
        console.error('Error in POST /v1/wishes/:slug:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

export default wishes;
