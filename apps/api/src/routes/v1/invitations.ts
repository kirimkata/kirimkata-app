import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
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

const router = new OpenAPIHono<{ Bindings: Env }>();

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
    custom_images: z.record(z.any()).optional(),
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
        const registration = await weddingRegistrationRepo.findBySlug(slug);
        if (!registration) return c.json({ error: 'Registration not found' }, 404);

        const settings = await loveStoryRepo.getSettings(registration.id);
        const blocks = await loveStoryRepo.getBlocks(registration.id);
        return c.json({ success: true, data: { settings, blocks } }, 200);
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
            404: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Not found' },
        },
    }),
    async (c) => {
        const slug = c.req.param('slug');
        const { settings, blocks } = c.req.valid('json');
        const registration = await weddingRegistrationRepo.findBySlug(slug);
        if (!registration) return c.json({ error: 'Registration not found' }, 404);

        if (settings) {
            await loveStoryRepo.upsertSettings({ registration_id: registration.id, ...settings as any });
        }
        if (blocks) {
            await loveStoryRepo.deleteAllBlocks(registration.id);
            for (const block of blocks) {
                await loveStoryRepo.createBlock({
                    registration_id: registration.id,
                    title: block.title,
                    body_text: block.body_text,
                    display_order: block.display_order,
                });
            }
        }
        await invitationCompiler.compileAndCache(slug);
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
        const registration = await weddingRegistrationRepo.findBySlug(slug);
        if (!registration) return c.json({ error: 'Registration not found' }, 404);

        const settings = await galleryRepo.getSettings(registration.id);
        return c.json({ success: true, data: { settings } }, 200);
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
            404: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Not found' },
        },
    }),
    async (c) => {
        const slug = c.req.param('slug');
        const { settings } = c.req.valid('json');
        const registration = await weddingRegistrationRepo.findBySlug(slug);
        if (!registration) return c.json({ error: 'Registration not found' }, 404);

        await galleryRepo.upsertSettings({ registration_id: registration.id, ...settings as any });
        await invitationCompiler.compileAndCache(slug);
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
        const registration = await weddingRegistrationRepo.findBySlug(slug);
        if (!registration) return c.json({ error: 'Registration not found' }, 404);

        const settings = await weddingGiftRepo.getSettings(registration.id);
        const bankAccounts = await weddingGiftRepo.getBankAccounts(registration.id);
        return c.json({ success: true, data: { settings, bankAccounts } }, 200);
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
            404: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Not found' },
        },
    }),
    async (c) => {
        const slug = c.req.param('slug');
        const { settings, bankAccounts } = c.req.valid('json');
        const registration = await weddingRegistrationRepo.findBySlug(slug);
        if (!registration) return c.json({ error: 'Registration not found' }, 404);

        if (settings) {
            await weddingGiftRepo.upsertSettings({ registration_id: registration.id, ...settings as any });
        }
        if (bankAccounts) {
            await weddingGiftRepo.deleteAllBankAccounts(registration.id);
            for (const account of bankAccounts) {
                await weddingGiftRepo.createBankAccount({
                    registration_id: registration.id,
                    bank_name: account.bank_name,
                    account_number: account.account_number,
                    account_holder_name: account.account_holder_name,
                    display_order: account.display_order,
                });
            }
        }
        await invitationCompiler.compileAndCache(slug);
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
        const registration = await weddingRegistrationRepo.findBySlug(slug);
        if (!registration) return c.json({ error: 'Registration not found' }, 404);

        const settings = await closingRepo.getSettings(registration.id);
        return c.json({ success: true, data: { settings } }, 200);
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
            404: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Not found' },
        },
    }),
    async (c) => {
        const slug = c.req.param('slug');
        const { settings } = c.req.valid('json');
        const registration = await weddingRegistrationRepo.findBySlug(slug);
        if (!registration) return c.json({ error: 'Registration not found' }, 404);

        await closingRepo.upsertSettings({ registration_id: registration.id, ...settings as any });
        await invitationCompiler.compileAndCache(slug);
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
        const registration = await weddingRegistrationRepo.findBySlug(slug);
        if (!registration) return c.json({ error: 'Registration not found' }, 404);

        const settings = await backgroundMusicRepo.getSettings(registration.id);
        return c.json({ success: true, data: { settings } }, 200);
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
            404: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Not found' },
        },
    }),
    async (c) => {
        const slug = c.req.param('slug');
        const { settings } = c.req.valid('json');
        const registration = await weddingRegistrationRepo.findBySlug(slug);
        if (!registration) return c.json({ error: 'Registration not found' }, 404);

        await backgroundMusicRepo.upsertSettings({ registration_id: registration.id, ...settings as any });
        await invitationCompiler.compileAndCache(slug);
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
        const registration = await weddingRegistrationRepo.findBySlug(slug);
        if (!registration) return c.json({ error: 'Registration not found' }, 404);

        const settings = await themeSettingsRepo.getSettings(registration.id);
        return c.json({ success: true, data: { settings } }, 200);
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
            404: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Not found' },
        },
    }),
    async (c) => {
        const slug = c.req.param('slug');
        const { settings } = c.req.valid('json');
        const registration = await weddingRegistrationRepo.findBySlug(slug);
        if (!registration) return c.json({ error: 'Registration not found' }, 404);

        await themeSettingsRepo.upsertSettings({ registration_id: registration.id, ...settings as any });
        await invitationCompiler.compileAndCache(slug);
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
        const registration = await weddingRegistrationRepo.findBySlug(slug);
        if (!registration) return c.json({ error: 'Registration not found' }, 404);

        const greetings = await greetingSectionRepo.findByRegistrationId(registration.id);
        return c.json({ success: true, data: { greetings } }, 200);
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
            404: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Not found' },
        },
    }),
    async (c) => {
        const slug = c.req.param('slug');
        const { greetings } = c.req.valid('json');
        const registration = await weddingRegistrationRepo.findBySlug(slug);
        if (!registration) return c.json({ error: 'Registration not found' }, 404);

        if (greetings) {
            const existing = await greetingSectionRepo.findByRegistrationId(registration.id);
            for (const old of existing) {
                await greetingSectionRepo.delete(old.id);
            }
            for (const greeting of greetings) {
                // Map section_key to section_type
                const sectionTypeMap: Record<string, 'opening_verse' | 'main_greeting' | 'countdown_title'> = {
                    'opening_verse': 'opening_verse',
                    'main_greeting': 'main_greeting',
                    'countdown_title': 'countdown_title',
                };
                const section_type = sectionTypeMap[greeting.section_key] || 'main_greeting';

                await greetingSectionRepo.create({
                    registration_id: registration.id,
                    section_type,
                    display_order: greeting.display_order,
                    title: greeting.title,
                    subtitle: greeting.subtitle,
                });
            }
        }
        await invitationCompiler.compileAndCache(slug);
        return c.json({ success: true, message: 'Greetings updated successfully' }, 200);
    }
);

// Compile Route (POST)
router.openapi(
    createRoute({
        method: 'post',
        path: '/{slug}/compile',
        request: { params: SlugParamsSchema },
        responses: {
            200: { content: { 'application/json': { schema: SuccessResponseSchema(z.any()) } }, description: 'Compile invitation data' },
        },
    }),
    async (c) => {
        const slug = c.req.param('slug');
        const compiled = await invitationCompiler.compileAndCache(slug);
        return c.json({ success: true, data: compiled, message: 'Invitation compiled successfully' });
    }
);

// Compile Route (GET) - Public access for frontend
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
            // Use fetchFullInvitationContent to checks cache first, then compiles if needed
            const compiled = await fetchFullInvitationContent(slug);
            return c.json({ success: true, data: compiled }, 200);
        } catch (error) {
            console.error('Error fetching invitation:', error);
            return c.json({ error: 'Invitation not found' }, 404);
        }
    }
);

export default router;
