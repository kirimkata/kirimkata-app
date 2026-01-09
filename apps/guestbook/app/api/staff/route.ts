import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/services/jwt';
import { createStaff, getClientStaff, updateStaff, deleteStaff } from '@/lib/repositories/staffRepository';
import { ClientJWTPayload } from '@/lib/types';

/**
 * Verify client JWT token and check guestbook access
 */
function verifyClientToken(request: NextRequest): ClientJWTPayload | null {
  const authHeader = request.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);

  if (!payload || payload.type !== 'CLIENT' || !(payload as ClientJWTPayload).guestbook_access) {
    return null;
  }

  return payload as ClientJWTPayload;
}

/**
 * GET /api/staff - Get all staff for client
 */
export async function GET(request: NextRequest) {
  try {
    const clientPayload = verifyClientToken(request);
    if (!clientPayload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized atau tidak memiliki akses guestbook' },
        { status: 401 }
      );
    }

    const staff = await getClientStaff(clientPayload.client_id);

    return NextResponse.json({
      success: true,
      data: staff
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/staff - Create new staff
 */
export async function POST(request: NextRequest) {
  try {
    const clientPayload = verifyClientToken(request);
    if (!clientPayload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized atau tidak memiliki akses guestbook' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username, password, full_name, phone, permissions } = body;

    if (!username || !password || !full_name) {
      return NextResponse.json(
        { success: false, error: 'Username, password, dan nama lengkap wajib diisi' },
        { status: 400 }
      );
    }

    if (!permissions || typeof permissions !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Permission staff harus ditentukan' },
        { status: 400 }
      );
    }

    const staff = await createStaff(
      clientPayload.client_id,
      username,
      password,
      full_name,
      phone,
      {
        can_checkin: permissions.can_checkin || false,
        can_redeem_souvenir: permissions.can_redeem_souvenir || false,
        can_redeem_snack: permissions.can_redeem_snack || false,
        can_access_vip_lounge: permissions.can_access_vip_lounge || false,
      },
      'CLIENT'
    );

    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'Gagal membuat staff' },
        { status: 500 }
      );
    }

    // Remove password from response (if exists)
    const { password_encrypted, ...safeStaff } = staff as any;

    return NextResponse.json({
      success: true,
      data: safeStaff,
      message: 'Staff berhasil dibuat'
    });
  } catch (error: any) {
    console.error('Error creating staff:', error);
    
    // Handle quota exceeded error
    if (error.message?.includes('quota exceeded')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Handle duplicate username error
    if (error.message?.includes('Username sudah digunakan')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/staff - Update staff
 */
export async function PUT(request: NextRequest) {
  try {
    const clientPayload = verifyClientToken(request);
    if (!clientPayload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized atau tidak memiliki akses guestbook' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { staff_id, full_name, phone, permissions, is_active } = body;

    if (!staff_id) {
      return NextResponse.json(
        { success: false, error: 'Staff ID wajib diisi' },
        { status: 400 }
      );
    }

    const updates: any = {};
    
    if (full_name !== undefined) updates.full_name = full_name;
    if (phone !== undefined) updates.phone = phone;
    if (is_active !== undefined) updates.is_active = is_active;
    
    if (permissions) {
      if (permissions.can_checkin !== undefined) updates.can_checkin = permissions.can_checkin;
      if (permissions.can_redeem_souvenir !== undefined) updates.can_redeem_souvenir = permissions.can_redeem_souvenir;
      if (permissions.can_redeem_snack !== undefined) updates.can_redeem_snack = permissions.can_redeem_snack;
      if (permissions.can_access_vip_lounge !== undefined) updates.can_access_vip_lounge = permissions.can_access_vip_lounge;
    }

    const staff = await updateStaff(staff_id, updates);

    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'Staff tidak ditemukan atau gagal diupdate' },
        { status: 404 }
      );
    }

    // Remove password from response (if exists)
    const { password_encrypted, ...safeStaff } = staff as any;

    return NextResponse.json({
      success: true,
      data: safeStaff,
      message: 'Staff berhasil diupdate'
    });
  } catch (error) {
    console.error('Error updating staff:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/staff - Delete staff
 */
export async function DELETE(request: NextRequest) {
  try {
    const clientPayload = verifyClientToken(request);
    if (!clientPayload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized atau tidak memiliki akses guestbook' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('id');

    if (!staffId) {
      return NextResponse.json(
        { success: false, error: 'Staff ID wajib diisi' },
        { status: 400 }
      );
    }

    const success = await deleteStaff(staffId);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Staff tidak ditemukan atau gagal dihapus' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Staff berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting staff:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
