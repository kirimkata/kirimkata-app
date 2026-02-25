import { eq, desc, and, or, sql } from 'drizzle-orm';
import type { Db } from '../db';
import { invitationPages, orders, clients } from '../db/schema';
import type { Env } from '../lib/types';

export class InvitationRepository {
    constructor(private db: Db, private env: Env) { }

    /**
     * Create invitation from verified order
     */
    async createFromOrder(data: {
        orderId: string;
        clientId: string;
        slug: string;
        profile: any;
        bride: any;
        groom: any;
        event: any;
        greetings: any;
        eventDetails: any;
        loveStory: any;
        gallery: any;
        weddingGift: any;
        closing: any;
        musicSettings?: any;
        themeKey?: string;
        customImages?: any;
        activeUntil: string; // ISO date string
    }): Promise<typeof invitationPages.$inferSelect> {
        const [invitation] = await this.db
            .insert(invitationPages)
            .values({
                orderId: data.orderId,
                clientId: data.clientId,
                slug: data.slug,
                profile: data.profile,
                bride: data.bride,
                groom: data.groom,
                event: data.event,
                greetings: data.greetings,
                eventDetails: data.eventDetails,
                loveStory: data.loveStory,
                gallery: data.gallery,
                weddingGift: data.weddingGift,
                closing: data.closing,
                musicSettings: data.musicSettings || null,
                themeKey: data.themeKey || 'parallax/parallax-custom1',
                customImages: data.customImages || null,
                verificationStatus: 'verified', // Created from verified order
                activeUntil: data.activeUntil,
                isActive: false, // Stays false until client explicitly publishes
            })
            .returning();

        return invitation;
    }

    /**
     * Find invitation by ID
     */
    async findById(id: string): Promise<typeof invitationPages.$inferSelect | null> {
        const results = await this.db
            .select()
            .from(invitationPages)
            .where(eq(invitationPages.id, id))
            .limit(1);

        return results[0] || null;
    }

    /**
     * Find invitation by slug
     */
    async findBySlug(slug: string): Promise<typeof invitationPages.$inferSelect | null> {
        const results = await this.db
            .select()
            .from(invitationPages)
            .where(eq(invitationPages.slug, slug))
            .limit(1);

        return results[0] || null;
    }

    /**
     * Find all invitations for a client
     */
    async findByClientId(clientId: string, filters?: {
        isActive?: boolean;
        verificationStatus?: string;
    }): Promise<typeof invitationPages.$inferSelect[]> {
        const conditions = [eq(invitationPages.clientId, clientId)];

        if (filters?.isActive !== undefined) {
            conditions.push(eq(invitationPages.isActive, filters.isActive));
        }

        if (filters?.verificationStatus) {
            conditions.push(eq(invitationPages.verificationStatus, filters.verificationStatus));
        }

        return this.db
            .select()
            .from(invitationPages)
            .where(and(...conditions))
            .orderBy(desc(invitationPages.createdAt));
    }

    /**
     * Update verification status
     */
    async updateVerificationStatus(invitationId: string, status: string, adminId?: string): Promise<typeof invitationPages.$inferSelect | null> {
        const updateData: any = {
            verificationStatus: status,
            updatedAt: new Date().toISOString(),
        };

        if (status === 'verified' && adminId) {
            updateData.verifiedAt = new Date().toISOString();
            updateData.verifiedBy = adminId;
        }

        const [invitation] = await this.db
            .update(invitationPages)
            .set(updateData)
            .where(eq(invitationPages.id, invitationId))
            .returning();

        return invitation || null;
    }

    /**
     * Activate invitation (set isActive = true)
     */
    async activate(invitationId: string): Promise<typeof invitationPages.$inferSelect | null> {
        const [invitation] = await this.db
            .update(invitationPages)
            .set({
                isActive: true,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(invitationPages.id, invitationId))
            .returning();

        return invitation || null;
    }

    /**
     * Deactivate invitation
     */
    async deactivate(invitationId: string): Promise<typeof invitationPages.$inferSelect | null> {
        const [invitation] = await this.db
            .update(invitationPages)
            .set({
                isActive: false,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(invitationPages.id, invitationId))
            .returning();

        return invitation || null;
    }

    /**
     * Archive invitation
     */
    async archive(invitationId: string): Promise<typeof invitationPages.$inferSelect | null> {
        const [invitation] = await this.db
            .update(invitationPages)
            .set({
                isActive: false,
                archivedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            })
            .where(eq(invitationPages.id, invitationId))
            .returning();

        return invitation || null;
    }

    /**
     * Renew invitation (extend activeUntil by 3 months)
     */
    async renew(invitationId: string): Promise<typeof invitationPages.$inferSelect | null> {
        const invitation = await this.findById(invitationId);
        if (!invitation) return null;

        const currentExpiry = new Date(invitation.activeUntil || new Date());
        const newExpiry = new Date(currentExpiry);
        newExpiry.setMonth(newExpiry.getMonth() + 3);

        const [renewed] = await this.db
            .update(invitationPages)
            .set({
                activeUntil: newExpiry.toISOString().slice(0, 10),
                isActive: true,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(invitationPages.id, invitationId))
            .returning();

        return renewed || null;
    }

    /**
     * Get expiring invitations (within specified days)
     */
    async findExpiringSoon(days: number = 7): Promise<typeof invitationPages.$inferSelect[]> {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);

        return this.db
            .select()
            .from(invitationPages)
            .where(
                and(
                    eq(invitationPages.isActive, true),
                    sql`${invitationPages.activeUntil} >= ${today.toISOString().slice(0, 10)}`,
                    sql`${invitationPages.activeUntil} <= ${futureDate.toISOString().slice(0, 10)}`
                )
            )
            .orderBy(invitationPages.activeUntil);
    }

    /**
     * Get expired invitations
     */
    async findExpired(): Promise<typeof invitationPages.$inferSelect[]> {
        const today = new Date().toISOString().slice(0, 10);

        return this.db
            .select()
            .from(invitationPages)
            .where(
                and(
                    eq(invitationPages.isActive, true),
                    sql`${invitationPages.activeUntil} < ${today}`
                )
            )
            .orderBy(invitationPages.activeUntil);
    }

    /**
     * Auto-deactivate expired invitations
     */
    async deactivateExpired(): Promise<number> {
        const today = new Date().toISOString().slice(0, 10);

        const result = await this.db
            .update(invitationPages)
            .set({
                isActive: false,
                updatedAt: new Date().toISOString(),
            })
            .where(
                and(
                    eq(invitationPages.isActive, true),
                    sql`${invitationPages.activeUntil} < ${today}`
                )
            )
            .returning();

        return result.length;
    }

    /**
     * Update invitation content
     */
    async updateContent(invitationId: string, data: Partial<{
        profile: any;
        bride: any;
        groom: any;
        event: any;
        greetings: any;
        eventDetails: any;
        loveStory: any;
        gallery: any;
        weddingGift: any;
        closing: any;
        musicSettings: any;
        themeKey: string;
        customImages: any;
    }>): Promise<typeof invitationPages.$inferSelect | null> {
        const [invitation] = await this.db
            .update(invitationPages)
            .set({
                ...data,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(invitationPages.id, invitationId))
            .returning();

        return invitation || null;
    }

    /**
     * Get all active invitations
     */
    async findAllActive(): Promise<typeof invitationPages.$inferSelect[]> {
        return this.db
            .select()
            .from(invitationPages)
            .where(eq(invitationPages.isActive, true))
            .orderBy(desc(invitationPages.createdAt));
    }
}
