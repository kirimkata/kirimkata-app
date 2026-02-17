import { eq, desc, and, or, sql } from 'drizzle-orm';
import type { Db } from '../db';
import { orders, templates, clients } from '../db/schema';
import type { Env } from '../lib/types';

export class OrderRepository {
    constructor(private db: Db, private env: Env) { }

    /**
     * Generate unique order number
     * Format: ORD-YYYYMMDD-XXXXX
     */
    async generateOrderNumber(): Promise<string> {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

        // Get count of orders today
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const count = await this.db
            .select({ count: sql<number>`count(*)` })
            .from(orders)
            .where(sql`${orders.createdAt} >= ${todayStart.toISOString()}`)
            .then(rows => Number(rows[0]?.count || 0));

        const sequence = String(count + 1).padStart(5, '0');
        return `ORD-${dateStr}-${sequence}`;
    }

    /**
     * Check if slug is available
     */
    async isSlugAvailable(slug: string): Promise<boolean> {
        const existing = await this.db
            .select({ id: orders.id })
            .from(orders)
            .where(eq(orders.slug, slug))
            .limit(1);

        return existing.length === 0;
    }

    /**
     * Create new order
     */
    async createOrder(data: {
        clientId: string;
        type: string;
        title: string;
        slug: string;
        mainDate: string; // ISO date string
        inviterType: string;
        inviterData: any;
        templateId: number;
        templatePrice: number;
        addons?: any[];
        discount?: number;
        voucherCode?: string;
    }): Promise<typeof orders.$inferSelect> {
        const orderNumber = await this.generateOrderNumber();

        // Calculate total
        const addonsArray = data.addons || [];
        const addonTotal = addonsArray.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0);
        const subtotal = data.templatePrice + addonTotal;
        const discount = data.discount || 0;
        const total = subtotal - discount;

        // Set expiration (24 hours from now)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const [order] = await this.db
            .insert(orders)
            .values({
                orderNumber,
                clientId: data.clientId,
                type: data.type,
                title: data.title,
                slug: data.slug,
                mainDate: data.mainDate,
                inviterType: data.inviterType,
                inviterData: data.inviterData,
                templateId: data.templateId,
                templatePrice: data.templatePrice,
                addons: addonsArray,
                subtotal,
                discount,
                voucherCode: data.voucherCode || null,
                total,
                paymentStatus: 'pending',
                status: 'draft',
                expiresAt: expiresAt.toISOString(),
            })
            .returning();

        return order;
    }

    /**
     * Find order by ID
     */
    async findById(id: string): Promise<typeof orders.$inferSelect | null> {
        const results = await this.db
            .select()
            .from(orders)
            .where(eq(orders.id, id))
            .limit(1);

        return results[0] || null;
    }

    /**
     * Find order by order number
     */
    async findByOrderNumber(orderNumber: string): Promise<typeof orders.$inferSelect | null> {
        const results = await this.db
            .select()
            .from(orders)
            .where(eq(orders.orderNumber, orderNumber))
            .limit(1);

        return results[0] || null;
    }

    /**
     * Find order by slug
     */
    async findBySlug(slug: string): Promise<typeof orders.$inferSelect | null> {
        const results = await this.db
            .select()
            .from(orders)
            .where(eq(orders.slug, slug))
            .limit(1);

        return results[0] || null;
    }

    /**
     * Find all orders for a client
     */
    async findByClientId(clientId: string, filters?: {
        paymentStatus?: string;
        status?: string;
    }): Promise<typeof orders.$inferSelect[]> {
        let query = this.db
            .select()
            .from(orders)
            .where(eq(orders.clientId, clientId));

        const conditions = [eq(orders.clientId, clientId)];

        if (filters?.paymentStatus) {
            conditions.push(eq(orders.paymentStatus, filters.paymentStatus));
        }

        if (filters?.status) {
            conditions.push(eq(orders.status, filters.status));
        }

        if (conditions.length > 1) {
            query = this.db
                .select()
                .from(orders)
                .where(and(...conditions));
        }

        return query.orderBy(desc(orders.createdAt));
    }

    /**
     * Upload payment proof
     */
    async uploadPaymentProof(orderId: string, data: {
        paymentProofUrl: string;
        paymentMethod?: string;
        paymentBank?: string;
        paymentAccountName?: string;
    }): Promise<typeof orders.$inferSelect | null> {
        const [order] = await this.db
            .update(orders)
            .set({
                paymentProofUrl: data.paymentProofUrl,
                paymentMethod: data.paymentMethod || null,
                paymentBank: data.paymentBank || null,
                paymentAccountName: data.paymentAccountName || null,
                paymentStatus: 'pending_verification',
                updatedAt: new Date().toISOString(),
            })
            .where(eq(orders.id, orderId))
            .returning();

        return order || null;
    }

    /**
     * Admin: Verify payment
     */
    async verifyPayment(orderId: string, adminId: string): Promise<typeof orders.$inferSelect | null> {
        const [order] = await this.db
            .update(orders)
            .set({
                paymentStatus: 'verified',
                paymentVerifiedAt: new Date().toISOString(),
                paymentVerifiedBy: adminId,
                status: 'active',
                updatedAt: new Date().toISOString(),
            })
            .where(eq(orders.id, orderId))
            .returning();

        return order || null;
    }

    /**
     * Admin: Reject payment
     */
    async rejectPayment(orderId: string, adminId: string, reason: string): Promise<typeof orders.$inferSelect | null> {
        const [order] = await this.db
            .update(orders)
            .set({
                paymentStatus: 'rejected',
                paymentVerifiedBy: adminId,
                paymentRejectionReason: reason,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(orders.id, orderId))
            .returning();

        return order || null;
    }

    /**
     * Get pending verification orders (admin view)
     */
    async findPendingVerification(): Promise<typeof orders.$inferSelect[]> {
        return this.db
            .select()
            .from(orders)
            .where(eq(orders.paymentStatus, 'pending_verification'))
            .orderBy(orders.createdAt);
    }

    /**
     * Cancel order
     */
    async cancelOrder(orderId: string): Promise<typeof orders.$inferSelect | null> {
        const [order] = await this.db
            .update(orders)
            .set({
                status: 'cancelled',
                updatedAt: new Date().toISOString(),
            })
            .where(eq(orders.id, orderId))
            .returning();

        return order || null;
    }

    /**
     * Mark order as expired
     */
    async expireOrder(orderId: string): Promise<typeof orders.$inferSelect | null> {
        const [order] = await this.db
            .update(orders)
            .set({
                status: 'expired',
                updatedAt: new Date().toISOString(),
            })
            .where(eq(orders.id, orderId))
            .returning();

        return order || null;
    }

    /**
     * Get expired unpaid orders (for cleanup job)
     */
    async findExpiredOrders(): Promise<typeof orders.$inferSelect[]> {
        const now = new Date().toISOString();

        return this.db
            .select()
            .from(orders)
            .where(
                and(
                    sql`${orders.expiresAt} < ${now}`,
                    eq(orders.paymentStatus, 'pending'),
                    eq(orders.status, 'draft')
                )
            );
    }
}
