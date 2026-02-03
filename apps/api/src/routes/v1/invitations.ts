import { Hono } from 'hono';
import { getSupabaseClient } from '../../lib/supabase';
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

const router = new Hono<{ Bindings: Env }>();

// ============ LOVE STORY ============

router.get('/:slug/love-story', async (c) => {
    try {
        const slug = c.req.param('slug');
        const registration = await weddingRegistrationRepo.findBySlug(slug);

        if (!registration) {
            return c.json({ error: 'Registration not found' }, 404);
        }

        const settings = await loveStoryRepo.getSettings(registration.id);
        const blocks = await loveStoryRepo.getBlocks(registration.id);

        return c.json({
            success: true,
            data: { settings, blocks }
        });
    } catch (error: any) {
        console.error('Error getting love story:', error);
        return c.json({ error: error.message }, 500);
    }
});

router.post('/:slug/love-story', async (c) => {
    try {
        const slug = c.req.param('slug');
        const body = await c.req.json();
        const { settings, blocks } = body;

        const registration = await weddingRegistrationRepo.findBySlug(slug);
        if (!registration) {
            return c.json({ error: 'Registration not found' }, 404);
        }

        if (settings) {
            await loveStoryRepo.upsertSettings({
                registration_id: registration.id,
                ...settings
            });
        }

        if (blocks && Array.isArray(blocks)) {
            await loveStoryRepo.deleteAllBlocks(registration.id);
            for (const block of blocks) {
                await loveStoryRepo.createBlock({
                    registration_id: registration.id,
                    title: block.title,
                    body_text: block.body_text,
                    display_order: block.display_order
                });
            }
        }

        await invitationCompiler.compileAndCache(slug);

        return c.json({
            success: true,
            message: 'Love story updated successfully'
        });
    } catch (error: any) {
        console.error('Error updating love story:', error);
        return c.json({ error: error.message }, 500);
    }
});

// ============ GALLERY ============

router.get('/:slug/gallery', async (c) => {
    try {
        const slug = c.req.param('slug');
        const registration = await weddingRegistrationRepo.findBySlug(slug);

        if (!registration) {
            return c.json({ error: 'Registration not found' }, 404);
        }

        const settings = await galleryRepo.getSettings(registration.id);

        return c.json({
            success: true,
            data: { settings }
        });
    } catch (error: any) {
        console.error('Error getting gallery:', error);
        return c.json({ error: error.message }, 500);
    }
});

router.post('/:slug/gallery', async (c) => {
    try {
        const slug = c.req.param('slug');
        const body = await c.req.json();
        const { settings } = body;

        const registration = await weddingRegistrationRepo.findBySlug(slug);
        if (!registration) {
            return c.json({ error: 'Registration not found' }, 404);
        }

        if (settings) {
            await galleryRepo.upsertSettings({
                registration_id: registration.id,
                ...settings
            });
        }

        await invitationCompiler.compileAndCache(slug);

        return c.json({
            success: true,
            message: 'Gallery updated successfully'
        });
    } catch (error: any) {
        console.error('Error updating gallery:', error);
        return c.json({ error: error.message }, 500);
    }
});

// ============ WEDDING GIFT ============

router.get('/:slug/wedding-gift', async (c) => {
    try {
        const slug = c.req.param('slug');
        const registration = await weddingRegistrationRepo.findBySlug(slug);

        if (!registration) {
            return c.json({ error: 'Registration not found' }, 404);
        }

        const settings = await weddingGiftRepo.getSettings(registration.id);
        const bankAccounts = await weddingGiftRepo.getBankAccounts(registration.id);

        return c.json({
            success: true,
            data: { settings, bankAccounts }
        });
    } catch (error: any) {
        console.error('Error getting wedding gift:', error);
        return c.json({ error: error.message }, 500);
    }
});

router.post('/:slug/wedding-gift', async (c) => {
    try {
        const slug = c.req.param('slug');
        const body = await c.req.json();
        const { settings, bankAccounts } = body;

        const registration = await weddingRegistrationRepo.findBySlug(slug);
        if (!registration) {
            return c.json({ error: 'Registration not found' }, 404);
        }

        if (settings) {
            await weddingGiftRepo.upsertSettings({
                registration_id: registration.id,
                ...settings
            });
        }

        if (bankAccounts && Array.isArray(bankAccounts)) {
            await weddingGiftRepo.deleteAllBankAccounts(registration.id);
            for (const account of bankAccounts) {
                await weddingGiftRepo.createBankAccount({
                    registration_id: registration.id,
                    bank_name: account.bank_name,
                    account_number: account.account_number,
                    account_holder_name: account.account_holder_name,
                    display_order: account.display_order
                });
            }
        }

        await invitationCompiler.compileAndCache(slug);

        return c.json({
            success: true,
            message: 'Wedding gift updated successfully'
        });
    } catch (error: any) {
        console.error('Error updating wedding gift:', error);
        return c.json({ error: error.message }, 500);
    }
});

// ============ CLOSING ============

router.get('/:slug/closing', async (c) => {
    try {
        const slug = c.req.param('slug');
        const registration = await weddingRegistrationRepo.findBySlug(slug);

        if (!registration) {
            return c.json({ error: 'Registration not found' }, 404);
        }

        const settings = await closingRepo.getSettings(registration.id);

        return c.json({
            success: true,
            data: { settings }
        });
    } catch (error: any) {
        console.error('Error getting closing:', error);
        return c.json({ error: error.message }, 500);
    }
});

router.post('/:slug/closing', async (c) => {
    try {
        const slug = c.req.param('slug');
        const body = await c.req.json();
        const { settings } = body;

        const registration = await weddingRegistrationRepo.findBySlug(slug);
        if (!registration) {
            return c.json({ error: 'Registration not found' }, 404);
        }

        if (settings) {
            await closingRepo.upsertSettings({
                registration_id: registration.id,
                ...settings
            });
        }

        await invitationCompiler.compileAndCache(slug);

        return c.json({
            success: true,
            message: 'Closing updated successfully'
        });
    } catch (error: any) {
        console.error('Error updating closing:', error);
        return c.json({ error: error.message }, 500);
    }
});

// ============ MUSIC ============

router.get('/:slug/music', async (c) => {
    try {
        const slug = c.req.param('slug');
        const registration = await weddingRegistrationRepo.findBySlug(slug);

        if (!registration) {
            return c.json({ error: 'Registration not found' }, 404);
        }

        const settings = await backgroundMusicRepo.getSettings(registration.id);

        return c.json({
            success: true,
            data: { settings }
        });
    } catch (error: any) {
        console.error('Error getting music:', error);
        return c.json({ error: error.message }, 500);
    }
});

router.post('/:slug/music', async (c) => {
    try {
        const slug = c.req.param('slug');
        const body = await c.req.json();
        const { settings } = body;

        const registration = await weddingRegistrationRepo.findBySlug(slug);
        if (!registration) {
            return c.json({ error: 'Registration not found' }, 404);
        }

        if (settings) {
            await backgroundMusicRepo.upsertSettings({
                registration_id: registration.id,
                ...settings
            });
        }

        await invitationCompiler.compileAndCache(slug);

        return c.json({
            success: true,
            message: 'Background music updated successfully'
        });
    } catch (error: any) {
        console.error('Error updating music:', error);
        return c.json({ error: error.message }, 500);
    }
});

// ============ THEME ============

router.get('/:slug/theme', async (c) => {
    try {
        const slug = c.req.param('slug');
        const registration = await weddingRegistrationRepo.findBySlug(slug);

        if (!registration) {
            return c.json({ error: 'Registration not found' }, 404);
        }

        const settings = await themeSettingsRepo.getSettings(registration.id);

        return c.json({
            success: true,
            data: { settings }
        });
    } catch (error: any) {
        console.error('Error getting theme:', error);
        return c.json({ error: error.message }, 500);
    }
});

router.post('/:slug/theme', async (c) => {
    try {
        const slug = c.req.param('slug');
        const body = await c.req.json();
        const { settings } = body;

        const registration = await weddingRegistrationRepo.findBySlug(slug);
        if (!registration) {
            return c.json({ error: 'Registration not found' }, 404);
        }

        if (settings) {
            await themeSettingsRepo.upsertSettings({
                registration_id: registration.id,
                ...settings
            });
        }

        await invitationCompiler.compileAndCache(slug);

        return c.json({
            success: true,
            message: 'Theme updated successfully'
        });
    } catch (error: any) {
        console.error('Error updating theme:', error);
        return c.json({ error: error.message }, 500);
    }
});

// ============ GREETING SECTIONS ============

router.get('/:slug/greetings', async (c) => {
    try {
        const slug = c.req.param('slug');
        const registration = await weddingRegistrationRepo.findBySlug(slug);

        if (!registration) {
            return c.json({ error: 'Registration not found' }, 404);
        }

        const greetings = await greetingSectionRepo.findByRegistrationId(registration.id);

        return c.json({
            success: true,
            data: { greetings }
        });
    } catch (error: any) {
        console.error('Error getting greetings:', error);
        return c.json({ error: error.message }, 500);
    }
});

router.post('/:slug/greetings', async (c) => {
    try {
        const slug = c.req.param('slug');
        const body = await c.req.json();
        const { greetings } = body;

        const registration = await weddingRegistrationRepo.findBySlug(slug);
        if (!registration) {
            return c.json({ error: 'Registration not found' }, 404);
        }

        if (greetings && Array.isArray(greetings)) {
            // Delete all existing and recreate
            for (const greeting of greetings) {
                // Delete old ones for this registration
                const existing = await greetingSectionRepo.findByRegistrationId(registration.id);
                for (const old of existing) {
                    await greetingSectionRepo.delete(old.id);
                }
                // Create new ones
                await greetingSectionRepo.create({
                    registration_id: registration.id,
                    ...greeting
                });
            }
        }

        await invitationCompiler.compileAndCache(slug);

        return c.json({
            success: true,
            message: 'Greetings updated successfully'
        });
    } catch (error: any) {
        console.error('Error updating greetings:', error);
        return c.json({ error: error.message }, 500);
    }
});

// ============ COMPILE ============

router.post('/:slug/compile', async (c) => {
    try {
        const slug = c.req.param('slug');
        const compiled = await invitationCompiler.compileAndCache(slug);

        return c.json({
            success: true,
            data: compiled,
            message: 'Invitation compiled successfully'
        });
    } catch (error: any) {
        console.error('Error compiling invitation:', error);
        return c.json({ error: error.message }, 500);
    }
});

export default router;
