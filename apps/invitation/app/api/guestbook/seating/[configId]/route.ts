import { NextRequest, NextResponse } from 'next/server';
import { verifyClientToken } from '@/lib/guestbook/services/jwt';
import { getSeatingConfigById, updateSeatingConfig, deleteSeatingConfig } from '@/lib/guestbook/repositories/seatingConfigRepository';
import { getEventByIdWithAccess } from '@/lib/guestbook/repositories/eventRepository';

/**
 * PUT /api/guestbook/seating/[configId]
 * Update seating configuration
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { configId: string } }
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

    // Verify config exists and user has access
    const existingConfig = await getSeatingConfigById(params.configId);
    if (!existingConfig) {
      return NextResponse.json(
        { success: false, error: 'Seating config not found' },
        { status: 404 }
      );
    }

    const event = await getEventByIdWithAccess(existingConfig.event_id, payload.client_id);
    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, capacity, allowed_guest_type_ids, is_active } = body;

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (capacity !== undefined) updates.capacity = capacity;
    if (allowed_guest_type_ids !== undefined) updates.allowed_guest_type_ids = allowed_guest_type_ids;
    if (is_active !== undefined) updates.is_active = is_active;

    const updatedConfig = await updateSeatingConfig(params.configId, updates);

    if (!updatedConfig) {
      return NextResponse.json(
        { success: false, error: 'Failed to update seating config' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedConfig,
    });
  } catch (error) {
    console.error('Update seating config error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/guestbook/seating/[configId]
 * Delete seating configuration
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { configId: string } }
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

    // Verify config exists and user has access
    const existingConfig = await getSeatingConfigById(params.configId);
    if (!existingConfig) {
      return NextResponse.json(
        { success: false, error: 'Seating config not found' },
        { status: 404 }
      );
    }

    const event = await getEventByIdWithAccess(existingConfig.event_id, payload.client_id);
    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const success = await deleteSeatingConfig(params.configId);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete seating config' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Seating config deleted successfully',
    });
  } catch (error) {
    console.error('Delete seating config error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
