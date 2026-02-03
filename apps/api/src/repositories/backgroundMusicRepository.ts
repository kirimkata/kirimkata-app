import { getSupabaseClient } from '../lib/supabase';
import type { Env } from '../lib/types';

export interface BackgroundMusicSettings {
    registration_id: string;
    audio_url: string;
    title?: string;
    artist?: string;
    loop: boolean;
    register_as_background_audio: boolean;
    is_enabled: boolean;
    created_at?: string;
    updated_at?: string;
}

class BackgroundMusicRepository {
    /**
     * Get background music settings
     */
    async getSettings(registrationId: string): Promise<BackgroundMusicSettings | null> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from('background_music_settings')
            .select('*')
            .eq('registration_id', registrationId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            console.error('Error getting background music settings:', error);
            throw new Error(`Failed to get background music settings: ${error.message}`);
        }

        return data;
    }

    /**
     * Upsert background music settings
     */
    async upsertSettings(data: BackgroundMusicSettings): Promise<BackgroundMusicSettings> {
        const supabase = getSupabaseClient();

        const { data: result, error } = await supabase
            .from('background_music_settings')
            .upsert(data, { onConflict: 'registration_id' })
            .select()
            .single();

        if (error) {
            console.error('Error upserting background music settings:', error);
            throw new Error(`Failed to upsert background music settings: ${error.message}`);
        }

        return result;
    }
}

// Export singleton instance
export const backgroundMusicRepo = new BackgroundMusicRepository();
