/**
 * R2 Storage Service for Cloudflare Workers
 * Uses native R2 bindings instead of AWS SDK
 */

export interface UploadFileParams {
    file: ArrayBuffer | Uint8Array;
    fileName: string;
    contentType: string;
    path: string; // e.g., 'clients/slug-name/photos'
}

export interface DeleteFileParams {
    path: string; // full path including filename
}

/**
 * Upload file to R2 using Workers binding
 */
export async function uploadToR2(
    bucket: R2Bucket,
    params: UploadFileParams,
    publicUrl: string
): Promise<string> {
    const { file, fileName, contentType, path } = params;
    const key = `${path}/${fileName}`;

    await bucket.put(key, file, {
        httpMetadata: {
            contentType,
        },
    });

    // Return public URL
    return `${publicUrl}/${key}`;
}

/**
 * Delete file from R2
 */
export async function deleteFromR2(
    bucket: R2Bucket,
    params: DeleteFileParams
): Promise<void> {
    await bucket.delete(params.path);
}

/**
 * List files in R2 path
 */
export async function listFilesInR2(
    bucket: R2Bucket,
    prefix: string
): Promise<string[]> {
    const listed = await bucket.list({ prefix });
    return listed.objects.map((obj) => obj.key);
}

/**
 * Generate sanitized filename
 */
export function sanitizeFileName(fileName: string): string {
    // Remove special characters and spaces
    const name = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    // Add timestamp to prevent duplicates
    const timestamp = Date.now();
    const extension = name.split('.').pop();
    const baseName = name.substring(0, name.lastIndexOf('.'));
    return `${baseName}_${timestamp}.${extension}`;
}

/**
 * Get file type category from MIME type
 */
export function getFileTypeCategory(mimeType: string): 'photo' | 'music' | 'video' | null {
    if (mimeType.startsWith('image/')) return 'photo';
    if (mimeType.startsWith('audio/')) return 'music';
    if (mimeType.startsWith('video/')) return 'video';
    return null;
}

// Allowed MIME types
export const ALLOWED_MIME_TYPES = {
    photo: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    music: ['audio/mpeg', 'audio/mp3', 'audio/wav'],
    video: ['video/mp4', 'video/webm'],
};

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
    photo: 5 * 1024 * 1024, // 5MB
    music: 10 * 1024 * 1024, // 10MB
    video: 50 * 1024 * 1024, // 50MB
};
