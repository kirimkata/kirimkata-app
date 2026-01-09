import { NextRequest, NextResponse } from 'next/server';
import { verifyClientToken } from '@/lib/guestbook/services/jwt';
import { getEventSeatingConfigs, createSeatingConfig } from '@/lib/guestbook/repositories/seatingConfigRepository';
import { getEventByIdWithAccess } from '@/lib/guestbook/repositories/eventRepository';

/**
 * GET /api/guestbook/seating?event_id=xxx
 * Get all seating configurations for an event
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

    const configs = await getEventSeatingConfigs(eventId);

    return NextResponse.json({
      success: true,
      data: configs,
    });
  } catch (error) {
    console.error('Get seating configs error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/guestbook/seating
 * Create new seating configuration
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
    const { event_id, seating_type, name, capacity, allowed_guest_type_ids } = body;

    if (!event_id || !seating_type || !name || !capacity) {
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

    const config = await createSeatingConfig(event_id, {
      seating_type,
      name,
      capacity,
      allowed_guest_type_ids: allowed_guest_type_ids || [],
    });

    if (!config) {
      return NextResponse.json(
        { success: false, error: 'Failed to create seating config' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Create seating config error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
