import { NextRequest, NextResponse } from 'next/server';
import { verifyClientToken } from '@/lib/guestbook/services/jwt';
import { getEventByIdWithAccess } from '@/lib/guestbook/repositories/eventRepository';
import { getSupabaseServiceClient } from '@/lib/guestbook/supabase';

/**
 * GET /api/guestbook/guests?event_id=xxx
 * Get all guests for an event
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyClientToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Event ID required' },
        { status: 400 }
      );
    }

    // Verify access
    const event = await getEventByIdWithAccess(eventId, payload.client_id);
    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found or access denied' },
        { status: 404 }
      );
    }

    const supabase = getSupabaseServiceClient();

    const { data: guests, error } = await supabase
      .from('invitation_guests')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get guests error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch guests' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: guests || [],
    });
  } catch (error) {
    console.error('Get guests error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/guestbook/guests
 * Create new guest
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyClientToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      event_id,
      guest_name,
      guest_phone,
      guest_email,
      guest_type_id,
      guest_group,
      max_companions,
      seating_config_id,
      source
    } = body;

    if (!event_id || !guest_name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify access
    const event = await getEventByIdWithAccess(event_id, payload.client_id);
    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found or access denied' },
        { status: 404 }
      );
    }

    const supabase = getSupabaseServiceClient();

    const insertData: any = {
      client_id: payload.client_id,
      event_id,
      guest_name,
      guest_phone: guest_phone || null,
      guest_email: guest_email || null,
      guest_type_id: guest_type_id || null,
      guest_group: guest_group || null,
      max_companions: max_companions || 0,
      actual_companions: 0,
      seating_config_id: seating_config_id || null,
      source: source || 'manual',
      is_checked_in: false,
      invitation_sent: false,
    };

    const { data: guest, error } = await supabase
      .from('invitation_guests')
      .insert(insertData)
      .select()
      .single();

    if (error || !guest) {
      console.error('Create guest error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create guest' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: guest,
    });
  } catch (error) {
    console.error('Create guest error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
