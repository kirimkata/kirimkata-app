import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

// Initialize R2 client
const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || '';
const PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

export interface UploadFileParams {
    file: Buffer;
    fileName: string;
    contentType: string;
    path: string; // e.g., 'clients/123/photos'
}

export interface DeleteFileParams {
    path: string; // full path including filename
}

/**
 * Upload file to R2
 */
export async function uploadToR2(params: UploadFileParams): Promise<string> {
    const { file, fileName, contentType, path } = params;
    const key = `${path}/${fileName}`;

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: contentType,
    });

    await r2Client.send(command);

    // Return public URL
    return `${PUBLIC_URL}/${key}`;
}

/**
 * Delete file from R2
 */
export async function deleteFromR2(params: DeleteFileParams): Promise<void> {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: params.path,
    });

    await r2Client.send(command);
}

/**
 * List files in R2 path
 */
export async function listFilesInR2(prefix: string): Promise<string[]> {
    const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
    });

    const response = await r2Client.send(command);
    return response.Contents?.map((item) => item.Key || '') || [];
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
 * Validate file type
 */
export function validateFileType(mimeType: string, allowedTypes: string[]): boolean {
    return allowedTypes.includes(mimeType);
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
    photo: 1 * 1024 * 1024, // 1MB
    music: 5 * 1024 * 1024, // 5MB
    video: 10 * 1024 * 1024, // 10MB
};
