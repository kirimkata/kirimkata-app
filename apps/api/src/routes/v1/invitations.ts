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
        // Explicitly cast to match schema if needed, but repo types should align close enough
        // We might need to map some fields if repo returns nulls where optional is expected
        return c.json({ success: true, data: { settings: settings as any, blocks: blocks as any } });
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
        return c.json({ success: true, message: 'Love story updated successfully' });
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
        },
    }),
    async (c) => {
        const slug = c.req.param('slug');
        const registration = await weddingRegistrationRepo.findBySlug(slug);
        if (!registration) return c.json({ error: 'Registration not found' }, 404);

        const settings = await galleryRepo.getSettings(registration.id);
        return c.json({ success: true, data: { settings: settings as any } });
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
        },
    }),
    async (c) => {
        const slug = c.req.param('slug');
        const { settings } = c.req.valid('json');
        const registration = await weddingRegistrationRepo.findBySlug(slug);
        if (!registration) return c.json({ error: 'Registration not found' }, 404);

        await galleryRepo.upsertSettings({ registration_id: registration.id, ...settings as any });
        await invitationCompiler.compileAndCache(slug);
        return c.json({ success: true, message: 'Gallery updated successfully' });
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
        },
    }),
    async (c) => {
        const slug = c.req.param('slug');
        const registration = await weddingRegistrationRepo.findBySlug(slug);
        if (!registration) return c.json({ error: 'Registration not found' }, 404);

        const settings = await weddingGiftRepo.getSettings(registration.id);
        const bankAccounts = await weddingGiftRepo.getBankAccounts(registration.id);
        return c.json({ success: true, data: { settings: settings as any, bankAccounts: bankAccounts as any } });
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
        return c.json({ success: true, message: 'Wedding gift updated successfully' });
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
        },
    }),
    async (c) => {
        const slug = c.req.param('slug');
        const registration = await weddingRegistrationRepo.findBySlug(slug);
        if (!registration) return c.json({ error: 'Registration not found' }, 404);

        const settings = await closingRepo.getSettings(registration.id);
        return c.json({ success: true, data: { settings: settings as any } });
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
        },
    }),
    async (c) => {
        const slug = c.req.param('slug');
        const { settings } = c.req.valid('json');
        const registration = await weddingRegistrationRepo.findBySlug(slug);
        if (!registration) return c.json({ error: 'Registration not found' }, 404);

        await closingRepo.upsertSettings({ registration_id: registration.id, ...settings as any });
        await invitationCompiler.compileAndCache(slug);
        return c.json({ success: true, message: 'Closing updated successfully' });
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
        },
    }),
    async (c) => {
        const slug = c.req.param('slug');
        const registration = await weddingRegistrationRepo.findBySlug(slug);
        if (!registration) return c.json({ error: 'Registration not found' }, 404);

        const settings = await backgroundMusicRepo.getSettings(registration.id);
        return c.json({ success: true, data: { settings: settings as any } });
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
        },
    }),
    async (c) => {
        const slug = c.req.param('slug');
        const { settings } = c.req.valid('json');
        const registration = await weddingRegistrationRepo.findBySlug(slug);
        if (!registration) return c.json({ error: 'Registration not found' }, 404);

        await backgroundMusicRepo.upsertSettings({ registration_id: registration.id, ...settings as any });
        await invitationCompiler.compileAndCache(slug);
        return c.json({ success: true, message: 'Background music updated successfully' });
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
        },
    }),
    async (c) => {
        const slug = c.req.param('slug');
        const registration = await weddingRegistrationRepo.findBySlug(slug);
        if (!registration) return c.json({ error: 'Registration not found' }, 404);

        const settings = await themeSettingsRepo.getSettings(registration.id);
        return c.json({ success: true, data: { settings: settings as any } });
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
        },
    }),
    async (c) => {
        const slug = c.req.param('slug');
        const { settings } = c.req.valid('json');
        const registration = await weddingRegistrationRepo.findBySlug(slug);
        if (!registration) return c.json({ error: 'Registration not found' }, 404);

        await themeSettingsRepo.upsertSettings({ registration_id: registration.id, ...settings as any });
        await invitationCompiler.compileAndCache(slug);
        return c.json({ success: true, message: 'Theme updated successfully' });
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
        },
    }),
    async (c) => {
        const slug = c.req.param('slug');
        const registration = await weddingRegistrationRepo.findBySlug(slug);
        if (!registration) return c.json({ error: 'Registration not found' }, 404);

        const greetings = await greetingSectionRepo.findByRegistrationId(registration.id);
        return c.json({ success: true, data: { greetings: greetings as any } });
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
                await greetingSectionRepo.create({ registration_id: registration.id, ...greeting });
            }
        }
        await invitationCompiler.compileAndCache(slug);
        return c.json({ success: true, message: 'Greetings updated successfully' });
    }
);

// Compile Route
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

export default router;
