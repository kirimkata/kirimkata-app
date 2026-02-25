import type { Db } from '../db';
import type { Env } from '../lib/types';
import { OrderRepository } from '../repositories/OrderRepository';
import { InvoiceRepository } from '../repositories/InvoiceRepository';
import { TemplateRepository } from '../repositories/TemplateRepository';
import { AddonRepository } from '../repositories/AddonRepository';
import { InvitationRepository } from '../repositories/invitationRepository';
import { guestbookEvents } from '../db/schema';

export class OrderService {
    private orderRepo: OrderRepository;
    private invoiceRepo: InvoiceRepository;
    private templateRepo: TemplateRepository;
    private addonRepo: AddonRepository;
    private invitationRepo: InvitationRepository;

    constructor(private db: Db, private env: Env) {
        this.orderRepo = new OrderRepository(db, env);
        this.invoiceRepo = new InvoiceRepository(db, env);
        this.templateRepo = new TemplateRepository(db, env);
        this.addonRepo = new AddonRepository(db, env);
        this.invitationRepo = new InvitationRepository(db, env);
    }

    /**
     * Create order with validation
     */
    async createOrder(data: {
        clientId: string;
        type: string;
        title: string;
        slug: string;
        mainDate: string;
        inviterType: string;
        inviterData: any;
        templateId: number;
        addonIds?: number[];
        voucherCode?: string;
    }): Promise<{
        order: any;
        invoice: any;
    }> {
        // 1. Validate slug availability
        const slugAvailable = await this.orderRepo.isSlugAvailable(data.slug);
        if (!slugAvailable) {
            throw new Error(`Slug "${data.slug}" is already taken`);
        }

        // 2. Get template details and validate
        const template = await this.templateRepo.findById(data.templateId);
        if (!template) {
            throw new Error(`Template with ID ${data.templateId} not found`);
        }
        if (!template.isActive) {
            throw new Error(`Template "${template.name}" is not active`);
        }

        // 3. Get addon details if specified
        let addons: any[] = [];
        if (data.addonIds && data.addonIds.length > 0) {
            for (const addonId of data.addonIds) {
                const addon = await this.addonRepo.findById(addonId);
                if (!addon) {
                    throw new Error(`Addon with ID ${addonId} not found`);
                }
                if (!addon.isActive) {
                    throw new Error(`Addon "${addon.name}" is not active`);
                }
                addons.push({
                    id: addon.id,
                    name: addon.name,
                    slug: addon.slug,
                    price: addon.price,
                    quantity: 1, // Default quantity
                    unit: addon.unit,
                });
            }
        }

        // 4. Apply voucher discount if provided
        let discount = 0;
        if (data.voucherCode) {
            // TODO: Implement voucher validation and discount calculation
            // For now, just store the voucher code
        }

        // 5. Create order
        const order = await this.orderRepo.createOrder({
            clientId: data.clientId,
            type: data.type,
            title: data.title,
            slug: data.slug,
            mainDate: data.mainDate,
            inviterType: data.inviterType,
            inviterData: data.inviterData,
            templateId: template.id,
            templatePrice: template.basePrice,
            addons,
            discount,
            voucherCode: data.voucherCode,
        });

        // 6. Create invoice
        const invoice = await this.invoiceRepo.createFromOrder({
            orderId: order.id,
            clientId: data.clientId,
            subtotal: order.subtotal,
            discount: order.discount || 0,
            total: order.total,
        });

        return { order, invoice };
    }

    /**
     * Upload payment proof
     */
    async uploadPaymentProof(orderId: string, data: {
        paymentProofUrl: string;
        paymentMethod: string;
        paymentBank?: string;
        paymentAccountName?: string;
    }): Promise<any> {
        // Validate order exists
        const order = await this.orderRepo.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        // Check if order can still accept payment proof
        if (order.paymentStatus !== 'pending' && order.paymentStatus !== 'unpaid' && order.paymentStatus !== 'rejected') {
            throw new Error(`Cannot upload payment proof. Order payment status is "${order.paymentStatus}"`);
        }

        // Check if order is expired
        if (order.expiresAt && new Date(order.expiresAt) < new Date()) {
            throw new Error('Order has expired');
        }

        // Upload payment proof
        return this.orderRepo.uploadPaymentProof(orderId, data);
    }

    /**
     * Admin: Verify payment and create invitation
     */
    async verifyPayment(orderId: string, adminId: string): Promise<{
        order: any;
        invitation: any;
        event: any;
        invoice: any;
    }> {
        // 1. Get order
        const order = await this.orderRepo.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        // 2. Validate payment status
        if (order.paymentStatus !== 'pending_verification') {
            throw new Error(`Cannot verify payment. Order payment status is "${order.paymentStatus}"`);
        }

        // 3. Verify payment
        const verifiedOrder = await this.orderRepo.verifyPayment(orderId, adminId);
        if (!verifiedOrder) {
            throw new Error('Failed to verify payment');
        }

        // 4. Calculate expiration date (3 months from now)
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 3);
        const activeUntil = expiryDate.toISOString().slice(0, 10);

        // 5. Create invitation with default content structure
        const inviterData = verifiedOrder.inviterData as any;
        const invitation = await this.invitationRepo.createFromOrder({
            orderId: verifiedOrder.id,
            clientId: verifiedOrder.clientId,
            slug: verifiedOrder.slug,
            profile: {
                theme: 'parallax-custom1',
                name: verifiedOrder.title,
                slug: verifiedOrder.slug,
            },
            bride: inviterData?.bride || {},
            groom: inviterData?.groom || {},
            event: {
                fullDateLabel: verifiedOrder.mainDate,
                isoDate: verifiedOrder.mainDate,
            },
            greetings: {},
            eventDetails: {
                holyMatrimony: {},
                reception: {},
                streaming: {},
            },
            loveStory: {
                mainTitle: 'Our Love Story',
                backgroundImage: '',
                overlayOpacity: 0.6,
                blocks: [],
            },
            gallery: {
                mainTitle: 'Our Moments',
                backgroundColor: '#F5F5F0',
                topRowImages: [],
                middleImages: [],
                bottomGridImages: [],
            },
            weddingGift: {
                title: 'Wedding Gift',
                subtitle: 'Doa restu Anda adalah hadiah terindah bagi kami.',
                buttonLabel: 'Kirim Hadiah',
                giftImageSrc: '',
                backgroundOverlayOpacity: 0.55,
                bankAccounts: [],
                physicalGift: {
                    recipientName: '',
                    addressLines: [],
                },
            },
            closing: {
                backgroundColor: '#F5F5F0',
                photoSrc: '',
                photoAlt: 'Closing Photo',
                namesScript: '',
                messageLines: [],
            },
            activeUntil,
        });

        // 5.5 Create Event for Client Dashboard
        const [newEvent] = await this.db.insert(guestbookEvents).values({
            clientId: verifiedOrder.clientId,
            eventName: verifiedOrder.title,
            eventDate: verifiedOrder.mainDate,
            invitationId: invitation.id,
            hasInvitation: true,
            hasGuestbook: false, // Default false unless they bought a guestbook addon
            seatingMode: 'no_seat',
            isActive: true,
        }).returning();

        // 6. Mark invoice as paid
        const invoice = await this.invoiceRepo.findByOrderId(orderId);
        if (invoice) {
            await this.invoiceRepo.markAsPaid(invoice.id);
        }

        return {
            order: verifiedOrder,
            invitation,
            event: newEvent,
            invoice,
        };
    }

    /**
     * Admin: Reject payment
     */
    async rejectPayment(orderId: string, adminId: string, reason: string): Promise<any> {
        const order = await this.orderRepo.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        if (order.paymentStatus !== 'pending_verification') {
            throw new Error(`Cannot reject payment. Order payment status is "${order.paymentStatus}"`);
        }

        return this.orderRepo.rejectPayment(orderId, adminId, reason);
    }

    /**
     * Get order with related data
     */
    async getOrderDetails(orderId: string): Promise<{
        order: any;
        template: any;
        invoice: any | null;
        invitation: any | null;
    }> {
        const order = await this.orderRepo.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        const template = await this.templateRepo.findById(order.templateId);
        const invoice = await this.invoiceRepo.findByOrderId(orderId);

        let invitation = null;
        if (order.paymentStatus === 'verified') {
            invitation = await this.invitationRepo.findBySlug(order.slug);
        }

        return {
            order,
            template,
            invoice,
            invitation,
        };
    }

    /**
     * Cancel order
     */
    async cancelOrder(orderId: string, clientId: string): Promise<any> {
        const order = await this.orderRepo.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        // Verify ownership
        if (order.clientId !== clientId) {
            throw new Error('Unauthorized');
        }

        // Only allow cancellation if pending
        if (order.paymentStatus !== 'pending') {
            throw new Error(`Cannot cancel order with payment status "${order.paymentStatus}"`);
        }

        return this.orderRepo.cancelOrder(orderId);
    }

    /**
     * Cleanup expired orders (background job)
     */
    async cleanupExpiredOrders(): Promise<number> {
        const expiredOrders = await this.orderRepo.findExpiredOrders();

        let count = 0;
        for (const order of expiredOrders) {
            await this.orderRepo.expireOrder(order.id);
            count++;
        }

        return count;
    }
}
