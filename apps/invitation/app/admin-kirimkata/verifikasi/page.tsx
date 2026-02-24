'use client';

import { useState, useEffect, useCallback } from 'react';
import { InvitationAPI } from '@/lib/api/client';
import { CheckCircle, XCircle, Clock, RefreshCw, AlertCircle, Eye } from 'lucide-react';
import Link from 'next/link';

interface PendingOrder {
    id: string;
    orderNumber: string;
    title: string;
    slug: string;
    total: number;
    paymentStatus: string;
    paymentMethod?: string;
    paymentProofUrl?: string;
    paymentBank?: string;
    paymentAccountName?: string;
    createdAt: string;
    clientId: string;
}

export default function VerifikasiPage() {
    const [orders, setOrders] = useState<PendingOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState<string | null>(null);

    // Reject modal state
    const [rejectTarget, setRejectTarget] = useState<PendingOrder | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectLoading, setRejectLoading] = useState(false);
    const [rejectError, setRejectError] = useState('');

    const loadPendingOrders = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('admin_token') || '';
            const res = await InvitationAPI.getPendingOrders(token);
            if (res.success) {
                setOrders(res.data || []);
            } else {
                setError('Gagal memuat data pesanan pending.');
            }
        } catch {
            setError('Terjadi kesalahan saat memuat data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadPendingOrders(); }, [loadPendingOrders]);

    const handleVerify = async (order: PendingOrder) => {
        if (!confirm(`Verifikasi pembayaran untuk pesanan "${order.title}"?`)) return;
        setProcessing(order.id);
        try {
            const token = localStorage.getItem('admin_token') || '';
            const res = await InvitationAPI.verifyOrder(order.id, token);
            if (res.success) {
                alert(`✅ Pesanan "${order.title}" berhasil diverifikasi! Undangan telah dibuat.`);
                loadPendingOrders();
            } else {
                alert(`Gagal verifikasi: ${res.error || 'Unknown error'}`);
            }
        } catch {
            alert('Terjadi kesalahan saat memverifikasi.');
        } finally {
            setProcessing(null);
        }
    };

    const handleRejectSubmit = async () => {
        if (!rejectTarget) return;
        if (!rejectReason.trim()) { setRejectError('Alasan penolakan wajib diisi.'); return; }
        setRejectLoading(true);
        setRejectError('');
        try {
            const token = localStorage.getItem('admin_token') || '';
            const res = await InvitationAPI.rejectOrder(rejectTarget.id, rejectReason.trim(), token);
            if (res.success) {
                alert(`❌ Pesanan "${rejectTarget.title}" telah ditolak.`);
                setRejectTarget(null);
                setRejectReason('');
                loadPendingOrders();
            } else {
                setRejectError(res.error || 'Gagal menolak pesanan.');
            }
        } catch {
            setRejectError('Terjadi kesalahan.');
        } finally {
            setRejectLoading(false);
        }
    };

    const renderProof = (order: PendingOrder) => {
        if (!order.paymentProofUrl) return <span className="text-gray-400 text-xs">—</span>;
        if (order.paymentProofUrl.startsWith('QRIS-REF:')) {
            const refNum = order.paymentProofUrl.replace('QRIS-REF:', '');
            return (
                <div className="text-xs">
                    <span className="font-semibold text-blue-700">QRIS</span>
                    <div className="font-mono text-gray-700 mt-1 bg-gray-50 px-2 py-1 rounded border text-xs">{refNum}</div>
                    {order.paymentAccountName && (
                        <div className="text-gray-500 mt-0.5">Pengirim: {order.paymentAccountName}</div>
                    )}
                </div>
            );
        }
        return (
            <a href={order.paymentProofUrl} target="_blank" rel="noreferrer"
                className="text-blue-600 hover:text-blue-800 text-xs underline">
                Lihat Bukti
            </a>
        );
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Verifikasi Pembayaran</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Pesanan yang menunggu konfirmasi pembayaran dari admin
                    </p>
                </div>
                <button onClick={loadPendingOrders} disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-50">
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <RefreshCw size={28} className="animate-spin text-gray-400" />
                </div>
            ) : orders.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-16 text-center">
                    <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Tidak ada pesanan pending</h3>
                    <p className="text-gray-500 text-sm">Semua pesanan sudah diverifikasi.</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">No. Pesanan</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Undangan</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Bukti Bayar</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tanggal</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {orders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-sm text-gray-900">{order.orderNumber}</div>
                                        <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                            <Clock size={10} />
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                Menunggu Verifikasi
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-sm text-gray-900">{order.title}</div>
                                        <div className="text-xs text-blue-600 mt-0.5">kirimkata.com/{order.slug}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-sm text-gray-900">
                                            Rp {order.total?.toLocaleString('id-ID')}
                                        </div>
                                        {order.paymentMethod && (
                                            <div className="text-xs text-gray-500 mt-0.5 capitalize">
                                                {order.paymentMethod.replace(/_/g, ' ')}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 max-w-[180px]">
                                        {renderProof(order)}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500">
                                        {new Date(order.createdAt).toLocaleDateString('id-ID', {
                                            day: 'numeric', month: 'short', year: 'numeric'
                                        })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <Link href={`/admin-kirimkata/pesanan/${order.id}`}
                                                className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Lihat Detail">
                                                <Eye size={15} />
                                            </Link>
                                            <button
                                                onClick={() => handleVerify(order)}
                                                disabled={processing === order.id}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-semibold disabled:opacity-50 disabled:cursor-wait"
                                            >
                                                <CheckCircle size={13} />
                                                {processing === order.id ? 'Proses...' : 'Verifikasi'}
                                            </button>
                                            <button
                                                onClick={() => { setRejectTarget(order); setRejectReason(''); setRejectError(''); }}
                                                disabled={processing === order.id}
                                                className="flex items-center gap-1.5 px-3 py-1.5 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 text-xs font-semibold disabled:opacity-50"
                                            >
                                                <XCircle size={13} />
                                                Tolak
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Reject Modal */}
            {rejectTarget && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <XCircle size={20} className="text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Tolak Pembayaran</h3>
                                <p className="text-sm text-gray-500">{rejectTarget.title}</p>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Alasan Penolakan <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                rows={3}
                                value={rejectReason}
                                onChange={(e) => { setRejectReason(e.target.value); setRejectError(''); }}
                                placeholder="Contoh: Nominal transfer tidak sesuai, bukti pembayaran tidak valid, dll."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
                            />
                            {rejectError && (
                                <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">
                                    <AlertCircle size={11} /> {rejectError}
                                </p>
                            )}
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs text-amber-800">
                            Pesanan akan kembali ke status <strong>Ditolak</strong>. User dapat mengulang pembayaran.
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setRejectTarget(null)} disabled={rejectLoading}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                                Batal
                            </button>
                            <button onClick={handleRejectSubmit} disabled={rejectLoading}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                                {rejectLoading ? <RefreshCw size={13} className="animate-spin" /> : <XCircle size={13} />}
                                {rejectLoading ? 'Menolak...' : 'Tolak Pesanan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
