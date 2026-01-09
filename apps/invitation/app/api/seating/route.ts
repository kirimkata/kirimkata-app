import { NextRequest, NextResponse } from 'next/server';
import { verifyClientToken } from '@/lib/guestbook/services/jwt';
import { getEventSeating, getSeatingStats, updateGuestSeating } from '@/lib/guestbook/repositories/seatingRepository';

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

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');
    const statsOnly = searchParams.get('stats') === 'true';

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Event ID wajib diisi' },
        { status: 400 }
      );
    }

    if (statsOnly) {
      const stats = await getSeatingStats(eventId);
      return NextResponse.json({
        success: true,
        data: stats,
      });
    }

    const seating = await getEventSeating(eventId);
    return NextResponse.json({
      success: true,
      data: seating,
    });
  } catch (error) {
    console.error('Get seating error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const { guest_id, table_number, seating_area } = body;

    if (!guest_id) {
      return NextResponse.json(
        { success: false, error: 'Guest ID wajib diisi' },
        { status: 400 }
      );
    }

    const success = await updateGuestSeating(
      guest_id,
      table_number || null,
      seating_area || null
    );

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Gagal update seating' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Seating berhasil diupdate',
    });
  } catch (error) {
    console.error('Update seating error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
