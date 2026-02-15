import { getDb } from '@/db';
import { closingSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { Env } from '@/lib/types';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export type ClosingSettings = InferSelectModel<typeof closingSettings>;
export type UpsertClosingSettingsInput = InferInsertModel<typeof closingSettings>;

class ClosingRepository {
    /**
     * Get closing settings
     */
    async getSettings(env: Env, registrationId: string): Promise<ClosingSettings | null> {
        const db = getDb(env);

        const [result] = await db
            .select()
            .from(closingSettings)
            .where(eq(closingSettings.registrationId, registrationId))
            .limit(1);

        return result || null;
    }

    /**
     * Upsert closing settings
     */
    async upsertSettings(env: Env, data: UpsertClosingSettingsInput): Promise<ClosingSettings> {
        const db = getDb(env);

        const [result] = await db
            .insert(closingSettings)
            .values({
                ...data,
                updatedAt: new Date().toISOString(),
            })
            .onConflictDoUpdate({
                target: closingSettings.registrationId,
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
export const closingRepo = new ClosingRepository();

