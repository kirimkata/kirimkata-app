import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { Context } from 'hono';
import type { Env } from '../../lib/types';
import { weddingRegistrationRepo } from '../../repositories/weddingRegistrationRepository';
import { loveStoryRepo } from '../../repositories/loveStoryRepository';
import { galleryRepo } from '../../repositories/galleryRepository';
import { weddingGiftRepo } from '../../repositories/weddingGiftRepository';
import { closingRepo } from '../../repositories/closingRepository';
import { backgroundMusicRepo } from '../../repositories/backgroundMusicRepository';
import { themeSettingsRepo } from '../../repositories/themeSettingsRepository';
import { greetingSectionRepo } from '../../repositories/greetingSectionRepository';
import { invitationCompiler } from '../../services-invitation/invitationCompilerService';
import { fetchFullInvitationContent } from '../../repositories/invitationContentRepository';
import { RateLimiter } from '../../middleware/rateLimit';
import { verifyToken } from '../../services/jwt';

const publicRateLimiter = new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
    message: 'Too many requests'
});

const router = new OpenAPIHono<{ Bindings: Env }>();

/**
 * Helper function to validate JWT and get client ID
 */
async function getAuthenticatedClientId(c: Context<{ Bindings: Env }>): Promise<{ clientId: string | null; error?: string }> {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { clientId: null, error: 'Missing or invalid authorization header' };
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token, c.env.JWT_SECRET);

    if (!payload || payload.type !== 'CLIENT') {
        return { clientId: null, error: 'Invalid or expired token' };
    }

    return { clientId: payload.client_id };
}

/**
 * Helper function to validate ownership
 * Checks if the authenticated client owns the wedding registration for the given slug
 */
async function validateOwnership(env: Env, slug: string, clientId: string): Promise<{ valid: boolean; error?: string; registration?: any }> {
    const registration = await weddingRegistrationRepo.findBySlug(env, slug);

    if (!registration) {
        return { valid: false, error: 'Registration not found' };
    }

    if (registration.client_id !== clientId) {
        return { valid: false, error: 'Unauthorized access to this invitation' };
    }

    return { valid: true, registration };
}

// ============ SCHEMAS ============

const SlugParamsSchema = z.object({
    slug: z.string().openapi({ param: { name: 'slug', in: 'path' }, example: 'romeo-juliet' }),
});

const ErrorSchema = z.object({
    error: z.string(),
});

const SuccessResponseSchema = (dataSchema: z.ZodType) => z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    message: z.string().optional(),
});

// Love Story Schemas
const LoveStorySettingsSchema = z.object({
    main_title: z.string().optional(),
    background_image_url: z.string().optional(),
    overlay_opacity: z.number().optional(),
    is_enabled: z.boolean().optional().default(true),
});

const LoveStoryBlockSchema = z.object({
    title: z.string(),
    body_text: z.string(),
    display_order: z.number(),
});

const LoveStoryResponseSchema = z.object({
    settings: LoveStorySettingsSchema.nullable(),
    blocks: z.array(LoveStoryBlockSchema),
});

const UpdateLoveStoryBodySchema = z.object({
    settings: LoveStorySettingsSchema.optional(),
    blocks: z.array(LoveStoryBlockSchema).optional(),
});

// Gallery Schemas
const GallerySettingsSchema = z.object({
    main_title: z.string().optional(),
    background_color: z.string().optional(),
    show_youtube: z.boolean().optional(),
    youtube_embed_url: z.string().optional(),
    images: z.array(z.string()).optional(),
    is_enabled: z.boolean().optional().default(true),
});

const GalleryResponseSchema = z.object({
    settings: GallerySettingsSchema.nullable(),
});

const UpdateGalleryBodySchema = z.object({
    settings: GallerySettingsSchema,
});

// Wedding Gift Schemas
const WeddingGiftSettingsSchema = z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    button_label: z.string().optional(),
    gift_image_url: z.string().optional(),
    background_overlay_opacity: z.number().optional(),
    recipient_name: z.string().optional(),
    recipient_phone: z.string().optional(),
    recipient_address_line1: z.string().optional(),
    recipient_address_line2: z.string().optional(),
    recipient_address_line3: z.string().optional(),
    is_enabled: z.boolean().optional().default(true),
});

const BankAccountSchema = z.object({
    bank_name: z.string(),
    account_number: z.string(),
    account_holder_name: z.string(),
    display_order: z.number(),
});

const WeddingGiftResponseSchema = z.object({
    settings: WeddingGiftSettingsSchema.nullable(),
    bankAccounts: z.array(BankAccountSchema),
});

const UpdateWeddingGiftBodySchema = z.object({
    settings: WeddingGiftSettingsSchema.optional(),
    bankAccounts: z.array(BankAccountSchema).optional(),
});

// Closing Schemas
const ClosingSettingsSchema = z.object({
    background_color: z.string().optional(),
    photo_url: z.string().optional(),
    names_display: z.string().optional(),
    message_line1: z.string().optional(),
    message_line2: z.string().optional(),
    message_line3: z.string().optional(),
    photo_alt: z.string().optional(),
    is_enabled: z.boolean().optional().default(true),
});

const ClosingResponseSchema = z.object({
    settings: ClosingSettingsSchema.nullable(),
});

const UpdateClosingBodySchema = z.object({
    settings: ClosingSettingsSchema,
});

// Music Schemas
const MusicSettingsSchema = z.object({
    audio_url: z.string().optional(),
    title: z.string().optional(),
    artist: z.string().optional(),
    loop: z.boolean().optional(),
    register_as_background_audio: z.boolean().optional(),
    is_enabled: z.boolean().optional().default(true),
});

const MusicResponseSchema = z.object({
    settings: MusicSettingsSchema.nullable(),
});

const UpdateMusicBodySchema = z.object({
    settings: MusicSettingsSchema,
});

// Theme Schemas
const ThemeSettingsSchema = z.object({
    theme_key: z.string().optional(),
    custom_images: z.record(z.string(), z.any()).optional(),
    enable_gallery: z.boolean().optional(),
    enable_love_story: z.boolean().optional(),
    enable_wedding_gift: z.boolean().optional(),
    enable_wishes: z.boolean().optional(),
    enable_closing: z.boolean().optional(),
    custom_css: z.string().optional(),
});

const ThemeResponseSchema = z.object({
    settings: ThemeSettingsSchema.nullable(),
});

const UpdateThemeBodySchema = z.object({
    settings: ThemeSettingsSchema,
});

// Greetings Schemas
const GreetingSectionSchema = z.object({
    section_key: z.string(),
    display_order: z.number(),
    title: z.string().optional(),
    subtitle: z.string().optional(),
    show_bride_name: z.boolean().optional(),
    show_groom_name: z.boolean().optional(),
});

const GreetingsResponseSchema = z.object({
    greetings: z.array(GreetingSectionSchema),
});

const UpdateGreetingsBodySchema = z.object({
    greetings: z.array(GreetingSectionSchema),
});

// ============ ROUTES ============

// Love Story Routes
router.openapi(
    createRoute({
        method: 'get',
        path: '/{slug}/love-story',
        request: { params: SlugParamsSchema },
        responses: {
            200: { content: { 'application/json': { schema: SuccessResponseSchema(LoveStoryResponseSchema) } }, description: 'Retrieve love story settings' },
            404: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Not found' },
        },
    }),
    async (c) => {
        const slug = c.req.param('slug');
        const registration = await weddingRegistrationRepo.findBySlug(c.env, slug);
        if (!registration) return c.json({ error: 'Registration not found' }, 404);

        const settings = await loveStoryRepo.getSettings(c.env, registration.id);
        const blocks = await loveStoryRepo.getBlocks(c.env, registration.id);

        // Map to snake_case for API response
        const mappedSettings = settings ? {
            main_title: settings.mainTitle,
            background_image_url: settings.backgroundImageUrl,
            overlay_opacity: typeof settings.overlayOpacity === 'string' ? parseFloat(settings.overlayOpacity) : settings.overlayOpacity, // Handle potential string
            is_enabled: settings.isEnabled,
        } : null;

        const mappedBlocks = blocks.map(block => ({
            title: block.title,
            body_text: block.bodyText,
            display_order: block.displayOrder,
        }));

        return c.json({ success: true, data: { settings: mappedSettings, blocks: mappedBlocks } }, 200);
    }
);

router.openapi(
    createRoute({
        method: 'post',
        path: '/{slug}/love-story',
        request: {
            params: SlugParamsSchema,
            body: { content: { 'application/json': { schema: UpdateLoveStoryBodySchema } } },
        },
        responses: {
            200: { content: { 'application/json': { schema: SuccessResponseSchema(z.object({})) } }, description: 'Update love story' },
            401: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Unauthorized' },
            403: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Forbidden' },
            404: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Not found' },
        },
    }),
    async (c) => {
        // Authenticate
        const auth = await getAuthenticatedClientId(c);
        if (!auth.clientId) {
            return c.json({ error: auth.error || 'Unauthorized' }, 401);
        }

        const slug = c.req.param('slug');
        const { settings, blocks } = c.req.valid('json');

        // Validate ownership
        const validation = await validateOwnership(c.env, slug, auth.clientId);
        if (!validation.valid) {
            return c.json({ error: validation.error! }, validation.error === 'Registration not found' ? 404 : 403);
        }
        const registration = validation.registration;

        if (settings) {
            // Map snake_case input to camelCase for Drizzle
            await loveStoryRepo.upsertSettings(c.env, {
                registrationId: registration.id,
                mainTitle: settings.main_title,
                backgroundImageUrl: settings.background_image_url,
                overlayOpacity: settings.overlay_opacity?.toString(), // Convert number to string for numeric column
                isEnabled: settings.is_enabled,
            });
        }
        if (blocks) {
            await loveStoryRepo.deleteAllBlocks(c.env, registration.id);
            for (const block of blocks) {
                await loveStoryRepo.createBlock(c.env, {
                    registrationId: registration.id,
                    title: block.title,
                    bodyText: block.body_text,
                    displayOrder: block.display_order,
                });
            }
        }
        await invitationCompiler.compileAndCache(c.env, slug);
        return c.json({ success: true, message: 'Love story updated successfully' }, 200);
    }
);

// Gallery Routes
router.openapi(
    createRoute({
        method: 'get',
        path: '/{slug}/gallery',
        request: { params: SlugParamsSchema },
        responses: {
            200: { content: { 'application/json': { schema: SuccessResponseSchema(GalleryResponseSchema) } }, description: 'Retrieve gallery settings' },
            404: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Not found' },
        },
    }),
    async (c) => {
        const slug = c.req.param('slug');
        const registration = await weddingRegistrationRepo.findBySlug(c.env, slug);
        if (!registration) return c.json({ error: 'Registration not found' }, 404);

        const settings = await galleryRepo.getSettings(c.env, registration.id);

        // Map to snake_case for API response
        const mappedSettings = settings ? {
            main_title: settings.mainTitle,
            background_color: settings.backgroundColor,
            show_youtube: settings.showYoutube,
            youtube_embed_url: settings.youtubeEmbedUrl,
            images: settings.images,
            is_enabled: settings.isEnabled,
        } : null;

        return c.json({ success: true, data: { settings: mappedSettings } }, 200);
    }
);

router.openapi(
    createRoute({
        method: 'post',
        path: '/{slug}/gallery',
        request: {
            params: SlugParamsSchema,
            body: { content: { 'application/json': { schema: UpdateGalleryBodySchema } } },
        },
        responses: {
            200: { content: { 'application/json': { schema: SuccessResponseSchema(z.object({})) } }, description: 'Update gallery' },
            401: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Unauthorized' },
            403: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Forbidden' },
            404: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Not found' },
        },
    }),
    async (c) => {
        const auth = await getAuthenticatedClientId(c);
        if (!auth.clientId) {
            return c.json({ error: auth.error || 'Unauthorized' }, 401);
        }

        const slug = c.req.param('slug');
        const { settings } = c.req.valid('json');

        const validation = await validateOwnership(c.env, slug, auth.clientId);
        if (!validation.valid) {
            return c.json({ error: validation.error! }, validation.error === 'Registration not found' ? 404 : 403);
        }
        const registration = validation.registration;

        // Map snake_case input to camelCase for Drizzle
        await galleryRepo.upsertSettings(c.env, {
            registrationId: registration.id,
            mainTitle: settings.main_title,
            backgroundColor: settings.background_color,
            showYoutube: settings.show_youtube,
            youtubeEmbedUrl: settings.youtube_embed_url,
            images: settings.images,
            isEnabled: settings.is_enabled,
        });

        await invitationCompiler.compileAndCache(c.env, slug);
        return c.json({ success: true, message: 'Gallery updated successfully' }, 200);
    }
);

// Wedding Gift Routes
router.openapi(
    createRoute({
        method: 'get',
        path: '/{slug}/wedding-gift',
        request: { params: SlugParamsSchema },
        responses: {
            200: { content: { 'application/json': { schema: SuccessResponseSchema(WeddingGiftResponseSchema) } }, description: 'Retrieve wedding gift settings' },
            404: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Not found' },
        },
    }),
    async (c) => {
        const slug = c.req.param('slug');
        const registration = await weddingRegistrationRepo.findBySlug(c.env, slug);
        if (!registration) return c.json({ error: 'Registration not found' }, 404);

        const settings = await weddingGiftRepo.getSettings(c.env, registration.id);
        const bankAccounts = await weddingGiftRepo.getBankAccounts(c.env, registration.id);

        // Map to snake_case for API response
        const mappedSettings = settings ? {
            title: settings.title,
            subtitle: settings.subtitle,
            button_label: settings.buttonLabel,
            gift_image_url: settings.giftImageUrl,
            background_overlay_opacity: typeof settings.backgroundOverlayOpacity === 'string' ? parseFloat(settings.backgroundOverlayOpacity) : settings.backgroundOverlayOpacity,
            recipient_name: settings.recipientName,
            recipient_phone: settings.recipientPhone,
            recipient_address_line1: settings.recipientAddressLine1,
            recipient_address_line2: settings.recipientAddressLine2,
            recipient_address_line3: settings.recipientAddressLine3,
            is_enabled: settings.isEnabled,
        } : null;

        const mappedAccounts = bankAccounts.map(acc => ({
            bank_name: acc.bankName,
            account_number: acc.accountNumber,
            account_holder_name: acc.accountHolderName,
            display_order: acc.displayOrder,
        }));

        return c.json({ success: true, data: { settings: mappedSettings, bankAccounts: mappedAccounts } }, 200);
    }
);

router.openapi(
    createRoute({
        method: 'post',
        path: '/{slug}/wedding-gift',
        request: {
            params: SlugParamsSchema,
            body: { content: { 'application/json': { schema: UpdateWeddingGiftBodySchema } } },
        },
        responses: {
            200: { content: { 'application/json': { schema: SuccessResponseSchema(z.object({})) } }, description: 'Update wedding gift' },
            401: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Unauthorized' },
            403: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Forbidden' },
            404: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Not found' },
        },
    }),
    async (c) => {
        const auth = await getAuthenticatedClientId(c);
        if (!auth.clientId) {
            return c.json({ error: auth.error || 'Unauthorized' }, 401);
        }

        const slug = c.req.param('slug');
        const { settings, bankAccounts } = c.req.valid('json');

        const validation = await validateOwnership(c.env, slug, auth.clientId);
        if (!validation.valid) {
            return c.json({ error: validation.error! }, validation.error === 'Registration not found' ? 404 : 403);
        }
        const registration = validation.registration;

        if (settings) {
            // Map snake_case input to camelCase
            await weddingGiftRepo.upsertSettings(c.env, {
                registrationId: registration.id,
                title: settings.title,
                subtitle: settings.subtitle,
                buttonLabel: settings.button_label,
                giftImageUrl: settings.gift_image_url,
                backgroundOverlayOpacity: settings.background_overlay_opacity?.toString(), // Convert number to string
                recipientName: settings.recipient_name,
                recipientPhone: settings.recipient_phone,
                recipientAddressLine1: settings.recipient_address_line1,
                recipientAddressLine2: settings.recipient_address_line2,
                recipientAddressLine3: settings.recipient_address_line3,
                isEnabled: settings.is_enabled,
            });
        }
        if (bankAccounts) {
            await weddingGiftRepo.deleteAllBankAccounts(c.env, registration.id);
            for (const account of bankAccounts) {
                await weddingGiftRepo.createBankAccount(c.env, {
                    registrationId: registration.id,
                    bankName: account.bank_name,
                    accountNumber: account.account_number,
                    accountHolderName: account.account_holder_name,
                    displayOrder: account.display_order,
                });
            }
        }
        await invitationCompiler.compileAndCache(c.env, slug);
        return c.json({ success: true, message: 'Wedding gift updated successfully' }, 200);
    }
);

// Closing Routes
router.openapi(
    createRoute({
        method: 'get',
        path: '/{slug}/closing',
        request: { params: SlugParamsSchema },
        responses: {
            200: { content: { 'application/json': { schema: SuccessResponseSchema(ClosingResponseSchema) } }, description: 'Retrieve closing settings' },
            404: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Not found' },
        },
    }),
    async (c) => {
        const slug = c.req.param('slug');
        const registration = await weddingRegistrationRepo.findBySlug(c.env, slug);
        if (!registration) return c.json({ error: 'Registration not found' }, 404);

        const settings = await closingRepo.getSettings(c.env, registration.id);

        // Map to snake_case
        const mappedSettings = settings ? {
            background_color: settings.backgroundColor,
            photo_url: settings.photoUrl,
            names_display: settings.namesDisplay,
            message_line1: settings.messageLine1,
            message_line2: settings.messageLine2,
            message_line3: settings.messageLine3,
            photo_alt: settings.photoAlt,
            is_enabled: settings.isEnabled,
        } : null;

        return c.json({ success: true, data: { settings: mappedSettings } }, 200);
    }
);

router.openapi(
    createRoute({
        method: 'post',
        path: '/{slug}/closing',
        request: {
            params: SlugParamsSchema,
            body: { content: { 'application/json': { schema: UpdateClosingBodySchema } } },
        },
        responses: {
            200: { content: { 'application/json': { schema: SuccessResponseSchema(z.object({})) } }, description: 'Update closing settings' },
            401: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Unauthorized' },
            403: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Forbidden' },
            404: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Not found' },
        },
    }),
    async (c) => {
        const auth = await getAuthenticatedClientId(c);
        if (!auth.clientId) {
            return c.json({ error: auth.error || 'Unauthorized' }, 401);
        }

        const slug = c.req.param('slug');
        const { settings } = c.req.valid('json');

        const validation = await validateOwnership(c.env, slug, auth.clientId);
        if (!validation.valid) {
            return c.json({ error: validation.error! }, validation.error === 'Registration not found' ? 404 : 403);
        }
        const registration = validation.registration;

        await closingRepo.upsertSettings(c.env, {
            registrationId: registration.id,
            backgroundColor: settings.background_color,
            photoUrl: settings.photo_url,
            namesDisplay: settings.names_display,
            messageLine1: settings.message_line1,
            messageLine2: settings.message_line2,
            messageLine3: settings.message_line3,
            photoAlt: settings.photo_alt,
            isEnabled: settings.is_enabled,
        });

        await invitationCompiler.compileAndCache(c.env, slug);
        return c.json({ success: true, message: 'Closing updated successfully' }, 200);
    }
);

// Music Routes
router.openapi(
    createRoute({
        method: 'get',
        path: '/{slug}/music',
        request: { params: SlugParamsSchema },
        responses: {
            200: { content: { 'application/json': { schema: SuccessResponseSchema(MusicResponseSchema) } }, description: 'Retrieve music settings' },
            404: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Not found' },
        },
    }),
    async (c) => {
        const slug = c.req.param('slug');
        const registration = await weddingRegistrationRepo.findBySlug(c.env, slug);
        if (!registration) return c.json({ error: 'Registration not found' }, 404);

        const settings = await backgroundMusicRepo.getSettings(c.env, registration.id);

        // Map to snake_case
        const mappedSettings = settings ? {
            audio_url: settings.audioUrl,
            title: settings.title,
            artist: settings.artist,
            loop: settings.loop,
            register_as_background_audio: settings.registerAsBackgroundAudio,
            is_enabled: settings.isEnabled,
        } : null;

        return c.json({ success: true, data: { settings: mappedSettings } }, 200);
    }
);

router.openapi(
    createRoute({
        method: 'post',
        path: '/{slug}/music',
        request: {
            params: SlugParamsSchema,
            body: { content: { 'application/json': { schema: UpdateMusicBodySchema } } },
        },
        responses: {
            200: { content: { 'application/json': { schema: SuccessResponseSchema(z.object({})) } }, description: 'Update music settings' },
            401: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Unauthorized' },
            403: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Forbidden' },
            404: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Not found' },
        },
    }),
    async (c) => {
        const auth = await getAuthenticatedClientId(c);
        if (!auth.clientId) {
            return c.json({ error: auth.error || 'Unauthorized' }, 401);
        }

        const slug = c.req.param('slug');
        const { settings } = c.req.valid('json');

        const validation = await validateOwnership(c.env, slug, auth.clientId);
        if (!validation.valid) {
            return c.json({ error: validation.error! }, validation.error === 'Registration not found' ? 404 : 403);
        }
        const registration = validation.registration;

        await backgroundMusicRepo.upsertSettings(c.env, {
            registrationId: registration.id,
            audioUrl: settings.audio_url,
            title: settings.title,
            artist: settings.artist,
            loop: settings.loop,
            registerAsBackgroundAudio: settings.register_as_background_audio,
            isEnabled: settings.is_enabled,
        });

        await invitationCompiler.compileAndCache(c.env, slug);
        return c.json({ success: true, message: 'Background music updated successfully' }, 200);
    }
);

// Theme Routes
router.openapi(
    createRoute({
        method: 'get',
        path: '/{slug}/theme',
        request: { params: SlugParamsSchema },
        responses: {
            200: { content: { 'application/json': { schema: SuccessResponseSchema(ThemeResponseSchema) } }, description: 'Retrieve theme settings' },
            404: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Not found' },
        },
    }),
    async (c) => {
        const slug = c.req.param('slug');
        const registration = await weddingRegistrationRepo.findBySlug(c.env, slug);
        if (!registration) return c.json({ error: 'Registration not found' }, 404);

        const settings = await themeSettingsRepo.getSettings(c.env, registration.id);

        // Map to snake_case
        const mappedSettings = settings ? {
            theme_key: settings.themeKey,
            custom_images: settings.customImages,
            enable_gallery: settings.enableGallery,
            enable_love_story: settings.enableLoveStory,
            enable_wedding_gift: settings.enableWeddingGift,
            enable_wishes: settings.enableWishes,
            enable_closing: settings.enableClosing,
            custom_css: settings.customCss,
        } : null;

        return c.json({ success: true, data: { settings: mappedSettings } }, 200);
    }
);

router.openapi(
    createRoute({
        method: 'post',
        path: '/{slug}/theme',
        request: {
            params: SlugParamsSchema,
            body: { content: { 'application/json': { schema: UpdateThemeBodySchema } } },
        },
        responses: {
            200: { content: { 'application/json': { schema: SuccessResponseSchema(z.object({})) } }, description: 'Update theme settings' },
            401: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Unauthorized' },
            403: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Forbidden' },
            404: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Not found' },
        },
    }),
    async (c) => {
        const auth = await getAuthenticatedClientId(c);
        if (!auth.clientId) {
            return c.json({ error: auth.error || 'Unauthorized' }, 401);
        }

        const slug = c.req.param('slug');
        const { settings } = c.req.valid('json');

        const validation = await validateOwnership(c.env, slug, auth.clientId);
        if (!validation.valid) {
            return c.json({ error: validation.error! }, validation.error === 'Registration not found' ? 404 : 403);
        }
        const registration = validation.registration;

        // Map snake_case input to camelCase
        await themeSettingsRepo.upsertSettings(c.env, {
            registrationId: registration.id,
            themeKey: settings.theme_key,
            customImages: settings.custom_images, // Assuming JSONB structure is compatible or needs mapping? Usually any/any matches.
            enableGallery: settings.enable_gallery,
            enableLoveStory: settings.enable_love_story,
            enableWeddingGift: settings.enable_wedding_gift,
            enableWishes: settings.enable_wishes,
            enableClosing: settings.enable_closing,
            customCss: settings.custom_css,
        });

        await invitationCompiler.compileAndCache(c.env, slug);
        return c.json({ success: true, message: 'Theme updated successfully' }, 200);
    }
);

// Greetings Routes
router.openapi(
    createRoute({
        method: 'get',
        path: '/{slug}/greetings',
        request: { params: SlugParamsSchema },
        responses: {
            200: { content: { 'application/json': { schema: SuccessResponseSchema(GreetingsResponseSchema) } }, description: 'Retrieve greeting sections' },
            404: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Not found' },
        },
    }),
    async (c) => {
        const slug = c.req.param('slug');
        const registration = await weddingRegistrationRepo.findBySlug(c.env, slug);
        if (!registration) return c.json({ error: 'Registration not found' }, 404);

        const greetings = await greetingSectionRepo.findByRegistrationId(c.env, registration.id);

        // Map to snake_case
        const mappedGreetings = greetings?.map(g => ({
            // section_key: g.sectionType, // Removed duplicate
            // We use sectionKey as it aligns with the repository interface
            section_key: g.sectionKey,
            display_order: g.displayOrder,
            title: g.title,
            subtitle: g.subtitle,
            show_bride_name: g.showBrideName,
            show_groom_name: g.showGroomName,
        }));

        return c.json({ success: true, data: { greetings: mappedGreetings } }, 200);
    }
);

router.openapi(
    createRoute({
        method: 'post',
        path: '/{slug}/greetings',
        request: {
            params: SlugParamsSchema,
            body: { content: { 'application/json': { schema: UpdateGreetingsBodySchema } } },
        },
        responses: {
            200: { content: { 'application/json': { schema: SuccessResponseSchema(z.object({})) } }, description: 'Update greeting sections' },
            401: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Unauthorized' },
            403: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Forbidden' },
            404: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Not found' },
        },
    }),
    async (c) => {
        const auth = await getAuthenticatedClientId(c);
        if (!auth.clientId) {
            return c.json({ error: auth.error || 'Unauthorized' }, 401);
        }

        const slug = c.req.param('slug');
        const { greetings } = c.req.valid('json');

        const validation = await validateOwnership(c.env, slug, auth.clientId);
        if (!validation.valid) {
            return c.json({ error: validation.error! }, validation.error === 'Registration not found' ? 404 : 403);
        }
        const registration = validation.registration;

        if (greetings) {
            const existing = await greetingSectionRepo.findByRegistrationId(c.env, registration.id);
            for (const old of existing) {
                await greetingSectionRepo.delete(c.env, old.id);
            }
            for (const greeting of greetings) {
                // Map section_key to section_type
                const sectionTypeMap: Record<string, 'opening_verse' | 'main_greeting' | 'countdown_title'> = {
                    'opening_verse': 'opening_verse',
                    'main_greeting': 'main_greeting',
                    'countdown_title': 'countdown_title',
                };
                // Wait, GreetingSection in DB has sectionKey, NOT sectionType?
                // Step 2542 view_file lines 6-17: `sectionKey: string`.
                // Drizzle Schema (not fully viewed but implied) usually matches column name.
                // In Step 2547 (original file) line 668: `section_type`.
                // This implies original logic used `section_type`?
                // But Drizzle Repo interface `create` method takes `CreateGreetingSectionInput`.
                // Let's assume repo takes `sectionKey`.
                // BUT original code line 670: `section_type`.
                // I should check `greetingSectionRepository.ts` create method args.
                // Assuming `sectionKey` based on interface in Step 2542.
                // If I map to `sectionKey`:

                await greetingSectionRepo.create(c.env, {
                    registrationId: registration.id,
                    sectionKey: greeting.section_key,
                    displayOrder: greeting.display_order,
                    title: greeting.title,
                    subtitle: greeting.subtitle,
                    showBrideName: greeting.show_bride_name,
                    showGroomName: greeting.show_groom_name,
                });
            }
        }
        await invitationCompiler.compileAndCache(c.env, slug);
        return c.json({ success: true, message: 'Greetings updated successfully' }, 200);
    }
);

// Compile Route (POST) - Admin only
router.openapi(
    createRoute({
        method: 'post',
        path: '/{slug}/compile',
        request: { params: SlugParamsSchema },
        responses: {
            200: { content: { 'application/json': { schema: SuccessResponseSchema(z.any()) } }, description: 'Compile invitation data' },
            401: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Unauthorized' },
        },
    }),
    async (c: Context<{ Bindings: Env }>) => {
        const slug = c.req.param('slug');
        const adminSecret = c.env.ADMIN_SECRET;
        const providedSecret = c.req.header('x-admin-secret');

        if (!adminSecret || providedSecret !== adminSecret) {
            return c.json({ error: 'Unauthorized: Admin access required' }, 401);
        }

        const compiled = await invitationCompiler.compileAndCache(c.env, slug);
        return c.json({ success: true, data: compiled, message: 'Invitation compiled successfully' }, 200);
    }
);

// Compile Route (GET) - Public access for frontend with rate limiting
router.get('/:slug/compile', publicRateLimiter.middleware());

router.openapi(
    createRoute({
        method: 'get',
        path: '/{slug}/compile',
        request: { params: SlugParamsSchema },
        responses: {
            200: { content: { 'application/json': { schema: SuccessResponseSchema(z.any()) } }, description: 'Get compiled invitation data' },
            404: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Not found' },
        },
    }),
    async (c) => {
        const slug = c.req.param('slug');
        try {
            // Use fetchFullInvitationContent which checks cache first, then compiles if needed
            const compiled = await fetchFullInvitationContent(c.env, slug);
            return c.json({ success: true, data: compiled }, 200);
        } catch (error) {
            console.error('Error fetching invitation:', error);
            return c.json({ error: 'Invitation not found' }, 404);
        }
    }
);

export default router;
