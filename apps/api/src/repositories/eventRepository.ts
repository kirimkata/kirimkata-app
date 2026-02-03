import { getSupabaseClient } from '../lib/supabase';
import type { Env } from '../lib/types';

export interface Event {
    id: string;
    client_id: string;
    name: string;
    event_date: string;
    location?: string;
    slug?: string;
    has_invitation: boolean;
    has_guestbook: boolean;
    seating_mode: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateEventInput {
    client_id: string;
    name: string;
    event_date: string;
    location?: string;
    slug?: string;
    has_invitation?: boolean;
    has_guestbook?: boolean;
}

export interface UpdateEventInput {
    name?: string;
    event_date?: string;
    location?: string;
    slug?: string;
    has_invitation?: boolean;
    has_guestbook?: boolean;
    is_active?: boolean;
}

export class EventRepository {
    private tableName = 'events';

    /**
     * Create new event
     */
    async create(data: CreateEventInput, env?: Env): Promise<Event> {
        const supabase = getSupabaseClient(env);

        const eventData = {
            client_id: data.client_id,
            name: data.name,
            event_date: data.event_date,
            location: data.location,
            slug: data.slug,
            has_invitation: data.has_invitation ?? true,
            has_guestbook: data.has_guestbook ?? false,
            seating_mode: 'no_seat',
            is_active: true,
        };

        const { data: result, error } = await supabase
            .from(this.tableName)
            .insert(eventData)
            .select()
            .single();

        if (error) {
            console.error('Error creating event:', error);
            throw new Error(`Failed to create event: ${error.message}`);
        }

        return result;
    }

    /**
     * Find event by ID
     */
    async findById(id: string, env?: Env): Promise<Event | null> {
        const supabase = getSupabaseClient(env);

        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            console.error('Error finding event by ID:', error);
            throw new Error(`Failed to find event: ${error.message}`);
        }

        return data;
    }

    /**
     * Find event by slug
     */
    async findBySlug(slug: string, env?: Env): Promise<Event | null> {
        const supabase = getSupabaseClient(env);

        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('slug', slug)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            console.error('Error finding event by slug:', error);
            throw new Error(`Failed to find event: ${error.message}`);
        }

        return data;
    }

    /**
     * Find all events for a client
     */
    async findByClientId(clientId: string, env?: Env): Promise<Event[]> {
        const supabase = getSupabaseClient(env);

        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error finding events by client ID:', error);
            throw new Error(`Failed to find events: ${error.message}`);
        }

        return data || [];
    }

    /**
     * Update event
     */
    async update(id: string, updates: UpdateEventInput, env?: Env): Promise<Event> {
        const supabase = getSupabaseClient(env);

        const { data, error } = await supabase
            .from(this.tableName)
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating event:', error);
            throw new Error(`Failed to update event: ${error.message}`);
        }

        return data;
    }

    /**
     * Delete event
     */
    async delete(id: string, env?: Env): Promise<void> {
        const supabase = getSupabaseClient(env);

        const { error } = await supabase
            .from(this.tableName)
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting event:', error);
            throw new Error(`Failed to delete event: ${error.message}`);
        }
    }

    /**
     * Check if slug is available
     */
    async isSlugAvailable(slug: string, env?: Env): Promise<boolean> {
        const event = await this.findBySlug(slug, env);
        return event === null;
    }
}

export const eventRepository = new EventRepository();
