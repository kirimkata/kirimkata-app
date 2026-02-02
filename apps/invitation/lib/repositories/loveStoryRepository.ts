import { getSupabaseClient } from '@/lib/supabaseClient';

export interface LoveStorySettings {
    registration_id: string;
    main_title: string;
    background_image_url?: string;
    overlay_opacity: number;
    is_enabled: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface LoveStoryBlock {
    id: string;
    registration_id: string;
    title: string;
    body_text: string;
    display_order: number;
    created_at?: string;
    updated_at?: string;
}

export type CreateLoveStoryBlockInput = Omit<LoveStoryBlock, 'id' | 'created_at' | 'updated_at'>;
export type UpdateLoveStoryBlockInput = Partial<Omit<LoveStoryBlock, 'id' | 'registration_id' | 'created_at' | 'updated_at'>>;

class LoveStoryRepository {
    /**
     * Get love story settings
     */
    async getSettings(registrationId: string): Promise<LoveStorySettings | null> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from('love_story_settings')
            .select('*')
            .eq('registration_id', registrationId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            console.error('Error getting love story settings:', error);
            throw new Error(`Failed to get love story settings: ${error.message}`);
        }

        return data;
    }

    /**
     * Upsert love story settings
     */
    async upsertSettings(data: LoveStorySettings): Promise<LoveStorySettings> {
        const supabase = getSupabaseClient();

        const { data: result, error } = await supabase
            .from('love_story_settings')
            .upsert(data, { onConflict: 'registration_id' })
            .select()
            .single();

        if (error) {
            console.error('Error upserting love story settings:', error);
            throw new Error(`Failed to upsert love story settings: ${error.message}`);
        }

        return result;
    }

    /**
     * Get all love story blocks
     */
    async getBlocks(registrationId: string): Promise<LoveStoryBlock[]> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from('love_story_blocks')
            .select('*')
            .eq('registration_id', registrationId)
            .order('display_order', { ascending: true });

        if (error) {
            console.error('Error getting love story blocks:', error);
            throw new Error(`Failed to get love story blocks: ${error.message}`);
        }

        return data || [];
    }

    /**
     * Create love story block
     */
    async createBlock(block: CreateLoveStoryBlockInput): Promise<LoveStoryBlock> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from('love_story_blocks')
            .insert(block)
            .select()
            .single();

        if (error) {
            console.error('Error creating love story block:', error);
            throw new Error(`Failed to create love story block: ${error.message}`);
        }

        return data;
    }

    /**
     * Update love story block
     */
    async updateBlock(id: string, updates: UpdateLoveStoryBlockInput): Promise<LoveStoryBlock> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from('love_story_blocks')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating love story block:', error);
            throw new Error(`Failed to update love story block: ${error.message}`);
        }

        return data;
    }

    /**
     * Delete love story block
     */
    async deleteBlock(id: string): Promise<void> {
        const supabase = getSupabaseClient();

        const { error } = await supabase
            .from('love_story_blocks')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting love story block:', error);
            throw new Error(`Failed to delete love story block: ${error.message}`);
        }
    }

    /**
     * Reorder love story blocks
     */
    async reorderBlocks(registrationId: string, blockIds: string[]): Promise<void> {
        const supabase = getSupabaseClient();

        // Update display_order for each block
        const updates = blockIds.map((id, index) => ({
            id,
            display_order: index,
        }));

        const { error } = await supabase
            .from('love_story_blocks')
            .upsert(updates);

        if (error) {
            console.error('Error reordering love story blocks:', error);
            throw new Error(`Failed to reorder love story blocks: ${error.message}`);
        }
    }

    /**
     * Delete all blocks for a registration
     */
    async deleteAllBlocks(registrationId: string): Promise<void> {
        const supabase = getSupabaseClient();

        const { error } = await supabase
            .from('love_story_blocks')
            .delete()
            .eq('registration_id', registrationId);

        if (error) {
            console.error('Error deleting all love story blocks:', error);
            throw new Error(`Failed to delete love story blocks: ${error.message}`);
        }
    }
}

// Export singleton instance
export const loveStoryRepo = new LoveStoryRepository();
