import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/services/jwt';
import { getSupabaseServiceClient } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

/**
 * GET /api/client/invitation-content
 * Get invitation content for the authenticated client
 */
export async function GET(request: NextRequest) {
    try {
        // Verify client token
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);
        console.log('Verifying token for invitation-content:', token.substring(0, 20) + '...');
        const decoded = verifyToken(token);
        console.log('Decoded token:', decoded);

        if (!decoded || decoded.type !== 'client') {
            return NextResponse.json(
                { success: false, error: 'Invalid token' },
                { status: 401 }
            );
        }

        const supabase = getSupabaseServiceClient();

        // Get client's slug
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('slug')
            .eq('id', decoded.userId)
            .single();

        if (clientError || !client || !client.slug) {
            return NextResponse.json(
                { success: false, error: 'Client has no assigned invitation' },
                { status: 404 }
            );
        }

        // Get invitation content by slug
        const { data: content, error: contentError } = await supabase
            .from('invitation_contents')
            .select('*')
            .eq('slug', client.slug)
            .single();

        if (contentError || !content) {
            return NextResponse.json(
                { success: false, error: 'Invitation content not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            content: {
                slug: content.slug,
                bride: content.bride,
                groom: content.groom,
                event: content.event,
                eventDetails: content.event_details,
                loveStory: content.love_story,
                gallery: content.gallery,
                weddingGift: content.wedding_gift,
                closing: content.closing,
                musicSettings: content.music_settings,
                profile: content.profile,
            },
        });

    } catch (error) {
        console.error('Error in GET invitation-content:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/client/invitation-content
 * Update invitation content for the authenticated client
 */
export async function PUT(request: NextRequest) {
    try {
        // Verify client token
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);

        if (!decoded || decoded.type !== 'client') {
            return NextResponse.json(
                { success: false, error: 'Invalid token' },
                { status: 401 }
            );
        }

        const supabase = getSupabaseServiceClient();

        // Get client's slug
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('slug')
            .eq('id', decoded.userId)
            .single();

        if (clientError || !client || !client.slug) {
            return NextResponse.json(
                { success: false, error: 'Client has no assigned invitation' },
                { status: 404 }
            );
        }

        // Parse request body
        const body = await request.json();

        // Build update object (only update provided fields)
        const updateData: any = {
            updated_at: new Date().toISOString(),
        };

        if (body.bride) {
            updateData.bride = body.bride;
        }
        if (body.groom) {
            updateData.groom = body.groom;
        }

        // Handle event data - map to both event and event_cloud for compatibility
        if (body.event) {
            updateData.event = {
                fullDateLabel: body.event.fullDateLabel,
                isoDate: body.event.isoDate,
                countdownDateTime: body.event.countdownDateTime,
                eventTitle: `The Wedding of ${body.bride?.name || ''} & ${body.groom?.name || ''}`.trim(),
            };

            // Also update event_details for backward compatibility (or forward?)
            updateData.event_details = {
                holyMatrimony: body.event.holyMatrimony || {},
                reception: body.event.reception || {},
            };
        }


        if (body.eventDetails) {
            updateData.event_details = body.eventDetails;
        }
        if (body.loveStory) {
            updateData.love_story = body.loveStory;
        }
        if (body.gallery) {
            updateData.gallery = body.gallery;
        }
        if (body.weddingGift) {
            updateData.wedding_gift = body.weddingGift;
        }
        if (body.musicSettings) {
            updateData.music_settings = body.musicSettings;
        }
        if (body.closing) {
            updateData.closing = body.closing;
        }
        if (body.profile) {
            updateData.profile = body.profile;
        }

        // Update invitation content
        const { data, error } = await supabase
            .from('invitation_contents')
            .update(updateData)
            .eq('slug', client.slug)
            .select()
            .single();

        if (error) {
            console.error('Error updating invitation content:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to update invitation content' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Invitation content updated successfully',
            content: data,
        });

    } catch (error) {
        console.error('Error in PUT invitation-content:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
