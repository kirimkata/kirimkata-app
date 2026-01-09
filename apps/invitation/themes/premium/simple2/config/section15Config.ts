'use client';

export interface Simple2Section15SocialLinks {
    instagramUrl?: string;
    facebookUrl?: string;
    whatsappUrl?: string;
}

export interface Simple2Section15Config {
    backgroundImageUrl: string;
    overlayOpacity?: number;
    title: string;
    description: string;
    brandName: string;
    footerLabel: string;
    socialLinks?: Simple2Section15SocialLinks;
}

export const section15Config: Simple2Section15Config = {
    backgroundImageUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1200&q=80',
    overlayOpacity: 0.62,
    title: 'THANK YOU FOR YOUR\nATTENDANCE',
    description:
        'Merupakan suatu kebahagiaan dan kehormatan bagi kami\napabila Bapak/Ibu/Saudara/i berkenan hadir di hari\nbahagia kami.',
    brandName: 'kirimkata',
    footerLabel: 'Digital Wedding Invitation',
    socialLinks: {
        instagramUrl: '',
        facebookUrl: '',
        whatsappUrl: '',
    },
};
