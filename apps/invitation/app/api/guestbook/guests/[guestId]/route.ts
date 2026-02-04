import { NextRequest, NextResponse } from 'next/server';
import { verifyClientToken } from '@/lib/guestbook/services/jwt';
import { getSupabaseServiceClient } from '@/lib/guestbook/supabase';

/**
 * PUT /api/guestbook/guests/[guestId]
 * Update guest
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ guestId: string }> }
) {
  const params = await context.params;
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyClientToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Verify guest exists and belongs to client
    const { data: existingGuest } = await supabase
      .from('invitation_guests')
      .select('client_id')
      .eq('id', params.guestId)
      .single();

    if (!existingGuest || existingGuest.client_id !== payload.client_id) {
      return NextResponse.json(
        { success: false, error: 'Guest not found or access denied' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      guest_name,
      guest_phone,
      guest_email,
      guest_type_id,
      guest_group,
      max_companions,
      seating_config_id
    } = body;

    const updates: any = {};
    if (guest_name !== undefined) updates.guest_name = guest_name;
    if (guest_phone !== undefined) updates.guest_phone = guest_phone || null;
    if (guest_email !== undefined) updates.guest_email = guest_email || null;
    if (guest_type_id !== undefined) updates.guest_type_id = guest_type_id || null;
    if (guest_group !== undefined) updates.guest_group = guest_group || null;
    if (max_companions !== undefined) updates.max_companions = max_companions;
    if (seating_config_id !== undefined) updates.seating_config_id = seating_config_id || null;

    const { data: guest, error } = await supabase
      .from('invitation_guests')
      .update(updates)
      .eq('id', params.guestId)
      .select()
      .single();

    if (error || !guest) {
      console.error('Update guest error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update guest' },
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
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/guestbook/guests/[guestId]
 * Delete guest
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ guestId: string }> }
) {
  const params = await context.params;
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyClientToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Verify guest exists and belongs to client
    const { data: existingGuest } = await supabase
      .from('invitation_guests')
      .select('client_id')
      .eq('id', params.guestId)
      .single();

    if (!existingGuest || existingGuest.client_id !== payload.client_id) {
      return NextResponse.json(
        { success: false, error: 'Guest not found or access denied' },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from('invitation_guests')
      .delete()
      .eq('id', params.guestId);

    if (error) {
      console.error('Delete guest error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete guest' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Guest deleted successfully',
    });
  } catch (error) {
    console.error('Delete guest error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
