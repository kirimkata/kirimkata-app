'use client';

export interface Simple2GalleryImage {
    src: string;
    alt: string;
}

export interface Simple2Section11Config {
    backgroundImageUrl: string;
    overlayOpacity?: number;
    mainTitle: string;
    backgroundColor?: string;
    youtubeEmbedUrl?: string;
    showYoutube?: boolean;
    middleImages: Simple2GalleryImage[];
}

export const section11Config: Simple2Section11Config = {
    backgroundImageUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1200&q=80',
    overlayOpacity: 0.6,
    mainTitle: 'Our Moments',
    backgroundColor: '#000000',
    youtubeEmbedUrl: undefined,
    showYoutube: false,
    middleImages: [],
};
