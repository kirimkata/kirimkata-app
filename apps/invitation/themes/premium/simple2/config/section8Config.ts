'use client';

export interface Simple2Section8Config {
    backgroundImageUrl: string;
    overlayOpacity?: number;
    title: string;
    description: string;
    colors: string[];
}

export const section8Config: Simple2Section8Config = {
    backgroundImageUrl: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1200&q=80',
    overlayOpacity: 0.45,
    title: 'A GUIDE TO ATTIRE',
    description: 'Kami dengan hormat menganjurkan para tamu kami untuk mengenakan warna-warna ini untuk hari istimewa kami.',
    colors: ['#E9E9E9', '#455046', '#313131', '#C9B4B1'],
};
