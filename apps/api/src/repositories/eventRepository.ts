import { eq, desc } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { guestbookEvents as events, invitationPages } from '../db/schema';
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
    private getDb(env: Env) {
        const client = postgres(env.DATABASE_URL);
        return drizzle(client);
    }

    /**
     * Create new event
     */
    async create(data: CreateEventInput, env: Env): Promise<Event> {
        const db = this.getDb(env);

        return await db.transaction(async (tx) => {
            let invitationId = null;

            if (data.has_invitation !== false && data.slug) {
                // Create invitation page first
                const [invitation] = await tx.insert(invitationPages).values({
                    clientId: data.client_id,
                    slug: data.slug,
                    profile: {},
                    bride: {},
                    groom: {},
                    event: {},
                    greetings: {},
                    eventDetails: {},
                    loveStory: [],
                    gallery: [],
                    weddingGift: {},
                    closing: {},
                }).returning();
                invitationId = invitation.id;
            }

            const [newEvent] = await tx.insert(events).values({
                clientId: data.client_id,
                eventName: data.name,
                eventDate: data.event_date,
                venueName: data.location,
                invitationId: invitationId,
                hasInvitation: data.has_invitation ?? true,
                hasGuestbook: data.has_guestbook ?? false,
                seatingMode: 'no_seat',
                isActive: true,
            }).returning();

            return {
                ...this.mapToEvent(newEvent),
                slug: data.slug
            };
        });
    }

    /**
     * Find event by ID
     */
    async findById(id: string, env: Env): Promise<Event | null> {
        const db = this.getDb(env);

        const result = await db
            .select({
                event: events,
                slug: invitationPages.slug
            })
            .from(events)
            .leftJoin(invitationPages, eq(events.invitationId, invitationPages.id))
            .where(eq(events.id, id));

        if (result.length === 0) {
            return null;
        }

        const row = result[0];
        return {
            ...this.mapToEvent(row.event),
            slug: row.slug || undefined
        };
    }

    /**
     * Find event by slug
     */
    async findBySlug(slug: string, env: Env): Promise<Event | null> {
        const db = this.getDb(env);

        const result = await db
            .select({
                event: events,
                slug: invitationPages.slug
            })
            .from(events)
            .innerJoin(invitationPages, eq(events.invitationId, invitationPages.id))
            .where(eq(invitationPages.slug, slug))
            .limit(1);

        if (result.length === 0) {
            return null;
        }

        const row = result[0];
        return {
            ...this.mapToEvent(row.event),
            slug: row.slug || undefined
        };
    }

    /**
     * Find all events for a client
     */
    async findByClientId(clientId: string, env: Env): Promise<Event[]> {
        const db = this.getDb(env);

        const results = await db
            .select({
                event: events,
                slug: invitationPages.slug
            })
            .from(events)
            .leftJoin(invitationPages, eq(events.invitationId, invitationPages.id))
            .where(eq(events.clientId, clientId))
            .orderBy(desc(events.createdAt));

        return results.map(row => ({
            ...this.mapToEvent(row.event),
            slug: row.slug || undefined
        }));
    }

    /**
     * Update event
     */
    async update(id: string, updates: UpdateEventInput, env: Env): Promise<Event> {
        const db = this.getDb(env);

        return await db.transaction(async (tx) => {
            // Get current event to check invitationId
            const [currentEvent] = await tx
                .select()
                .from(events)
                .where(eq(events.id, id))
                .limit(1);

            if (!currentEvent) {
                throw new Error('Event not found');
            }

            // Update invitation slug if provided and linked
            let newSlug = undefined;
            if (updates.slug && currentEvent.invitationId) {
                const [updatedInv] = await tx
                    .update(invitationPages)
                    .set({ slug: updates.slug, updatedAt: new Date().toISOString() })
                    .where(eq(invitationPages.id, currentEvent.invitationId))
                    .returning();
                newSlug = updatedInv?.slug;
            }

            const updateData: any = {};
            if (updates.name !== undefined) updateData.eventName = updates.name;
            if (updates.event_date !== undefined) updateData.eventDate = updates.event_date;
            if (updates.location !== undefined) updateData.venueName = updates.location;
            if (updates.has_invitation !== undefined) updateData.hasInvitation = updates.has_invitation;
            if (updates.has_guestbook !== undefined) updateData.hasGuestbook = updates.has_guestbook;
            if (updates.is_active !== undefined) updateData.isActive = updates.is_active;

            updateData.updatedAt = new Date().toISOString();

            const [updatedEvent] = await tx.update(events)
                .set(updateData)
                .where(eq(events.id, id))
                .returning();

            // Fetch final slug if not updated but exists
            if (!newSlug && currentEvent.invitationId) {
                const [inv] = await tx.select({ slug: invitationPages.slug })
                    .from(invitationPages)
                    .where(eq(invitationPages.id, currentEvent.invitationId));
                newSlug = inv?.slug;
            }

            return {
                ...this.mapToEvent(updatedEvent),
                slug: newSlug
            };
        });
    }

    /**
     * Delete event
     */
    async delete(id: string, env: Env): Promise<void> {
        const db = this.getDb(env);
        // Cascade delete should handle invitationPages deletion if configured, 
        // but schema says `invitationId` references `invitationPages.id` with `onDelete: "cascade"`.
        // Wait, schema: `invitationId: ... references(() => invitationPages.id, { onDelete: "cascade" })`
        // This means if invitationPage is deleted, event is deleted.
        // But if event is deleted, invitationPage is NOT automatically deleted unless we do it manually or FK is reversed.
        // Current schema: Event -> InvitationPage (FK on Event).
        // Check schema line 167: invitationId references invitationPages.id.
        // So deleting Event does NOT delete InvitationPage.

        // We probably want to delete the InvitationPage too if it exists?
        // Or keep it? Usually strict coupling means delete both.

        // Fetch event to get invitationId
        const [event] = await db.select().from(events).where(eq(events.id, id));
        if (event && event.invitationId) {
            await db.delete(invitationPages).where(eq(invitationPages.id, event.invitationId));
        }
        await db.delete(events).where(eq(events.id, id));
    }

    /**
     * Check if slug is available
     */
    async isSlugAvailable(slug: string, env: Env): Promise<boolean> {
        const db = this.getDb(env);
        // Check global slug uniqueness on invitationPages
        const [invitation] = await db.select().from(invitationPages).where(eq(invitationPages.slug, slug)).limit(1);
        return !invitation;
    }

    /**
     * Map DB result to Event interface (snake_case)
     */
    private mapToEvent(dbEvent: any): Event {
        return {
            id: dbEvent.id,
            client_id: dbEvent.clientId,
            name: dbEvent.eventName,
            event_date: dbEvent.eventDate,
            location: dbEvent.venueName,
            slug: undefined, // populated by caller
            has_invitation: dbEvent.hasInvitation,
            has_guestbook: dbEvent.hasGuestbook,
            seating_mode: dbEvent.seatingMode,
            is_active: dbEvent.isActive,
            created_at: dbEvent.createdAt,
            updated_at: dbEvent.updatedAt,
        };
    }
}

export const eventRepository = new EventRepository();
