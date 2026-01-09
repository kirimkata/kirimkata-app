import { NextRequest, NextResponse } from 'next/server';
import { checkInEventGuest, getEventGuestByQR } from '@/lib/repositories/eventGuestRepository';
import { createStaffLog } from '@/lib/repositories/staffLogRepository';
import { verifyStaffToken } from '@/lib/services/jwt';

/**
 * POST /api/events/[eventId]/checkin - Check in guest
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Token tidak valid' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyStaffToken(token);

    if (!payload || payload.event_id !== eventId) {
      return NextResponse.json(
        { success: false, error: 'Token tidak valid atau tidak sesuai event' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { guest_id, qr_code, notes } = body;

    let guestId = guest_id;

    // If QR code provided, find guest by QR
    if (qr_code && !guest_id) {
      const guest = await getEventGuestByQR(qr_code);
      if (!guest || guest.event_id !== eventId) {
        return NextResponse.json(
          { success: false, error: 'QR code tidak valid atau tidak sesuai event' },
          { status: 400 }
        );
      }
      guestId = guest.id;
    }

    if (!guestId) {
      return NextResponse.json(
        { success: false, error: 'Guest ID atau QR code wajib diisi' },
        { status: 400 }
      );
    }

    // Check in guest
    const success = await checkInEventGuest(guestId, payload.staff_id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Gagal check in tamu' },
        { status: 500 }
      );
    }

    // Log staff action
    await createStaffLog(payload.staff_id, guestId, 'checkin', notes);

    return NextResponse.json({
      success: true,
      message: 'Tamu berhasil di-check in',
    });
  } catch (error) {
    console.error('Check in error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
