'use client';

export interface Simple2Section2Config {
    backgroundImageUrl: string;
    overlayOpacity?: number;
    quoteText: string;
    quoteReference: string;
}

export const section2Config: Simple2Section2Config = {
    backgroundImageUrl: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=1200&q=80',
    overlayOpacity: 0.65,
    quoteText:
        '“Two are better than one, because they have a good reward for their toil. For if they fall, one will lift up his fellow. But woe to him who is alone when he falls and has not another to lift him up.”',
    quoteReference: 'Ecclesiastes 4:9-10',
};
