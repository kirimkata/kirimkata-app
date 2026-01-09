import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabaseClient';
import type { CustomImages } from '@/lib/repositories/clientRepository';

export const dynamic = 'force-dynamic';

// GET - Fetch custom images for current client's invitation
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const clientId = request.headers.get('x-client-id');

        if (!clientId) {
            return NextResponse.json(
                { success: false, error: 'Client ID required' },
                { status: 400 }
            );
        }

        const supabase = getSupabaseServiceClient();

        // Get client's slug first
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('slug')
            .eq('id', clientId)
            .single();

        if (clientError || !client?.slug) {
            return NextResponse.json(
                { success: false, error: 'Client slug not found' },
                { status: 404 }
            );
        }

        // Get invitation content with custom_images and theme_key
        const { data: invitation, error } = await supabase
            .from('invitation_contents')
            .select('custom_images, theme_key')
            .eq('slug', client.slug)
            .single();

        // If no invitation found or error, return empty data (not an error)
        if (error || !invitation) {
            console.warn('No invitation content found for slug:', client.slug);
            return NextResponse.json({
                success: true,
                custom_images: null,
                theme_key: null,
                message: 'Belum ada data undangan',
            });
        }

        return NextResponse.json({
            success: true,
            custom_images: invitation.custom_images || null,
            theme_key: invitation.theme_key || null,
        });
    } catch (error) {
        console.error('Error in GET /api/client/custom-images:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT - Update custom images for current client's invitation
export async function PUT(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const clientId = request.headers.get('x-client-id');

        if (!clientId) {
            return NextResponse.json(
                { success: false, error: 'Client ID required' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { custom_images } = body as { custom_images: CustomImages };

        if (!custom_images || typeof custom_images !== 'object') {
            return NextResponse.json(
                { success: false, error: 'Invalid custom images data' },
                { status: 400 }
            );
        }

        const supabase = getSupabaseServiceClient();

        // Get client's slug first
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('slug')
            .eq('id', clientId)
            .single();

        if (clientError || !client?.slug) {
            return NextResponse.json(
                { success: false, error: 'Client slug not found' },
                { status: 404 }
            );
        }

        // Update invitation_contents with custom_images
        const { error } = await supabase
            .from('invitation_contents')
            .update({ custom_images })
            .eq('slug', client.slug);

        if (error) {
            console.error('Error saving custom images:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to save custom images' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Custom images saved successfully',
            custom_images,
        });
    } catch (error) {
        console.error('Error in PUT /api/client/custom-images:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
