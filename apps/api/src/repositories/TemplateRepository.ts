import { eq, desc, and } from 'drizzle-orm';
import type { Db } from '../db';
import { templates } from '../db/schema';
import type { Env } from '../lib/types';

export class TemplateRepository {
    constructor(private db: Db, private env: Env) { }

    /**
     * Find all templates with optional filters
     */
    async findAll(filters?: {
        category?: string;
        isActive?: boolean;
    }): Promise<typeof templates.$inferSelect[]> {
        let query = this.db.select().from(templates);

        const conditions = [];

        if (filters?.category) {
            conditions.push(eq(templates.category, filters.category));
        }

        if (filters?.isActive !== undefined) {
            conditions.push(eq(templates.isActive, filters.isActive));
        }

        if (conditions.length > 0) {
            query = query.where(and(...conditions)) as any;
        }

        const results = await query.orderBy(templates.sortOrder, templates.id);
        return results;
    }

    /**
     * Find template by ID
     */
    async findById(id: number): Promise<typeof templates.$inferSelect | null> {
        const results = await this.db
            .select()
            .from(templates)
            .where(eq(templates.id, id))
            .limit(1);

        return results[0] || null;
    }

    /**
     * Find template by slug
     */
    async findBySlug(slug: string): Promise<typeof templates.$inferSelect | null> {
        const results = await this.db
            .select()
            .from(templates)
            .where(eq(templates.slug, slug))
            .limit(1);

        return results[0] || null;
    }

    /**
     * Get all active templates for public catalog
     */
    async findActiveTemplates(): Promise<typeof templates.$inferSelect[]> {
        return this.findAll({ isActive: true });
    }

    /**
     * Get templates by category
     */
    async findByCategory(category: string): Promise<typeof templates.$inferSelect[]> {
        return this.findAll({ category, isActive: true });
    }
}
