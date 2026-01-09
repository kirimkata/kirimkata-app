import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { comparePassword } from '@/lib';
import { generateStaffToken } from '@/lib';

/**
 * POST /api/auth/login
 * Staff login for guestbook operator app
 */
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Find staff by username
    const { data: staff, error: staffError } = await supabase
      .from('guestbook_staff')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single();

    if (staffError || !staff) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await comparePassword(password, staff.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate STAFF JWT token
    const token = generateStaffToken({
      staff_id: staff.id,
      event_id: staff.event_id,
      client_id: staff.client_id,
      name: staff.full_name,
      staff_type: staff.staff_type,
      can_checkin: staff.can_checkin || true,
      can_redeem_souvenir: staff.can_redeem_souvenir || false,
      can_redeem_snack: staff.can_redeem_snack || false,
      can_access_vip_lounge: staff.can_access_vip_lounge || false,
    });

    return NextResponse.json({
      success: true,
      token,
      staff: {
        id: staff.id,
        username: staff.username,
        full_name: staff.full_name,
        event_id: staff.event_id,
        staff_type: staff.staff_type,
        permissions: staff.permissions || {},
      },
    });
  } catch (error) {
    console.error('Staff login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
