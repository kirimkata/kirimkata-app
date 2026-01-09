'use client';

export interface Simple2Section3Config {
    backgroundImageUrl: string;
    overlayOpacity?: number;
    quoteText: string;
    signatureText?: string;
}

export const section3Config: Simple2Section3Config = {
    backgroundImageUrl: 'https://images.unsplash.com/photo-1523464862212-d6631d073194?w=1200&q=80',
    overlayOpacity: 0.55,
    quoteText:
        '“I never feel like I’m wasting time with you. We could sit in silence for hours and it would still feel so full and good and necessary. I’m so thankful for you.”',
    signatureText: undefined,
};
