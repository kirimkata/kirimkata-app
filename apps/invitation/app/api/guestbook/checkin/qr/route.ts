import { NextRequest, NextResponse } from 'next/server';
import { verifyClientToken, verifyQRToken } from '@/lib/guestbook/services/jwt';
import { getEventByIdWithAccess } from '@/lib/guestbook/repositories/eventRepository';
import { getSupabaseServiceClient } from '@/lib/guestbook/supabase';

/**
 * POST /api/guestbook/checkin/qr
 * Check in a guest using QR code
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { qr_token, event_id } = body;

    if (!qr_token || !event_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify access
    const event = await getEventByIdWithAccess(event_id, payload.client_id);
    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found or access denied' },
        { status: 404 }
      );
    }

    // Verify QR token
    const qrPayload = verifyQRToken(qr_token);
    if (!qrPayload) {
      return NextResponse.json(
        { success: false, error: 'Invalid QR code' },
        { status: 400 }
      );
    }

    // Verify event matches
    if (qrPayload.event_id !== event_id) {
      return NextResponse.json(
        { success: false, error: 'QR code is for a different event' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Get guest
    const { data: guest, error: guestError } = await supabase
      .from('invitation_guests')
      .select('*')
      .eq('id', qrPayload.guest_id)
      .eq('event_id', event_id)
      .single();

    if (guestError || !guest) {
      return NextResponse.json(
        { success: false, error: 'Guest not found' },
        { status: 404 }
      );
    }

    // Check if already checked in
    if (guest.is_checked_in) {
      return NextResponse.json(
        { success: false, error: 'Guest already checked in' },
        { status: 400 }
      );
    }

    // Update guest
    const { data: updatedGuest, error: updateError } = await supabase
      .from('invitation_guests')
      .update({
        is_checked_in: true,
        checked_in_at: new Date().toISOString(),
      })
      .eq('id', qrPayload.guest_id)
      .select()
      .single();

    if (updateError || !updatedGuest) {
      console.error('Check-in error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to check in guest' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        guest_id: updatedGuest.id,
        guest_name: updatedGuest.guest_name,
        checked_in_at: updatedGuest.checked_in_at,
      },
      message: 'Guest checked in successfully',
    });
  } catch (error) {
    console.error('QR check-in error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
