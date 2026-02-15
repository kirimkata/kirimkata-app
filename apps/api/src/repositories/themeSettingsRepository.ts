import { getDb } from '@/db';
import { themeSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { Env } from '@/lib/types';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export type ThemeSettings = InferSelectModel<typeof themeSettings>;
export type UpsertThemeSettingsInput = InferInsertModel<typeof themeSettings>;

class ThemeSettingsRepository {
    /**
     * Get theme settings
     */
    async getSettings(env: Env, registrationId: string): Promise<ThemeSettings | null> {
        const db = getDb(env);

        const [result] = await db
            .select()
            .from(themeSettings)
            .where(eq(themeSettings.registrationId, registrationId))
            .limit(1);

        return result || null;
    }

    /**
     * Upsert theme settings
     */
    async upsertSettings(env: Env, data: UpsertThemeSettingsInput): Promise<ThemeSettings> {
        const db = getDb(env);

        const [result] = await db
            .insert(themeSettings)
            .values({
                ...data,
                updatedAt: new Date().toISOString(),
            })
            .onConflictDoUpdate({
                target: themeSettings.registrationId,
                set: {
                    ...data,
                    updatedAt: new Date().toISOString(),
                }
            })
            .returning();

        return result;
    }

    /**
     * Toggle feature
     */
    async toggleFeature(
        env: Env,
        registrationId: string,
        feature: 'gallery' | 'love_story' | 'wedding_gift' | 'wishes' | 'closing',
        enabled: boolean
    ): Promise<ThemeSettings> {
        const settings = await this.getSettings(env, registrationId);

        // If settings don't exist, likely need to create default.
        // Or throw error? Original code threw "Theme settings not found".
        if (!settings) {
            throw new Error('Theme settings not found');
        }

        const featureMap = {
            gallery: 'enableGallery',
            love_story: 'enableLoveStory',
            wedding_gift: 'enableWeddingGift',
            wishes: 'enableWishes',
            closing: 'enableClosing',
        } as const;

        const updateData: UpsertThemeSettingsInput = {
            ...settings,
            // Ensure registrationId is present if settings doesn't have it (unlikely given it came from DB via getSettings, but for type safety if needed)
            // Actually settings is ThemeSettings which has registrationId.
            [featureMap[feature]]: enabled,
            updatedAt: new Date().toISOString(),
        };

        return this.upsertSettings(env, updateData);
    }
}

// Export singleton instance
export const themeSettingsRepo = new ThemeSettingsRepository();

