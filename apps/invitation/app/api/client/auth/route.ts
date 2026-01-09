import { NextRequest, NextResponse } from 'next/server';
import { findClientByUsername, verifyClientCredentials } from '@/lib/repositories/clientRepository';
import { generateClientToken } from '@/lib/guestbook/services/jwt';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json(
                { error: 'Username and password are required' },
                { status: 400 }
            );
        }

        // Verify credentials
        const client = await verifyClientCredentials(username, password);

        if (!client) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Generate JWT token with guestbook format
        const token = generateClientToken({
            client_id: client.id,
            username: client.username,
            email: client.email,
            slug: client.slug,
            guestbook_access: client.guestbook_access ?? true,
        });

        // Fetch theme_key from invitation_contents if client has a slug
        let theme_key = null;
        if (client.slug) {
            const { getSupabaseServiceClient } = await import('@/lib/supabaseClient');
            const supabase = getSupabaseServiceClient();
            const { data: invitation } = await supabase
                .from('invitation_contents')
                .select('theme_key')
                .eq('slug', client.slug)
                .single();
            theme_key = invitation?.theme_key || null;
        }

        return NextResponse.json({
            success: true,
            token,
            client: {
                id: client.id,
                username: client.username,
                email: client.email,
                slug: client.slug,
                guestbook_access: client.guestbook_access ?? false,
                theme_key: theme_key,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
