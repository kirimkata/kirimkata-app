/**
 * Reusable hook for fetching gallery/photo data
 * Can be used across different theme designs
 */

import { useInvitationContent } from '@/lib/contexts/InvitationContentContext';

export interface GalleryPhoto {
    url: string;
    caption?: string;
    alt?: string;
}

export interface UseGalleryDataReturn {
    photos: GalleryPhoto[];
    isLoading: boolean;
    hasPhotos: boolean;
}

export function useGalleryData(): UseGalleryDataReturn {
    const invitationContent = useInvitationContent();

    // Combine all gallery images from different sections
    const topRowImages = invitationContent?.gallery?.topRowImages || [];
    const middleImages = invitationContent?.gallery?.middleImages || [];
    const bottomGridImages = invitationContent?.gallery?.bottomGridImages || [];

    const photos: GalleryPhoto[] = [
        ...topRowImages.map((img: any) => ({
            url: img.src,
            alt: img.alt || 'Gallery photo',
        })),
        ...middleImages.map((img: any) => ({
            url: img.src,
            alt: img.alt || 'Gallery photo',
        })),
        ...bottomGridImages.map((img: any) => ({
            url: img.src,
            alt: img.alt || 'Gallery photo',
        })),
    ];

    return {
        photos,
        isLoading: false,
        hasPhotos: photos.length > 0,
    };
}
