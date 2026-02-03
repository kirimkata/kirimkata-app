import { getSupabaseClient } from '../lib/supabase';
import type { Env } from '../lib/types';

export interface ClosingSettings {
    registration_id: string;
    background_color: string;
    photo_url?: string;
    photo_alt?: string;
    names_script: string;
    message_line1?: string;
    message_line2?: string;
    message_line3?: string;
    is_enabled: boolean;
    created_at?: string;
    updated_at?: string;
}

class ClosingRepository {
    /**
     * Get closing settings
     */
    async getSettings(registrationId: string): Promise<ClosingSettings | null> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from('closing_settings')
            .select('*')
            .eq('registration_id', registrationId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            console.error('Error getting closing settings:', error);
            throw new Error(`Failed to get closing settings: ${error.message}`);
        }

        return data;
    }

    /**
     * Upsert closing settings
     */
    async upsertSettings(data: ClosingSettings): Promise<ClosingSettings> {
        const supabase = getSupabaseClient();

        const { data: result, error } = await supabase
            .from('closing_settings')
            .upsert(data, { onConflict: 'registration_id' })
            .select()
            .single();

        if (error) {
            console.error('Error upserting closing settings:', error);
            throw new Error(`Failed to upsert closing settings: ${error.message}`);
        }

        return result;
    }
}

// Export singleton instance
export const closingRepo = new ClosingRepository();
