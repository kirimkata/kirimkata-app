import { NextRequest, NextResponse } from 'next/server';
import { verifyClientToken } from '@/lib/guestbook/services/jwt';
import { getEventByIdWithAccess } from '@/lib/guestbook/repositories/eventRepository';
import { getEventSeatingConfigs } from '@/lib/guestbook/repositories/seatingConfigRepository';
import { getSupabaseServiceClient } from '@/lib/guestbook/supabase';

/**
 * POST /api/guestbook/seating/auto-assign
 * Auto-assign guests to available seats
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
    const { event_id } = body;

    if (!event_id) {
      return NextResponse.json(
        { success: false, error: 'Event ID required' },
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

    // Get all seating configs
    const seatingConfigs = await getEventSeatingConfigs(event_id);
    
    if (seatingConfigs.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No seating configurations found' },
        { status: 400 }
      );
    }

    // Get unassigned guests
    const { data: guests, error: guestsError } = await supabase
      .from('invitation_guests')
      .select('id, guest_type_id, guest_name')
      .eq('event_id', event_id)
      .is('seating_config_id', null)
      .order('created_at', { ascending: true });

    if (guestsError || !guests) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch guests' },
        { status: 500 }
      );
    }

    if (guests.length === 0) {
      return NextResponse.json({
        success: true,
        data: { assigned_count: 0, message: 'No unassigned guests found' },
      });
    }

    // Build seating availability map
    const seatAvailability = new Map<string, number>();
    for (const config of seatingConfigs) {
      // Get current assignments for this seat
      const { count } = await supabase
        .from('invitation_guests')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event_id)
        .eq('seating_config_id', config.id);

      const available = config.capacity - (count || 0);
      if (available > 0) {
        seatAvailability.set(config.id, available);
      }
    }

    // Auto-assign algorithm
    let assignedCount = 0;
    const updates = [];

    for (const guest of guests) {
      let assigned = false;

      // Try to find a suitable seat
      for (const config of seatingConfigs) {
        const available = seatAvailability.get(config.id);
        
        if (!available || available <= 0) continue;

        // Check guest type restrictions
        if (config.allowed_guest_type_ids.length > 0) {
          if (!guest.guest_type_id || !config.allowed_guest_type_ids.includes(guest.guest_type_id)) {
            continue;
          }
        }

        // Assign guest to this seat
        updates.push({
          id: guest.id,
          seating_config_id: config.id,
        });

        // Update availability
        seatAvailability.set(config.id, available - 1);
        assignedCount++;
        assigned = true;
        break;
      }

      if (!assigned) {
        // No suitable seat found for this guest
        console.log(`No suitable seat found for guest: ${guest.guest_name}`);
      }
    }

    // Perform batch update
    if (updates.length > 0) {
      for (const update of updates) {
        await supabase
          .from('invitation_guests')
          .update({ seating_config_id: update.seating_config_id })
          .eq('id', update.id);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        assigned_count: assignedCount,
        total_guests: guests.length,
        message: `Successfully assigned ${assignedCount} out of ${guests.length} guests`,
      },
    });
  } catch (error) {
    console.error('Auto-assign error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
