import { NextRequest, NextResponse } from 'next/server';
import { verifyClientToken } from '@/lib/guestbook/services/jwt';
import { generateQRToken } from '@/lib/guestbook/services/jwt';
import { getSupabaseServiceClient } from '@/lib/guestbook/supabase';

/**
 * POST /api/guestbook/guests/[guestId]/generate-qr
 * Generate QR code token for guest
 */
export async function POST(
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
      .select('client_id, event_id, guest_name')
      .eq('id', params.guestId)
      .single();

    if (!existingGuest || existingGuest.client_id !== payload.client_id) {
      return NextResponse.json(
        { success: false, error: 'Guest not found or access denied' },
        { status: 404 }
      );
    }

    // Generate QR token
    const qrToken = generateQRToken({
      guest_id: params.guestId,
      event_id: existingGuest.event_id,
      guest_name: existingGuest.guest_name,
    });

    // Update guest with QR token
    const { data: guest, error } = await supabase
      .from('invitation_guests')
      .update({ qr_token: qrToken })
      .eq('id', params.guestId)
      .select()
      .single();

    if (error || !guest) {
      console.error('Generate QR error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to generate QR code' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: guest,
      qr_token: qrToken,
    });
  } catch (error) {
    console.error('Generate QR error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
