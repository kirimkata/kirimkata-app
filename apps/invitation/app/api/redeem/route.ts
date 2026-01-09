import { NextRequest, NextResponse } from 'next/server';
import { verifyClientToken } from '@/lib/guestbook/services/jwt';
import { getRedemptionLogs } from '@/lib/guestbook/repositories/logRepository';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Token tidak valid' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyClientToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Token tidak valid' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Event ID wajib diisi' },
        { status: 400 }
      );
    }

    const logs = await getRedemptionLogs(eventId, limit);

    return NextResponse.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error('Get redemption logs error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
