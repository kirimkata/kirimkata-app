import { getSupabaseClient } from '@/lib/supabaseClient';

export interface ThemeSettings {
    registration_id: string;
    theme_key: string;
    enable_gallery: boolean;
    enable_love_story: boolean;
    enable_wedding_gift: boolean;
    enable_wishes: boolean;
    enable_closing: boolean;
    custom_css?: string;
    created_at?: string;
    updated_at?: string;
}

class ThemeSettingsRepository {
    /**
     * Get theme settings
     */
    async getSettings(registrationId: string): Promise<ThemeSettings | null> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from('theme_settings')
            .select('*')
            .eq('registration_id', registrationId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            console.error('Error getting theme settings:', error);
            throw new Error(`Failed to get theme settings: ${error.message}`);
        }

        return data;
    }

    /**
     * Upsert theme settings
     */
    async upsertSettings(data: ThemeSettings): Promise<ThemeSettings> {
        const supabase = getSupabaseClient();

        const { data: result, error } = await supabase
            .from('theme_settings')
            .upsert(data, { onConflict: 'registration_id' })
            .select()
            .single();

        if (error) {
            console.error('Error upserting theme settings:', error);
            throw new Error(`Failed to upsert theme settings: ${error.message}`);
        }

        return result;
    }

    /**
     * Toggle feature
     */
    async toggleFeature(
        registrationId: string,
        feature: 'gallery' | 'love_story' | 'wedding_gift' | 'wishes' | 'closing',
        enabled: boolean
    ): Promise<ThemeSettings> {
        const settings = await this.getSettings(registrationId);
        if (!settings) {
            throw new Error('Theme settings not found');
        }

        const featureMap = {
            gallery: 'enable_gallery',
            love_story: 'enable_love_story',
            wedding_gift: 'enable_wedding_gift',
            wishes: 'enable_wishes',
            closing: 'enable_closing',
        };

        return this.upsertSettings({
            ...settings,
            [featureMap[feature]]: enabled,
        });
    }
}

// Export singleton instance
export const themeSettingsRepo = new ThemeSettingsRepository();
