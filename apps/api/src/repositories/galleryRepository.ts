import { getDb } from '@/db';
import { gallerySettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { Env } from '@/lib/types';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export type GallerySettings = InferSelectModel<typeof gallerySettings>;
export type UpsertGallerySettingsInput = InferInsertModel<typeof gallerySettings>;

class GalleryRepository {
    /**
     * Get gallery settings
     */
    async getSettings(env: Env, registrationId: string): Promise<GallerySettings | null> {
        const db = getDb(env);

        const [result] = await db
            .select()
            .from(gallerySettings)
            .where(eq(gallerySettings.registrationId, registrationId))
            .limit(1);

        return result || null;
    }

    /**
     * Upsert gallery settings
     */
    async upsertSettings(env: Env, data: UpsertGallerySettingsInput): Promise<GallerySettings> {
        const db = getDb(env);

        const [result] = await db
            .insert(gallerySettings)
            .values({
                ...data,
                updatedAt: new Date().toISOString(),
            })
            .onConflictDoUpdate({
                target: gallerySettings.registrationId,
                set: {
                    ...data,
                    updatedAt: new Date().toISOString(),
                }
            })
            .returning();

        return result;
    }

    /**
     * Add image to gallery
     */
    async addImage(
        env: Env,
        registrationId: string,
        imageUrl: string
    ): Promise<GallerySettings> {
        const settings = await this.getSettings(env, registrationId);

        // If settings don't exist, create default
        const currentImages = settings?.images || [];
        const updatedImages = [...currentImages, imageUrl];

        // If settings exist, update. If not, we need mandatory fields.
        // But mainTitle has default.
        // We'll upsert.

        const upsertData: UpsertGallerySettingsInput = {
            registrationId,
            images: updatedImages,
            // If settings existed, preserve content. If not, only defaults will be used via DB defaults
            ...(settings ? {
                mainTitle: settings.mainTitle,
                backgroundColor: settings.backgroundColor,
                showYoutube: settings.showYoutube,
                youtubeEmbedUrl: settings.youtubeEmbedUrl,
                isEnabled: settings.isEnabled,
            } : {})
        };

        return this.upsertSettings(env, upsertData);
    }

    /**
     * Remove image from gallery
     */
    async removeImage(env: Env, registrationId: string, imageUrl: string): Promise<GallerySettings> {
        const settings = await this.getSettings(env, registrationId);
        if (!settings) {
            throw new Error('Gallery settings not found');
        }

        const currentImages = settings.images || [];
        const updatedImages = currentImages.filter(img => img !== imageUrl);

        return this.upsertSettings(env, {
            ...settings,
            images: updatedImages,
            updatedAt: new Date().toISOString()
        });
    }

    /**
     * Reorder images
     */
    async reorderImages(
        env: Env,
        registrationId: string,
        imageUrls: string[]
    ): Promise<GallerySettings> {
        const settings = await this.getSettings(env, registrationId);

        // If settings don't exist, we can create one with these images? 
        // Logic says "Gallery settings not found" in original code.
        if (!settings) {
            throw new Error('Gallery settings not found');
        }

        return this.upsertSettings(env, {
            ...settings,
            images: imageUrls,
            updatedAt: new Date().toISOString()
        });
    }
}

// Export singleton instance
export const galleryRepo = new GalleryRepository();

