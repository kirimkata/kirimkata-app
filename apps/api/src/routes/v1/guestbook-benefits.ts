import { Hono } from 'hono';
import type { Env } from '@/lib/types';
import { clientAuthMiddleware } from '@/middleware/auth';
import { getDb } from '@/db';
import { benefitCatalog, guestTypeBenefits, guestTypes, guestbookEvents } from '@/db/schema';
import { eq, desc, inArray, and } from 'drizzle-orm';

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
        const db = getDb(c.env);

        const benefits = await db
            .select()
            .from(benefitCatalog)
            .orderBy(benefitCatalog.sortOrder);

        return c.json({
            success: true,
            data: benefits,
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
        const { benefit_key, display_name, description, icon } = body;

        if (!benefit_key || !display_name) {
            return c.json(
                { success: false, error: 'Missing required fields' },
                400
            );
        }

        const db = getDb(c.env);

        // Get existing benefits to determine sort order
        const existingBenefits = await db
            .select({ sortOrder: benefitCatalog.sortOrder })
            .from(benefitCatalog)
            .orderBy(desc(benefitCatalog.sortOrder))
            .limit(1);

        const maxSortOrder = existingBenefits.length > 0
            ? (existingBenefits[0].sortOrder ?? 0)
            : 0;

        const [benefit] = await db
            .insert(benefitCatalog)
            .values({
                benefitKey: benefit_key,
                displayName: display_name,
                description: description || null,
                icon: icon || null,
                sortOrder: maxSortOrder + 1,
            })
            .returning();

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
        const db = getDb(c.env);

        const updateData: any = {};
        if (body.benefit_key !== undefined) updateData.benefitKey = body.benefit_key;
        if (body.display_name !== undefined) updateData.displayName = body.display_name;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.icon !== undefined) updateData.icon = body.icon;
        if (body.sort_order !== undefined) updateData.sortOrder = body.sort_order;

        const [benefit] = await db
            .update(benefitCatalog)
            .set(updateData)
            .where(eq(benefitCatalog.id, benefitId))
            .returning();

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
        const db = getDb(c.env);

        await db
            .delete(benefitCatalog)
            .where(eq(benefitCatalog.id, benefitId));

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

        const db = getDb(c.env);

        // Verify guest type belongs to client
        const [guestType] = await db
            .select({ id: guestTypes.id })
            .from(guestTypes)
            .where(and(
                eq(guestTypes.id, guest_type_id),
                eq(guestTypes.clientId, clientId)
            ))
            .limit(1);

        if (!guestType) {
            return c.json(
                { success: false, error: 'Guest type not found or access denied' },
                404
            );
        }

        // Delete existing assignments
        await db
            .delete(guestTypeBenefits)
            .where(eq(guestTypeBenefits.guestTypeId, guest_type_id));

        // Create new assignments
        if (benefit_ids.length > 0) {
            const assignments = benefit_ids.map((benefit_type: string) => ({
                guestTypeId: guest_type_id,
                benefitType: benefit_type,
            }));

            await db
                .insert(guestTypeBenefits)
                .values(assignments);
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

        const db = getDb(c.env);

        // Verify access to event
        const [event] = await db
            .select({ id: guestbookEvents.id })
            .from(guestbookEvents)
            .where(and(
                eq(guestbookEvents.id, eventId),
                eq(guestbookEvents.clientId, clientId)
            ))
            .limit(1);

        if (!event) {
            return c.json(
                { success: false, error: 'Event not found or access denied' },
                404
            );
        }

        // Get guest types for event
        const guestTypesList = await db
            .select({
                id: guestTypes.id,
                type_name: guestTypes.typeName,
                display_name: guestTypes.displayName,
            })
            .from(guestTypes)
            .where(eq(guestTypes.eventId, eventId));

        // Get all benefits
        const benefitsList = await db
            .select({
                id: benefitCatalog.id,
                benefit_key: benefitCatalog.benefitKey,
                display_name: benefitCatalog.displayName,
            })
            .from(benefitCatalog)
            .orderBy(benefitCatalog.sortOrder);

        // Get assignments
        const guestTypeIds = guestTypesList.map(gt => gt.id);
        const assignments = guestTypeIds.length > 0
            ? await db
                .select({
                    guest_type_id: guestTypeBenefits.guestTypeId,
                    benefit_type: guestTypeBenefits.benefitType,
                })
                .from(guestTypeBenefits)
                .where(inArray(guestTypeBenefits.guestTypeId, guestTypeIds))
            : [];

        // Build matrix
        const matrix = guestTypesList.map(guestType => ({
            guest_type: guestType,
            benefits: benefitsList.filter(benefit =>
                assignments.some(a =>
                    a.guest_type_id === guestType.id && a.benefit_type === benefit.benefit_key
                )
            ),
        }));

        return c.json({
            success: true,
            data: {
                guest_types: guestTypesList,
                benefits: benefitsList,
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
