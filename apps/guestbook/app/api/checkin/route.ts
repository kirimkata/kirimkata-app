import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, verifyQRToken, extractTokenFromHeader } from '@/lib/services/jwt';
import { getGuestByQRToken, searchGuests, isGuestCheckedIn, getGuestById, searchGuestsByNameWithGroup } from '@/lib/repositories/guestRepository';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { CheckinMethod, JWTPayload, ClientJWTPayload, StaffJWTPayload, EventGuest } from '@/lib/types';


/**
 * Verify authentication (client or staff) and check checkin permission
 */
function verifyCheckinAuth(request: NextRequest): { payload: JWTPayload; clientId: string; staffId?: string } | null {
  const authHeader = request.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);

  if (!payload) {
    return null;
  }

  if (payload.type === 'CLIENT') {
    const clientPayload = payload as ClientJWTPayload;
    if (!clientPayload.guestbook_access) {
      return null;
    }
    return { payload, clientId: clientPayload.client_id };
  } else if (payload.type === 'STAFF') {
    const staffPayload = payload as StaffJWTPayload;
    if (!staffPayload.can_checkin) {
      return null;
    }
    return { payload, clientId: staffPayload.client_id, staffId: staffPayload.staff_id };
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication and checkin permission
    const authResult = verifyCheckinAuth(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - tidak memiliki akses check-in' },
        { status: 401 }
      );
    }

    const { clientId, staffId } = authResult;

    const body = await request.json();
    const { guest_id, qr_token, method, notes } = body;

    let guest = null;

    // Handle different check-in methods
    if (method === 'QR_SCAN' && qr_token) {
      // QR token is now just the guest ID - direct lookup
      guest = await getGuestByQRToken(qr_token);

      if (!guest) {
        return NextResponse.json(
          { success: false, error: 'Tamu tidak ditemukan atau QR Code tidak valid' },
          { status: 404 }
        );
      }

      // EventGuest doesn't have client_id - verification done by event_id in repository
    } else if (method === 'MANUAL_SEARCH') {
      const { guest_name, guest_group } = body;
      
      if (!guest_id && !guest_name) {
        return NextResponse.json(
          { success: false, error: 'Guest ID atau nama tamu wajib diisi untuk pencarian manual' },
          { status: 400 }
        );
      }

      if (guest_id) {
        guest = await getGuestById(guest_id);
      } else if (guest_name) {
        const searchResults = await searchGuestsByNameWithGroup(clientId, guest_name, guest_group);
        if (searchResults.length === 0) {
          return NextResponse.json(
            { success: false, error: 'Tamu tidak ditemukan' },
            { status: 404 }
          );
        }
        if (searchResults.length > 1) {
          // Return multiple results for user to choose
          return NextResponse.json(
            { 
              success: false, 
              error: 'Ditemukan lebih dari 1 tamu dengan nama tersebut. Silakan pilih berdasarkan grup:', 
              data: searchResults.map((g) => ({
                id: g.id,
                guest_name: (g as any).guest_name || (g as any).name,
                guest_phone: (g as any).guest_phone || (g as any).phone
              }))
            },
            { status: 400 }
          );
        }
        guest = searchResults[0];
      }
      
      if (!guest) {
        return NextResponse.json(
          { success: false, error: 'Tamu tidak ditemukan' },
          { status: 404 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Method check-in tidak valid' },
        { status: 400 }
      );
    }

    // Check if guest belongs to the same event (EventGuest doesn't have client_id directly)
    // This check is handled by repository layer filtering

    // Check if guest is already checked in
    const alreadyCheckedIn = await isGuestCheckedIn(guest.id);
    if (alreadyCheckedIn) {
      return NextResponse.json(
        { success: false, error: 'Tamu sudah melakukan check-in sebelumnya' },
        { status: 409 }
      );
    }

    // Get device and location info
    const userAgent = request.headers.get('user-agent');
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwarded?.split(',')[0] || realIp || 'unknown';

    const deviceInfo = {
      user_agent: userAgent,
      ip_address: clientIp,
      timestamp: new Date().toISOString()
    };

    // Perform check-in
    const supabase = getSupabaseServiceClient();
    
    // Set audit context
    if (staffId) {
      await supabase.rpc('set_config', {
        parameter: 'app.current_staff_id',
        value: staffId
      });
    }
    await supabase.rpc('set_config', {
      parameter: 'app.client_ip',
      value: clientIp
    });

    const { data: checkinData, error: checkinError } = await supabase
      .from('guestbook_checkins')
      .insert({
        guest_id: guest.id,
        client_id: clientId,
        staff_id: staffId || null,
        check_in_method: method as CheckinMethod,
        device_info: deviceInfo,
        notes
      })
      .select()
      .single();

    if (checkinError) {
      console.error('Check-in error:', checkinError);
      return NextResponse.json(
        { success: false, error: 'Gagal melakukan check-in' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Check-in berhasil',
      data: {
        checkin: checkinData,
        guest: {
          ...guest,
          is_checked_in: true,
          checkin_time: checkinData.checked_in_at
        }
      }
    });

  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// Get recent check-ins for this client
export async function GET(request: NextRequest) {
  try {
    // Verify authentication and checkin permission
    const authResult = verifyCheckinAuth(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - tidak memiliki akses check-in' },
        { status: 401 }
      );
    }

    const { clientId } = authResult;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = getSupabaseServiceClient();
    
    // Get recent check-ins for this client
    const { data: checkins, error } = await supabase
      .from('guestbook_checkins')
      .select(`
        *,
        invitation_guests:guest_id(*),
        guestbook_staff:staff_id(*)
      `)
      .eq('client_id', clientId)
      .order('checked_in_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching check-ins:', error);
      return NextResponse.json(
        { success: false, error: 'Gagal mengambil data check-in' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: checkins || []
    });

  } catch (error) {
    console.error('Error fetching check-ins:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
