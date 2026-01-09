'use client';

export interface Simple2GiftAccountConfig {
    id: string;
    label: string;
    accountNumber: string;
    accountName: string;
}

export interface Simple2GiftPhysicalConfig {
    recipientName: string;
    addressLines: string[];
}

export interface Simple2GiftRegistryItemConfig {
    id: string;
    title: string;
    priceLabel: string;
    amountLabel?: string;
    imageUrl: string;
    url?: string;
}

export interface Simple2Section14Config {
    backgroundImageUrl: string;
    overlayOpacity?: number;

    title: string;
    heroImageUrl: string;
    description: string;

    tabs: {
        eAmplopLabel: string;
        giftRegistryLabel: string;
    };

    eAmplop: {
        copyLabel: string;
        copiedLabel: string;
        confirmGiftLabel: string;
        destinationPhysicalLabel: string;
        fallbackAccounts: Simple2GiftAccountConfig[];
        fallbackPhysicalGift: Simple2GiftPhysicalConfig;
    };

    confirmation: {
        title: string;
        description: string;
        namePlaceholder: string;
        giftPlaceholder: string;
        destinationPlaceholder: string;
        confirmViaWhatsappLabel: string;
        backLabel: string;
    };

    giftRegistry: {
        addressTitle: string;
        recommendationsTitle: string;
        seeAllLabel: string;
        items: Simple2GiftRegistryItemConfig[];
    };

    whatsappNumber: string;
}

export const section14Config: Simple2Section14Config = {
    backgroundImageUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1200&q=80',
    overlayOpacity: 0.62,

    title: 'WEDDING GIFT',
    heroImageUrl: 'https://images.unsplash.com/photo-1523285367489-d38aec03b7b8?w=1200&q=80',
    description:
        'Tanpa mengurangi rasa hormat kami, bagi tamu yang ingin mengirimkan hadiah kepada kedua mempelai dapat mengirimnya melalui :',

    tabs: {
        eAmplopLabel: 'E-AMPLOP',
        giftRegistryLabel: 'GIFT REGISTRY',
    },

    eAmplop: {
        copyLabel: 'SALIN',
        copiedLabel: 'TERSALIN',
        confirmGiftLabel: 'KONFIRMASI KIRIM HADIAH',
        destinationPhysicalLabel: 'KIRIM KADO',
        fallbackAccounts: [
            {
                id: 'bca',
                label: 'BCA',
                accountNumber: '0123 456 789',
                accountName: 'Nama Penerima',
            },
            {
                id: 'bri',
                label: 'BRI',
                accountNumber: '0123 456 789',
                accountName: 'Nama Penerima',
            },
            {
                id: 'gopay',
                label: 'GOPAY',
                accountNumber: '0123 456 789',
                accountName: 'Nama Penerima',
            },
        ],
        fallbackPhysicalGift: {
            recipientName: 'Nama Penerima',
            addressLines: ['Jl. Lorem Ipsum No. 01, RT01 RW01,', 'Kel. Dolor, Kec. Sit Amet, Kota Bandung'],
        },
    },

    confirmation: {
        title: 'KONFIRMASI KIRIM HADIAH',
        description:
            'Tanpa mengurangi rasa hormat kami, bagi tamu yang telah mengirimkan hadiah kepada kedua mempelai harap konfirmasi pengiriman melalui form berikut ini :',
        namePlaceholder: 'Tuliskan Nama Anda',
        giftPlaceholder: 'Nominal/Kado',
        destinationPlaceholder: 'Rekening/Alamat Tujuan',
        confirmViaWhatsappLabel: 'KONFIRMASI VIA WHATSAPP',
        backLabel: 'KEMBALI',
    },

    giftRegistry: {
        addressTitle: 'KIRIM KADO',
        recommendationsTitle: 'REKOMENDASI KADO',
        seeAllLabel: 'LIHAT SEMUA KADO',
        items: [
            {
                id: 'gift-1',
                title: 'Debellin Cookware Set',
                priceLabel: 'Rp 899.000',
                amountLabel: 'Amount : 1',
                imageUrl: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=1200&q=80',
                url: '',
            },
            {
                id: 'gift-2',
                title: 'Sprei Bedcover',
                priceLabel: 'Rp 379.000',
                amountLabel: 'Amount : 1',
                imageUrl: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200&q=80',
                url: '',
            },
        ],
    },

    whatsappNumber: '6280000000000',
};
