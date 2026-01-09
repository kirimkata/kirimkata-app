import { NextRequest, NextResponse } from 'next/server';
import { verifyClientToken } from '@/lib/guestbook/services/jwt';
import { getSupabaseServiceClient } from '@/lib/guestbook/supabase';

/**
 * POST /api/guestbook/guests/bulk-delete
 * Delete multiple guests
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
    const { guest_ids } = body;

    if (!guest_ids || !Array.isArray(guest_ids) || guest_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Guest IDs required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Verify all guests belong to client
    const { data: guests } = await supabase
      .from('invitation_guests')
      .select('id, client_id')
      .in('id', guest_ids);

    if (!guests || guests.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No guests found' },
        { status: 404 }
      );
    }

    // Check all guests belong to client
    const unauthorizedGuests = guests.filter(g => g.client_id !== payload.client_id);
    if (unauthorizedGuests.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Access denied to some guests' },
        { status: 403 }
      );
    }

    // Delete guests
    const { error } = await supabase
      .from('invitation_guests')
      .delete()
      .in('id', guest_ids);

    if (error) {
      console.error('Bulk delete error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete guests' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${guest_ids.length} guests`,
      deleted_count: guest_ids.length,
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
