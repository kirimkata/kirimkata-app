import { getSupabaseClient } from '../lib/supabase';
import type { Env } from '../lib/types';

export interface GreetingSection {
    id: string;
    registration_id: string;
    section_type: 'opening_verse' | 'main_greeting' | 'countdown_title';
    title?: string;
    subtitle?: string;
    content_text?: string;
    bride_text?: string;
    groom_text?: string;
    display_order: number;
    created_at?: string;
    updated_at?: string;
}

export type CreateGreetingSectionInput = Omit<GreetingSection, 'id' | 'created_at' | 'updated_at'>;
export type UpdateGreetingSectionInput = Partial<Omit<GreetingSection, 'id' | 'registration_id' | 'created_at' | 'updated_at'>>;

class GreetingSectionRepository {
    private tableName = 'greeting_sections';

    /**
     * Create new greeting section
     */
    async create(data: CreateGreetingSectionInput): Promise<GreetingSection> {
        const supabase = getSupabaseClient();

        const { data: result, error } = await supabase
            .from(this.tableName)
            .insert(data)
            .select()
            .single();

        if (error) {
            console.error('Error creating greeting section:', error);
            throw new Error(`Failed to create greeting section: ${error.message}`);
        }

        return result;
    }

    /**
     * Find all greeting sections by registration ID
     */
    async findByRegistrationId(registrationId: string): Promise<GreetingSection[]> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('registration_id', registrationId)
            .order('display_order', { ascending: true });

        if (error) {
            console.error('Error finding greeting sections:', error);
            throw new Error(`Failed to find greeting sections: ${error.message}`);
        }

        return data || [];
    }

    /**
     * Find greeting section by type
     */
    async findByType(registrationId: string, sectionType: GreetingSection['section_type']): Promise<GreetingSection | null> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('registration_id', registrationId)
            .eq('section_type', sectionType)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            console.error('Error finding greeting section by type:', error);
            throw new Error(`Failed to find greeting section: ${error.message}`);
        }

        return data;
    }

    /**
     * Update greeting section
     */
    async update(id: string, updates: UpdateGreetingSectionInput): Promise<GreetingSection> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from(this.tableName)
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating greeting section:', error);
            throw new Error(`Failed to update greeting section: ${error.message}`);
        }

        return data;
    }

    /**
     * Delete greeting section
     */
    async delete(id: string): Promise<void> {
        const supabase = getSupabaseClient();

        const { error } = await supabase
            .from(this.tableName)
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting greeting section:', error);
            throw new Error(`Failed to delete greeting section: ${error.message}`);
        }
    }

    /**
     * Bulk create greeting sections
     */
    async bulkCreate(items: CreateGreetingSectionInput[]): Promise<GreetingSection[]> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from(this.tableName)
            .insert(items)
            .select();

        if (error) {
            console.error('Error bulk creating greeting sections:', error);
            throw new Error(`Failed to bulk create greeting sections: ${error.message}`);
        }

        return data || [];
    }

    /**
     * Delete all greeting sections for a registration
     */
    async deleteAllByRegistrationId(registrationId: string): Promise<void> {
        const supabase = getSupabaseClient();

        const { error } = await supabase
            .from(this.tableName)
            .delete()
            .eq('registration_id', registrationId);

        if (error) {
            console.error('Error deleting all greeting sections:', error);
            throw new Error(`Failed to delete greeting sections: ${error.message}`);
        }
    }
}

// Export singleton instance
export const greetingSectionRepo = new GreetingSectionRepository();
