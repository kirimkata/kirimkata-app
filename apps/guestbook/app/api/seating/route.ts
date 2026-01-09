import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/services/jwt';
import { 
  getGuestsByTable, 
  getGuestsBySeatingArea, 
  assignSeating, 
  isSeatingAvailable,
  getSeatingStats 
} from '@/lib/repositories/guestRepository';
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
 * GET /api/seating - Get seating information
 * Query params:
 * - table: Get guests by table number
 * - area: Get guests by seating area
 * - stats: Get seating statistics
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
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');
    const area = searchParams.get('area');
    const stats = searchParams.get('stats');

    if (stats === 'true') {
      // Get seating statistics
      const seatingStats = await getSeatingStats(clientId);
      return NextResponse.json({
        success: true,
        data: seatingStats
      });
    }

    if (table) {
      // Get guests by table
      const guests = await getGuestsByTable(clientId, table);
      return NextResponse.json({
        success: true,
        data: guests
      });
    }

    if (area) {
      // Get guests by seating area
      const guests = await getGuestsBySeatingArea(clientId, area);
      return NextResponse.json({
        success: true,
        data: guests
      });
    }

    return NextResponse.json(
      { success: false, error: 'Missing query parameters' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Seating GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/seating - Assign seating to guest
 * Body: {
 *   guest_id: string,
 *   table_number: string,
 *   seat_number?: string,
 *   seating_area?: string,
 *   check_availability?: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = verifyAuth(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { clientId } = authResult;
    const body = await request.json();
    const { guest_id, table_number, seat_number, seating_area, check_availability = true } = body;

    if (!guest_id || !table_number) {
      return NextResponse.json(
        { success: false, error: 'Guest ID and table number are required' },
        { status: 400 }
      );
    }

    // Check availability if requested
    if (check_availability) {
      const available = await isSeatingAvailable(clientId, table_number, seat_number);
      if (!available) {
        return NextResponse.json(
          { success: false, error: 'Seating is already occupied' },
          { status: 409 }
        );
      }
    }

    // Assign seating
    const success = await assignSeating(guest_id, table_number, seat_number, seating_area);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to assign seating' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Seating assigned successfully'
    });

  } catch (error) {
    console.error('Seating POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/seating - Check seating availability
 * Body: {
 *   table_number: string,
 *   seat_number?: string
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = verifyAuth(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { clientId } = authResult;
    const body = await request.json();
    const { table_number, seat_number } = body;

    if (!table_number) {
      return NextResponse.json(
        { success: false, error: 'Table number is required' },
        { status: 400 }
      );
    }

    const available = await isSeatingAvailable(clientId, table_number, seat_number);

    return NextResponse.json({
      success: true,
      data: {
        table_number,
        seat_number,
        available
      }
    });

  } catch (error) {
    console.error('Seating PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
