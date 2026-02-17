import { Hono } from 'hono';
import type { Env } from '../../lib/types';
import { getDb } from '../../db';
import { TemplateRepository } from '../../repositories/TemplateRepository';

const app = new Hono<{ Bindings: Env }>();

/**
 * GET /v1/templates
 * List all templates with optional filters
 */
app.get('/', async (c) => {
    try {
        const db = getDb(c.env);
        const templateRepo = new TemplateRepository(db, c.env);

        const category = c.req.query('category');
        const activeOnly = c.req.query('active') === 'true';

        const filters: any = {};
        if (category) filters.category = category;
        if (activeOnly) filters.isActive = true;

        const templates = await templateRepo.findAll(filters);

        return c.json({ success: true, data: templates });
    } catch (error: any) {
        console.error('Error fetching templates:', error);
        return c.json({ success: false, error: error.message }, 500);
    }
});

/**
 * GET /v1/templates/:id
 * Get template by ID
 */
app.get('/:id', async (c) => {
    try {
        const db = getDb(c.env);
        const templateRepo = new TemplateRepository(db, c.env);

        const id = parseInt(c.req.param('id'));
        const template = await templateRepo.findById(id);

        if (!template) {
            return c.json({ success: false, error: 'Template not found' }, 404);
        }

        return c.json({ success: true, data: template });
    } catch (error: any) {
        console.error('Error fetching template:', error);
        return c.json({ success: false, error: error.message }, 500);
    }
});

/**
 * GET /v1/templates/slug/:slug
 * Get template by slug
 */
app.get('/slug/:slug', async (c) => {
    try {
        const db = getDb(c.env);
        const templateRepo = new TemplateRepository(db, c.env);

        const slug = c.req.param('slug');
        const template = await templateRepo.findBySlug(slug);

        if (!template) {
            return c.json({ success: false, error: 'Template not found' }, 404);
        }

        return c.json({ success: true, data: template });
    } catch (error: any) {
        console.error('Error fetching template:', error);
        return c.json({ success: false, error: error.message }, 500);
    }
});

export default app;
