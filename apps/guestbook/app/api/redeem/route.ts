import { NextRequest, NextResponse } from 'next/server';
import { verifyStaffToken, extractTokenFromHeader } from '@/lib/services/jwt';
import { getGuestById } from '@/lib/repositories/guestRepository';
import { getSupabaseServiceClient } from '@/lib/supabase';
// EntitlementType removed - using string literals for redemption types

export async function POST(request: NextRequest) {
  try {
    // Verify staff authentication
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token tidak ditemukan' },
        { status: 401 }
      );
    }

    const staffPayload = verifyStaffToken(token);
    if (!staffPayload) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { guest_id, entitlement_type, quantity = 1, notes } = body;

    if (!guest_id || !entitlement_type) {
      return NextResponse.json(
        { success: false, error: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    // Validate entitlement type based on staff permissions
    const allowedTypes: string[] = [];
    if (staffPayload.can_redeem_souvenir) allowedTypes.push('SOUVENIR');
    if (staffPayload.can_redeem_snack) allowedTypes.push('SNACK');
    if (staffPayload.can_access_vip_lounge) allowedTypes.push('VIP_LOUNGE');

    if (!allowedTypes.includes(entitlement_type)) {
      return NextResponse.json(
        { success: false, error: 'Tidak memiliki akses untuk jenis entitlement ini' },
        { status: 403 }
      );
    }

    // Get guest details
    const guest = await getGuestById(guest_id);
    if (!guest) {
      return NextResponse.json(
        { success: false, error: 'Tamu tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if guest is checked in
    if (!guest.is_checked_in) {
      return NextResponse.json(
        { success: false, error: 'Tamu belum melakukan check-in' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Check entitlement
    const { data: entitlement, error: entitlementError } = await supabase
      .from('entitlements')
      .select('*')
      .eq('guest_id', guest_id)
      .eq('entitlement_type', entitlement_type)
      .single();

    if (entitlementError || !entitlement) {
      return NextResponse.json(
        { success: false, error: 'Tamu tidak memiliki hak untuk item ini' },
        { status: 400 }
      );
    }

    if (!entitlement.is_entitled) {
      return NextResponse.json(
        { success: false, error: 'Entitlement tidak aktif' },
        { status: 400 }
      );
    }

    // Check existing redemptions
    const { data: existingRedemptions, error: redemptionError } = await supabase
      .from('redemptions')
      .select('quantity')
      .eq('guest_id', guest_id)
      .eq('entitlement_type', entitlement_type);

    if (redemptionError) {
      console.error('Error checking redemptions:', redemptionError);
      return NextResponse.json(
        { success: false, error: 'Gagal memeriksa riwayat redemption' },
        { status: 500 }
      );
    }

    const totalRedeemed = existingRedemptions?.reduce((sum, r) => sum + r.quantity, 0) || 0;
    const remainingQuantity = entitlement.max_quantity - totalRedeemed;

    if (quantity > remainingQuantity) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Kuota tidak mencukupi. Tersisa: ${remainingQuantity}, diminta: ${quantity}` 
        },
        { status: 400 }
      );
    }

    // Get device and location info
    const userAgent = request.headers.get('user-agent');
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwarded?.split(',')[0] || realIp || 'unknown';

    // Set audit context
    await supabase.rpc('set_config', {
      parameter: 'app.current_staff_id',
      value: staffPayload.staff_id
    });
    await supabase.rpc('set_config', {
      parameter: 'app.client_ip',
      value: clientIp
    });

    // Create redemption record
    const { data: redemption, error: createError } = await supabase
      .from('redemptions')
      .insert({
        guest_id,
        staff_id: staffPayload.staff_id,
        entitlement_type,
        quantity,
        notes
      })
      .select(`
        *,
        guest:guests(*),
        staff:staff(full_name, role)
      `)
      .single();

    if (createError) {
      console.error('Error creating redemption:', createError);
      return NextResponse.json(
        { success: false, error: 'Gagal melakukan redemption' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Redemption berhasil',
      data: {
        redemption,
        remaining_quantity: remainingQuantity - quantity
      }
    });

  } catch (error) {
    console.error('Redemption error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// Get redemption history
export async function GET(request: NextRequest) {
  try {
    // Verify staff authentication
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token tidak ditemukan' },
        { status: 401 }
      );
    }

    const staffPayload = verifyStaffToken(token);
    if (!staffPayload) {
      return NextResponse.json(
        { success: false, error: 'Token tidak valid' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const guestId = searchParams.get('guest_id');
    const entitlementType = searchParams.get('entitlement_type');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = getSupabaseServiceClient();
    
    let query = supabase
      .from('redemptions')
      .select(`
        *,
        guest:guests(guest_code, name, category),
        staff:staff(full_name, role)
      `)
      .order('redeemed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (guestId) {
      query = query.eq('guest_id', guestId);
    }

    if (entitlementType) {
      query = query.eq('entitlement_type', entitlementType);
    }

    // Filter by staff permissions
    const allowedRedemptionTypes: string[] = [];
    if (staffPayload.can_redeem_souvenir) allowedRedemptionTypes.push('SOUVENIR');
    if (staffPayload.can_redeem_snack) allowedRedemptionTypes.push('SNACK');
    if (staffPayload.can_access_vip_lounge) allowedRedemptionTypes.push('VIP_LOUNGE');
    
    if (allowedRedemptionTypes.length > 0) {
      query = query.in('entitlement_type', allowedRedemptionTypes);
    }

    const { data: redemptions, error } = await query;

    if (error) {
      console.error('Error fetching redemptions:', error);
      return NextResponse.json(
        { success: false, error: 'Gagal mengambil data redemption' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: redemptions || []
    });

  } catch (error) {
    console.error('Error fetching redemptions:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
