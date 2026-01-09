import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/services/jwt';
import { getSupabaseServiceClient } from '@/lib/supabaseClient';
import { deleteFromR2 } from '@/lib/storage/r2-upload';

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
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

        // Get file ID from request body
        const body = await request.json();
        const fileId = body.fileId;

        if (!fileId) {
            return NextResponse.json({ error: 'File ID required' }, { status: 400 });
        }

        // Get file info and verify ownership
        const { data: file, error: fileError } = await supabase
            .from('client_media')
            .select('file_url, client_id')
            .eq('id', fileId)
            .single();

        if (fileError || !file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // Verify ownership
        if (file.client_id !== clientId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Extract R2 path from URL
        const fileUrl = file.file_url;
        const publicUrl = process.env.R2_PUBLIC_URL || '';
        const r2Path = fileUrl.replace(`${publicUrl}/`, '');

        // Delete from R2
        try {
            await deleteFromR2({ path: r2Path });
        } catch (r2Error) {
            console.error('R2 delete error:', r2Error);
            // Continue to delete from database even if R2 delete fails
        }

        // Delete from database
        const { error: deleteError } = await supabase
            .from('client_media')
            .delete()
            .eq('id', fileId);

        if (deleteError) {
            throw deleteError;
        }

        return NextResponse.json({
            success: true,
            message: 'File deleted successfully'
        });

    } catch (error: any) {
        console.error('Delete file error:', error);
        return NextResponse.json({
            error: 'Failed to delete file',
            message: error.message
        }, { status: 500 });
    }
}
