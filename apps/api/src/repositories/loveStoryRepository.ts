import { getDb } from '@/db';
import { loveStorySettings, invitationLoveStoryContent } from '@/db/schema';
import { eq, asc, inArray } from 'drizzle-orm';
import type { Env } from '@/lib/types';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export type LoveStorySettings = InferSelectModel<typeof loveStorySettings>;
export type LoveStoryBlock = InferSelectModel<typeof invitationLoveStoryContent>;

export type CreateLoveStoryBlockInput = InferInsertModel<typeof invitationLoveStoryContent>;
export type UpdateLoveStoryBlockInput = Partial<CreateLoveStoryBlockInput>;
export type UpsertLoveStorySettingsInput = InferInsertModel<typeof loveStorySettings>;

export type CreateLoveStoryBlockInputOmit = Omit<CreateLoveStoryBlockInput, 'id' | 'createdAt' | 'updatedAt'>;

class LoveStoryRepository {

    /**
     * Get love story settings
     */
    async getSettings(env: Env, registrationId: string): Promise<LoveStorySettings | null> {
        const db = getDb(env);

        const [result] = await db
            .select()
            .from(loveStorySettings)
            .where(eq(loveStorySettings.registrationId, registrationId))
            .limit(1);

        return result || null;
    }

    /**
     * Upsert love story settings
     */
    async upsertSettings(env: Env, data: UpsertLoveStorySettingsInput): Promise<LoveStorySettings> {
        const db = getDb(env);

        const [result] = await db
            .insert(loveStorySettings)
            .values({
                ...data,
                updatedAt: new Date().toISOString(),
            })
            .onConflictDoUpdate({
                target: loveStorySettings.registrationId,
                set: {
                    ...data,
                    updatedAt: new Date().toISOString(),
                }
            })
            .returning();

        return result;
    }

    /**
     * Get all love story blocks
     */
    async getBlocks(env: Env, registrationId: string): Promise<LoveStoryBlock[]> {
        const db = getDb(env);

        const results = await db
            .select()
            .from(invitationLoveStoryContent)
            .where(eq(invitationLoveStoryContent.registrationId, registrationId))
            .orderBy(asc(invitationLoveStoryContent.displayOrder));

        return results;
    }

    /**
     * Create love story block
     */
    async createBlock(env: Env, block: CreateLoveStoryBlockInputOmit): Promise<LoveStoryBlock> {
        const db = getDb(env);

        const [result] = await db
            .insert(invitationLoveStoryContent)
            .values({
                ...block,
                updatedAt: new Date().toISOString(),
            })
            .returning();

        return result;
    }

    /**
     * Update love story block
     */
    async updateBlock(env: Env, id: string, updates: UpdateLoveStoryBlockInput): Promise<LoveStoryBlock> {
        const db = getDb(env);

        const [result] = await db
            .update(invitationLoveStoryContent)
            .set({
                ...updates,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(invitationLoveStoryContent.id, id))
            .returning();

        if (!result) {
            throw new Error('Failed to update love story block: Record not found');
        }

        return result;
    }

    /**
     * Delete love story block
     */
    async deleteBlock(env: Env, id: string): Promise<void> {
        const db = getDb(env);

        await db
            .delete(invitationLoveStoryContent)
            .where(eq(invitationLoveStoryContent.id, id));
    }

    /**
     * Reorder love story blocks
     */
    async reorderBlocks(env: Env, registrationId: string, blockIds: string[]): Promise<void> {
        const db = getDb(env);

        // Drizzle doesn't support bulk upsert efficiently with different values for same columns easily in one query generic way without raw SQL case/when
        // But we can do individual updates in transaction or separate updates.
        // Given typically small number of blocks (< 10), sequential updates are fine or Promise.all.

        await db.transaction(async (tx) => {
            const updatePromises = blockIds.map((id, index) =>
                tx.update(invitationLoveStoryContent)
                    .set({ displayOrder: index, updatedAt: new Date().toISOString() })
                    .where(eq(invitationLoveStoryContent.id, id))
            );
            await Promise.all(updatePromises);
        });
    }

    /**
     * Delete all blocks for a registration
     */
    async deleteAllBlocks(env: Env, registrationId: string): Promise<void> {
        const db = getDb(env);

        await db
            .delete(invitationLoveStoryContent)
            .where(eq(invitationLoveStoryContent.registrationId, registrationId));
    }
}

// Export singleton instance
export const loveStoryRepo = new LoveStoryRepository();

