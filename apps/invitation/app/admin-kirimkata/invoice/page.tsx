'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { InvitationAPI } from '@/lib/api/client';

interface Invoice {
    id: string;
    invoiceNumber: string;
    clientId: string;
    orderId: string;
    orderNumber?: string;
    total: number;
    paymentStatus: string;
    dueDate?: string;
    createdAt: string;
}

export default function InvoicesListPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        loadInvoices();
    }, [filter]);

    const loadInvoices = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token') || '';

            const filters = filter !== 'all' ? { status: filter } : undefined;
            const response = await InvitationAPI.getInvoices(token, filters);

            if (response.success) {
                setInvoices(response.data);
            } else {
                setError('Gagal memuat invoice');
            }
        } catch (err) {
            setError('Terjadi kesalahan saat memuat data');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadgeColor = (status: string) => {
        const colors: Record<string, string> = {
            unpaid: 'bg-red-100 text-red-800',
            pending_verification: 'bg-yellow-100 text-yellow-800',
            paid: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const formatStatus = (status: string) => {
        const labels: Record<string, string> = {
            unpaid: 'Belum Dibayar',
            pending_verification: 'Menunggu Verifikasi',
            paid: 'Lunas',
            rejected: 'Ditolak',
        };
        return labels[status] || status;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Invoice</h1>

                {/* Filter */}
                <select
                    className="px-4 py-2 border rounded-lg"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                >
                    <option value="all">Semua Invoice</option>
                    <option value="unpaid">Belum Dibayar</option>
                    <option value="pending_verification">Menunggu Verifikasi</option>
                    <option value="paid">Lunas</option>
                </select>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            {invoices.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <p className="text-gray-500 mb-4">
                        {filter !== 'all' ? 'Tidak ada invoice dengan status ini' : 'Belum ada invoice'}
                    </p>
                    <Link href="/admin-kirimkata/pesanan/buat">
                        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Buat Pesanan
                        </button>
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    No. Invoice
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    No. Pesanan
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Total
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Jatuh Tempo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Tanggal
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {invoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        {invoice.invoiceNumber}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        <Link
                                            href={`/admin-kirimkata/pesanan/${invoice.orderId}`}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            {invoice.orderNumber || invoice.orderId}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        Rp {invoice.total?.toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(invoice.paymentStatus)}`}>
                                            {formatStatus(invoice.paymentStatus)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('id-ID') : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(invoice.createdAt).toLocaleDateString('id-ID')}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <Link href={`/admin-kirimkata/invoice/${invoice.id}`}>
                                            <button className="text-blue-600 hover:text-blue-800">
                                                Lihat Detail
                                            </button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
