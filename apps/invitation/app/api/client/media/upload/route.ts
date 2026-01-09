import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/services/jwt';
import { getSupabaseServiceClient } from '@/lib/supabaseClient';
import { uploadToR2, sanitizeFileName, getFileTypeCategory, ALLOWED_MIME_TYPES, FILE_SIZE_LIMITS } from '@/lib/storage/r2-upload';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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

        // Parse multipart form data
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const fileType = formData.get('type') as string; // 'photo', 'music', or 'video'

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        const mimeType = file.type;
        const category = getFileTypeCategory(mimeType);

        if (!category || category !== fileType) {
            return NextResponse.json({
                error: 'Invalid file type',
                message: `File type ${mimeType} is not allowed for ${fileType}`
            }, { status: 400 });
        }

        const allowedTypes = ALLOWED_MIME_TYPES[category];
        if (!allowedTypes.includes(mimeType)) {
            return NextResponse.json({
                error: 'Invalid file type',
                message: `Allowed types for ${category}: ${allowedTypes.join(', ')}`
            }, { status: 400 });
        }

        // Validate file size
        const maxSize = FILE_SIZE_LIMITS[category];
        if (file.size > maxSize) {
            const maxSizeMB = Math.round(maxSize / (1024 * 1024));
            return NextResponse.json({
                error: 'File too large',
                message: `Maximum file size for ${category} is ${maxSizeMB}MB`
            }, { status: 400 });
        }

        // Check quota and get client slug
        const quotaField = `quota_${fileType}s` as 'quota_photos' | 'quota_music' | 'quota_videos';
        const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('quota_photos, quota_music, quota_videos, slug')
            .eq('id', clientId)
            .single();

        if (clientError || !clientData) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        if (!clientData.slug) {
            return NextResponse.json({ error: 'Client has no slug assigned' }, { status: 400 });
        }

        const quotaLimit = (clientData as any)[quotaField];
        const clientSlug = clientData.slug;

        // Count existing files
        const { count, error: countError } = await supabase
            .from('client_media')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', clientId)
            .eq('file_type', fileType);

        if (countError) {
            throw countError;
        }

        const currentCount = count || 0;

        if (currentCount >= quotaLimit) {
            const typeLabel = fileType === 'photo' ? 'foto' : fileType === 'music' ? 'musik' : 'video';
            return NextResponse.json({
                error: 'Quota exceeded',
                message: `Anda telah mencapai batas maksimum upload ${typeLabel} (${currentCount}/${quotaLimit}). Silakan hapus file yang tidak digunakan terlebih dahulu.`,
                current: currentCount,
                limit: quotaLimit,
                type: fileType
            }, { status: 400 });
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Sanitize filename
        const sanitizedFileName = sanitizeFileName(file.name);

        // Upload to R2 using slug instead of client_id
        const path = `clients/${clientSlug}/${fileType}s`;
        const fileUrl = await uploadToR2({
            file: buffer,
            fileName: sanitizedFileName,
            contentType: mimeType,
            path,
        });

        // Save metadata to database
        const { data: insertedFile, error: insertError } = await supabase
            .from('client_media')
            .insert({
                client_id: clientId,
                file_name: sanitizedFileName,
                file_url: fileUrl,
                file_type: fileType,
                file_size: file.size,
                mime_type: mimeType,
            })
            .select()
            .single();

        if (insertError) {
            throw insertError;
        }

        return NextResponse.json({
            success: true,
            file: insertedFile
        });

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({
            error: 'Upload failed',
            message: error.message
        }, { status: 500 });
    }
}
