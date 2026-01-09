import { Hono } from 'hono';
import type { Env } from '@/lib/types';
import { clientAuthMiddleware } from '@/middleware/auth';
import { getSupabaseClient } from '@/lib/supabase';

const guestbookBenefits = new Hono<{
    Bindings: Env;
    Variables: {
        clientId: string;
        jwtPayload: any;
    };
}>();

// All routes require client authentication
guestbookBenefits.use('*', clientAuthMiddleware);

/**
 * GET /v1/guestbook/benefits
 * Get all benefits from catalog
 */
guestbookBenefits.get('/', async (c) => {
    try {
        const supabase = getSupabaseClient(c.env);

        const { data: benefits, error } = await supabase
            .from('benefit_catalog')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) {
            throw error;
        }

        return c.json({
            success: true,
            data: benefits || [],
        });
    } catch (error) {
        console.error('Get benefits error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * POST /v1/guestbook/benefits
 * Create new benefit in catalog
 */
guestbookBenefits.post('/', async (c) => {
    try {
        const body = await c.req.json();
        const { benefit_type, display_name, description, icon } = body;

        if (!benefit_type || !display_name) {
            return c.json(
                { success: false, error: 'Missing required fields' },
                400
            );
        }

        const supabase = getSupabaseClient(c.env);

        // Get existing benefits to determine sort order
        const { data: existingBenefits } = await supabase
            .from('benefit_catalog')
            .select('sort_order')
            .order('sort_order', { ascending: false })
            .limit(1);

        const maxSortOrder = existingBenefits && existingBenefits.length > 0
            ? existingBenefits[0].sort_order
            : 0;

        const { data: benefit, error } = await supabase
            .from('benefit_catalog')
            .insert({
                benefit_type,
                display_name,
                description: description || null,
                icon: icon || null,
                sort_order: maxSortOrder + 1,
            })
            .select()
            .single();

        if (error || !benefit) {
            console.error('Create benefit error:', error);
            return c.json(
                { success: false, error: 'Failed to create benefit' },
                500
            );
        }

        return c.json({
            success: true,
            data: benefit,
        });
    } catch (error) {
        console.error('Create benefit error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * PUT /v1/guestbook/benefits/:benefitId
 * Update benefit
 */
guestbookBenefits.put('/:benefitId', async (c) => {
    try {
        const benefitId = c.req.param('benefitId');
        const body = await c.req.json();
        const supabase = getSupabaseClient(c.env);

        const { data: benefit, error } = await supabase
            .from('benefit_catalog')
            .update(body)
            .eq('id', benefitId)
            .select()
            .single();

        if (error) {
            console.error('Update benefit error:', error);
            return c.json(
                { success: false, error: 'Failed to update benefit' },
                500
            );
        }

        return c.json({
            success: true,
            data: benefit,
        });
    } catch (error) {
        console.error('Update benefit error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * DELETE /v1/guestbook/benefits/:benefitId
 * Delete benefit
 */
guestbookBenefits.delete('/:benefitId', async (c) => {
    try {
        const benefitId = c.req.param('benefitId');
        const supabase = getSupabaseClient(c.env);

        const { error } = await supabase
            .from('benefit_catalog')
            .delete()
            .eq('id', benefitId);

        if (error) {
            console.error('Delete benefit error:', error);
            return c.json(
                { success: false, error: 'Failed to delete benefit' },
                500
            );
        }

        return c.json({
            success: true,
            message: 'Benefit deleted successfully',
        });
    } catch (error) {
        console.error('Delete benefit error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * POST /v1/guestbook/benefits/assign
 * Assign benefits to guest type
 */
guestbookBenefits.post('/assign', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const body = await c.req.json();
        const { guest_type_id, benefit_ids } = body;

        if (!guest_type_id || !Array.isArray(benefit_ids)) {
            return c.json(
                { success: false, error: 'Invalid request data' },
                400
            );
        }

        const supabase = getSupabaseClient(c.env);

        // Verify guest type belongs to client
        const { data: guestType, error: typeError } = await supabase
            .from('guest_types')
            .select('id')
            .eq('id', guest_type_id)
            .eq('client_id', clientId)
            .single();

        if (typeError || !guestType) {
            return c.json(
                { success: false, error: 'Guest type not found or access denied' },
                404
            );
        }

        // Delete existing assignments
        await supabase
            .from('guest_type_benefits')
            .delete()
            .eq('guest_type_id', guest_type_id);

        // Create new assignments
        if (benefit_ids.length > 0) {
            const assignments = benefit_ids.map(benefit_id => ({
                guest_type_id,
                benefit_id,
            }));

            const { error } = await supabase
                .from('guest_type_benefits')
                .insert(assignments);

            if (error) {
                console.error('Assign benefits error:', error);
                return c.json(
                    { success: false, error: 'Failed to assign benefits' },
                    500
                );
            }
        }

        return c.json({
            success: true,
            message: 'Benefits assigned successfully',
        });
    } catch (error) {
        console.error('Assign benefits error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * GET /v1/guestbook/benefits/matrix?event_id=xxx
 * Get benefit matrix for event (which guest types have which benefits)
 */
guestbookBenefits.get('/matrix', async (c) => {
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

        // Get guest types for event
        const { data: guestTypes, error: typesError } = await supabase
            .from('guest_types')
            .select('id, type_name, display_name')
            .eq('event_id', eventId);

        if (typesError) {
            throw typesError;
        }

        // Get all benefits
        const { data: benefits, error: benefitsError } = await supabase
            .from('benefit_catalog')
            .select('id, benefit_type, display_name')
            .order('sort_order', { ascending: true });

        if (benefitsError) {
            throw benefitsError;
        }

        // Get assignments
        const guestTypeIds = guestTypes?.map(gt => gt.id) || [];
        const { data: assignments, error: assignError } = await supabase
            .from('guest_type_benefits')
            .select('guest_type_id, benefit_id')
            .in('guest_type_id', guestTypeIds);

        if (assignError) {
            throw assignError;
        }

        // Build matrix
        const matrix = guestTypes?.map(guestType => ({
            guest_type: guestType,
            benefits: benefits?.filter(benefit =>
                assignments?.some(a =>
                    a.guest_type_id === guestType.id && a.benefit_id === benefit.id
                )
            ) || [],
        })) || [];

        return c.json({
            success: true,
            data: {
                guest_types: guestTypes || [],
                benefits: benefits || [],
                matrix,
            },
        });
    } catch (error) {
        console.error('Get benefit matrix error:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

export default guestbookBenefits;
