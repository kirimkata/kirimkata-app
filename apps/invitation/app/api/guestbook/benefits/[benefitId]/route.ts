import { NextRequest, NextResponse } from 'next/server';
import { verifyClientToken } from '@/lib/guestbook/services/jwt';
import { removeBenefitFromGuestType, updateGuestTypeBenefit } from '@/lib/guestbook/repositories/benefitRepository';
import { getSupabaseServiceClient } from '@/lib/guestbook/supabase';

/**
 * PUT /api/guestbook/benefits/[benefitId]
 * Update benefit assignment
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { benefitId: string } }
) {
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
    const { quantity, description, is_active } = body;

    const updates: any = {};
    if (quantity !== undefined) updates.quantity = quantity;
    if (description !== undefined) updates.description = description;
    if (is_active !== undefined) updates.is_active = is_active;

    const updatedBenefit = await updateGuestTypeBenefit(params.benefitId, updates);

    if (!updatedBenefit) {
      return NextResponse.json(
        { success: false, error: 'Failed to update benefit' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedBenefit,
    });
  } catch (error) {
    console.error('Update benefit error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/guestbook/benefits/[benefitId]
 * Remove benefit from guest type
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { benefitId: string } }
) {
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

    const success = await removeBenefitFromGuestType(params.benefitId);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to remove benefit' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Benefit removed successfully',
    });
  } catch (error) {
    console.error('Remove benefit error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
