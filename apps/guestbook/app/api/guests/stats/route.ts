import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/services/jwt';
import { getGuestStats } from '@/lib/repositories/guestRepository';
import { JWTPayload, ClientJWTPayload, StaffJWTPayload } from '@/lib/types';

/**
 * Verify authentication and get client ID
 */
function verifyAuth(request: NextRequest): { payload: JWTPayload; clientId: string } | null {
  const authHeader = request.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  let clientId: string;
  if (payload.type === 'CLIENT') {
    const clientPayload = payload as ClientJWTPayload;
    if (!clientPayload.guestbook_access) {
      return null;
    }
    clientId = clientPayload.client_id;
  } else if (payload.type === 'STAFF') {
    const staffPayload = payload as StaffJWTPayload;
    clientId = staffPayload.client_id;
  } else {
    return null;
  }

  return { payload, clientId };
}

/**
 * GET /api/guests/stats - Get guest statistics for client
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = verifyAuth(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { clientId } = authResult;

    // Get guest statistics
    const stats = await getGuestStats(clientId);

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Guest stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
