'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    FileText, Clock, CheckCircle2, XCircle, ChevronRight,
    AlertCircle, Loader2, RefreshCw, Plus, Copy, Check
} from 'lucide-react';
import Image from 'next/image';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.kirimkata.com';
const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('client_token') : null;
const authFetch = (url: string, opts: RequestInit = {}) =>
    fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(opts.headers as any) } });

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
    unpaid: { label: 'Belum Dibayar', bg: '#fef9c3', text: '#854d0e', icon: Clock },
    pending_verification: { label: 'Menunggu Verifikasi', bg: '#dbeafe', text: '#1e40af', icon: Clock },
    paid: { label: 'Lunas', bg: '#dcfce7', text: '#166534', icon: CheckCircle2 },
    rejected: { label: 'Ditolak', bg: '#fee2e2', text: '#991b1b', icon: XCircle },
};

/* ─── QRIS Static Payment Modal ─── */
function PaymentModal({ invoice, onClose, onSuccess, colors }: {
    invoice: any; onClose: () => void; onSuccess: () => void; colors: any;
}) {
    const [step, setStep] = useState<'qris' | 'confirm'>('qris');
    const [refNumber, setRefNumber] = useState('');
    const [payerName, setPayerName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const totalAmount = invoice.total;

    const copyAmount = () => {
        navigator.clipboard.writeText(String(totalAmount));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleConfirm = async () => {
        if (!refNumber.trim()) { setError('Nomor referensi transaksi wajib diisi.'); return; }
        setLoading(true);
        setError('');
        try {
            const res = await authFetch(`${API_BASE}/v1/orders/${invoice.orderId}/payment-proof`, {
                method: 'POST',
                body: JSON.stringify({
                    paymentProofUrl: `QRIS-REF:${refNumber.trim()}`,
                    paymentMethod: 'qris_static',
                    paymentBank: 'QRIS',
                    paymentAccountName: payerName.trim() || 'Tidak diisi',
                }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'Gagal mengirim konfirmasi pembayaran.');
            onSuccess();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8,
        border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.text, fontSize: 14, outline: 'none',
    };

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div style={{ backgroundColor: colors.card, borderRadius: 16, width: 460, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>

                {/* Header */}
                <div style={{ padding: '24px 28px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <h3 style={{ fontSize: 17, fontWeight: 700, color: colors.text }}>Pembayaran via QRIS</h3>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textSecondary, fontSize: 20, lineHeight: 1 }}>×</button>
                    </div>
                    <p style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 20 }}>
                        Invoice <strong>{invoice.invoiceNumber}</strong>
                    </p>

                    {/* Step tabs */}
                    <div style={{ display: 'flex', borderBottom: `1px solid ${colors.border}`, marginBottom: 24 }}>
                        {[{ k: 'qris', label: '1. Scan QRIS' }, { k: 'confirm', label: '2. Konfirmasi' }].map(s => (
                            <button key={s.k} onClick={() => step === 'confirm' && s.k === 'qris' && setStep('qris')}
                                style={{ flex: 1, padding: '10px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: step === s.k ? colors.primary : colors.textSecondary, borderBottom: `2px solid ${step === s.k ? colors.primary : 'transparent'}`, transition: 'all 0.15s' }}>
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Body */}
                <div style={{ padding: '0 28px 28px' }}>
                    {step === 'qris' && (
                        <div>
                            {/* Amount box */}
                            <div style={{ backgroundColor: colors.hover, borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 2 }}>Jumlah yang harus dibayar</div>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: colors.text }}>Rp {totalAmount?.toLocaleString('id-ID')}</div>
                                </div>
                                <button onClick={copyAmount}
                                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 8, border: `1px solid ${colors.border}`, backgroundColor: colors.card, color: colors.text, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                                    {copied ? <Check size={13} style={{ color: '#22c55e' }} /> : <Copy size={13} />}
                                    {copied ? 'Tersalin' : 'Salin'}
                                </button>
                            </div>

                            {/* QRIS image */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
                                <div style={{ border: `2px solid ${colors.border}`, borderRadius: 12, padding: 12, backgroundColor: '#fff', display: 'inline-block' }}>
                                    <Image
                                        src="/qr-code-example.webp"
                                        alt="QRIS KirimKata"
                                        width={220}
                                        height={220}
                                        style={{ display: 'block', borderRadius: 6 }}
                                    />
                                </div>
                                <p style={{ fontSize: 12, color: colors.textSecondary, marginTop: 10, textAlign: 'center' }}>
                                    Scan menggunakan aplikasi m-banking atau e-wallet apapun
                                </p>
                            </div>

                            {/* Instructions */}
                            <div style={{ backgroundColor: `${colors.primary}10`, borderRadius: 10, padding: '14px 16px', marginBottom: 24, border: `1px solid ${colors.primary}20` }}>
                                <p style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 8 }}>Cara Bayar:</p>
                                {[
                                    'Buka aplikasi m-banking atau e-wallet (GoPay, OVO, Dana, dll.)',
                                    `Transfer tepat sejumlah Rp ${totalAmount?.toLocaleString('id-ID')}`,
                                    'Catat nomor referensi/ID transaksi setelah berhasil',
                                    'Klik tombol di bawah dan masukkan nomor referensi tersebut',
                                ].map((step, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: i < 3 ? 6 : 0 }}>
                                        <span style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: colors.primary, color: colors.primaryText, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                                        <span style={{ fontSize: 13, color: colors.text }}>{step}</span>
                                    </div>
                                ))}
                            </div>

                            <button onClick={() => setStep('confirm')}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '12px', borderRadius: 8, border: 'none', backgroundColor: colors.primary, color: colors.primaryText, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                                Sudah Bayar, Konfirmasi <ChevronRight size={15} />
                            </button>
                        </div>
                    )}

                    {step === 'confirm' && (
                        <div>
                            <div style={{ marginBottom: 18 }}>
                                <label style={{ fontSize: 13, fontWeight: 500, color: colors.textSecondary, display: 'block', marginBottom: 6 }}>
                                    Nomor Referensi / ID Transaksi <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input value={refNumber} onChange={e => { setRefNumber(e.target.value); setError(''); }}
                                    placeholder="Contoh: 1234567890 atau TRF2024XXXXX"
                                    style={inputStyle} />
                                <p style={{ fontSize: 11, color: colors.textSecondary, marginTop: 5 }}>
                                    Nomor ini ada di riwayat transaksi atau notifikasi berhasil dari aplikasi Anda.
                                </p>
                            </div>

                            <div style={{ marginBottom: 20 }}>
                                <label style={{ fontSize: 13, fontWeight: 500, color: colors.textSecondary, display: 'block', marginBottom: 6 }}>
                                    Nama Pengirim (opsional)
                                </label>
                                <input value={payerName} onChange={e => setPayerName(e.target.value)}
                                    placeholder="Nama sesuai rekening / akun"
                                    style={inputStyle} />
                            </div>

                            {/* Summary box */}
                            <div style={{ backgroundColor: colors.hover, borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <span style={{ fontSize: 13, color: colors.textSecondary }}>Invoice</span>
                                    <span style={{ fontSize: 13, color: colors.text, fontWeight: 500 }}>{invoice.invoiceNumber}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: 13, color: colors.textSecondary }}>Total</span>
                                    <span style={{ fontSize: 14, color: colors.text, fontWeight: 700 }}>Rp {totalAmount?.toLocaleString('id-ID')}</span>
                                </div>
                            </div>

                            {error && (
                                <div style={{ display: 'flex', gap: 8, padding: '10px 14px', backgroundColor: '#fee2e2', borderRadius: 8, marginBottom: 16, color: '#dc2626', fontSize: 13 }}>
                                    <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: 10 }}>
                                <button onClick={() => setStep('qris')}
                                    style={{ flex: 1, padding: '11px', borderRadius: 8, border: `1px solid ${colors.border}`, backgroundColor: 'transparent', color: colors.text, fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>
                                    Kembali
                                </button>
                                <button onClick={handleConfirm} disabled={loading}
                                    style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px', borderRadius: 8, border: 'none', backgroundColor: loading ? colors.border : colors.primary, color: loading ? colors.textSecondary : colors.primaryText, fontSize: 14, fontWeight: 600, cursor: loading ? 'wait' : 'pointer' }}>
                                    {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                                    {loading ? 'Mengirim...' : 'Kirim Konfirmasi'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

/* ─── Main Invoice Page ─── */
export default function InvoicePage() {
    const { colors } = useTheme();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
    const [payTarget, setPayTarget] = useState<any | null>(null);
    const [showNewBanner, setShowNewBanner] = useState(false);

    useEffect(() => {
        if (searchParams?.get('new') === '1') {
            setShowNewBanner(true);
            // Auto-dismiss after 8 seconds
            setTimeout(() => setShowNewBanner(false), 8000);
        }
    }, [searchParams]);

    const fetchInvoices = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await authFetch(`${API_BASE}/v1/invoices`);
            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'Gagal memuat invoice.');
            setInvoices(data.data || []);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchInvoices(); }, []);

    const filtered = invoices.filter(inv => {
        if (filter === 'unpaid') return inv.paymentStatus !== 'paid';
        if (filter === 'paid') return inv.paymentStatus === 'paid';
        return true;
    });

    const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

    const StatusBadge = ({ status }: { status: string }) => {
        const cfg = STATUS_CONFIG[status] || { label: status, bg: colors.hover, text: colors.textSecondary, icon: Clock };
        const Icon = cfg.icon;
        return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, backgroundColor: cfg.bg, color: cfg.text, fontSize: 12, fontWeight: 600 }}>
                <Icon size={12} /> {cfg.label}
            </span>
        );
    };

    const thStyle: React.CSSProperties = { padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${colors.border}`, whiteSpace: 'nowrap' };
    const tdStyle: React.CSSProperties = { padding: '14px 16px', fontSize: 14, color: colors.text, borderBottom: `1px solid ${colors.border}` };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: `3px solid ${colors.border}`, borderTopColor: colors.primary, animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.text, marginBottom: 6 }}>Invoice</h1>
                    <p style={{ fontSize: 14, color: colors.textSecondary }}>Riwayat transaksi dan status pembayaran undangan Anda.</p>
                </div>
                <button onClick={() => router.push('/client-dashboard/new-order')}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 8, border: 'none', backgroundColor: colors.primary, color: colors.primaryText, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                    <Plus size={16} /> Buat Undangan Baru
                </button>
            </div>

            {error && (
                <div style={{ display: 'flex', gap: 10, padding: '14px 16px', backgroundColor: '#fee2e2', borderRadius: 8, marginBottom: 20, color: '#dc2626', fontSize: 14 }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} /> {error}
                    <button onClick={fetchInvoices} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                        <RefreshCw size={13} /> Coba lagi
                    </button>
                </div>
            )}

            {/* Banner sukses setelah buat pesanan baru */}
            {showNewBanner && (
                <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '16px 20px', backgroundColor: '#dcfce7', borderRadius: 10,
                    border: '1px solid #86efac', marginBottom: 20,
                }}>
                    <CheckCircle2 size={20} style={{ color: '#16a34a', flexShrink: 0, marginTop: 1 }} />
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#15803d', marginBottom: 4 }}>
                            🎉 Pesanan berhasil dibuat!
                        </p>
                        <p style={{ fontSize: 13, color: '#166534' }}>
                            Silakan selesaikan pembayaran dengan menekan tombol <strong>Bayar Sekarang</strong> di invoice di bawah ini.
                            Setelah pembayaran dikonfirmasi, undangan Anda akan segera diaktifkan.
                        </p>
                    </div>
                    <button onClick={() => setShowNewBanner(false)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', fontSize: 18, lineHeight: 1, padding: 0, flexShrink: 0 }}>
                        ×
                    </button>
                </div>
            )}

            {/* Filters */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
                {[{ v: 'all', label: 'Semua' }, { v: 'unpaid', label: 'Belum Lunas' }, { v: 'paid', label: 'Lunas' }].map(f => (
                    <button key={f.v} onClick={() => setFilter(f.v as any)}
                        style={{ padding: '7px 16px', borderRadius: 20, border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', backgroundColor: filter === f.v ? colors.primary : 'transparent', color: filter === f.v ? colors.primaryText : colors.textSecondary }}>
                        {f.label}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: colors.card, borderRadius: 12, border: `1px dashed ${colors.border}` }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: colors.hover, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: colors.textSecondary }}>
                        <FileText size={26} />
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: colors.text, marginBottom: 8 }}>Belum ada invoice</h3>
                    <p style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 20 }}>
                        {filter === 'all' ? 'Buat undangan baru untuk memulai.' : 'Tidak ada invoice dengan status ini.'}
                    </p>
                    {filter === 'all' && (
                        <button onClick={() => router.push('/client-dashboard/new-order')}
                            style={{ padding: '10px 20px', borderRadius: 8, border: 'none', backgroundColor: colors.primary, color: colors.primaryText, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                            Buat Undangan Baru
                        </button>
                    )}
                </div>
            ) : (
                <div style={{ backgroundColor: colors.card, borderRadius: 12, border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ backgroundColor: colors.hover }}>
                            <tr>
                                <th style={thStyle}>No. Invoice</th>
                                <th style={thStyle}>Judul Undangan</th>
                                <th style={thStyle}>Tanggal</th>
                                <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
                                <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                                <th style={{ ...thStyle, textAlign: 'center' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((inv) => (
                                <tr key={inv.id}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = colors.hover)}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                                    <td style={tdStyle}>
                                        <div style={{ fontWeight: 600 }}>{inv.invoiceNumber}</div>
                                        {inv.order?.orderNumber && <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>{inv.order.orderNumber}</div>}
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{ fontWeight: 500 }}>{inv.order?.title || '—'}</div>
                                        {inv.order?.slug && <div style={{ fontSize: 11, color: colors.primary, marginTop: 2 }}>kirimkata.com/{inv.order.slug}</div>}
                                    </td>
                                    <td style={tdStyle}>
                                        <div>{formatDate(inv.invoiceDate)}</div>
                                        {inv.dueDate && inv.paymentStatus !== 'paid' && (
                                            <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Jatuh tempo: {formatDate(inv.dueDate)}</div>
                                        )}
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, fontSize: 15 }}>
                                        Rp {inv.total?.toLocaleString('id-ID')}
                                        {inv.discount > 0 && <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 400 }}>- Rp {inv.discount?.toLocaleString('id-ID')}</div>}
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                                        <StatusBadge status={inv.paymentStatus} />
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                                        {(inv.paymentStatus === 'unpaid' || inv.paymentStatus === 'rejected') && (
                                            <button onClick={() => setPayTarget(inv)}
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 16px', borderRadius: 8, border: `1px solid ${colors.primary}`, backgroundColor: 'transparent', color: colors.primary, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                                                Bayar Sekarang
                                            </button>
                                        )}
                                        {inv.paymentStatus === 'pending_verification' && (
                                            <span style={{ fontSize: 12, color: '#1e40af' }}>Menunggu konfirmasi</span>
                                        )}
                                        {inv.paymentStatus === 'paid' && (
                                            <span style={{ fontSize: 12, color: '#166534' }}>Selesai</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {payTarget && (
                <PaymentModal
                    invoice={payTarget}
                    colors={colors}
                    onClose={() => setPayTarget(null)}
                    onSuccess={() => { setPayTarget(null); fetchInvoices(); }}
                />
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
