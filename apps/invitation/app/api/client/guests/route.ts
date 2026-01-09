import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

interface Guest {
    id?: string;
    name: string;
    phone: string;
    sent?: boolean;
}

// GET - Fetch all guests for current client
export async function GET(request: NextRequest) {
    try {
        // Get client token from Authorization header
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get client ID from header
        const clientId = request.headers.get('x-client-id');

        if (!clientId) {
            return NextResponse.json(
                { success: false, error: 'Client ID required' },
                { status: 400 }
            );
        }

        const supabase = getSupabaseServiceClient();

        // Fetch guests for this client
        const { data: guests, error } = await supabase
            .from('invitation_guests')
            .select('id, name, phone, sent')
            .eq('client_id', clientId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching guests:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch guests' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            guests: guests || [],
        });
    } catch (error) {
        console.error('Error in GET /api/client/guests:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST - Save all guests for current client
export async function POST(request: NextRequest) {
    try {
        // Get client token from Authorization header
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
        const { guests } = body as { guests: Guest[] };

        if (!Array.isArray(guests)) {
            return NextResponse.json(
                { success: false, error: 'Invalid guests data' },
                { status: 400 }
            );
        }

        const supabase = getSupabaseServiceClient();

        // Delete all existing guests for this client
        const { error: deleteError } = await supabase
            .from('invitation_guests')
            .delete()
            .eq('client_id', clientId);

        if (deleteError) {
            console.error('Error deleting guests:', deleteError);
            return NextResponse.json(
                { success: false, error: 'Failed to delete existing guests' },
                { status: 500 }
            );
        }

        // Insert new guests if any
        if (guests.length > 0) {
            const guestsToInsert = guests.map((guest) => ({
                client_id: clientId,
                name: guest.name,
                phone: guest.phone,
                sent: guest.sent || false,
            }));

            const { data: insertedGuests, error: insertError } = await supabase
                .from('invitation_guests')
                .insert(guestsToInsert)
                .select('id, name, phone, sent');

            if (insertError) {
                console.error('Error inserting guests:', insertError);
                return NextResponse.json(
                    { success: false, error: 'Failed to save guests' },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                message: 'Guests saved successfully',
                guests: insertedGuests || [],
            });
        }

        return NextResponse.json({
            success: true,
            message: 'All guests deleted successfully',
            guests: [],
        });
    } catch (error) {
        console.error('Error in POST /api/client/guests:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
