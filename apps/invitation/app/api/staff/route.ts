import { NextRequest, NextResponse } from 'next/server';
import { verifyClientToken } from '@/lib/guestbook/services/jwt';
import { getEventStaff, createStaff, updateStaff, deleteStaff } from '@/lib/guestbook/repositories/staffRepository';

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

    const staff = await getEventStaff(eventId);

    return NextResponse.json({
      success: true,
      data: staff,
    });
  } catch (error) {
    console.error('Get staff error:', error);
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
    const { event_id, username, password, full_name, phone, permissions } = body;

    if (!event_id || !username || !password || !full_name) {
      return NextResponse.json(
        { success: false, error: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    const staff = await createStaff(
      event_id,
      username,
      password,
      full_name,
      phone || null,
      permissions || {}
    );

    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'Gagal membuat staff' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: staff,
    });
  } catch (error: any) {
    console.error('Create staff error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan server' },
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
    const { staff_id, ...updates } = body;

    if (!staff_id) {
      return NextResponse.json(
        { success: false, error: 'Staff ID wajib diisi' },
        { status: 400 }
      );
    }

    const staff = await updateStaff(staff_id, updates);

    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'Gagal update staff' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: staff,
    });
  } catch (error) {
    console.error('Update staff error:', error);
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
    const staffId = searchParams.get('staff_id');

    if (!staffId) {
      return NextResponse.json(
        { success: false, error: 'Staff ID wajib diisi' },
        { status: 400 }
      );
    }

    const success = await deleteStaff(staffId);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Gagal hapus staff' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Staff berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete staff error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
