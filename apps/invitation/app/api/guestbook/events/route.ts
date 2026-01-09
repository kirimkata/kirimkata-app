import { NextRequest, NextResponse } from 'next/server';
import { getClientEvents, createEvent, createEventWithModules } from '@/lib/guestbook/repositories/eventRepository';
import { verifyClientToken } from '@/lib/guestbook/services/jwt';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Token tidak valid' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyClientToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Token tidak valid' },
        { status: 401 }
      );
    }

    const events = await getClientEvents(payload.client_id);

    return NextResponse.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error('Get events error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Token tidak valid' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyClientToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Token tidak valid' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Check if this is a new wizard-based creation (with modules)
    if (body.has_invitation !== undefined || body.has_guestbook !== undefined) {
      // New wizard format
      const {
        name,
        event_date,
        event_time,
        location,
        venue_address,
        timezone,
        has_invitation,
        has_guestbook,
        invitation_config,
        guestbook_config,
        seating_mode,
      } = body;

      // Validation
      if (!name || !event_date) {
        return NextResponse.json(
          { success: false, error: 'Nama dan tanggal event wajib diisi' },
          { status: 400 }
        );
      }

      if (!has_invitation && !has_guestbook) {
        return NextResponse.json(
          { success: false, error: 'Pilih minimal 1 modul' },
          { status: 400 }
        );
      }

      const event = await createEventWithModules(payload.client_id, {
        name,
        event_date,
        event_time,
        location,
        venue_address,
        timezone,
        has_invitation,
        has_guestbook,
        invitation_config,
        guestbook_config,
        seating_mode,
      });

      if (!event) {
        return NextResponse.json(
          { success: false, error: 'Gagal membuat event' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: event,
      });
    } else {
      // Legacy format (backward compatibility)
      const { name, event_date, location, options } = body;

      if (!name) {
        return NextResponse.json(
          { success: false, error: 'Nama event wajib diisi' },
          { status: 400 }
        );
      }

      const event = await createEvent(
        payload.client_id,
        name,
        event_date,
        location,
        options
      );

      if (!event) {
        return NextResponse.json(
          { success: false, error: 'Gagal membuat event' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: event,
      });
    }
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
