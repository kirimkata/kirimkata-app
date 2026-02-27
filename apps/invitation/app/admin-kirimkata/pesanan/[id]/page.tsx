'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { InvitationAPI } from '@/lib/api/client';
import { CheckCircle, XCircle, RefreshCw, AlertCircle } from 'lucide-react';

interface Order {
    id: string;
    orderNumber: string;
    clientId: string;
    type: string;
    title: string;
    slug: string;
    mainDate: string;
    templateId: number;
    templateName?: string;
    basePrice: number;
    selectedAddons: any[];
    total: number;
    paymentStatus: string;
    orderStatus: string;
    paymentProofUrl?: string;
    paymentMethod?: string;
    createdAt: string;
}

interface Invoice {
    id: string;
    invoiceNumber: string;
    total: number;
    paymentStatus: string;
    dueDate?: string;
}

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params?.id as string;

    const [order, setOrder] = useState<Order | null>(null);
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Admin verify/reject state
    const [verifying, setVerifying] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectLoading, setRejectLoading] = useState(false);
    const [rejectError, setRejectError] = useState('');
    const [actionSuccess, setActionSuccess] = useState('');

    useEffect(() => {
        if (orderId) {
            loadOrderDetails();
        }
    }, [orderId]);

    const loadOrderDetails = async () => {
        try {
            const token = localStorage.getItem('admin_token') || '';

            // API returns { order, template, invoice, invitation }
            const orderResponse = await InvitationAPI.getOrder(orderId, token);
            if (orderResponse.success) {
                const { order: rawOrder, template, invoice: rawInvoice } = orderResponse.data;

                // Map DB field names → interface field names
                setOrder({
                    ...rawOrder,
                    basePrice: rawOrder.templatePrice,
                    selectedAddons: rawOrder.addons || [],
                    orderStatus: rawOrder.status,
                    templateName: template?.name || 'Template',
                });

                if (rawInvoice) {
                    setInvoice(rawInvoice);
                }
            }
        } catch (err) {
            setError('Gagal memuat detail pesanan');
        } finally {
            setLoading(false);
        }
    };

    const handleUploadPayment = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!paymentData.paymentProofUrl) {
            setError('URL bukti pembayaran wajib diisi');
            return;
        }

        try {
            setUploading(true);
            setError('');

            const token = localStorage.getItem('admin_token') || '';
            const response = await InvitationAPI.uploadPaymentProof(orderId, paymentData, token);

            if (response.success) {
                setShowUploadModal(false);
                loadOrderDetails();
                alert('Bukti pembayaran berhasil diupload! Menunggu verifikasi admin.');
            } else {
                setError(response.error || 'Gagal mengupload bukti pembayaran');
            }
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan');
        } finally {
            setUploading(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!confirm('Apakah Anda yakin ingin membatalkan pesanan ini?')) {
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token') || '';
            const response = await InvitationAPI.cancelOrder(orderId, token);

            if (response.success) {
                alert('Pesanan berhasil dibatalkan');
                router.push('/admin-kirimkata/pesanan');
            } else {
                setError(response.error || 'Gagal membatalkan pesanan');
            }
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan');
        } finally {
            setLoading(false);
        }
    };

    // Admin: Verify payment
    const handleVerify = async () => {
        if (!confirm('Verifikasi pembayaran ini? Undangan akan langsung dibuat.')) return;
        setVerifying(true);
        setError('');
        try {
            const token = localStorage.getItem('admin_token') || '';
            const res = await InvitationAPI.verifyOrder(orderId, token);
            if (res.success) {
                setActionSuccess('✅ Pembayaran berhasil diverifikasi! Undangan telah dibuat.');
                loadOrderDetails();
            } else {
                setError(res.error || 'Gagal memverifikasi pembayaran.');
            }
        } catch {
            setError('Terjadi kesalahan saat verifikasi.');
        } finally {
            setVerifying(false);
        }
    };

    // Admin: Reject payment
    const handleRejectSubmit = async () => {
        if (!rejectReason.trim()) { setRejectError('Alasan penolakan wajib diisi.'); return; }
        setRejectLoading(true);
        setRejectError('');
        try {
            const token = localStorage.getItem('admin_token') || '';
            const res = await InvitationAPI.rejectOrder(orderId, rejectReason.trim(), token);
            if (res.success) {
                setShowRejectModal(false);
                setRejectReason('');
                setActionSuccess('❌ Pembayaran ditolak. User dapat mengulang pembayaran.');
                loadOrderDetails();
            } else {
                setRejectError(res.error || 'Gagal menolak pembayaran.');
            }
        } catch {
            setRejectError('Terjadi kesalahan.');
        } finally {
            setRejectLoading(false);
        }
    };

    const [paymentData, setPaymentData] = useState({
        paymentProofUrl: '',
        paymentMethod: 'manual_transfer',
        paymentBank: '',
        paymentAccountName: '',
    });

    const getStatusBadgeColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800',
            verified: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            expired: 'bg-gray-100 text-gray-800',
            cancelled: 'bg-gray-100 text-gray-800',
            unpaid: 'bg-red-100 text-red-800',
            pending_verification: 'bg-yellow-100 text-yellow-800',
            paid: 'bg-green-100 text-green-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const formatStatus = (status: string) => {
        const labels: Record<string, string> = {
            pending: 'Pending',
            verified: 'Terverifikasi',
            rejected: 'Ditolak',
            expired: 'Kadaluarsa',
            cancelled: 'Dibatalkan',
            unpaid: 'Belum Dibayar',
            pending_verification: 'Menunggu Verifikasi',
            paid: 'Lunas',
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

    if (!order) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">Pesanan tidak ditemukan</p>
                    <Link href="/admin-kirimkata/pesanan">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                            Kembali ke Daftar Pesanan
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <Link href="/admin-kirimkata/pesanan" className="text-blue-600 hover:text-blue-800">
                    ← Kembali ke Daftar Pesanan
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-bold mb-2">{order.title}</h1>
                        <p className="text-gray-600">Pesanan #{order.orderNumber}</p>
                    </div>
                    <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm ${getStatusBadgeColor(order.orderStatus)}`}>
                            {formatStatus(order.orderStatus)}
                        </span>
                        <br />
                        <span className={`px-3 py-1 rounded-full text-sm mt-2 inline-block ${getStatusBadgeColor(order.paymentStatus)}`}>
                            {formatStatus(order.paymentStatus)}
                        </span>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <h3 className="font-semibold mb-3">Informasi Pesanan</h3>
                        <div className="space-y-2 text-sm">
                            <p><strong>Slug:</strong> /{order.slug}</p>
                            <p><strong>Tanggal Acara:</strong> {new Date(order.mainDate).toLocaleDateString('id-ID')}</p>
                            <p><strong>Tipe:</strong> {order.type}</p>
                            <p><strong>Tanggal Pesanan:</strong> {new Date(order.createdAt).toLocaleDateString('id-ID')}</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-3">Template & Add-ons</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>{order.templateName || 'Template'}</span>
                                <span>Rp {order.basePrice?.toLocaleString('id-ID') ?? '-'}</span>
                            </div>
                            {order.selectedAddons && order.selectedAddons.map((addon: any, i: number) => (
                                <div key={i} className="flex justify-between">
                                    <span>{addon.name}</span>
                                    <span>Rp {addon.price?.toLocaleString('id-ID') ?? '-'}</span>
                                </div>
                            ))}
                            <div className="border-t pt-2 flex justify-between font-bold">
                                <span>Total</span>
                                <span className="text-blue-600">Rp {order.total?.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Invoice Information */}
                {invoice && (
                    <div className="border-t pt-6 mb-6">
                        <h3 className="font-semibold mb-3">Informasi Invoice</h3>
                        <div className="space-y-2 text-sm">
                            <p><strong>No. Invoice:</strong> {invoice.invoiceNumber}</p>
                            <p><strong>Total:</strong> Rp {invoice.total?.toLocaleString('id-ID')}</p>
                            <p><strong>Status Pembayaran:</strong> <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusBadgeColor(invoice.paymentStatus)}`}>{formatStatus(invoice.paymentStatus)}</span></p>
                            {invoice.dueDate && (
                                <p><strong>Jatuh Tempo:</strong> {new Date(invoice.dueDate).toLocaleDateString('id-ID')}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Payment Proof */}
                {order.paymentProofUrl && (
                    <div className="border-t pt-6 mb-6">
                        <h3 className="font-semibold mb-3">Bukti Pembayaran</h3>
                        {order.paymentProofUrl.startsWith('QRIS-REF:') ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm font-medium text-blue-800 mb-1">Pembayaran via QRIS</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs text-gray-600">Nomor Referensi:</span>
                                    <code className="font-mono text-sm bg-white border border-blue-200 px-3 py-1 rounded text-gray-900">
                                        {order.paymentProofUrl.replace('QRIS-REF:', '')}
                                    </code>
                                </div>
                                {order.paymentMethod && (
                                    <p className="text-xs text-gray-500 mt-2">Metode: {order.paymentMethod.replace(/_/g, ' ')}</p>
                                )}
                            </div>
                        ) : (
                            <div>
                                <img
                                    src={order.paymentProofUrl}
                                    alt="Bukti Pembayaran"
                                    className="max-w-md rounded-lg border"
                                />
                                {order.paymentMethod && (
                                    <p className="text-sm text-gray-600 mt-2">Metode: {order.paymentMethod}</p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Action Success Banner */}
                {actionSuccess && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm font-medium">
                        {actionSuccess}
                    </div>
                )}

                {/* Admin: Verifikasi Pembayaran */}
                {order.paymentStatus === 'pending_verification' && (
                    <div className="border-t pt-6 mb-6">
                        <h3 className="font-semibold mb-3 text-blue-900">Verifikasi Pembayaran</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Periksa bukti pembayaran di atas, lalu pilih tindakan:
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleVerify}
                                disabled={verifying}
                                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50 disabled:cursor-wait"
                            >
                                <CheckCircle size={16} />
                                {verifying ? 'Memverifikasi...' : 'Verifikasi Pembayaran'}
                            </button>
                            <button
                                onClick={() => { setShowRejectModal(true); setRejectReason(''); setRejectError(''); }}
                                disabled={verifying}
                                className="flex items-center gap-2 px-6 py-2.5 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 font-semibold disabled:opacity-50"
                            >
                                <XCircle size={16} />
                                Tolak Pembayaran
                            </button>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4">
                    {order.paymentStatus === 'unpaid' && order.orderStatus === 'pending' && (
                        <>
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Upload Bukti Pembayaran
                            </button>
                            <button
                                onClick={handleCancelOrder}
                                className="px-6 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50"
                            >
                                Batalkan Pesanan
                            </button>
                        </>
                    )}

                    {order.orderStatus === 'verified' && (
                        <Link href={`/client-dashboard/edit-undangan?slug=${order.slug}`}>
                            <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                Lihat Undangan
                            </button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Upload Payment Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4">Upload Bukti Pembayaran</h3>

                        <form onSubmit={handleUploadPayment}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">URL Bukti Pembayaran *</label>
                                <input
                                    type="url"
                                    className="w-full px-4 py-2 border rounded-lg"
                                    placeholder="https://..."
                                    value={paymentData.paymentProofUrl}
                                    onChange={(e) => setPaymentData({ ...paymentData, paymentProofUrl: e.target.value })}
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Upload gambar ke layanan seperti Imgur atau imgbb</p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Metode Pembayaran</label>
                                <select
                                    className="w-full px-4 py-2 border rounded-lg"
                                    value={paymentData.paymentMethod}
                                    onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                                >
                                    <option value="manual_transfer">Transfer Bank</option>
                                    <option value="e_wallet">E-Wallet</option>
                                    <option value="qris">QRIS</option>
                                </select>
                            </div>

                            {paymentData.paymentMethod === 'manual_transfer' && (
                                <>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium mb-2">Nama Bank</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 border rounded-lg"
                                            placeholder="Contoh: BCA, Mandiri"
                                            value={paymentData.paymentBank}
                                            onChange={(e) => setPaymentData({ ...paymentData, paymentBank: e.target.value })}
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium mb-2">Nama Pemilik Rekening</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 border rounded-lg"
                                            value={paymentData.paymentAccountName}
                                            onChange={(e) => setPaymentData({ ...paymentData, paymentAccountName: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowUploadModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    disabled={uploading}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                                    disabled={uploading}
                                >
                                    {uploading ? 'Uploading...' : 'Upload'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reject Payment Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <XCircle size={20} className="text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Tolak Pembayaran</h3>
                                <p className="text-sm text-gray-500">{order?.title}</p>
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
                            Pesanan akan dikembalikan ke status <strong>Ditolak</strong>. User dapat mengulang pembayaran.
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setShowRejectModal(false)} disabled={rejectLoading}
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
