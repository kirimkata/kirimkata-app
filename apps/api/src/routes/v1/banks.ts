import { Hono } from 'hono';
import type { Env } from '../../lib/types';
import { getDb } from '../../db';
import { banks } from '../../db/schema';
import { eq, asc } from 'drizzle-orm';

const app = new Hono<{ Bindings: Env }>();

/**
 * GET /v1/banks
 * Public — returns active banks with logo URLs for the gift section dropdown.
 * No auth required. Add new banks by inserting rows in the DB.
 */
app.get('/', async (c) => {
    try {
        const db = getDb(c.env);

        const result = await db
            .select({
                id: banks.id,
                name: banks.name,
                code: banks.code,
                logoUrl: banks.logoUrl,
                displayOrder: banks.displayOrder,
            })
            .from(banks)
            .where(eq(banks.isActive, true))
            .orderBy(asc(banks.displayOrder));

        return c.json({ success: true, data: result });
    } catch (error: any) {
        console.error('Error fetching banks:', error);
        return c.json({ success: false, error: 'Failed to fetch banks' }, 500);
    }
});

export default app;
