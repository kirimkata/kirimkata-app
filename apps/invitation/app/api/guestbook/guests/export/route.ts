import { NextRequest, NextResponse } from 'next/server';
import { verifyClientToken } from '@/lib/guestbook/services/jwt';
import { getEventByIdWithAccess } from '@/lib/guestbook/repositories/eventRepository';
import { getSupabaseServiceClient } from '@/lib/guestbook/supabase';

/**
 * GET /api/guestbook/guests/export?event_id=xxx
 * Export guests to CSV
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

    // Fetch guests with related data
    const { data: guests, error } = await supabase
      .from('invitation_guests')
      .select(`
        id,
        guest_name,
        guest_phone,
        guest_email,
        guest_group,
        max_companions,
        actual_companions,
        is_checked_in,
        checked_in_at,
        invitation_sent,
        qr_token,
        source,
        created_at
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Export guests error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch guests' },
        { status: 500 }
      );
    }

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
      'Invitation Sent',
      'Has QR',
      'Source',
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
        guest.invitation_sent ? 'Yes' : 'No',
        guest.qr_token ? 'Yes' : 'No',
        guest.source || '',
        new Date(guest.created_at).toLocaleString()
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="guests_${eventId}_${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export guests error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
