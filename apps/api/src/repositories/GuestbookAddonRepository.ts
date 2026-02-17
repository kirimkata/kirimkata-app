import { eq, and } from 'drizzle-orm';
import type { Db } from '../db';
import { guestbookAddons, invitationPages, orders, admins } from '../db/schema';
import type { Env } from '../lib/types';

export class GuestbookAddonRepository {
    constructor(private db: Db, private env: Env) { }

    /**
     * Create guestbook addon for invitation
     */
    async create(data: {
        invitationId: string;
        orderId?: string;
        isEnabled?: boolean;
        seatingMode?: string;
        staffQuota?: number;
        config?: any;
    }): Promise<typeof guestbookAddons.$inferSelect> {
        const [addon] = await this.db
            .insert(guestbookAddons)
            .values({
                invitationId: data.invitationId,
                orderId: data.orderId || null,
                isEnabled: data.isEnabled || false,
                seatingMode: data.seatingMode || 'no_seat',
                staffQuota: data.staffQuota || 2,
                staffQuotaUsed: 0,
                config: data.config || {},
            })
            .returning();

        return addon;
    }

    /**
     * Find guestbook addon by invitation ID
     */
    async findByInvitationId(invitationId: string): Promise<typeof guestbookAddons.$inferSelect | null> {
        const results = await this.db
            .select()
            .from(guestbookAddons)
            .where(eq(guestbookAddons.invitationId, invitationId))
            .limit(1);

        return results[0] || null;
    }

    /**
     * Find guestbook addon by ID
     */
    async findById(id: string): Promise<typeof guestbookAddons.$inferSelect | null> {
        const results = await this.db
            .select()
            .from(guestbookAddons)
            .where(eq(guestbookAddons.id, id))
            .limit(1);

        return results[0] || null;
    }

    /**
     * Enable guestbook for invitation
     */
    async enable(invitationId: string): Promise<typeof guestbookAddons.$inferSelect | null> {
        const [addon] = await this.db
            .update(guestbookAddons)
            .set({
                isEnabled: true,
                enabledAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            })
            .where(eq(guestbookAddons.invitationId, invitationId))
            .returning();

        return addon || null;
    }

    /**
     * Disable guestbook for invitation
     */
    async disable(invitationId: string): Promise<typeof guestbookAddons.$inferSelect | null> {
        const [addon] = await this.db
            .update(guestbookAddons)
            .set({
                isEnabled: false,
                disabledAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            })
            .where(eq(guestbookAddons.invitationId, invitationId))
            .returning();

        return addon || null;
    }

    /**
     * Record payment proof for later activation
     */
    async uploadPaymentProof(invitationId: string, data: {
        paymentProofUrl: string;
        paymentAmount: number;
    }): Promise<typeof guestbookAddons.$inferSelect | null> {
        const [addon] = await this.db
            .update(guestbookAddons)
            .set({
                paymentProofUrl: data.paymentProofUrl,
                paymentAmount: data.paymentAmount,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(guestbookAddons.invitationId, invitationId))
            .returning();

        return addon || null;
    }

    /**
     * Admin: Verify payment and enable guestbook
     */
    async verifyPayment(invitationId: string, adminId: string): Promise<typeof guestbookAddons.$inferSelect | null> {
        const [addon] = await this.db
            .update(guestbookAddons)
            .set({
                paymentVerified: true,
                paymentVerifiedAt: new Date().toISOString(),
                paymentVerifiedBy: adminId,
                isEnabled: true,
                enabledAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            })
            .where(eq(guestbookAddons.invitationId, invitationId))
            .returning();

        return addon || null;
    }

    /**
     * Update seating mode
     */
    async updateSeatingMode(invitationId: string, seatingMode: string): Promise<typeof guestbookAddons.$inferSelect | null> {
        const [addon] = await this.db
            .update(guestbookAddons)
            .set({
                seatingMode,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(guestbookAddons.invitationId, invitationId))
            .returning();

        return addon || null;
    }

    /**
     * Update staff quota
     */
    async updateStaffQuota(invitationId: string, quota: number): Promise<typeof guestbookAddons.$inferSelect | null> {
        const [addon] = await this.db
            .update(guestbookAddons)
            .set({
                staffQuota: quota,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(guestbookAddons.invitationId, invitationId))
            .returning();

        return addon || null;
    }

    /**
     * Increment staff quota usage
     */
    async incrementStaffUsage(invitationId: string): Promise<typeof guestbookAddons.$inferSelect | null> {
        const addon = await this.findByInvitationId(invitationId);
        if (!addon) return null;

        const [updated] = await this.db
            .update(guestbookAddons)
            .set({
                staffQuotaUsed: (addon.staffQuotaUsed || 0) + 1,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(guestbookAddons.invitationId, invitationId))
            .returning();

        return updated || null;
    }

    /**
     * Decrement staff quota usage
     */
    async decrementStaffUsage(invitationId: string): Promise<typeof guestbookAddons.$inferSelect | null> {
        const addon = await this.findByInvitationId(invitationId);
        if (!addon || (addon.staffQuotaUsed || 0) <= 0) return null;

        const [updated] = await this.db
            .update(guestbookAddons)
            .set({
                staffQuotaUsed: (addon.staffQuotaUsed || 0) - 1,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(guestbookAddons.invitationId, invitationId))
            .returning();

        return updated || null;
    }

    /**
     * Update configuration
     */
    async updateConfig(invitationId: string, config: any): Promise<typeof guestbookAddons.$inferSelect | null> {
        const [addon] = await this.db
            .update(guestbookAddons)
            .set({
                config,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(guestbookAddons.invitationId, invitationId))
            .returning();

        return addon || null;
    }

    /**
     * Get all enabled guestbook addons
     */
    async findAllEnabled(): Promise<typeof guestbookAddons.$inferSelect[]> {
        return this.db
            .select()
            .from(guestbookAddons)
            .where(eq(guestbookAddons.isEnabled, true));
    }

    /**
     * Get pending payment verification
     */
    async findPendingVerification(): Promise<typeof guestbookAddons.$inferSelect[]> {
        return this.db
            .select()
            .from(guestbookAddons)
            .where(
                and(
                    eq(guestbookAddons.paymentVerified, false),
                    eq(guestbookAddons.isEnabled, false)
                )
            );
    }
}
