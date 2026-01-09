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

        // Get query parameter for file type filter
        const { searchParams } = new URL(request.url);
        const typeFilter = searchParams.get('type'); // 'photo', 'music', 'video', or 'all'

        let query = supabase
            .from('client_media')
            .select('id, file_name, file_url, file_type, file_size, mime_type, uploaded_at')
            .eq('client_id', clientId);

        if (typeFilter && typeFilter !== 'all') {
            query = query.eq('file_type', typeFilter);
        }

        query = query.order('uploaded_at', { ascending: false });

        const { data: files, error } = await query;

        if (error) {
            throw error;
        }

        return NextResponse.json({
            files: files || []
        });

    } catch (error: any) {
        console.error('List files error:', error);
        return NextResponse.json({
            error: 'Failed to list files',
            message: error.message
        }, { status: 500 });
    }
}
