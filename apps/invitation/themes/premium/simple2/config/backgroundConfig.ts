/**
 * Simple2 Theme - Background Configuration
 * 
 * Configure cover background images/videos from R2 storage
 * You can set either a video URL or an array of image URLs
 */

export interface BackgroundConfig {
    type: 'video' | 'images';
    // For video background
    videoUrl?: string;
    // For image background (single or multiple for slideshow)
    imageUrls?: string[];
    // Slideshow settings (only applies when imageUrls has multiple items)
    slideshowInterval?: number; // in milliseconds, default 5000 (5 seconds)
    // Overlay opacity (0-1) for text readability
    overlayOpacity?: number; // default 0.4
}

/**
 * Default background configuration
 * Replace these URLs with your R2 storage URLs
 */
export const backgroundConfig: BackgroundConfig = {
    type: 'images',
    imageUrls: [
        // Add your R2 image URLs here
        // Example: 'https://your-r2-bucket.com/image1.jpg',
        'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80',
    ],
    slideshowInterval: 5000, // 5 seconds per image
    overlayOpacity: 0.5, // 50% dark overlay
};

/**
 * Example configurations:
 * 
 * // Single image background:
 * {
 *   type: 'images',
 *   imageUrls: ['https://your-r2-bucket.com/cover.jpg'],
 *   overlayOpacity: 0.4,
 * }
 * 
 * // Multiple images (slideshow):
 * {
 *   type: 'images',
 *   imageUrls: [
 *     'https://your-r2-bucket.com/image1.jpg',
 *     'https://your-r2-bucket.com/image2.jpg',
 *     'https://your-r2-bucket.com/image3.jpg',
 *   ],
 *   slideshowInterval: 5000,
 *   overlayOpacity: 0.5,
 * }
 * 
 * // Video background:
 * {
 *   type: 'video',
 *   videoUrl: 'https://your-r2-bucket.com/wedding-video.mp4',
 *   overlayOpacity: 0.6,
 * }
 */
