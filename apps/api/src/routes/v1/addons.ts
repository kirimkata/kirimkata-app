import { Hono } from 'hono';
import type { Env } from '../../lib/types';
import { getDb } from '../../db';
import { AddonRepository } from '../../repositories/AddonRepository';

const app = new Hono<{ Bindings: Env }>();

/**
 * GET /v1/addons
 * List all add-ons with optional filters
 */
app.get('/', async (c) => {
    try {
        const db = getDb(c.env);
        const addonRepo = new AddonRepository(db, c.env);

        const category = c.req.query('category');
        const activeOnly = c.req.query('active') === 'true';

        const filters: any = {};
        if (category) filters.category = category;
        if (activeOnly) filters.isActive = true;

        const addons = await addonRepo.findAll(filters);

        return c.json({ success: true, data: addons });
    } catch (error: any) {
        console.error('Error fetching addons:', error);
        return c.json({ success: false, error: error.message }, 500);
    }
});

/**
 * GET /v1/addons/:id
 * Get add-on by ID
 */
app.get('/:id', async (c) => {
    try {
        const db = getDb(c.env);
        const addonRepo = new AddonRepository(db, c.env);

        const id = parseInt(c.req.param('id'));
        const addon = await addonRepo.findById(id);

        if (!addon) {
            return c.json({ success: false, error: 'Add-on not found' }, 404);
        }

        return c.json({ success: true, data: addon });
    } catch (error: any) {
        console.error('Error fetching addon:', error);
        return c.json({ success: false, error: error.message }, 500);
    }
});

/**
 * GET /v1/addons/slug/:slug
 * Get add-on by slug
 */
app.get('/slug/:slug', async (c) => {
    try {
        const db = getDb(c.env);
        const addonRepo = new AddonRepository(db, c.env);

        const slug = c.req.param('slug');
        const addon = await addonRepo.findBySlug(slug);

        if (!addon) {
            return c.json({ success: false, error: 'Add-on not found' }, 404);
        }

        return c.json({ success: true, data: addon });
    } catch (error: any) {
        console.error('Error fetching addon:', error);
        return c.json({ success: false, error: error.message }, 500);
    }
});

export default app;
