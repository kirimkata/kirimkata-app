'use client';

export interface Simple2Section10LinkConfig {
    label: string;
    url?: string;
}

export interface Simple2Section10Config {
    backgroundImageUrl: string;
    overlayOpacity?: number;
    eyebrow: string;
    title: string;
    description: string;
    weddingFrameLink: Simple2Section10LinkConfig;
    uploadPhotosLink: Simple2Section10LinkConfig;
    disclaimer: string;
}

export const section10Config: Simple2Section10Config = {
    backgroundImageUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1200&q=80',
    overlayOpacity: 0.62,
    eyebrow: 'CAPTURE YOUR MOMENT',
    title: 'WEDDING FRAME',
    description:
        'Unggah dan abadikan momen kamu saat menghadiri pernikahan kami dengan menggunakan Wedding Frame di bawah ini.',
    weddingFrameLink: {
        label: 'WEDDING FRAME',
        url: 'https://instagram.com',
    },
    uploadPhotosLink: {
        label: 'UPLOAD PHOTOS',
        url: 'https://instagram.com',
    },
    disclaimer: 'Disclaimer: Pastikan anda menggunakan Instagram versi terbaru.',
};
