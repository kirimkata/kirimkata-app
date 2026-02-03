import { getSupabaseClient } from '../lib/supabase';
import type { Env } from '../lib/types';

export interface WeddingRegistration {
    id: string;
    client_id: string;
    slug: string;
    event_type: 'islam' | 'kristen' | 'katolik' | 'hindu' | 'buddha' | 'custom';
    custom_event1_label?: string;
    custom_event2_label?: string;
    bride_name: string;
    bride_full_name: string;
    bride_father_name?: string;
    bride_mother_name?: string;
    bride_instagram?: string;
    groom_name: string;
    groom_full_name: string;
    groom_father_name?: string;
    groom_mother_name?: string;
    groom_instagram?: string;
    event1_date: string;
    event2_same_date: boolean;
    event2_date?: string;
    timezone: 'WIB' | 'WITA' | 'WIT';
    event1_time: string;
    event1_end_time?: string;
    event1_venue_name?: string;
    event1_venue_address?: string;
    event1_venue_city?: string;
    event1_venue_province?: string;
    event1_maps_url?: string;
    event2_same_venue: boolean;
    event2_time?: string;
    event2_end_time?: string;
    event2_venue_name?: string;
    event2_venue_address?: string;
    event2_venue_city?: string;
    event2_venue_province?: string;
    event2_maps_url?: string;
    created_at?: string;
    updated_at?: string;
}

export type CreateWeddingRegistrationInput = Omit<WeddingRegistration, 'id' | 'created_at' | 'updated_at'>;
export type UpdateWeddingRegistrationInput = Partial<Omit<WeddingRegistration, 'id' | 'client_id' | 'created_at' | 'updated_at'>>;

class WeddingRegistrationRepository {
    private tableName = 'wedding_registrations';

    /**
     * Create new wedding registration
     */
    async create(data: CreateWeddingRegistrationInput): Promise<WeddingRegistration> {
        const supabase = getSupabaseClient();

        // Map API field names to database column names
        const dbData: any = { ...data };
        if ('event1_time' in data) {
            dbData.event1_start_time = data.event1_time;
            delete dbData.event1_time;
        }
        if ('event2_time' in data) {
            dbData.event2_start_time = data.event2_time;
            delete dbData.event2_time;
        }

        const { data: result, error } = await supabase
            .from(this.tableName)
            .insert(dbData)
            .select()
            .single();

        if (error) {
            console.error('Error creating wedding registration:', error);
            throw new Error(`Failed to create wedding registration: ${error.message}`);
        }

        // Map DB column names back to API field names
        const mapped: any = { ...result };
        if (mapped.event1_start_time) mapped.event1_time = mapped.event1_start_time;
        if (mapped.event2_start_time) mapped.event2_time = mapped.event2_start_time;

        return mapped;
    }

    /**
     * Find wedding registration by slug
     */
    async findBySlug(slug: string): Promise<WeddingRegistration | null> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('slug', slug)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Not found
                return null;
            }
            console.error('Error finding wedding registration by slug:', error);
            throw new Error(`Failed to find wedding registration: ${error.message}`);
        }

        // Map DB column names to API field names
        const result: any = { ...data };
        if (result.event1_start_time) result.event1_time = result.event1_start_time;
        if (result.event2_start_time) result.event2_time = result.event2_start_time;

        return result;
    }

    /**
     * Find wedding registration by ID
     */
    async findById(id: string): Promise<WeddingRegistration | null> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            console.error('Error finding wedding registration by ID:', error);
            throw new Error(`Failed to find wedding registration: ${error.message}`);
        }

        return data;
    }

    /**
     * Update wedding registration
     */
    async update(id: string, updates: UpdateWeddingRegistrationInput): Promise<WeddingRegistration> {
        const supabase = getSupabaseClient();

        // Map API field names to database column names
        const dbUpdates: any = { ...updates };
        if ('event1_time' in updates) {
            dbUpdates.event1_start_time = updates.event1_time;
            delete dbUpdates.event1_time;
        }
        if ('event2_time' in updates) {
            dbUpdates.event2_start_time = updates.event2_time;
            delete dbUpdates.event2_time;
        }

        const { data, error } = await supabase
            .from(this.tableName)
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating wedding registration:', error);
            throw new Error(`Failed to update wedding registration: ${error.message}`);
        }

        // Map DB column names back to API field names
        const result: any = { ...data };
        if (result.event1_start_time) result.event1_time = result.event1_start_time;
        if (result.event2_start_time) result.event2_time = result.event2_start_time;

        return result;
    }

    /**
     * Delete wedding registration
     */
    async delete(id: string): Promise<void> {
        const supabase = getSupabaseClient();

        const { error } = await supabase
            .from(this.tableName)
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting wedding registration:', error);
            throw new Error(`Failed to delete wedding registration: ${error.message}`);
        }
    }

    /**
     * Find all registrations by client ID
     */
    async findByClientId(clientId: string): Promise<WeddingRegistration[]> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error finding wedding registrations by client ID:', error);
            throw new Error(`Failed to find wedding registrations: ${error.message}`);
        }

        return data || [];
    }

    /**
     * Check if slug is available
     */
    async isSlugAvailable(slug: string): Promise<boolean> {
        const existing = await this.findBySlug(slug);
        return !existing;
    }
}

// Export singleton instance
export const weddingRegistrationRepo = new WeddingRegistrationRepository();
