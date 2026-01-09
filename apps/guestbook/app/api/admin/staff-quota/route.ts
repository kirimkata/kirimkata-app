import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/services/jwt';
import { getSupabaseServiceClient } from '@/lib/supabase';

/**
 * Verify admin kirimkata token
 * This should check against the existing admin system from invitation project
 */
function verifyAdminToken(request: NextRequest): any | null {
  const authHeader = request.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);

  // Check if this is an admin token from the main invitation system
  // Note: This needs to be integrated with the existing admin auth system
  if (!payload) {
    return null;
  }

  return payload;
}

/**
 * GET /api/admin/staff-quota - Get all clients with their staff quota info
 */
export async function GET(request: NextRequest) {
  try {
    const adminPayload = verifyAdminToken(request);
    if (!adminPayload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - admin access required' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Get all clients with guestbook access and their staff info
    const { data: clients, error } = await supabase
      .from('clients')
      .select(`
        id,
        username,
        email,
        guestbook_access,
        staff_quota,
        staff_quota_used,
        created_at,
        guestbook_staff!inner(
          id,
          username,
          full_name,
          can_checkin,
          can_redeem_souvenir,
          can_redeem_snack,
          can_access_vip_lounge,
          is_active,
          created_at
        )
      `)
      .eq('guestbook_access', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching clients:', error);
      return NextResponse.json(
        { success: false, error: 'Gagal mengambil data client' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: clients || []
    });
  } catch (error) {
    console.error('Error in admin staff quota GET:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/staff-quota - Update client staff quota
 */
export async function PUT(request: NextRequest) {
  try {
    const adminPayload = verifyAdminToken(request);
    if (!adminPayload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { client_id, staff_quota } = body;

    if (!client_id || staff_quota === undefined) {
      return NextResponse.json(
        { success: false, error: 'Client ID dan staff quota wajib diisi' },
        { status: 400 }
      );
    }

    if (staff_quota < 0) {
      return NextResponse.json(
        { success: false, error: 'Staff quota tidak boleh negatif' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Check if client exists and has guestbook access
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, username, staff_quota_used, guestbook_access')
      .eq('id', client_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { success: false, error: 'Client tidak ditemukan' },
        { status: 404 }
      );
    }

    if (!client.guestbook_access) {
      return NextResponse.json(
        { success: false, error: 'Client tidak memiliki akses guestbook' },
        { status: 400 }
      );
    }

    // Check if new quota is less than currently used
    if (staff_quota < client.staff_quota_used) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Staff quota tidak boleh kurang dari yang sudah digunakan (${client.staff_quota_used})` 
        },
        { status: 400 }
      );
    }

    // Update staff quota
    const { data: updatedClient, error: updateError } = await supabase
      .from('clients')
      .update({ staff_quota })
      .eq('id', client_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating staff quota:', updateError);
      return NextResponse.json(
        { success: false, error: 'Gagal mengupdate staff quota' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedClient,
      message: `Staff quota untuk ${client.username} berhasil diupdate menjadi ${staff_quota}`
    });
  } catch (error) {
    console.error('Error in admin staff quota PUT:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/staff-quota - Enable/disable guestbook access for client
 */
export async function POST(request: NextRequest) {
  try {
    const adminPayload = verifyAdminToken(request);
    if (!adminPayload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { client_id, guestbook_access, staff_quota } = body;

    if (!client_id || guestbook_access === undefined) {
      return NextResponse.json(
        { success: false, error: 'Client ID dan guestbook access status wajib diisi' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Check if client exists
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, username')
      .eq('id', client_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { success: false, error: 'Client tidak ditemukan' },
        { status: 404 }
      );
    }

    const updates: any = { guestbook_access };
    
    // Set default staff quota when enabling guestbook access
    if (guestbook_access && staff_quota !== undefined) {
      updates.staff_quota = staff_quota;
    } else if (guestbook_access) {
      updates.staff_quota = 5; // Default quota
    }

    // Update client
    const { data: updatedClient, error: updateError } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', client_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating client guestbook access:', updateError);
      return NextResponse.json(
        { success: false, error: 'Gagal mengupdate akses guestbook' },
        { status: 500 }
      );
    }

    const action = guestbook_access ? 'diaktifkan' : 'dinonaktifkan';
    return NextResponse.json({
      success: true,
      data: updatedClient,
      message: `Akses guestbook untuk ${client.username} berhasil ${action}`
    });
  } catch (error) {
    console.error('Error in admin staff quota POST:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
