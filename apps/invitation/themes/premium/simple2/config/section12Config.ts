'use client';

export interface Simple2Section12Labels {
    nameLabel: string;
    messageLabel: string;
    attendanceLabel: string;
    hadirLabel: string;
    tidakHadirLabel: string;
    nextLabel: string;
    prevLabel: string;
    submitLabel: string;
}

export interface Simple2Section12Config {
    backgroundImageUrl: string;
    overlayOpacity?: number;
    title: string;
    description: string;
    labels: Simple2Section12Labels;
}

export const section12Config: Simple2Section12Config = {
    backgroundImageUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1200&q=80',
    overlayOpacity: 0.62,
    title: 'RSVP',
    description:
        'Bagi tamu undangan yang akan hadir di acara pernikahan kami silahkan kirimkan konfirmasi kehadiran dengan mengisi form berikut :',
    labels: {
        nameLabel: 'Nama',
        messageLabel: 'Doa & Ucapan',
        attendanceLabel: 'Konfirmasi Kehadiran',
        hadirLabel: 'Hadir',
        tidakHadirLabel: 'Tidak Hadir',
        nextLabel: 'Selanjutnya',
        prevLabel: 'Sebelumnya',
        submitLabel: 'Kirim',
    },
};
