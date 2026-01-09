import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

// Default template when DB value is null
const DEFAULT_TEMPLATE = `Halo {nama},

Kami mengundang Anda untuk hadir di acara spesial kami.

Silakan buka undangan di:
{link}

Terima kasih!`;

// GET - Fetch message template for current client
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

        const { data: client, error } = await supabase
            .from('clients')
            .select('message_template')
            .eq('id', clientId)
            .single();

        if (error) {
            console.error('Error fetching template:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch template' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            template: client?.message_template || DEFAULT_TEMPLATE,
        });
    } catch (error) {
        console.error('Error in GET /api/client/template:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST - Save message template for current client
export async function POST(request: NextRequest) {
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
        const { template } = body as { template: string };

        if (typeof template !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Invalid template data' },
                { status: 400 }
            );
        }

        const supabase = getSupabaseServiceClient();

        const { error } = await supabase
            .from('clients')
            .update({ message_template: template })
            .eq('id', clientId);

        if (error) {
            console.error('Error saving template:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to save template' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Template saved successfully',
        });
    } catch (error) {
        console.error('Error in POST /api/client/template:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
