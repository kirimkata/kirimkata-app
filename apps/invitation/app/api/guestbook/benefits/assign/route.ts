import { NextRequest, NextResponse } from 'next/server';
import { verifyClientToken } from '@/lib/guestbook/services/jwt';
import { assignBenefitToGuestType } from '@/lib/guestbook/repositories/benefitRepository';
import { getGuestTypeById } from '@/lib/guestbook/repositories/guestTypeRepository';

/**
 * POST /api/guestbook/benefits/assign
 * Assign benefit to guest type
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
    const { guest_type_id, benefit_type, quantity, description } = body;

    if (!guest_type_id || !benefit_type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify guest type belongs to client
    const guestType = await getGuestTypeById(guest_type_id);
    if (!guestType || guestType.client_id !== payload.client_id) {
      return NextResponse.json(
        { success: false, error: 'Guest type not found or access denied' },
        { status: 404 }
      );
    }

    const benefit = await assignBenefitToGuestType(
      guest_type_id,
      benefit_type,
      quantity || 1,
      description
    );

    if (!benefit) {
      return NextResponse.json(
        { success: false, error: 'Failed to assign benefit' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: benefit,
    });
  } catch (error) {
    console.error('Assign benefit error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
