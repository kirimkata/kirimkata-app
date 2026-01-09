import { NextRequest, NextResponse } from 'next/server';
import { verifyClientToken } from '@/lib/guestbook/services/jwt';
import { getEventByIdWithAccess } from '@/lib/guestbook/repositories/eventRepository';
import { getSupabaseServiceClient } from '@/lib/guestbook/supabase';

/**
 * GET /api/guestbook/reports/stats?event_id=xxx
 * Get comprehensive report statistics for an event
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

    // Get breakdown by guest type
    const { data: guestTypes } = await supabase
      .from('guest_types')
      .select('id, type_name, display_name, color_code')
      .eq('event_id', eventId)
      .order('priority_order', { ascending: true });

    const byGuestType = [];
    for (const type of guestTypes || []) {
      const { count: typeTotal } = await supabase
        .from('invitation_guests')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('guest_type_id', type.id);

      const { count: typeCheckedIn } = await supabase
        .from('invitation_guests')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('guest_type_id', type.id)
        .eq('is_checked_in', true);

      byGuestType.push({
        type_name: type.type_name,
        display_name: type.display_name,
        color_code: type.color_code,
        total: typeTotal || 0,
        checked_in: typeCheckedIn || 0,
      });
    }

    // Get seating utilization
    const { data: seatingConfigs } = await supabase
      .from('event_seating_config')
      .select('id, name, capacity')
      .eq('event_id', eventId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    const bySeating = [];
    for (const config of seatingConfigs || []) {
      const { count: assigned } = await supabase
        .from('invitation_guests')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('seating_config_id', config.id);

      bySeating.push({
        seating_name: config.name,
        capacity: config.capacity,
        assigned: assigned || 0,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        total_guests: total,
        checked_in: checked,
        not_checked_in: notCheckedIn,
        check_in_rate: checkInRate,
        by_guest_type: byGuestType,
        by_seating: bySeating,
        hourly_checkins: [], // Placeholder for future implementation
      },
    });
  } catch (error) {
    console.error('Get report stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
