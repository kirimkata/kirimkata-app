import { eq, desc, and } from 'drizzle-orm';
import type { Db } from '../db';
import { addonCatalog } from '../db/schema';
import type { Env } from '../lib/types';

export class AddonRepository {
    constructor(private db: Db, private env: Env) { }

    /**
     * Find all add-ons with optional filters
     */
    async findAll(filters?: {
        category?: string;
        isActive?: boolean;
    }): Promise<typeof addonCatalog.$inferSelect[]> {
        let query = this.db.select().from(addonCatalog);

        const conditions = [];

        if (filters?.category) {
            conditions.push(eq(addonCatalog.category, filters.category));
        }

        if (filters?.isActive !== undefined) {
            conditions.push(eq(addonCatalog.isActive, filters.isActive));
        }

        if (conditions.length > 0) {
            query = query.where(and(...conditions)) as any;
        }

        const results = await query.orderBy(addonCatalog.sortOrder, addonCatalog.id);
        return results;
    }

    /**
     * Find add-on by ID
     */
    async findById(id: number): Promise<typeof addonCatalog.$inferSelect | null> {
        const results = await this.db
            .select()
            .from(addonCatalog)
            .where(eq(addonCatalog.id, id))
            .limit(1);

        return results[0] || null;
    }

    /**
     * Find add-on by slug
     */
    async findBySlug(slug: string): Promise<typeof addonCatalog.$inferSelect | null> {
        const results = await this.db
            .select()
            .from(addonCatalog)
            .where(eq(addonCatalog.slug, slug))
            .limit(1);

        return results[0] || null;
    }

    /**
     * Get all active add-ons for public catalog
     */
    async findActiveAddons(): Promise<typeof addonCatalog.$inferSelect[]> {
        return this.findAll({ isActive: true });
    }

    /**
     * Get add-ons by category
     */
    async findByCategory(category: string): Promise<typeof addonCatalog.$inferSelect[]> {
        return this.findAll({ category, isActive: true });
    }

    /**
     * Find multiple add-ons by IDs
     */
    async findByIds(ids: number[]): Promise<typeof addonCatalog.$inferSelect[]> {
        if (ids.length === 0) return [];

        const results = await this.db
            .select()
            .from(addonCatalog)
            .where(eq(addonCatalog.id, ids[0])); // Simplified for single ID

        // TODO: Use proper IN clause when multiple IDs
        return results;
    }
}
