import { NextRequest, NextResponse } from 'next/server';
import { weddingRegistrationRepo } from '@/lib/repositories/weddingRegistrationRepository';
import { loveStoryRepo } from '@/lib/repositories/loveStoryRepository';
import { invitationCompiler } from '@/lib/services/invitationCompilerService';

/**
 * GET /api/invitations/[slug]/love-story
 * Get love story settings and blocks
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ slug: string }> }
) {
    const params = await context.params;
    try {
        const registration = await weddingRegistrationRepo.findBySlug(params.slug);
        if (!registration) {
            return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
        }

        const settings = await loveStoryRepo.getSettings(registration.id);
        const blocks = await loveStoryRepo.getBlocks(registration.id);

        return NextResponse.json({
            success: true,
            data: {
                settings,
                blocks,
            },
        });
    } catch (error: any) {
        console.error('Error getting love story:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/invitations/[slug]/love-story
 * Update love story settings and blocks
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ slug: string }> }
) {
    const params = await context.params;
    try {
        const body = await request.json();
        const { settings, blocks } = body;

        const registration = await weddingRegistrationRepo.findBySlug(params.slug);
        if (!registration) {
            return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
        }

        // Save settings
        if (settings) {
            await loveStoryRepo.upsertSettings({
                registration_id: registration.id,
                ...settings,
            });
        }

        // Save blocks
        if (blocks && Array.isArray(blocks)) {
            // Delete existing blocks and create new ones
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

        // Recompile cache
        await invitationCompiler.compileAndCache(params.slug);

        return NextResponse.json({
            success: true,
            message: 'Love story updated successfully',
        });
    } catch (error: any) {
        console.error('Error updating love story:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
