import { NextRequest, NextResponse } from 'next/server';
import { verifyClientToken } from '@/lib/guestbook/services/jwt';
import { bulkCreateSeatingConfigs } from '@/lib/guestbook/repositories/seatingConfigRepository';
import { getEventByIdWithAccess } from '@/lib/guestbook/repositories/eventRepository';

/**
 * POST /api/guestbook/seating/bulk
 * Bulk create seating configurations
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
    const { event_id, configs } = body;

    if (!event_id || !configs || !Array.isArray(configs)) {
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

    const createdConfigs = await bulkCreateSeatingConfigs(event_id, configs);

    if (!createdConfigs || createdConfigs.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to create seating configs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: createdConfigs,
      message: `Successfully created ${createdConfigs.length} seating configurations`,
    });
  } catch (error) {
    console.error('Bulk create seating configs error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
