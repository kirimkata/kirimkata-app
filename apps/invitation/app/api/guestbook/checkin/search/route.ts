import { NextRequest, NextResponse } from 'next/server';
import { verifyClientToken } from '@/lib/guestbook/services/jwt';
import { getEventByIdWithAccess } from '@/lib/guestbook/repositories/eventRepository';
import { getSupabaseServiceClient } from '@/lib/guestbook/supabase';

/**
 * GET /api/guestbook/checkin/search?event_id=xxx&query=xxx
 * Search guests for check-in
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
    const query = searchParams.get('query');

    if (!eventId || !query) {
      return NextResponse.json(
        { success: false, error: 'Event ID and query required' },
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

    // Search guests by name, phone, or email
    const searchQuery = `%${query.toLowerCase()}%`;
    
    const { data: guests, error } = await supabase
      .from('invitation_guests')
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
