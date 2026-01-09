import { NextRequest, NextResponse } from 'next/server';
import { verifyStaffToken } from '@/lib';
import { getSupabaseServiceClient } from '@/lib/supabase';

/**
 * GET /api/checkin/search?event_id=xxx&query=xxx
 * Search guests for check-in with STAFF authentication
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
    const payload = verifyStaffToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');
    const query = searchParams.get('query');

    if (!eventId || !query) {
      return NextResponse.json(
        { success: false, error: 'Event ID and query required' },
        { status: 400 }
      );
    }

    // Verify event_id matches staff token
    if (eventId !== payload.event_id) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this event' },
        { status: 403 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Search guests by name, phone, or email
    const searchQuery = `%${query.toLowerCase()}%`;
    
    const { data: guests, error } = await supabase
      .from('event_guests')
      .select('*')
      .eq('event_id', eventId)
      .or(`guest_name.ilike.${searchQuery},guest_phone.ilike.${searchQuery},guest_email.ilike.${searchQuery}`)
      .order('is_checked_in', { ascending: true })
      .order('guest_name', { ascending: true })
      .limit(20);

    if (error) {
      console.error('Search error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to search guests' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: guests || [],
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
