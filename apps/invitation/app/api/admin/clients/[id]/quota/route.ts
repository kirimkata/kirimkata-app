import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/services/jwt';
import { getSupabaseServiceClient } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Verify admin JWT token
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded || (decoded as any).type !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: clientId } = await params;
        const supabase = getSupabaseServiceClient();

        // Get client quota
        const { data, error } = await supabase
            .from('clients')
            .select('quota_photos, quota_music, quota_videos')
            .eq('id', clientId)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        return NextResponse.json({
            quota_photos: data.quota_photos,
            quota_music: data.quota_music,
            quota_videos: data.quota_videos,
        });

    } catch (error: any) {
        console.error('Get quota error:', error);
        return NextResponse.json({
            error: 'Failed to get quota',
            message: error.message
        }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Verify admin JWT token
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded || (decoded as any).type !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: clientId } = await params;
        const body = await request.json();
        const supabase = getSupabaseServiceClient();

        const { quota_photos, quota_music, quota_videos } = body;

        // Validate values
        if (quota_photos !== undefined && (quota_photos < 0 || quota_photos > 100)) {
            return NextResponse.json({ error: 'quota_photos must be between 0 and 100' }, { status: 400 });
        }
        if (quota_music !== undefined && (quota_music < 0 || quota_music > 100)) {
            return NextResponse.json({ error: 'quota_music must be between 0 and 100' }, { status: 400 });
        }
        if (quota_videos !== undefined && (quota_videos < 0 || quota_videos > 100)) {
            return NextResponse.json({ error: 'quota_videos must be between 0 and 100' }, { status: 400 });
        }

        // Build update object
        const updates: any = {};
        if (quota_photos !== undefined) updates.quota_photos = quota_photos;
        if (quota_music !== undefined) updates.quota_music = quota_music;
        if (quota_videos !== undefined) updates.quota_videos = quota_videos;

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No quota values provided' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('clients')
            .update(updates)
            .eq('id', clientId)
            .select('quota_photos, quota_music, quota_videos')
            .single();

        if (error || !data) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            quota: data
        });

    } catch (error: any) {
        console.error('Update quota error:', error);
        return NextResponse.json({
            error: 'Failed to update quota',
            message: error.message
        }, { status: 500 });
    }
}
