import { NextRequest, NextResponse } from 'next/server';
import { getClientEvents, createEvent } from '@/lib/repositories/eventRepository';
import { verifyClientToken } from '@/lib/services/jwt';

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
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
