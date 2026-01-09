/**
 * Cloudflare R2 Image URL Helpers
 * 
 * These functions help generate consistent R2 URLs for images
 * stored in Cloudflare R2 bucket.
 */

// R2 base URL - set this in your .env
const R2_BASE_URL = process.env.NEXT_PUBLIC_R2_URL || 'https://media.kirimkata.com';

/**
 * Get full R2 URL for a given path
 */
export function getR2Url(path: string): string {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${R2_BASE_URL}/${cleanPath}`;
}

/**
 * Get client-specific image URL
 * 
 * @param clientSlug - Client slug (e.g., 'poppy-fadli')
 * @param imageName - Image name without size suffix (e.g., 'hero', 'gallery/photo1')
 * @param size - Image size: 'sm' (640px), 'md' (828px), 'lg' (1200px)
 * @returns Full R2 URL
 * 
 * @example
 * getClientImageUrl('poppy-fadli', 'hero', 'lg')
 * // Returns: https://media.kirimkata.com/clients/poppy-fadli/hero-lg.webp
 */
export function getClientImageUrl(
    clientSlug: string,
    imageName: string,
    size: 'sm' | 'md' | 'lg' = 'md'
): string {
    return getR2Url(`clients/${clientSlug}/${imageName}-${size}.webp`);
}

/**
 * Get gallery image URL
 * 
 * @param clientSlug - Client slug
 * @param photoNumber - Photo number (1, 2, 3, etc.)
 * @param size - Image size
 * @returns Full R2 URL
 * 
 * @example
 * getGalleryImageUrl('poppy-fadli', 1, 'md')
 * // Returns: https://media.kirimkata.com/clients/poppy-fadli/gallery/photo1-md.webp
 */
export function getGalleryImageUrl(
    clientSlug: string,
    photoNumber: number,
    size: 'sm' | 'md' | 'lg' = 'md'
): string {
    return getClientImageUrl(clientSlug, `gallery/photo${photoNumber}`, size);
}

/**
 * Get shared asset URL
 * 
 * @param assetPath - Path to shared asset (e.g., 'logo', 'icons/heart')
 * @param size - Optional size for images
 * @returns Full R2 URL
 * 
 * @example
 * getSharedAssetUrl('logo', 'sm')
 * // Returns: https://media.kirimkata.com/shared/logo-sm.webp
 */
export function getSharedAssetUrl(
    assetPath: string,
    size?: 'sm' | 'md' | 'lg'
): string {
    if (size) {
        return getR2Url(`shared/${assetPath}-${size}.webp`);
    }
    return getR2Url(`shared/${assetPath}`);
}

/**
 * Get srcSet string for responsive images
 * 
 * @param clientSlug - Client slug
 * @param imageName - Image name
 * @returns srcSet string for <img> or <source>
 * 
 * @example
 * getImageSrcSet('poppy-fadli', 'hero')
 * // Returns: "https://...hero-sm.webp 640w, https://...hero-md.webp 828w, https://...hero-lg.webp 1200w"
 */
export function getImageSrcSet(
    clientSlug: string,
    imageName: string
): string {
    const sm = getClientImageUrl(clientSlug, imageName, 'sm');
    const md = getClientImageUrl(clientSlug, imageName, 'md');
    const lg = getClientImageUrl(clientSlug, imageName, 'lg');

    return `${sm} 640w, ${md} 828w, ${lg} 1200w`;
}

/**
 * Image size configurations
 */
export const IMAGE_SIZES = {
    sm: { width: 640, breakpoint: '(max-width: 640px)' },
    md: { width: 828, breakpoint: '(max-width: 828px)' },
    lg: { width: 1200, breakpoint: '(min-width: 829px)' },
} as const;

/**
 * Get sizes attribute for responsive images
 * 
 * @returns sizes string for <img>
 * 
 * @example
 * getImageSizes()
 * // Returns: "(max-width: 640px) 100vw, (max-width: 828px) 100vw, 1200px"
 */
export function getImageSizes(): string {
    return '(max-width: 640px) 100vw, (max-width: 828px) 100vw, 1200px';
}
