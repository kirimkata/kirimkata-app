import { NextRequest, NextResponse } from 'next/server';
import { weddingRegistrationRepo } from '@/lib/repositories/weddingRegistrationRepository';
import { backgroundMusicRepo } from '@/lib/repositories/backgroundMusicRepository';
import { invitationCompiler } from '@/lib/services/invitationCompilerService';

/**
 * GET /api/invitations/[slug]/music
 * Get background music settings
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        const registration = await weddingRegistrationRepo.findBySlug(params.slug);
        if (!registration) {
            return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
        }

        const settings = await backgroundMusicRepo.getSettings(registration.id);

        return NextResponse.json({
            success: true,
            data: settings,
        });
    } catch (error: any) {
        console.error('Error getting background music:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/invitations/[slug]/music
 * Update background music settings
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        const body = await request.json();
        const registration = await weddingRegistrationRepo.findBySlug(params.slug);

        if (!registration) {
            return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
        }

        // Save music settings
        await backgroundMusicRepo.upsertSettings({
            registration_id: registration.id,
            ...body,
        });

        // Recompile cache
        await invitationCompiler.compileAndCache(params.slug);

        return NextResponse.json({
            success: true,
            message: 'Background music updated successfully',
        });
    } catch (error: any) {
        console.error('Error updating background music:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
