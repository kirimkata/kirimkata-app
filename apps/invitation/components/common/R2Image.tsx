import React from 'react';
import { getClientImageUrl, getImageSrcSet, getImageSizes } from '@/lib/storage/r2';

interface R2ImageProps {
    clientSlug: string;
    imageName: string;
    alt: string;
    className?: string;
    priority?: boolean;
    sizes?: string;
}

/**
 * R2Image Component
 * 
 * Responsive image component that serves pre-optimized images from Cloudflare R2
 * 
 * Features:
 * - Automatic responsive images (sm, md, lg)
 * - Lazy loading by default
 * - WebP format
 * - 0 Vercel transformations
 * 
 * @example
 * <R2Image 
 *   clientSlug="poppy-fadli"
 *   imageName="hero"
 *   alt="Wedding ceremony"
 * />
 * 
 * @example
 * <R2Image 
 *   clientSlug="poppy-fadli"
 *   imageName="gallery/photo1"
 *   alt="Reception"
 *   priority // For above-the-fold images
 * />
 */
export function R2Image({
    clientSlug,
    imageName,
    alt,
    className = '',
    priority = false,
    sizes,
}: R2ImageProps) {
    const srcSet = getImageSrcSet(clientSlug, imageName);
    const src = getClientImageUrl(clientSlug, imageName, 'lg');
    const imageSizes = sizes || getImageSizes();

    return (
        <img
            src={src}
            srcSet={srcSet}
            sizes={imageSizes}
            alt={alt}
            className={className}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
        />
    );
}

/**
 * R2Picture Component
 * 
 * More control over responsive images using <picture> element
 * 
 * @example
 * <R2Picture 
 *   clientSlug="poppy-fadli"
 *   imageName="hero"
 *   alt="Wedding"
 * />
 */
export function R2Picture({
    clientSlug,
    imageName,
    alt,
    className = '',
    priority = false,
}: R2ImageProps) {
    const smUrl = getClientImageUrl(clientSlug, imageName, 'sm');
    const mdUrl = getClientImageUrl(clientSlug, imageName, 'md');
    const lgUrl = getClientImageUrl(clientSlug, imageName, 'lg');

    return (
        <picture>
            <source media="(max-width: 640px)" srcSet={smUrl} type="image/webp" />
            <source media="(max-width: 828px)" srcSet={mdUrl} type="image/webp" />
            <img
                src={lgUrl}
                alt={alt}
                className={className}
                loading={priority ? 'eager' : 'lazy'}
                decoding="async"
            />
        </picture>
    );
}

/**
 * R2BackgroundImage Component
 * 
 * Background image using CSS with responsive sources
 * 
 * @example
 * <R2BackgroundImage 
 *   clientSlug="poppy-fadli"
 *   imageName="hero"
 *   className="h-screen"
 * >
 *   <h1>Content over background</h1>
 * </R2BackgroundImage>
 */
export function R2BackgroundImage({
    clientSlug,
    imageName,
    className = '',
    children,
}: R2ImageProps & { children?: React.ReactNode }) {
    const lgUrl = getClientImageUrl(clientSlug, imageName, 'lg');

    return (
        <div
            className={className}
            style={{
                backgroundImage: `url(${lgUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        >
            {children}
        </div>
    );
}
