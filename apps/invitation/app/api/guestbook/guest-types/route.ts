import { NextRequest, NextResponse } from 'next/server';
import { verifyClientToken } from '@/lib/guestbook/services/jwt';
import { getEventGuestTypes, createGuestType } from '@/lib/guestbook/repositories/guestTypeRepository';
import { getEventByIdWithAccess } from '@/lib/guestbook/repositories/eventRepository';

/**
 * GET /api/guestbook/guest-types?event_id=xxx
 * Get all guest types for an event
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

    const guestTypes = await getEventGuestTypes(eventId);

    return NextResponse.json({
      success: true,
      data: guestTypes,
    });
  } catch (error) {
    console.error('Get guest types error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/guestbook/guest-types
 * Create new guest type
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
    const { event_id, type_name, display_name, color_code } = body;

    if (!event_id || !type_name || !display_name || !color_code) {
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

    // Get current guest types to determine priority order
    const existingTypes = await getEventGuestTypes(event_id);
    const maxPriority = existingTypes.reduce((max, type) => Math.max(max, type.priority_order), 0);

    const guestType = await createGuestType(payload.client_id, event_id, {
      type_name,
      display_name,
      color_code,
      priority_order: maxPriority + 1,
    });

    if (!guestType) {
      return NextResponse.json(
        { success: false, error: 'Failed to create guest type' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: guestType,
    });
  } catch (error) {
    console.error('Create guest type error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
