import { getDb } from '@/db';
import { backgroundMusicSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { Env } from '@/lib/types';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export type BackgroundMusicSettings = InferSelectModel<typeof backgroundMusicSettings>;
export type UpsertBackgroundMusicSettingsInput = InferInsertModel<typeof backgroundMusicSettings>;

class BackgroundMusicRepository {
    /**
     * Get background music settings
     */
    async getSettings(env: Env, registrationId: string): Promise<BackgroundMusicSettings | null> {
        const db = getDb(env);

        const [result] = await db
            .select()
            .from(backgroundMusicSettings)
            .where(eq(backgroundMusicSettings.registrationId, registrationId))
            .limit(1);

        return result || null;
    }

    /**
     * Upsert background music settings
     */
    async upsertSettings(env: Env, data: UpsertBackgroundMusicSettingsInput): Promise<BackgroundMusicSettings> {
        const db = getDb(env);

        const [result] = await db
            .insert(backgroundMusicSettings)
            .values({
                ...data,
                updatedAt: new Date().toISOString(),
            })
            .onConflictDoUpdate({
                target: backgroundMusicSettings.registrationId,
                set: {
                    ...data,
                    updatedAt: new Date().toISOString(),
                }
            })
            .returning();

        return result;
    }
}

// Export singleton instance
export const backgroundMusicRepo = new BackgroundMusicRepository();

