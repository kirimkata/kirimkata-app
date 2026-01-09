import { NextRequest, NextResponse } from 'next/server';
import { getEventGuestSummary } from '@/lib/repositories/eventRepository';
import { getEventGuestStats, getRecentCheckIns } from '@/lib/repositories/eventGuestRepository';
import { getEventStaffLogs } from '@/lib/repositories/staffLogRepository';
import { verifyStaffToken, verifyClientToken } from '@/lib/services/jwt';

/**
 * GET /api/events/[eventId]/dashboard - Get dashboard stats for event
 */
export async function GET(
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
    
    // Try to verify as staff token first, then client token
    const staffPayload = verifyStaffToken(token);
    const clientPayload = verifyClientToken(token);
    
    if (!staffPayload && !clientPayload) {
      return NextResponse.json(
        { success: false, error: 'Token tidak valid' },
        { status: 401 }
      );
    }

    // For staff, verify they belong to this event
    if (staffPayload && staffPayload.event_id !== eventId) {
      return NextResponse.json(
        { success: false, error: 'Tidak memiliki akses ke event ini' },
        { status: 403 }
      );
    }

    // Get event summary
    const summary = await getEventGuestSummary(eventId);
    
    // Get detailed stats
    const stats = await getEventGuestStats(eventId);
    
    // Get recent check-ins
    const recentCheckIns = await getRecentCheckIns(eventId, 10);
    
    // Get recent staff logs
    const recentStaffLogs = await getEventStaffLogs(eventId, 10);

    return NextResponse.json({
      success: true,
      data: {
        summary,
        stats: {
          total_guests: stats.total,
          registered_guests: stats.registered,
          walkin_guests: stats.walkin,
          checked_in_guests: stats.checked_in,
          invitations_sent: stats.invitations_sent,
          guest_types_breakdown: stats.guest_types,
        },
        recent_checkins: recentCheckIns,
        recent_staff_logs: recentStaffLogs,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
