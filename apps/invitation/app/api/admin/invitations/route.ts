import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabaseClient';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

interface InvitationPayload {
    slug: string;
    themeKey: string;
    clientProfile: {
        slug: string;
        coupleNames: string;
        weddingDateLabel: string;
    };
    bride: any;
    groom: any;
    event: any;
    loveStory: any;
    gallery: any;
    weddingGift: any;
    backgroundMusic: any;
    closing: any;
}

export async function POST(request: NextRequest) {
    try {
        // Verify admin token
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);
        try {
            jwt.verify(token, JWT_SECRET);
        } catch (error) {
            return NextResponse.json(
                { success: false, error: 'Invalid token' },
                { status: 401 }
            );
        }

        const payload: InvitationPayload = await request.json();

        // Validate required fields
        if (!payload.slug || !payload.themeKey) {
            return NextResponse.json(
                { success: false, error: 'Slug and theme are required' },
                { status: 400 }
            );
        }

        const supabase = getSupabaseServiceClient();

        // Check if slug already exists
        const { data: existing } = await supabase
            .from('invitation_contents')
            .select('slug')
            .eq('slug', payload.slug)
            .single();

        if (existing) {
            return NextResponse.json(
                { success: false, error: `Slug "${payload.slug}" sudah digunakan` },
                { status: 400 }
            );
        }

        // Prepare eventCloud from event data
        const eventCloud = {
            holyMatrimony: payload.event.holyMatrimony,
            reception: payload.event.reception,
            streaming: {
                description: '',
                url: '',
                buttonLabel: 'Watch Live',
            },
        };

        // Insert new invitation
        const { data, error } = await supabase
            .from('invitation_contents')
            .insert({
                slug: payload.slug,
                theme_key: payload.themeKey,
                client_profile: payload.clientProfile,
                bride: payload.bride,
                groom: payload.groom,
                event: {
                    fullDateLabel: payload.event.fullDateLabel,
                    isoDate: payload.event.isoDate,
                    countdownDateTime: payload.event.countdownDateTime,
                },
                clouds: {}, // Empty for now, can be filled later
                event_cloud: eventCloud,
                love_story: payload.loveStory,
                gallery: payload.gallery,
                wedding_gift: payload.weddingGift,
                background_music: payload.backgroundMusic,
                closing: payload.closing,
            })
            .select()
            .single();

        if (error) {
            console.error('Error inserting invitation:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to create invitation: ' + error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                slug: data.slug,
                themeKey: data.theme_key,
            },
        });
    } catch (error: any) {
        console.error('Error in POST /api/admin/invitations:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
