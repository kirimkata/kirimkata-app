import { NextRequest, NextResponse } from 'next/server';
import { getEventGuests, createEventGuest } from '@/lib/repositories/eventGuestRepository';
import { verifyClientToken } from '@/lib/services/jwt';

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
    const payload = verifyClientToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Token tidak valid' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const source = searchParams.get('source') as 'registered' | 'walkin' | undefined;
    const search = searchParams.get('search') || undefined;

    const result = await getEventGuests(eventId, page, limit, source, search);

    return NextResponse.json({
      success: true,
      data: result.guests,
      total: result.total,
      page,
      limit,
    });
  } catch (error) {
    console.error('Get event guests error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const payload = verifyClientToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Token tidak valid' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      guest_name, 
      source = 'registered',
      guest_phone,
      guest_email,
      guest_type_id,
      should_send_invitation,
      max_companions = 0,
      notes 
    } = body;

    if (!guest_name) {
      return NextResponse.json(
        { success: false, error: 'Nama tamu wajib diisi' },
        { status: 400 }
      );
    }

    const guest = await createEventGuest(
      eventId,
      guest_name,
      source,
      {
        guest_phone,
        guest_email,
        guest_type_id,
        should_send_invitation,
        max_companions,
        notes,
        created_by: payload.client_id,
      }
    );

    if (!guest) {
      return NextResponse.json(
        { success: false, error: 'Gagal membuat tamu' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: guest,
    });
  } catch (error) {
    console.error('Create event guest error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
