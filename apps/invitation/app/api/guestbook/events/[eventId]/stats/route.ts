import { NextRequest, NextResponse } from 'next/server';
import { verifyClientToken } from '@/lib/guestbook/services/jwt';
import { getEventByIdWithAccess } from '@/lib/guestbook/repositories/eventRepository';
import { getSupabaseServiceClient } from '@/lib/guestbook/supabase';

/**
 * GET /api/guestbook/events/[eventId]/stats
 * Get event statistics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
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

    // Verify access
    const event = await getEventByIdWithAccess(params.eventId, payload.client_id);
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
      .eq('event_id', params.eventId);

    // Get checked in guests
    const { count: checkedIn } = await supabase
      .from('invitation_guests')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', params.eventId)
      .eq('is_checked_in', true);

    // Get invitations sent
    const { count: invitationsSent } = await supabase
      .from('invitation_guests')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', params.eventId)
      .eq('invitation_sent', true);

    // Get seats assigned
    const { count: seatsAssigned } = await supabase
      .from('invitation_guests')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', params.eventId)
      .not('seating_config_id', 'is', null);

    // Get guest types breakdown
    const { data: guestTypes } = await supabase
      .from('guest_types')
      .select('id, type_name, display_name')
      .eq('event_id', params.eventId);

    const guestTypesBreakdown: Record<string, number> = {};

    if (guestTypes) {
      for (const guestType of guestTypes) {
        const { count } = await supabase
          .from('invitation_guests')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', params.eventId)
          .eq('guest_type_id', guestType.id);

        guestTypesBreakdown[guestType.display_name] = count || 0;
      }
    }

    const stats = {
      total_guests: totalGuests || 0,
      checked_in: checkedIn || 0,
      invitations_sent: invitationsSent || 0,
      seats_assigned: seatsAssigned || 0,
      guest_types_breakdown: guestTypesBreakdown,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get event stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
