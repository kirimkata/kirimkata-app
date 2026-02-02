import { NextRequest, NextResponse } from 'next/server';
import { weddingRegistrationRepo } from '@/lib/repositories/weddingRegistrationRepository';
import { themeSettingsRepo } from '@/lib/repositories/themeSettingsRepository';
import { invitationCompiler } from '@/lib/services/invitationCompilerService';

/**
 * GET /api/invitations/[slug]/theme
 * Get theme settings
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

        const settings = await themeSettingsRepo.getSettings(registration.id);

        return NextResponse.json({
            success: true,
            data: settings,
        });
    } catch (error: any) {
        console.error('Error getting theme settings:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/invitations/[slug]/theme
 * Update theme settings
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

        // Save theme settings
        await themeSettingsRepo.upsertSettings({
            registration_id: registration.id,
            ...body,
        });

        // Recompile cache
        await invitationCompiler.compileAndCache(params.slug);

        return NextResponse.json({
            success: true,
            message: 'Theme settings updated successfully',
        });
    } catch (error: any) {
        console.error('Error updating theme settings:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * PATCH /api/invitations/[slug]/theme/toggle-feature
 * Toggle specific feature on/off
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        const body = await request.json();
        const { feature, enabled } = body;

        const registration = await weddingRegistrationRepo.findBySlug(params.slug);
        if (!registration) {
            return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
        }

        // Toggle feature
        await themeSettingsRepo.toggleFeature(registration.id, feature, enabled);

        // Recompile cache
        await invitationCompiler.compileAndCache(params.slug);

        return NextResponse.json({
            success: true,
            message: `Feature ${feature} ${enabled ? 'enabled' : 'disabled'}`,
        });
    } catch (error: any) {
        console.error('Error toggling feature:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
