'use client';

export interface Simple2EventDetailConfig {
    title: string;
    dateLabel: string;
    timeLabel: string;
    venueName: string;
    venueAddress: string;
    mapsUrl: string;
    mapsLabel: string;
}

export interface Simple2Section7Config {
    backgroundImageUrl: string;
    overlayOpacity?: number;
    fullDateLabel: string;
    holyMatrimony: Simple2EventDetailConfig;
    reception: Simple2EventDetailConfig;
}

export const section7Config: Simple2Section7Config = {
    backgroundImageUrl: 'https://images.unsplash.com/photo-1530026186672-2cd00ffc50d1?w=1200&q=80',
    overlayOpacity: 0.55,
    fullDateLabel: 'Sabtu, 17 Februari 202X',
    holyMatrimony: {
        title: 'HOLY MATRIMONY',
        dateLabel: 'Sabtu, 17 Februari 202X',
        timeLabel: '08.00 - 10.00 WIB',
        venueName: 'VUE PALACE HOTEL',
        venueAddress: 'Jl. Otto Iskandar Dinata No.3, Babakan Ciamis, Kec. Sumur Bandung, Kota Bandung',
        mapsUrl: 'https://maps.google.com',
        mapsLabel: 'GOOGLE MAPS',
    },
    reception: {
        title: 'RECEPTION',
        dateLabel: 'Sabtu, 17 Februari 202X',
        timeLabel: '11.00 - 14.00 WIB',
        venueName: 'VUE PALACE HOTEL',
        venueAddress: 'Jl. Otto Iskandar Dinata No.3, Babakan Ciamis, Kec. Sumur Bandung, Kota Bandung',
        mapsUrl: 'https://maps.google.com',
        mapsLabel: 'GOOGLE MAPS',
    },
};
