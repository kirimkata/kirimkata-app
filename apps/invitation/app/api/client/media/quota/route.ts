import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/services/jwt';
import { getSupabaseServiceClient } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Verify JWT token
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded || (decoded as any).type !== 'client') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const clientId = decoded.userId;
        const supabase = getSupabaseServiceClient();

        // Get quota limits from clients table
        const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('quota_photos, quota_music, quota_videos')
            .eq('id', clientId)
            .single();

        if (clientError || !clientData) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        const { quota_photos, quota_music, quota_videos } = clientData;

        // Get current usage for each type
        const { data: mediaFiles, error: mediaError } = await supabase
            .from('client_media')
            .select('file_type')
            .eq('client_id', clientId);

        if (mediaError) {
            throw mediaError;
        }

        const usage: Record<string, number> = {
            photo: 0,
            music: 0,
            video: 0,
        };

        mediaFiles?.forEach((file) => {
            usage[file.file_type] = (usage[file.file_type] || 0) + 1;
        });

        return NextResponse.json({
            photos: {
                used: usage.photo,
                limit: quota_photos,
                remaining: quota_photos - usage.photo,
            },
            music: {
                used: usage.music,
                limit: quota_music,
                remaining: quota_music - usage.music,
            },
            videos: {
                used: usage.video,
                limit: quota_videos,
                remaining: quota_videos - usage.video,
            },
        });

    } catch (error: any) {
        console.error('Quota check error:', error);
        return NextResponse.json({
            error: 'Failed to check quota',
            message: error.message
        }, { status: 500 });
    }
}
