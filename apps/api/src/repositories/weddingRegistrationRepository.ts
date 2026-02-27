import { getDb } from '@/db';
import { weddingRegistrations } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { Env } from '@/lib/types';

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

    // Helper to map DB result to Application model
    private mapFromDb(record: any): WeddingRegistration {
        const result: any = { ...record };

        // Map snake_case or camelCase from DB to expected interface properties
        // Drizzle schema uses camelCase for TypeScript keys (e.g. event1StartTime), but DB columns are snake_case.
        // Drizzle results are returned with proper TS keys defined in schema.

        // Map Drizzle schema keys (camelCase) to Interface keys (snake_case-ish for time)
        // Check schema definition: event1StartTime -> event1_start_time

        if (record.clientId) result.client_id = record.clientId;
        if (record.eventType) result.event_type = record.eventType;
        if (record.customEvent1Label) result.custom_event1_label = record.customEvent1Label;
        if (record.customEvent2Label) result.custom_event2_label = record.customEvent2Label;

        if (record.brideName) result.bride_name = record.brideName;
        if (record.brideFullName) result.bride_full_name = record.brideFullName;
        if (record.brideFatherName) result.bride_father_name = record.brideFatherName;
        if (record.brideMotherName) result.bride_mother_name = record.brideMotherName;
        if (record.brideInstagram) result.bride_instagram = record.brideInstagram;

        if (record.groomName) result.groom_name = record.groomName;
        if (record.groomFullName) result.groom_full_name = record.groomFullName;
        if (record.groomFatherName) result.groom_father_name = record.groomFatherName;
        if (record.groomMotherName) result.groom_mother_name = record.groomMotherName;
        if (record.groomInstagram) result.groom_instagram = record.groomInstagram;

        if (record.event1Date) result.event1_date = record.event1Date; // Date string usually
        if (record.event2SameDate !== undefined) result.event2_same_date = record.event2SameDate;
        if (record.event2Date) result.event2_date = record.event2Date;

        // Time fields mapping
        if (record.event1StartTime) result.event1_time = record.event1StartTime;
        if (record.event1EndTime) result.event1_end_time = record.event1EndTime;

        if (record.event1VenueName) result.event1_venue_name = record.event1VenueName;
        if (record.event1VenueAddress) result.event1_venue_address = record.event1VenueAddress;
        if (record.event1VenueCity) result.event1_venue_city = record.event1VenueCity;
        if (record.event1VenueProvince) result.event1_venue_province = record.event1VenueProvince;
        if (record.event1MapsUrl) result.event1_maps_url = record.event1MapsUrl;

        if (record.event2SameVenue !== undefined) result.event2_same_venue = record.event2SameVenue;

        if (record.event2StartTime) result.event2_time = record.event2StartTime;
        if (record.event2EndTime) result.event2_end_time = record.event2EndTime;

        if (record.event2VenueName) result.event2_venue_name = record.event2VenueName;
        if (record.event2VenueAddress) result.event2_venue_address = record.event2VenueAddress;
        if (record.event2VenueCity) result.event2_venue_city = record.event2VenueCity;
        if (record.event2VenueProvince) result.event2_venue_province = record.event2VenueProvince;
        if (record.event2MapsUrl) result.event2_maps_url = record.event2MapsUrl;

        if (record.createdAt) result.created_at = new Date(record.createdAt).toISOString();
        if (record.updatedAt) result.updated_at = new Date(record.updatedAt).toISOString();

        return result;
    }

    // Helper to map Application model to DB Drizzle schema
    private mapToDb(data: Partial<WeddingRegistration> & Record<string, any>): any {
        const dbData: any = {};

        // Helper to copy if exists
        const copy = (sourceKey: string, targetKey: string) => {
            if (data[sourceKey] !== undefined) dbData[targetKey] = data[sourceKey];
        };

        // Basic fields
        copy('slug', 'slug');
        copy('client_id', 'clientId');
        copy('event_type', 'eventType');
        copy('timezone', 'timezone');

        copy('custom_event1_label', 'customEvent1Label');
        copy('custom_event2_label', 'customEvent2Label');

        copy('bride_name', 'brideName');
        copy('bride_full_name', 'brideFullName');
        copy('bride_father_name', 'brideFatherName');
        copy('bride_mother_name', 'brideMotherName');
        copy('bride_instagram', 'brideInstagram');

        copy('groom_name', 'groomName');
        copy('groom_full_name', 'groomFullName');
        copy('groom_father_name', 'groomFatherName');
        copy('groom_mother_name', 'groomMotherName');
        copy('groom_instagram', 'groomInstagram');

        copy('event1_date', 'event1Date');
        // weddingDate mirrors event1_date (this column is NOT NULL — required for placeholder insert)
        if (data['event1_date'] !== undefined && !dbData.weddingDate) dbData.weddingDate = data['event1_date'];
        copy('event2_same_date', 'event2SameDate');
        copy('event2_date', 'event2Date');

        // Time mapping
        copy('event1_time', 'event1StartTime');
        copy('event1_end_time', 'event1EndTime');

        copy('event1_venue_name', 'event1VenueName');
        copy('event1_venue_address', 'event1VenueAddress');
        copy('event1_venue_city', 'event1VenueCity');
        copy('event1_venue_province', 'event1VenueProvince');
        copy('event1_maps_url', 'event1MapsUrl');

        copy('event2_same_venue', 'event2SameVenue');

        copy('event2_time', 'event2StartTime');
        copy('event2_end_time', 'event2EndTime');

        copy('event2_venue_name', 'event2VenueName');
        copy('event2_venue_address', 'event2VenueAddress');
        copy('event2_venue_city', 'event2VenueCity');
        copy('event2_venue_province', 'event2VenueProvince');
        copy('event2_maps_url', 'event2MapsUrl');

        return dbData;
    }

    /**
     * Create new wedding registration
     */
    async create(env: Env, data: CreateWeddingRegistrationInput): Promise<WeddingRegistration> {
        const db = getDb(env);
        const dbData = this.mapToDb(data as any);

        const [result] = await db
            .insert(weddingRegistrations)
            .values(dbData)
            .returning();

        return this.mapFromDb(result);
    }

    /**
     * Find wedding registration by slug
     */
    async findBySlug(env: Env, slug: string): Promise<WeddingRegistration | null> {
        const db = getDb(env);

        const [result] = await db
            .select()
            .from(weddingRegistrations)
            .where(eq(weddingRegistrations.slug, slug))
            .limit(1);

        if (!result) return null;
        return this.mapFromDb(result);
    }

    /**
     * Find wedding registration by ID
     */
    async findById(env: Env, id: string): Promise<WeddingRegistration | null> {
        const db = getDb(env);

        const [result] = await db
            .select()
            .from(weddingRegistrations)
            .where(eq(weddingRegistrations.id, id))
            .limit(1);

        if (!result) return null;
        return this.mapFromDb(result);
    }

    /**
     * Update wedding registration
     */
    async update(env: Env, id: string, updates: UpdateWeddingRegistrationInput): Promise<WeddingRegistration> {
        const db = getDb(env);
        const dbUpdates = this.mapToDb(updates as any);

        // Add updated_at
        dbUpdates.updatedAt = new Date().toISOString();

        const [result] = await db
            .update(weddingRegistrations)
            .set(dbUpdates)
            .where(eq(weddingRegistrations.id, id))
            .returning();

        if (!result) {
            throw new Error('Failed to update registration: Record not found');
        }

        return this.mapFromDb(result);
    }

    /**
     * Delete wedding registration
     */
    async delete(env: Env, id: string): Promise<void> {
        const db = getDb(env);

        await db
            .delete(weddingRegistrations)
            .where(eq(weddingRegistrations.id, id));
    }

    /**
     * Find all registrations by client ID
     */
    async findByClientId(env: Env, clientId: string): Promise<WeddingRegistration[]> {
        const db = getDb(env);

        const results = await db
            .select()
            .from(weddingRegistrations)
            .where(eq(weddingRegistrations.clientId, clientId))
            .orderBy(desc(weddingRegistrations.createdAt));

        return results.map(r => this.mapFromDb(r));
    }

    /**
     * Check if slug is available
     */
    async isSlugAvailable(env: Env, slug: string): Promise<boolean> {
        const existing = await this.findBySlug(env, slug);
        return !existing;
    }
}

// Export singleton instance
export const weddingRegistrationRepo = new WeddingRegistrationRepository();

