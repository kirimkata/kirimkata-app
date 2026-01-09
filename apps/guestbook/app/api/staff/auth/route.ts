import { NextRequest, NextResponse } from 'next/server';
import { verifyStaffPin } from '@/lib/repositories/staffRepository';
import { generateStaffToken } from '@/lib/services/jwt';

/**
 * POST /api/staff/auth - Staff login with PIN
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event_id, pin_code } = body;

    if (!event_id || !pin_code) {
      return NextResponse.json(
        { success: false, error: 'Event ID dan PIN code wajib diisi' },
        { status: 400 }
      );
    }

    // Verify staff PIN
    const staff = await verifyStaffPin(event_id, pin_code);

    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'PIN code salah atau staff tidak aktif' },
        { status: 401 }
      );
    }

    // Generate JWT token for staff - need to fetch full staff record with permissions
    // Staff type from old schema doesn't have client_id or permissions
    // This route needs updating to work with guestbook_staff table
    const token = generateStaffToken({
      staff_id: staff.id,
      event_id: staff.event_id,
      client_id: '', // TODO: fetch from event or staff record
      name: staff.name,
      staff_type: staff.staff_type,
      can_checkin: true, // TODO: fetch from staff permissions
      can_redeem_souvenir: false,
      can_redeem_snack: false,
      can_access_vip_lounge: false,
    });

    return NextResponse.json({
      success: true,
      token,
      staff: {
        id: staff.id,
        event_id: staff.event_id,
        name: staff.name,
        staff_type: staff.staff_type,
        is_active: staff.is_active,
      },
    });
  } catch (error) {
    console.error('Staff login error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
