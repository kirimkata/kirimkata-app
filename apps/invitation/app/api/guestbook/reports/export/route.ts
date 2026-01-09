import { NextRequest, NextResponse } from 'next/server';
import { verifyClientToken } from '@/lib/guestbook/services/jwt';
import { getEventByIdWithAccess } from '@/lib/guestbook/repositories/eventRepository';
import { getSupabaseServiceClient } from '@/lib/guestbook/supabase';

/**
 * GET /api/guestbook/reports/export?event_id=xxx&format=pdf|excel&report=overview|guests|checkin|seating
 * Export report in specified format
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');
    const format = searchParams.get('format') || 'excel';
    const reportType = searchParams.get('report') || 'overview';

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Event ID required' },
        { status: 400 }
      );
    }

    // Verify access
    const event = await getEventByIdWithAccess(eventId, payload.client_id);
    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found or access denied' },
        { status: 404 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Fetch data based on report type
    let csvContent = '';
    
    if (reportType === 'guests' || reportType === 'overview') {
      // Fetch all guests
      const { data: guests } = await supabase
        .from('invitation_guests')
        .select(`
          guest_name,
          guest_phone,
          guest_email,
          guest_group,
          max_companions,
          actual_companions,
          is_checked_in,
          checked_in_at,
          created_at
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      // Generate CSV
      const headers = [
        'Name',
        'Phone',
        'Email',
        'Group',
        'Max Companions',
        'Actual Companions',
        'Checked In',
        'Checked In At',
        'Created At'
      ];

      const csvRows = [headers.join(',')];

      for (const guest of guests || []) {
        const row = [
          `"${guest.guest_name || ''}"`,
          `"${guest.guest_phone || ''}"`,
          `"${guest.guest_email || ''}"`,
          `"${guest.guest_group || ''}"`,
          guest.max_companions || 0,
          guest.actual_companions || 0,
          guest.is_checked_in ? 'Yes' : 'No',
          guest.checked_in_at ? new Date(guest.checked_in_at).toLocaleString() : '',
          new Date(guest.created_at).toLocaleString()
        ];
        csvRows.push(row.join(','));
      }

      csvContent = csvRows.join('\n');
    }

    if (format === 'excel' || format === 'pdf') {
      // For now, return CSV format
      // Future: Implement actual Excel/PDF generation using libraries
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="report_${reportType}_${eventId}_${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid format' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Export report error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
