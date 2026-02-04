import { NextRequest, NextResponse } from 'next/server';
import { weddingRegistrationRepo } from '@/lib/repositories/weddingRegistrationRepository';
import { closingRepo } from '@/lib/repositories/closingRepository';
import { invitationCompiler } from '@/lib/services/invitationCompilerService';

/**
 * GET /api/invitations/[slug]/closing
 * Get closing settings
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

        const settings = await closingRepo.getSettings(registration.id);

        return NextResponse.json({
            success: true,
            data: settings,
        });
    } catch (error: any) {
        console.error('Error getting closing:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/invitations/[slug]/closing
 * Update closing settings
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ slug: string }> }
) {
    const params = await context.params;
    try {
        const body = await request.json();
        const registration = await weddingRegistrationRepo.findBySlug(params.slug);

        if (!registration) {
            return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
        }

        // Save closing settings
        await closingRepo.upsertSettings({
            registration_id: registration.id,
            ...body,
        });

        // Recompile cache
        await invitationCompiler.compileAndCache(params.slug);

        return NextResponse.json({
            success: true,
            message: 'Closing updated successfully',
        });
    } catch (error: any) {
        console.error('Error updating closing:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
