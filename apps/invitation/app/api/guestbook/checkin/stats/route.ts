import { NextRequest, NextResponse } from 'next/server';
import { verifyClientToken } from '@/lib/guestbook/services/jwt';
import { getEventByIdWithAccess } from '@/lib/guestbook/repositories/eventRepository';
import { getSupabaseServiceClient } from '@/lib/guestbook/supabase';

/**
 * GET /api/guestbook/checkin/stats?event_id=xxx
 * Get check-in statistics for an event
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

    // Get total guests
    const { count: totalGuests } = await supabase
      .from('invitation_guests')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);

    // Get checked in guests
    const { count: checkedIn } = await supabase
      .from('invitation_guests')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('is_checked_in', true);

    const total = totalGuests || 0;
    const checked = checkedIn || 0;
    const notCheckedIn = total - checked;
    const checkInRate = total > 0 ? Math.round((checked / total) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        total_guests: total,
        checked_in: checked,
        not_checked_in: notCheckedIn,
        check_in_rate: checkInRate,
      },
    });
  } catch (error) {
    console.error('Get check-in stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
