import { Hono } from 'hono';
import type { Env } from '@/lib/types';
import { clientAuthMiddleware } from '@/middleware/auth';
import { getDb } from '@/db';
import { clients, clientMedia } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
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

/**
 * POST /v1/media/upload
 * Upload file to R2
 */
media.post('/upload', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const db = getDb(c.env);

        // Parse multipart form data
        const formData = await c.req.formData();
        const file = formData.get('file') as any as File;
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

        // Check quota (slug removed from clients, using clientId for storage path)
        const [clientData] = await db
            .select({
                quotaPhotos: clients.quotaPhotos,
                quotaMusic: clients.quotaMusic,
                quotaVideos: clients.quotaVideos,
            })
            .from(clients)
            .where(eq(clients.id, clientId))
            .limit(1);

        if (!clientData) {
            return c.json({ error: 'Client not found' }, 404);
        }

        let quotaLimit = 0;
        if (fileType === 'photo') quotaLimit = clientData.quotaPhotos || 0;
        else if (fileType === 'music') quotaLimit = clientData.quotaMusic || 0;
        else if (fileType === 'video') quotaLimit = clientData.quotaVideos || 0;

        // Count existing files
        const [countResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(clientMedia)
            .where(and(
                eq(clientMedia.clientId, clientId),
                eq(clientMedia.fileType, fileType)
            ));

        const count = Number(countResult?.count || 0);

        if (count >= quotaLimit) {
            return c.json({
                error: 'Quota exceeded',
                message: `You have reached your quota for ${fileType}s (${quotaLimit})`
            }, 403);
        }

        // Upload to R2
        const sanitizedFileName = sanitizeFileName(file.name);
        const arrayBuffer = await file.arrayBuffer();

        // Use clientId as the path prefix for organization
        const path = `${clientId}/${fileType}`;

        const publicUrl = await uploadToR2(
            c.env.MEDIA_BUCKET,
            {
                file: arrayBuffer,
                fileName: sanitizedFileName,
                contentType: mimeType,
                path: path,
            },
            c.env.R2_PUBLIC_URL || ''
        );

        if (!publicUrl) {
            return c.json({ error: 'Failed to upload file to storage' }, 500);
        }

        // Save to database
        const [savedMedia] = await db
            .insert(clientMedia)
            .values({
                clientId: clientId,
                fileName: file.name, // Original name
                fileUrl: publicUrl,
                fileType: fileType,
                fileSize: file.size,
                mimeType: mimeType,
            })
            .returning();

        return c.json({
            success: true,
            data: {
                id: savedMedia.id,
                url: savedMedia.fileUrl,
                fileName: savedMedia.fileName,
                fileType: savedMedia.fileType
            }
        });

    } catch (error: any) {
        console.error('Upload error:', error);
        return c.json({
            error: 'Internal server error',
            message: error.message
        }, 500);
    }
});

/**
 * GET /v1/media/list
 * List client media
 */
media.get('/list', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const fileType = c.req.query('type');
        const db = getDb(c.env);

        let query = db
            .select()
            .from(clientMedia)
            .where(eq(clientMedia.clientId, clientId))
            .orderBy(desc(clientMedia.uploadedAt));

        if (fileType) {
            // @ts-ignore - Condition abstraction in Drizzle query builder
            query = db
                .select()
                .from(clientMedia)
                .where(and(
                    eq(clientMedia.clientId, clientId),
                    eq(clientMedia.fileType, fileType)
                ))
                .orderBy(desc(clientMedia.uploadedAt));
        }

        const files = await query;

        return c.json({
            success: true,
            data: files.map(f => ({
                id: f.id,
                url: f.fileUrl,
                fileName: f.fileName,
                fileType: f.fileType,
                fileSize: f.fileSize,
                uploadedAt: f.uploadedAt,
                mimeType: f.mimeType
            }))
        });
    } catch (error: any) {
        console.error('List media error:', error);
        return c.json({
            error: 'Internal server error',
            message: error.message
        }, 500);
    }
});

/**
 * DELETE /v1/media/:id
 * Delete file
 */
media.delete('/:id', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const mediaId = parseInt(c.req.param('id'), 10);
        const db = getDb(c.env);

        if (isNaN(mediaId)) {
            return c.json({ error: 'Invalid media ID' }, 400);
        }

        // Find file first to get URL (for R2 delete)
        const [file] = await db
            .select()
            .from(clientMedia)
            .where(and(
                eq(clientMedia.id, mediaId),
                eq(clientMedia.clientId, clientId)
            ))
            .limit(1);

        if (!file) {
            return c.json({ error: 'File not found' }, 404);
        }

        // Delete from R2
        let key = '';
        try {
            const urlObj = new URL(file.fileUrl);
            key = urlObj.pathname.substring(1); // Remove leading slash
        } catch (e) {
            // If URL parsing fails, maybe it's relative or invalid?
        }

        if (key) {
            await deleteFromR2(c.env.MEDIA_BUCKET, { path: key });
        }

        // Delete from DB
        await db
            .delete(clientMedia)
            .where(eq(clientMedia.id, mediaId));

        return c.json({
            success: true,
            message: 'File deleted successfully'
        });

    } catch (error: any) {
        console.error('Delete media error:', error);
        return c.json({
            error: 'Internal server error',
            message: error.message
        }, 500);
    }
});

/**
 * GET /v1/media/quota
 * Get current quota usage
 */
media.get('/quota', async (c) => {
    try {
        const clientId = c.get('clientId') as string;
        const db = getDb(c.env);

        // Get limits from client
        const [clientData] = await db
            .select({
                quotaPhotos: clients.quotaPhotos,
                quotaMusic: clients.quotaMusic,
                quotaVideos: clients.quotaVideos
            })
            .from(clients)
            .where(eq(clients.id, clientId))
            .limit(1);

        if (!clientData) {
            return c.json({ error: 'Client not found' }, 404);
        }

        // Get usage counts
        // Aggregate by fileType
        const usageResults = await db
            .select({
                fileType: clientMedia.fileType,
                count: sql<number>`count(*)`
            })
            .from(clientMedia)
            .where(eq(clientMedia.clientId, clientId))
            .groupBy(clientMedia.fileType);

        const usage = {
            photos: 0,
            music: 0,
            videos: 0
        };

        usageResults.forEach(row => {
            const count = Number(row.count);
            if (row.fileType === 'photo') usage.photos = count;
            else if (row.fileType === 'music') usage.music = count;
            else if (row.fileType === 'video') usage.videos = count;
        });

        return c.json({
            success: true,
            quota: {
                photos: {
                    used: usage.photos,
                    limit: clientData.quotaPhotos,
                    remaining: (clientData.quotaPhotos || 0) - usage.photos
                },
                music: {
                    used: usage.music,
                    limit: clientData.quotaMusic,
                    remaining: (clientData.quotaMusic || 0) - usage.music
                },
                videos: {
                    used: usage.videos,
                    limit: clientData.quotaVideos,
                    remaining: (clientData.quotaVideos || 0) - usage.videos
                }
            }
        });
    } catch (error: any) {
        console.error('Get quota error:', error);
        return c.json({
            error: 'Internal server error',
            message: error.message
        }, 500);
    }
});

export default media;
