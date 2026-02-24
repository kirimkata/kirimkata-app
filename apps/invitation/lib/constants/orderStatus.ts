/**
 * Konstanta status pesanan dan pembayaran yang digunakan di semua halaman.
 * Gunakan file ini sebagai single source of truth untuk label dan warna status.
 */

export const PAYMENT_STATUS = {
    unpaid: {
        label: 'Belum Dibayar',
        bg: '#fef9c3',
        text: '#854d0e',
        badge: 'bg-yellow-100 text-yellow-800',
    },
    pending_verification: {
        label: 'Menunggu Verifikasi',
        bg: '#dbeafe',
        text: '#1e40af',
        badge: 'bg-blue-100 text-blue-800',
    },
    paid: {
        label: 'Lunas',
        bg: '#dcfce7',
        text: '#166534',
        badge: 'bg-green-100 text-green-800',
    },
    rejected: {
        label: 'Ditolak',
        bg: '#fee2e2',
        text: '#991b1b',
        badge: 'bg-red-100 text-red-800',
    },
} as const;

export const ORDER_STATUS = {
    pending: {
        label: 'Menunggu',
        badge: 'bg-yellow-100 text-yellow-800',
    },
    verified: {
        label: 'Aktif',
        badge: 'bg-green-100 text-green-800',
    },
    rejected: {
        label: 'Ditolak',
        badge: 'bg-red-100 text-red-800',
    },
    expired: {
        label: 'Kadaluarsa',
        badge: 'bg-gray-100 text-gray-600',
    },
    cancelled: {
        label: 'Dibatalkan',
        badge: 'bg-gray-100 text-gray-600',
    },
} as const;

/** Helper: dapatkan label payment status */
export function getPaymentLabel(status: string): string {
    return PAYMENT_STATUS[status as keyof typeof PAYMENT_STATUS]?.label ?? status;
}

/** Helper: dapatkan label order status */
export function getOrderLabel(status: string): string {
    return ORDER_STATUS[status as keyof typeof ORDER_STATUS]?.label ?? status;
}

/** Helper: dapatkan class badge payment status */
export function getPaymentBadgeClass(status: string): string {
    return PAYMENT_STATUS[status as keyof typeof PAYMENT_STATUS]?.badge ?? 'bg-gray-100 text-gray-600';
}

/** Helper: dapatkan class badge order status */
export function getOrderBadgeClass(status: string): string {
    return ORDER_STATUS[status as keyof typeof ORDER_STATUS]?.badge ?? 'bg-gray-100 text-gray-600';
}
