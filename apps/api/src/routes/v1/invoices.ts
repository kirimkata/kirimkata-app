import { Hono } from 'hono';
import type { AppEnv } from '../../lib/types';
import { getDb } from '../../db';
import { InvoiceRepository } from '../../repositories/InvoiceRepository';
import { clientAuthMiddleware } from '../../middleware/auth';

const app = new Hono<AppEnv>();

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

        // Verify ownership
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

        // Verify ownership
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
 * GET /v1/invoices
 * Get client's invoices (requires auth)
 */
app.get('/', clientAuthMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const invoiceRepo = new InvoiceRepository(db, c.env);

        const payload = c.get('jwtPayload') as any;
        const clientId = payload.userId || payload.client_id;

        const status = c.req.query('status'); // 'paid' or 'unpaid'
        const filters: any = {};
        if (status) filters.paymentStatus = status;

        const invoices = await invoiceRepo.findByClientId(clientId, filters);

        return c.json({ success: true, data: invoices });
    } catch (error: any) {
        console.error('Error fetching invoices:', error);
        return c.json({ success: false, error: error.message }, 500);
    }
});

export default app;
