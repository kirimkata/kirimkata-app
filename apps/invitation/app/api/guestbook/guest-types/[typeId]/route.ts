import { NextRequest, NextResponse } from 'next/server';
import { verifyClientToken } from '@/lib/guestbook/services/jwt';
import { getGuestTypeById, updateGuestType, deleteGuestType } from '@/lib/guestbook/repositories/guestTypeRepository';

/**
 * PUT /api/guestbook/guest-types/[typeId]
 * Update guest type
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ typeId: string }> }
) {
  const params = await context.params;
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

    // Verify guest type exists and belongs to client
    const existingType = await getGuestTypeById(params.typeId);
    if (!existingType || existingType.client_id !== payload.client_id) {
      return NextResponse.json(
        { success: false, error: 'Guest type not found or access denied' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { type_name, display_name, color_code } = body;

    const updates: any = {};
    if (type_name !== undefined) updates.type_name = type_name;
    if (display_name !== undefined) updates.display_name = display_name;
    if (color_code !== undefined) updates.color_code = color_code;

    const updatedType = await updateGuestType(params.typeId, updates);

    if (!updatedType) {
      return NextResponse.json(
        { success: false, error: 'Failed to update guest type' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedType,
    });
  } catch (error) {
    console.error('Update guest type error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/guestbook/guest-types/[typeId]
 * Delete guest type
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ typeId: string }> }
) {
  const params = await context.params;
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

    // Verify guest type exists and belongs to client
    const existingType = await getGuestTypeById(params.typeId);
    if (!existingType || existingType.client_id !== payload.client_id) {
      return NextResponse.json(
        { success: false, error: 'Guest type not found or access denied' },
        { status: 404 }
      );
    }

    const success = await deleteGuestType(params.typeId);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete guest type. It may be in use by guests.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Guest type deleted successfully',
    });
  } catch (error) {
    console.error('Delete guest type error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
