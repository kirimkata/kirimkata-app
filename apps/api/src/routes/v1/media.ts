import { Hono } from 'hono';
import type { Env } from '@/lib/types';
import { clientAuthMiddleware } from '@/middleware/auth';
import { getSupabaseClient } from '@/lib/supabase';
import {
    uploadToR2,
    deleteFromR2,
    sanitizeFileName,
    getFileTypeCategory,
    ALLOWED_MIME_TYPES,
    FILE_SIZE_LIMITS,
} from '@/services/r2';

const media = new Hono<{
    Bindings: Env;
    Variables: {
        clientId: string;
        jwtPayload: any;
    };
}>();

// All media routes require authentication
media.use('*', clientAuthMiddleware);

// R2 Public URL (will be set from env or config)
const R2_PUBLIC_URL = 'https://media.kirimkata.com'; // Update this to your R2 public URL

/**
 * POST /v1/media/upload
 * Upload file to R2
 */
media.post('/upload', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const supabase = getSupabaseClient(c.env);

        // Parse multipart form data
        const formData = await c.req.formData();
        const file = formData.get('file') as File;
        const fileType = formData.get('type') as string; // 'photo', 'music', or 'video'

        if (!file) {
            return c.json({ error: 'No file provided' }, 400);
        }

        // Validate file type
        const mimeType = file.type;
        const category = getFileTypeCategory(mimeType);

        if (!category || category !== fileType) {
            return c.json({
                error: 'Invalid file type',
                message: `File type ${mimeType} is not allowed for ${fileType}`
            }, 400);
        }

        const allowedTypes = ALLOWED_MIME_TYPES[category];
        if (!allowedTypes.includes(mimeType)) {
            return c.json({
                error: 'Invalid file type',
                message: `Allowed types for ${category}: ${allowedTypes.join(', ')}`
            }, 400);
        }

        // Validate file size
        const maxSize = FILE_SIZE_LIMITS[category];
        if (file.size > maxSize) {
            const maxSizeMB = Math.round(maxSize / (1024 * 1024));
            return c.json({
                error: 'File too large',
                message: `Maximum file size for ${category} is ${maxSizeMB}MB`
            }, 400);
        }

        // Check quota and get client slug
        const quotaField = `quota_${fileType}s` as 'quota_photos' | 'quota_music' | 'quota_videos';
        const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('quota_photos, quota_music, quota_videos, slug')
            .eq('id', clientId)
            .single();

        if (clientError || !clientData) {
            return c.json({ error: 'Client not found' }, 404);
        }

        if (!clientData.slug) {
            return c.json({ error: 'Client has no slug assigned' }, 400);
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
            return c.json({
                error: 'Quota exceeded',
                message: `Anda telah mencapai batas maksimum upload ${typeLabel} (${currentCount}/${quotaLimit}). Silakan hapus file yang tidak digunakan terlebih dahulu.`,
                current: currentCount,
                limit: quotaLimit,
                type: fileType
            }, 400);
        }

        // Convert file to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();

        // Sanitize filename
        const sanitizedFileName = sanitizeFileName(file.name);

        // Upload to R2 using slug instead of client_id
        const path = `clients/${clientSlug}/${fileType}s`;
        const fileUrl = await uploadToR2(
            c.env.MEDIA_BUCKET,
            {
                file: arrayBuffer,
                fileName: sanitizedFileName,
                contentType: mimeType,
                path,
            },
            R2_PUBLIC_URL
        );

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

        return c.json({
            success: true,
            file: insertedFile
        });

    } catch (error: any) {
        console.error('Upload error:', error);
        return c.json({
            error: 'Upload failed',
            message: error.message
        }, 500);
    }
});

/**
 * GET /v1/media/list
 * List all media files for client
 */
media.get('/list', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const supabase = getSupabaseClient(c.env);

        // Get query parameter for file type filter
        const typeFilter = c.req.query('type'); // 'photo', 'music', 'video', or 'all'

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

        return c.json({
            files: files || []
        });

    } catch (error: any) {
        console.error('List files error:', error);
        return c.json({
            error: 'Failed to list files',
            message: error.message
        }, 500);
    }
});

/**
 * DELETE /v1/media/delete
 * Delete a media file
 */
media.delete('/delete', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const supabase = getSupabaseClient(c.env);

        // Get file ID from request body
        const body = await c.req.json();
        const fileId = body.fileId;

        if (!fileId) {
            return c.json({ error: 'File ID required' }, 400);
        }

        // Get file info and verify ownership
        const { data: file, error: fileError } = await supabase
            .from('client_media')
            .select('file_url, client_id')
            .eq('id', fileId)
            .single();

        if (fileError || !file) {
            return c.json({ error: 'File not found' }, 404);
        }

        // Verify ownership
        if (file.client_id !== clientId) {
            return c.json({ error: 'Unauthorized' }, 403);
        }

        // Extract R2 path from URL
        const fileUrl = file.file_url;
        const r2Path = fileUrl.replace(`${R2_PUBLIC_URL}/`, '');

        // Delete from R2
        try {
            await deleteFromR2(c.env.MEDIA_BUCKET, { path: r2Path });
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

        return c.json({
            success: true,
            message: 'File deleted successfully'
        });

    } catch (error: any) {
        console.error('Delete file error:', error);
        return c.json({
            error: 'Failed to delete file',
            message: error.message
        }, 500);
    }
});

/**
 * GET /v1/media/quota
 * Get media quota information
 */
media.get('/quota', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const supabase = getSupabaseClient(c.env);

        // Get quota limits from clients table
        const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('quota_photos, quota_music, quota_videos')
            .eq('id', clientId)
            .single();

        if (clientError || !clientData) {
            return c.json({ error: 'Client not found' }, 404);
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

        return c.json({
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
        return c.json({
            error: 'Failed to check quota',
            message: error.message
        }, 500);
    }
});

/**
 * GET /v1/media/custom-images
 * Get custom images for client's invitation
 */
media.get('/custom-images', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const supabase = getSupabaseClient(c.env);

        // Get client's slug first
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('slug')
            .eq('id', clientId)
            .single();

        if (clientError || !client?.slug) {
            return c.json(
                { success: false, error: 'Client slug not found' },
                404
            );
        }

        // Get invitation content with custom_images and theme_key
        const { data: invitation, error } = await supabase
            .from('invitation_contents')
            .select('custom_images, theme_key')
            .eq('slug', client.slug)
            .single();

        // If no invitation found or error, return empty data (not an error)
        if (error || !invitation) {
            console.warn('No invitation content found for slug:', client.slug);
            return c.json({
                success: true,
                custom_images: null,
                theme_key: null,
                message: 'Belum ada data undangan',
            });
        }

        return c.json({
            success: true,
            custom_images: invitation.custom_images || null,
            theme_key: invitation.theme_key || null,
        });
    } catch (error) {
        console.error('Error in GET custom-images:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

/**
 * PUT /v1/media/custom-images
 * Update custom images for client's invitation
 */
media.put('/custom-images', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const supabase = getSupabaseClient(c.env);

        const body = await c.req.json();
        const { custom_images } = body;

        if (!custom_images || typeof custom_images !== 'object') {
            return c.json(
                { success: false, error: 'Invalid custom images data' },
                400
            );
        }

        // Get client's slug first
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('slug')
            .eq('id', clientId)
            .single();

        if (clientError || !client?.slug) {
            return c.json(
                { success: false, error: 'Client slug not found' },
                404
            );
        }

        // Update invitation_contents with custom_images
        const { error } = await supabase
            .from('invitation_contents')
            .update({ custom_images })
            .eq('slug', client.slug);

        if (error) {
            console.error('Error saving custom images:', error);
            return c.json(
                { success: false, error: 'Failed to save custom images' },
                500
            );
        }

        return c.json({
            success: true,
            message: 'Custom images saved successfully',
            custom_images,
        });
    } catch (error) {
        console.error('Error in PUT custom-images:', error);
        return c.json(
            { success: false, error: 'Internal server error' },
            500
        );
    }
});

export default media;
