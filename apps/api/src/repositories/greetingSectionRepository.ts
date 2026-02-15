import { getDb } from '@/db';
import { invitationGreetingSettings } from '@/db/schema';
import { eq, asc, desc, and } from 'drizzle-orm';
import type { Env } from '@/lib/types';

export interface GreetingSection {
    id: string;
    registrationId: string;
    sectionKey: string;
    displayOrder: number;
    title?: string | null;
    subtitle?: string | null;
    showBrideName?: boolean | null;
    showGroomName?: boolean | null;
    createdAt?: string | null;
    updatedAt?: string | null;
}

export type CreateGreetingSectionInput = Omit<GreetingSection, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateGreetingSectionInput = Partial<Omit<GreetingSection, 'id' | 'registrationId' | 'createdAt' | 'updatedAt'>>;

class GreetingSectionRepository {

    // Helper to map DB result to Application model
    private mapFromDb(record: typeof invitationGreetingSettings.$inferSelect): GreetingSection {
        return {
            id: record.id,
            registrationId: record.registrationId,
            sectionKey: record.sectionKey,
            displayOrder: record.displayOrder,
            title: record.title,
            subtitle: record.subtitle,
            showBrideName: record.showBrideName,
            showGroomName: record.showGroomName,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
        };
    }

    /**
     * Create new greeting section
     */
    async create(env: Env, data: CreateGreetingSectionInput): Promise<GreetingSection> {
        const db = getDb(env);

        const [result] = await db
            .insert(invitationGreetingSettings)
            .values({
                registrationId: data.registrationId,
                sectionKey: data.sectionKey,
                displayOrder: data.displayOrder,
                title: data.title,
                subtitle: data.subtitle,
                showBrideName: data.showBrideName ?? false,
                showGroomName: data.showGroomName ?? false,
                updatedAt: new Date().toISOString(),
            })
            .returning();

        return this.mapFromDb(result);
    }

    /**
     * Find all greeting sections by registration ID
     */
    async findByRegistrationId(env: Env, registrationId: string): Promise<GreetingSection[]> {
        const db = getDb(env);

        const results = await db
            .select()
            .from(invitationGreetingSettings)
            .where(eq(invitationGreetingSettings.registrationId, registrationId))
            .orderBy(asc(invitationGreetingSettings.displayOrder));

        return results.map(r => this.mapFromDb(r));
    }

    /**
     * Find greeting section by type (sectionKey)
     */
    async findByKey(env: Env, registrationId: string, sectionKey: string): Promise<GreetingSection | null> {
        const db = getDb(env);

        const [result] = await db
            .select()
            .from(invitationGreetingSettings)
            .where(
                and(
                    eq(invitationGreetingSettings.registrationId, registrationId),
                    eq(invitationGreetingSettings.sectionKey, sectionKey)
                )
            )
            .limit(1);

        /* 
           Note: Drizzle .where() chaining acts as AND.
           Correct way for multiple conditions: .where(and(eq(...), eq(...))) or chaining .where()
           Wait, .where(eq(...)).where(eq(...)) works as AND in Drizzle query builder.
           Actually, checking Drizzle docs: yes, chaining `.where()` adds conditions with AND.
           Better to be explicit import `and`? 
           Let's stick to simple chaining for now or fetch by registration and filter (but safer to query).
           Wait, `findByKey` implies finding a specific one.
           
           Let's use `and` import if I change implementation, but chaining `.where` is fine.
           However, I will use `and` for better readability if I import it.
           I didn't import `and`. Let's assume chaining works or use single where.
           
           Actually, let's fix the query to use `and` from drizzle-orm.
        */

        // I'll stick to chaining `where` if I don't import `and`. 
        // But wait, key lookup needs AND.
        // Re-checking imports: `import { eq, asc, desc } from 'drizzle-orm';`
        // I should add `and`.

        /* 
           Refined query below.
        */

        if (!result) return null;
        return this.mapFromDb(result);
    }

    /**
     * Update greeting section
     */
    async update(env: Env, id: string, updates: UpdateGreetingSectionInput): Promise<GreetingSection> {
        const db = getDb(env);

        const [result] = await db
            .update(invitationGreetingSettings)
            .set({
                ...updates,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(invitationGreetingSettings.id, id))
            .returning();

        if (!result) {
            throw new Error('Failed to update greeting section: Record not found');
        }

        return this.mapFromDb(result);
    }

    /**
     * Delete greeting section
     */
    async delete(env: Env, id: string): Promise<void> {
        const db = getDb(env);

        await db
            .delete(invitationGreetingSettings)
            .where(eq(invitationGreetingSettings.id, id));
    }

    /**
     * Bulk create greeting sections
     */
    async bulkCreate(env: Env, items: CreateGreetingSectionInput[]): Promise<GreetingSection[]> {
        const db = getDb(env);

        if (items.length === 0) return [];

        const values = items.map(item => ({
            registrationId: item.registrationId,
            sectionKey: item.sectionKey,
            displayOrder: item.displayOrder,
            title: item.title,
            subtitle: item.subtitle,
            showBrideName: item.showBrideName ?? false,
            showGroomName: item.showGroomName ?? false,
            updatedAt: new Date().toISOString(),
        }));

        const results = await db
            .insert(invitationGreetingSettings)
            .values(values)
            .returning();

        return results.map(r => this.mapFromDb(r));
    }

    /**
     * Delete all greeting sections for a registration
     */
    async deleteAllByRegistrationId(env: Env, registrationId: string): Promise<void> {
        const db = getDb(env);

        await db
            .delete(invitationGreetingSettings)
            .where(eq(invitationGreetingSettings.registrationId, registrationId));
    }
}

// Export singleton instance
export const greetingSectionRepo = new GreetingSectionRepository();

