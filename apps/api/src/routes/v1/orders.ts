import { Hono } from 'hono';
import type { AppEnv } from '../../lib/types';
import { getDb } from '../../db';
import { OrderService } from '../../services/OrderService';
import { clientAuthMiddleware } from '../../middleware/auth';

const app = new Hono<AppEnv>();

/**
 * POST /v1/orders/check-slug
 * Check if a slug is available (requires auth)
 */
app.post('/check-slug', clientAuthMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const orderService = new OrderService(db, c.env);
        const body = await c.req.json();
        const { slug } = body;

        if (!slug) {
            return c.json({ success: false, error: 'Slug is required' }, 400);
        }

        const available = await (orderService as any).orderRepo.isSlugAvailable(slug);
        return c.json({ success: true, data: { available, slug } });
    } catch (error: any) {
        console.error('Error checking slug:', error);
        return c.json({ success: false, error: error.message }, 500);
    }
});

/**
 * POST /v1/orders
 * Create new order (requires auth)
 */
app.post('/', clientAuthMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const orderService = new OrderService(db, c.env);

        const payload = c.get('jwtPayload') as any;
        const clientId = payload.userId || payload.client_id;

        const body = await c.req.json();
        const { type, title, slug, mainDate, inviterType, inviterData, templateId, addonIds, voucherCode } = body;

        // Validation
        if (!title || !slug || !mainDate || !inviterType || !inviterData || !templateId) {
            return c.json({
                success: false,
                error: 'Missing required fields: title, slug, mainDate, inviterType, inviterData, templateId'
            }, 400);
        }

        const result = await orderService.createOrder({
            clientId,
            type: type || 'wedding',
            title,
            slug,
            mainDate,
            inviterType,
            inviterData,
            templateId,
            addonIds: addonIds || [],
            voucherCode,
        });

        return c.json({ success: true, data: result }, 201);
    } catch (error: any) {
        console.error('Error creating order:', error);
        return c.json({ success: false, error: error.message }, 400);
    }
});

/**
 * GET /v1/orders/:id
 * Get order details (requires auth)
 */
app.get('/:id', clientAuthMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const orderService = new OrderService(db, c.env);

        const orderId = c.req.param('id');
        const details = await orderService.getOrderDetails(orderId);

        // Verify ownership
        const payload = c.get('jwtPayload') as any;
        const userId = payload.userId || payload.client_id;
        if (details.order.clientId !== userId && payload.type !== 'ADMIN') {
            return c.json({ success: false, error: 'Unauthorized' }, 403);
        }

        return c.json({ success: true, data: details });
    } catch (error: any) {
        console.error('Error fetching order:', error);
        return c.json({ success: false, error: error.message }, 404);
    }
});

/**
 * POST /v1/orders/:id/payment-proof
 * Upload payment proof (requires auth)
 */
app.post('/:id/payment-proof', clientAuthMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const orderService = new OrderService(db, c.env);

        const orderId = c.req.param('id');
        const body = await c.req.json();
        const { paymentProofUrl, paymentMethod, paymentBank, paymentAccountName } = body;

        if (!paymentProofUrl || !paymentMethod) {
            return c.json({
                success: false,
                error: 'Missing required fields: paymentProofUrl, paymentMethod'
            }, 400);
        }

        const order = await orderService.uploadPaymentProof(orderId, {
            paymentProofUrl,
            paymentMethod,
            paymentBank,
            paymentAccountName,
        });

        return c.json({ success: true, data: order });
    } catch (error: any) {
        console.error('Error uploading payment proof:', error);
        return c.json({ success: false, error: error.message }, 400);
    }
});

/**
 * POST /v1/orders/:id/cancel
 * Cancel order (requires auth)
 */
app.post('/:id/cancel', clientAuthMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const orderService = new OrderService(db, c.env);

        const orderId = c.req.param('id');
        const payload = c.get('jwtPayload') as any;
        const clientId = payload.userId || payload.client_id;

        const order = await orderService.cancelOrder(orderId, clientId);

        return c.json({ success: true, data: order });
    } catch (error: any) {
        console.error('Error cancelling order:', error);
        return c.json({ success: false, error: error.message }, 400);
    }
});

/**
 * GET /v1/orders
 * Get client's orders (requires auth)
 */
app.get('/', clientAuthMiddleware, async (c) => {
    try {
        const db = getDb(c.env);
        const orderService = new OrderService(db, c.env);

        const payload = c.get('jwtPayload') as any;
        const clientId = payload.userId || payload.client_id;

        const { orderRepo } = orderService as any;
        const orders = await orderRepo.findByClientId(clientId);

        return c.json({ success: true, data: orders });
    } catch (error: any) {
        console.error('Error fetching orders:', error);
        return c.json({ success: false, error: error.message }, 500);
    }
});

export default app;
