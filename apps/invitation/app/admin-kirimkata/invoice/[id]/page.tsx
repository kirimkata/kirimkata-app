'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { InvitationAPI } from '@/lib/api/client';

interface Invoice {
    id: string;
    invoiceNumber: string;
    clientId: string;
    orderId: string;
    orderNumber?: string;
    orderTitle?: string;
    total: number;
    paymentStatus: string;
    dueDate?: string;
    paidAt?: string;
    createdAt: string;
    lineItems?: Array<{
        description: string;
        amount: number;
    }>;
}

export default function InvoiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const invoiceId = params?.id as string;

    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (invoiceId) {
            loadInvoiceDetails();
        }
    }, [invoiceId]);

    const loadInvoiceDetails = async () => {
        try {
            const token = localStorage.getItem('admin_token') || '';
            const response = await InvitationAPI.getInvoice(invoiceId, token);

            if (response.success) {
                setInvoice(response.data);
            } else {
                setError('Invoice tidak ditemukan');
            }
        } catch (err) {
            setError('Gagal memuat detail invoice');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadgeColor = (status: string) => {
        const colors: Record<string, string> = {
            unpaid: 'bg-red-100 text-red-800',
            awaiting_verification: 'bg-yellow-100 text-yellow-800',
            paid: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const formatStatus = (status: string) => {
        const labels: Record<string, string> = {
            unpaid: 'Belum Dibayar',
            awaiting_verification: 'Menunggu Verifikasi',
            paid: 'Lunas',
            rejected: 'Ditolak',
        };
        return labels[status] || status;
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">Invoice tidak ditemukan</p>
                    <Link href="/admin-kirimkata/invoice">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                            Kembali ke Daftar Invoice
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6 flex justify-between items-center print:hidden">
                <Link href="/admin-kirimkata/invoice" className="text-blue-600 hover:text-blue-800">
                    ← Kembali ke Daftar Invoice
                </Link>
                <button
                    onClick={handlePrint}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print Invoice
                </button>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 print:hidden">
                    {error}
                </div>
            )}

            {/* Invoice Card */}
            <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-start mb-8 pb-6 border-b">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">INVOICE</h1>
                        <p className="text-gray-600">#{invoice.invoiceNumber}</p>
                    </div>
                    <div className="text-right">
                        <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusBadgeColor(invoice.paymentStatus)}`}>
                            {formatStatus(invoice.paymentStatus)}
                        </span>
                        <p className="text-sm text-gray-600 mt-2">
                            Tanggal: {new Date(invoice.createdAt).toLocaleDateString('id-ID')}
                        </p>
                    </div>
                </div>

                {/* Company Info */}
                <div className="mb-8">
                    <h3 className="font-semibold text-lg mb-2">KirimKata</h3>
                    <p className="text-gray-600 text-sm">Platform Undangan Digital</p>
                    <p className="text-gray-600 text-sm">Indonesia</p>
                </div>

                {/* Invoice Details */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h4 className="font-semibold mb-2">Detail Invoice</h4>
                        <div className="text-sm space-y-1">
                            <p><strong>No. Invoice:</strong> {invoice.invoiceNumber}</p>
                            {invoice.orderNumber && (
                                <p>
                                    <strong>No. Pesanan:</strong>{' '}
                                    <Link
                                        href={`/admin-kirimkata/pesanan/${invoice.orderId}`}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        {invoice.orderNumber}
                                    </Link>
                                </p>
                            )}
                            {invoice.orderTitle && (
                                <p><strong>Judul:</strong> {invoice.orderTitle}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-2">Informasi Pembayaran</h4>
                        <div className="text-sm space-y-1">
                            {invoice.dueDate && (
                                <p><strong>Jatuh Tempo:</strong> {new Date(invoice.dueDate).toLocaleDateString('id-ID')}</p>
                            )}
                            {invoice.paidAt && (
                                <p><strong>Dibayar Pada:</strong> {new Date(invoice.paidAt).toLocaleDateString('id-ID')}</p>
                            )}
                            <p><strong>Status:</strong> {formatStatus(invoice.paymentStatus)}</p>
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                {invoice.lineItems && invoice.lineItems.length > 0 && (
                    <div className="mb-8">
                        <h4 className="font-semibold mb-4">Rincian</h4>
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Deskripsi</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Jumlah</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {invoice.lineItems.map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-3 text-sm">{item.description}</td>
                                        <td className="px-4 py-3 text-sm text-right">
                                            Rp {item.amount.toLocaleString('id-ID')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Total */}
                <div className="border-t pt-6">
                    <div className="flex justify-between items-center">
                        <span className="text-xl font-semibold">Total</span>
                        <span className="text-3xl font-bold text-blue-600">
                            Rp {invoice.total?.toLocaleString('id-ID')}
                        </span>
                    </div>
                </div>

                {/* Payment Instructions */}
                {invoice.paymentStatus === 'unpaid' && (
                    <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg print:hidden">
                        <h4 className="font-semibold mb-2">Instruksi Pembayaran</h4>
                        <p className="text-sm text-gray-700 mb-3">
                            Silakan lakukan pembayaran dan upload bukti pembayaran melalui halaman pesanan.
                        </p>
                        <Link href={`/admin-kirimkata/pesanan/${invoice.orderId}`}>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                Lihat Pesanan & Upload Bukti Bayar
                            </button>
                        </Link>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-12 pt-6 border-t text-center text-sm text-gray-500">
                    <p>Terima kasih atas kepercayaan Anda menggunakan KirimKata</p>
                    <p className="mt-1">Untuk pertanyaan, hubungi support@kirimkata.com</p>
                </div>
            </div>

            <style jsx>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
        </div>
    );
}
