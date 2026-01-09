import { NextRequest, NextResponse } from 'next/server';
import { verifyClientToken } from '@/lib/guestbook/services/jwt';
import { getEventGuests, createGuest, updateGuest, deleteGuest } from '@/lib/guestbook/repositories/guestRepository';

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

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Event ID wajib diisi' },
        { status: 400 }
      );
    }

    const guests = await getEventGuests(eventId);

    return NextResponse.json({
      success: true,
      data: guests,
    });
  } catch (error) {
    console.error('Get guests error:', error);
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
    const { event_id, ...guestData } = body;

    if (!event_id || !guestData.guest_name) {
      return NextResponse.json(
        { success: false, error: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    const guest = await createGuest(event_id, guestData);

    if (!guest) {
      return NextResponse.json(
        { success: false, error: 'Gagal membuat guest' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: guest,
    });
  } catch (error) {
    console.error('Create guest error:', error);
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
    const { guest_id, ...updates } = body;

    if (!guest_id) {
      return NextResponse.json(
        { success: false, error: 'Guest ID wajib diisi' },
        { status: 400 }
      );
    }

    const guest = await updateGuest(guest_id, updates);

    if (!guest) {
      return NextResponse.json(
        { success: false, error: 'Gagal update guest' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: guest,
    });
  } catch (error) {
    console.error('Update guest error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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
    const guestId = searchParams.get('guest_id');

    if (!guestId) {
      return NextResponse.json(
        { success: false, error: 'Guest ID wajib diisi' },
        { status: 400 }
      );
    }

    const success = await deleteGuest(guestId);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Gagal hapus guest' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Guest berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete guest error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
