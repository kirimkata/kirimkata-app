import { NextRequest, NextResponse } from 'next/server';
import { verifyStaffToken, extractTokenFromHeader } from '@/lib/services/jwt';
import { getSupabaseServiceClient } from '@/lib/supabase';

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

    const supabase = getSupabaseServiceClient();

    // Get guest statistics
    const { data: guestStats, error: guestError } = await supabase
      .from('guests')
      .select('category, id')
      .eq('is_active', true);

    if (guestError) {
      console.error('Error fetching guest stats:', guestError);
      return NextResponse.json(
        { success: false, error: 'Gagal mengambil statistik tamu' },
        { status: 500 }
      );
    }

    // Get check-in statistics
    const { data: checkinStats, error: checkinError } = await supabase
      .from('checkins')
      .select('guest_id, checked_in_at, guest:guests(category)')
      .order('checked_in_at', { ascending: false });

    if (checkinError) {
      console.error('Error fetching check-in stats:', checkinError);
      return NextResponse.json(
        { success: false, error: 'Gagal mengambil statistik check-in' },
        { status: 500 }
      );
    }

    // Get redemption statistics
    const { data: redemptionStats, error: redemptionError } = await supabase
      .from('redemptions')
      .select('entitlement_type, quantity, redeemed_at')
      .order('redeemed_at', { ascending: false });

    if (redemptionError) {
      console.error('Error fetching redemption stats:', redemptionError);
      return NextResponse.json(
        { success: false, error: 'Gagal mengambil statistik redemption' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const totalGuests = guestStats?.length || 0;
    const regularGuests = guestStats?.filter((g: any) => g.category === 'REGULAR').length || 0;
    const vipGuests = guestStats?.filter((g: any) => g.category === 'VIP').length || 0;
    const vvipGuests = guestStats?.filter((g: any) => g.category === 'VVIP').length || 0;
    const checkedInGuests = checkinStats?.length || 0;

    // Calculate redemption stats
    const souvenirRedemptions = redemptionStats?.filter((r: any) => r.entitlement_type === 'SOUVENIR')
      .reduce((sum: number, r: any) => sum + r.quantity, 0) || 0;
    const snackRedemptions = redemptionStats?.filter((r: any) => r.entitlement_type === 'SNACK')
      .reduce((sum: number, r: any) => sum + r.quantity, 0) || 0;
    const vipLoungeAccess = redemptionStats?.filter((r: any) => r.entitlement_type === 'VIP_LOUNGE').length || 0;

    // Get recent check-ins (last 10)
    const recentCheckins = checkinStats?.slice(0, 10).map((checkin: any) => ({
      id: checkin.guest_id,
      checked_in_at: checkin.checked_in_at,
      guest_category: checkin.guest?.category || 'REGULAR'
    })) || [];

    // Calculate hourly check-in trend (last 24 hours)
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const hourlyCheckins = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date(last24Hours.getTime() + i * 60 * 60 * 1000);
      const nextHour = new Date(hour.getTime() + 60 * 60 * 1000);
      
      const count = checkinStats?.filter((c: any) => {
        const checkinTime = new Date(c.checked_in_at);
        return checkinTime >= hour && checkinTime < nextHour;
      }).length || 0;

      return {
        hour: hour.getHours(),
        count
      };
    });

    const stats = {
      total_guests: totalGuests,
      checked_in_guests: checkedInGuests,
      regular_guests: regularGuests,
      vip_guests: vipGuests,
      vvip_guests: vvipGuests,
      souvenirs_redeemed: souvenirRedemptions,
      snacks_redeemed: snackRedemptions,
      vip_lounge_access: vipLoungeAccess,
      recent_checkins: recentCheckins,
      hourly_trend: hourlyCheckins,
      check_in_rate: totalGuests > 0 ? Math.round((checkedInGuests / totalGuests) * 100) : 0,
      last_updated: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
