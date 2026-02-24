import { eq, desc, and, sql } from 'drizzle-orm';
import type { Db } from '../db';
import { invoices, orders, clients } from '../db/schema';
import type { Env } from '../lib/types';

export class InvoiceRepository {
    constructor(private db: Db, private env: Env) { }

    /**
     * Generate unique invoice number
     * Format: INV-YYYYMMDD-XXXXX
     */
    async generateInvoiceNumber(): Promise<string> {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

        // Get count of invoices today
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const count = await this.db
            .select({ count: sql<number>`count(*)` })
            .from(invoices)
            .where(sql`${invoices.createdAt} >= ${todayStart.toISOString()}`)
            .then(rows => Number(rows[0]?.count || 0));

        const sequence = String(count + 1).padStart(5, '0');
        return `INV-${dateStr}-${sequence}`;
    }

    /**
     * Create invoice from order
     */
    async createFromOrder(data: {
        orderId: string;
        clientId: string;
        subtotal: number;
        discount: number;
        total: number;
        dueDate?: string;
        notes?: string;
    }): Promise<typeof invoices.$inferSelect> {
        const invoiceNumber = await this.generateInvoiceNumber();

        const [invoice] = await this.db
            .insert(invoices)
            .values({
                invoiceNumber,
                orderId: data.orderId,
                clientId: data.clientId,
                subtotal: data.subtotal,
                discount: data.discount,
                total: data.total,
                dueDate: data.dueDate || null,
                paymentStatus: 'unpaid',
                notes: data.notes || null,
            })
            .returning();

        return invoice;
    }

    /**
     * Find invoice by ID
     */
    async findById(id: string): Promise<typeof invoices.$inferSelect | null> {
        const results = await this.db
            .select()
            .from(invoices)
            .where(eq(invoices.id, id))
            .limit(1);

        return results[0] || null;
    }

    /**
     * Find invoice by invoice number
     */
    async findByInvoiceNumber(invoiceNumber: string): Promise<typeof invoices.$inferSelect | null> {
        const results = await this.db
            .select()
            .from(invoices)
            .where(eq(invoices.invoiceNumber, invoiceNumber))
            .limit(1);

        return results[0] || null;
    }

    /**
     * Find invoice by order ID
     */
    async findByOrderId(orderId: string): Promise<typeof invoices.$inferSelect | null> {
        const results = await this.db
            .select()
            .from(invoices)
            .where(eq(invoices.orderId, orderId))
            .limit(1);

        return results[0] || null;
    }

    /**
     * Find all invoices for a client
     */
    async findByClientId(clientId?: string, filters?: {
        paymentStatus?: string;
    }): Promise<typeof invoices.$inferSelect[]> {
        const conditions = [];
        if (clientId) {
            conditions.push(eq(invoices.clientId, clientId));
        }

        if (filters?.paymentStatus) {
            conditions.push(eq(invoices.paymentStatus, filters.paymentStatus));
        }

        let query: any = this.db.select().from(invoices);
        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }

        return query.orderBy(desc(invoices.createdAt));
    }

    /**
     * Mark invoice as paid
     */
    async markAsPaid(invoiceId: string): Promise<typeof invoices.$inferSelect | null> {
        const [invoice] = await this.db
            .update(invoices)
            .set({
                paymentStatus: 'paid',
                paidAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            })
            .where(eq(invoices.id, invoiceId))
            .returning();

        return invoice || null;
    }

    /**
     * Update PDF URL after generation
     */
    async updatePdfUrl(invoiceId: string, pdfUrl: string): Promise<typeof invoices.$inferSelect | null> {
        const [invoice] = await this.db
            .update(invoices)
            .set({
                pdfUrl,
                pdfGeneratedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            })
            .where(eq(invoices.id, invoiceId))
            .returning();

        return invoice || null;
    }

    /**
     * Get all unpaid invoices
     */
    async findUnpaid(): Promise<typeof invoices.$inferSelect[]> {
        return this.db
            .select()
            .from(invoices)
            .where(eq(invoices.paymentStatus, 'unpaid'))
            .orderBy(invoices.dueDate);
    }

    /**
     * Get overdue invoices
     */
    async findOverdue(): Promise<typeof invoices.$inferSelect[]> {
        const today = new Date().toISOString().slice(0, 10);

        return this.db
            .select()
            .from(invoices)
            .where(
                and(
                    eq(invoices.paymentStatus, 'unpaid'),
                    sql`${invoices.dueDate} < ${today}`
                )
            )
            .orderBy(invoices.dueDate);
    }
}
