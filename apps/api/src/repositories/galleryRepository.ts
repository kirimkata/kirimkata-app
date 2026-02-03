import { getSupabaseClient } from '../lib/supabase';
import type { Env } from '../lib/types';

export interface GallerySettings {
    registration_id: string;
    main_title: string;
    background_color: string;
    top_row_images: string[];
    middle_images: string[];
    bottom_grid_images: string[];
    youtube_embed_url?: string;
    show_youtube: boolean;
    is_enabled: boolean;
    created_at?: string;
    updated_at?: string;
}

class GalleryRepository {
    /**
     * Get gallery settings
     */
    async getSettings(registrationId: string): Promise<GallerySettings | null> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from('gallery_settings')
            .select('*')
            .eq('registration_id', registrationId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            console.error('Error getting gallery settings:', error);
            throw new Error(`Failed to get gallery settings: ${error.message}`);
        }

        return data;
    }

    /**
     * Upsert gallery settings
     */
    async upsertSettings(data: GallerySettings): Promise<GallerySettings> {
        const supabase = getSupabaseClient();

        const { data: result, error } = await supabase
            .from('gallery_settings')
            .upsert(data, { onConflict: 'registration_id' })
            .select()
            .single();

        if (error) {
            console.error('Error upserting gallery settings:', error);
            throw new Error(`Failed to upsert gallery settings: ${error.message}`);
        }

        return result;
    }

    /**
     * Add image to gallery
     */
    async addImage(
        registrationId: string,
        imageUrl: string,
        position: 'top' | 'middle' | 'bottom'
    ): Promise<GallerySettings> {
        const settings = await this.getSettings(registrationId);
        if (!settings) {
            throw new Error('Gallery settings not found');
        }

        const field = position === 'top' ? 'top_row_images'
            : position === 'middle' ? 'middle_images'
                : 'bottom_grid_images';

        const updatedImages = [...(settings[field] || []), imageUrl];

        return this.upsertSettings({
            ...settings,
            [field]: updatedImages,
        });
    }

    /**
     * Remove image from gallery
     */
    async removeImage(registrationId: string, imageUrl: string): Promise<GallerySettings> {
        const settings = await this.getSettings(registrationId);
        if (!settings) {
            throw new Error('Gallery settings not found');
        }

        return this.upsertSettings({
            ...settings,
            top_row_images: settings.top_row_images.filter(img => img !== imageUrl),
            middle_images: settings.middle_images.filter(img => img !== imageUrl),
            bottom_grid_images: settings.bottom_grid_images.filter(img => img !== imageUrl),
        });
    }

    /**
     * Reorder images in a specific position
     */
    async reorderImages(
        registrationId: string,
        position: 'top' | 'middle' | 'bottom',
        imageUrls: string[]
    ): Promise<GallerySettings> {
        const settings = await this.getSettings(registrationId);
        if (!settings) {
            throw new Error('Gallery settings not found');
        }

        const field = position === 'top' ? 'top_row_images'
            : position === 'middle' ? 'middle_images'
                : 'bottom_grid_images';

        return this.upsertSettings({
            ...settings,
            [field]: imageUrls,
        });
    }
}

// Export singleton instance
export const galleryRepo = new GalleryRepository();
