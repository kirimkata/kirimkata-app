'use client';

export interface Simple2LoveStoryBlock {
    title?: string;
    body: string;
}

export interface Simple2Section5Config {
    backgroundImageUrl: string;
    overlayOpacity?: number;
    centerImageUrl: string;
    mainTitle: string;
    blocks: Simple2LoveStoryBlock[];
}

export const section5Config: Simple2Section5Config = {
    backgroundImageUrl: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=1200&q=80',
    overlayOpacity: 0.6,
    centerImageUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=900&q=80',
    mainTitle: 'A PEAK OF LOVE',
    blocks: [
        {
            title: 'Awal Bertemu',
            body:
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Nulla facilisi cras fermentum odio eu feugiat pretium nibh ipsum.',
        },
        {
            title: 'Menjalin Hubungan',
            body:
                'Conditum mattis pellentesque id nibh tortor id aliquet. Quis imperdiet massa tincidunt nunc pulvinar sapien et ligula ullamcorper. Vestibulum morbi blandit cursus risus.',
        },
        {
            title: 'Bertunangan',
            body:
                'Magna fermentum iaculis eu non. Pretium lectus quam id leo. Arcu vitae elementum curabitur vitae nunc sed.',
        },
        {
            title: 'Hari Pernikahan',
            body:
                'Donec ac odio tempor orci dapibus ultrices in iaculis nunc. Sed adipiscing diam donec adipiscing tristique risus.',
        },
    ],
};
