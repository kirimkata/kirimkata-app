import { Hono } from 'hono';
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
import { clientAuthMiddleware } from '../../middleware/auth';

const router = new Hono<{ Bindings: Env; Variables: { clientId: string } }>();

/**
 * Helper function to validate ownership
 * Checks if the authenticated client owns the wedding registration for the given slug
 */
async function validateOwnership(slug: string, clientId: string): Promise<{ valid: boolean; error?: string; registration?: any }> {
    const registration = await weddingRegistrationRepo.findBySlug(slug);

    if (!registration) {
        return { valid: false, error: 'Registration not found' };
    }

    if (registration.client_id !== clientId) {
        return { valid: false, error: 'Unauthorized access to this invitation' };
    }

    return { valid: true, registration };
}

// ============ ROUTES ============

// Love Story Routes
router.get('/:slug/love-story', async (c) => {
    const slug = c.req.param('slug');
    const registration = await weddingRegistrationRepo.findBySlug(slug);
    if (!registration) return c.json({ error: 'Registration not found' }, 404);

    const settings = await loveStoryRepo.getSettings(registration.id);
    const blocks = await loveStoryRepo.getBlocks(registration.id);
    return c.json({ success: true, data: { settings, blocks } });
});

router.post('/:slug/love-story', clientAuthMiddleware, async (c) => {
    const slug = c.req.param('slug');
    const clientId = c.get('clientId') as string;

    // Ownership validation
    const ownershipCheck = await validateOwnership(slug, clientId);
    if (!ownershipCheck.valid) {
        return c.json({ error: ownershipCheck.error }, 403);
    }

    const body = await c.req.json();
    const { settings, blocks } = body;
    const registration = ownershipCheck.registration;

    if (settings) {
        await loveStoryRepo.upsertSettings({ registration_id: registration.id, ...settings });
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
});

// Gallery Routes
router.get('/:slug/gallery', async (c) => {
    const slug = c.req.param('slug');
    const registration = await weddingRegistrationRepo.findBySlug(slug);
    if (!registration) return c.json({ error: 'Registration not found' }, 404);

    const settings = await galleryRepo.getSettings(registration.id);
    return c.json({ success: true, data: { settings } });
});

router.post('/:slug/gallery', clientAuthMiddleware, async (c) => {
    const slug = c.req.param('slug');
    const clientId = c.get('clientId') as string;

    const ownershipCheck = await validateOwnership(slug, clientId);
    if (!ownershipCheck.valid) {
        return c.json({ error: ownershipCheck.error }, 403);
    }

    const body = await c.req.json();
    const { settings } = body;
    const registration = ownershipCheck.registration;

    await galleryRepo.upsertSettings({ registration_id: registration.id, ...settings });
    await invitationCompiler.compileAndCache(slug);
    return c.json({ success: true, message: 'Gallery updated successfully' });
});

// Wedding Gift Routes
router.get('/:slug/wedding-gift', async (c) => {
    const slug = c.req.param('slug');
    const registration = await weddingRegistrationRepo.findBySlug(slug);
    if (!registration) return c.json({ error: 'Registration not found' }, 404);

    const settings = await weddingGiftRepo.getSettings(registration.id);
    const bankAccounts = await weddingGiftRepo.getBankAccounts(registration.id);
    return c.json({ success: true, data: { settings, bankAccounts } });
});

router.post('/:slug/wedding-gift', clientAuthMiddleware, async (c) => {
    const slug = c.req.param('slug');
    const clientId = c.get('clientId') as string;

    const ownershipCheck = await validateOwnership(slug, clientId);
    if (!ownershipCheck.valid) {
        return c.json({ error: ownershipCheck.error }, 403);
    }

    const body = await c.req.json();
    const { settings, bankAccounts } = body;
    const registration = ownershipCheck.registration;

    if (settings) {
        await weddingGiftRepo.upsertSettings({ registration_id: registration.id, ...settings });
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
});

// Closing Routes
router.get('/:slug/closing', async (c) => {
    const slug = c.req.param('slug');
    const registration = await weddingRegistrationRepo.findBySlug(slug);
    if (!registration) return c.json({ error: 'Registration not found' }, 404);

    const settings = await closingRepo.getSettings(registration.id);
    return c.json({ success: true, data: { settings } });
});

router.post('/:slug/closing', clientAuthMiddleware, async (c) => {
    const slug = c.req.param('slug');
    const clientId = c.get('clientId') as string;

    const ownershipCheck = await validateOwnership(slug, clientId);
    if (!ownershipCheck.valid) {
        return c.json({ error: ownershipCheck.error }, 403);
    }

    const body = await c.req.json();
    const { settings } = body;
    const registration = ownershipCheck.registration;

    await closingRepo.upsertSettings({ registration_id: registration.id, ...settings });
    await invitationCompiler.compileAndCache(slug);
    return c.json({ success: true, message: 'Closing updated successfully' });
});

// Music Routes
router.get('/:slug/music', async (c) => {
    const slug = c.req.param('slug');
    const registration = await weddingRegistrationRepo.findBySlug(slug);
    if (!registration) return c.json({ error: 'Registration not found' }, 404);

    const settings = await backgroundMusicRepo.getSettings(registration.id);
    return c.json({ success: true, data: { settings } });
});

router.post('/:slug/music', clientAuthMiddleware, async (c) => {
    const slug = c.req.param('slug');
    const clientId = c.get('clientId') as string;

    const ownershipCheck = await validateOwnership(slug, clientId);
    if (!ownershipCheck.valid) {
        return c.json({ error: ownershipCheck.error }, 403);
    }

    const body = await c.req.json();
    const { settings } = body;
    const registration = ownershipCheck.registration;

    await backgroundMusicRepo.upsertSettings({ registration_id: registration.id, ...settings });
    await invitationCompiler.compileAndCache(slug);
    return c.json({ success: true, message: 'Background music updated successfully' });
});

// Theme Routes
router.get('/:slug/theme', async (c) => {
    const slug = c.req.param('slug');
    const registration = await weddingRegistrationRepo.findBySlug(slug);
    if (!registration) return c.json({ error: 'Registration not found' }, 404);

    const settings = await themeSettingsRepo.getSettings(registration.id);
    return c.json({ success: true, data: { settings } });
});

router.post('/:slug/theme', clientAuthMiddleware, async (c) => {
    const slug = c.req.param('slug');
    const clientId = c.get('clientId') as string;

    const ownershipCheck = await validateOwnership(slug, clientId);
    if (!ownershipCheck.valid) {
        return c.json({ error: ownershipCheck.error }, 403);
    }

    const body = await c.req.json();
    const { settings } = body;
    const registration = ownershipCheck.registration;

    await themeSettingsRepo.upsertSettings({ registration_id: registration.id, ...settings });
    await invitationCompiler.compileAndCache(slug);
    return c.json({ success: true, message: 'Theme updated successfully' });
});

// Greetings Routes
router.get('/:slug/greetings', async (c) => {
    const slug = c.req.param('slug');
    const registration = await weddingRegistrationRepo.findBySlug(slug);
    if (!registration) return c.json({ error: 'Registration not found' }, 404);

    const greetings = await greetingSectionRepo.findByRegistrationId(registration.id);
    return c.json({ success: true, data: { greetings } });
});

router.post('/:slug/greetings', clientAuthMiddleware, async (c) => {
    const slug = c.req.param('slug');
    const clientId = c.get('clientId') as string;

    const ownershipCheck = await validateOwnership(slug, clientId);
    if (!ownershipCheck.valid) {
        return c.json({ error: ownershipCheck.error }, 403);
    }

    const body = await c.req.json();
    const { greetings } = body;
    const registration = ownershipCheck.registration;

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
});

// Compile Route
router.post('/:slug/compile', clientAuthMiddleware, async (c) => {
    const slug = c.req.param('slug');
    const clientId = c.get('clientId') as string;

    const ownershipCheck = await validateOwnership(slug, clientId);
    if (!ownershipCheck.valid) {
        return c.json({ error: ownershipCheck.error }, 403);
    }

    const compiled = await invitationCompiler.compileAndCache(slug);
    return c.json({ success: true, data: compiled, message: 'Invitation compiled successfully' });
});

export default router;
