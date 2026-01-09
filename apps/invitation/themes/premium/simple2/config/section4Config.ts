'use client';

export interface Simple2Section4Config {
    backgroundImageUrl: string;
    overlayOpacity?: number;
    gradientStartOpacity?: number;
    gradientEndOpacity?: number;
    gradientStopPercent?: number;
}

export const section4Config: Simple2Section4Config = {
    backgroundImageUrl: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=1200&q=80',
    overlayOpacity: 0.0,
    gradientStartOpacity: 0.85,
    gradientEndOpacity: 0.0,
    gradientStopPercent: 65,
};
