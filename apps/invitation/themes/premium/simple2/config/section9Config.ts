'use client';

export interface Simple2Section9Config {
    backgroundImageUrl: string;
    overlayOpacity?: number;
    thumbnailImageUrl: string;
    title: string;
    dateLabel: string;
    timeLabel: string;
    description: string;
    linkLabel: string;
}

export const section9Config: Simple2Section9Config = {
    backgroundImageUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1200&q=80',
    overlayOpacity: 0.6,
    thumbnailImageUrl: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=600&q=80',
    title: 'JOIN OUR WEDDING\nLIVE STREAMING',
    dateLabel: 'Sabtu, 17 Februari 202X',
    timeLabel: '08.00 - 10.00 WIB',
    description:
        'Moment bahagia proses pernikahan akan kami tayangkan secara virtual melalui platform berikut ini.',
    linkLabel: '@USERNAME',
};
