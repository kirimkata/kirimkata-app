import { Hono } from 'hono';
import type { AppEnv } from '../../lib/types';
import { getDb } from '../../db';
import { InvoiceRepository } from '../../repositories/InvoiceRepository';
import { clientAuthMiddleware } from '../../middleware/auth';
import { orders } from '../../db/schema';
import { eq } from 'drizzle-orm';

const app = new Hono<AppEnv>();

/**
 * GET /v1/invoices
 * Get client's invoices with order details joined (requires auth)
 */
app.get('/', clientAuthMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const invoiceRepo = new InvoiceRepository(db, c.env);

        const payload = c.get('jwtPayload') as any;
        const clientId = payload.userId || payload.client_id;

        const status = c.req.query('status');
        const filters: any = {};
        if (status) filters.paymentStatus = status;

        const invoiceList = await invoiceRepo.findByClientId(clientId, filters);

        // Enrich with order data (title, slug, orderNumber)
        const enriched = await Promise.all(
            invoiceList.map(async (inv) => {
                try {
                    const [order] = await db
                        .select({
                            id: orders.id,
                            orderNumber: orders.orderNumber,
                            title: orders.title,
                            slug: orders.slug,
                            mainDate: orders.mainDate,
                            paymentStatus: orders.paymentStatus,
                            paymentProofUrl: orders.paymentProofUrl,
                        })
                        .from(orders)
                        .where(eq(orders.id, inv.orderId))
                        .limit(1);
                    return { ...inv, order: order || null };
                } catch {
                    return { ...inv, order: null };
                }
            })
        );

        return c.json({ success: true, data: enriched });
    } catch (error: any) {
        console.error('Error fetching invoices:', error);
        return c.json({ success: false, error: error.message }, 500);
    }
});

/**
 * GET /v1/invoices/order/:orderId
 * Get invoice by order ID (requires auth)
 */
app.get('/order/:orderId', clientAuthMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const invoiceRepo = new InvoiceRepository(db, c.env);

        const orderId = c.req.param('orderId');
        const invoice = await invoiceRepo.findByOrderId(orderId);

        if (!invoice) {
            return c.json({ success: false, error: 'Invoice not found' }, 404);
        }

        const payload = c.get('jwtPayload') as any;
        const userId = payload.userId || payload.client_id;
        if (invoice.clientId !== userId && payload.type !== 'ADMIN') {
            return c.json({ success: false, error: 'Unauthorized' }, 403);
        }

        return c.json({ success: true, data: invoice });
    } catch (error: any) {
        console.error('Error fetching invoice:', error);
        return c.json({ success: false, error: error.message }, 500);
    }
});

/**
 * GET /v1/invoices/:id
 * Get invoice by ID (requires auth)
 */
app.get('/:id', clientAuthMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const invoiceRepo = new InvoiceRepository(db, c.env);

        const invoiceId = c.req.param('id');
        const invoice = await invoiceRepo.findById(invoiceId);

        if (!invoice) {
            return c.json({ success: false, error: 'Invoice not found' }, 404);
        }

        const payload = c.get('jwtPayload') as any;
        const userId = payload.userId || payload.client_id;
        if (invoice.clientId !== userId && payload.type !== 'ADMIN') {
            return c.json({ success: false, error: 'Unauthorized' }, 403);
        }

        return c.json({ success: true, data: invoice });
    } catch (error: any) {
        console.error('Error fetching invoice:', error);
        return c.json({ success: false, error: error.message }, 500);
    }
});

export default app;
