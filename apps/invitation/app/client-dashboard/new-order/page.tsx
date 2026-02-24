'use client';

import React, { useState, useCallback, useContext, createContext, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/contexts/ThemeContext';
import {
    ChevronRight, ChevronLeft, Check, Loader2, AlertCircle, Info,
    Calendar, Link2, User, Type, CheckCircle2
} from 'lucide-react';

/* ─────────────────────── TYPES ─────────────────────── */
interface AddonSelection { id: number; slug: string; name: string; price: number; unit: string; qty: number; }
interface OrderData {
    groomName: string; brideName: string; title: string; slug: string;
    date: string; isDateTbd: boolean;
    templateId: number | null; templatePrice: number; templateName: string;
    addons: AddonSelection[]; voucherCode: string; discount: number;
}
interface OrderCtx { order: OrderData; update: (d: Partial<OrderData>) => void; step: number; setStep: (s: number) => void; }

/* ─────────────────────── CONTEXT ─────────────────────── */
const Ctx = createContext<OrderCtx | null>(null);
const useOrder = () => { const c = useContext(Ctx); if (!c) throw new Error('useOrder outside provider'); return c; };

/* ─────────────────────── HELPERS ─────────────────────── */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.kirimkata.com';
const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('client_token') : null;
const authFetch = (url: string, opts: RequestInit = {}) =>
    fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(opts.headers as any) } });

/* ─────────────────────── STEP BAR ─────────────────────── */
function StepBar({ step, colors }: { step: number; colors: any }) {
    const steps = ['Data Acara', 'Pilih Desain', 'Konfirmasi Pesanan'];
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {steps.map((label, i) => {
                const n = i + 1;
                const done = step > n;
                const active = step === n;
                return (
                    <React.Fragment key={n}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                            <div style={{
                                width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 13, fontWeight: 600,
                                backgroundColor: done ? '#22c55e' : active ? colors.primary : colors.border,
                                color: done || active ? '#fff' : colors.textSecondary,
                                transition: 'all 0.2s',
                                boxShadow: active ? `0 0 0 3px ${colors.primary}33` : 'none',
                            }}>
                                {done ? <Check size={15} /> : n}
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 500, color: active ? colors.text : colors.textSecondary, whiteSpace: 'nowrap' }}>
                                {label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div style={{ height: 2, width: 64, marginBottom: 20, backgroundColor: done ? '#22c55e' : colors.border, transition: 'background-color 0.3s', marginLeft: 8, marginRight: 8 }} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

/* ─────────────────────── STEP 1 ─────────────────────── */
function Step1({ colors }: { colors: any }) {
    const { order, update, setStep } = useOrder();
    const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'ok' | 'taken'>('idle');
    const [slugTimer, setSlugTimer] = useState<any>(null);

    const handleSlugChange = (val: string) => {
        const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, '');
        update({ slug: clean });
        if (slugTimer) clearTimeout(slugTimer);
        if (clean.length < 3) { setSlugStatus('idle'); return; }
        setSlugStatus('checking');
        setSlugTimer(setTimeout(async () => {
            try {
                const res = await authFetch(`${API_BASE}/v1/orders/check-slug`, { method: 'POST', body: JSON.stringify({ slug: clean }) });
                const data = await res.json();
                setSlugStatus(data.data?.available ? 'ok' : 'taken');
            } catch { setSlugStatus('idle'); }
        }, 700));
    };

    const isValid = order.groomName && order.brideName && order.title && order.slug &&
        (order.isDateTbd || order.date) && slugStatus !== 'taken' && slugStatus !== 'checking';

    const inputStyle = (hasError?: boolean): React.CSSProperties => ({
        width: '100%', boxSizing: 'border-box',
        padding: '10px 12px', borderRadius: 8, fontSize: 14,
        border: `1px solid ${hasError ? '#ef4444' : colors.border}`,
        backgroundColor: colors.inputBg, color: colors.text, outline: 'none',
        transition: 'border-color 0.2s',
    });

    const labelStyle: React.CSSProperties = {
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 13, fontWeight: 500, color: colors.textSecondary, marginBottom: 6,
    };

    return (
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.text, marginBottom: 6 }}>Data Acara</h2>
                <p style={{ fontSize: 14, color: colors.textSecondary }}>Isi informasi dasar untuk membuat undangan pernikahan.</p>
            </div>

            <div style={{ backgroundColor: colors.card, borderRadius: 12, border: `1px solid ${colors.border}`, padding: '28px 32px' }}>
                {/* Row 1: Names */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                    <div>
                        <label style={labelStyle}><User size={14} /> Nama Mempelai Pria</label>
                        <input value={order.groomName} onChange={e => update({ groomName: e.target.value })}
                            placeholder="Adam" style={inputStyle()} />
                    </div>
                    <div>
                        <label style={labelStyle}><User size={14} /> Nama Mempelai Wanita</label>
                        <input value={order.brideName} onChange={e => update({ brideName: e.target.value })}
                            placeholder="Hawa" style={inputStyle()} />
                    </div>
                </div>

                {/* Row 2: Title */}
                <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}><Type size={14} /> Judul Undangan</label>
                    <input value={order.title} onChange={e => update({ title: e.target.value })}
                        placeholder="The Wedding of Adam & Hawa" style={inputStyle()} />
                </div>

                {/* Row 3: Slug */}
                <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}><Link2 size={14} /> Link Undangan</label>
                    <div style={{
                        display: 'flex', alignItems: 'center', borderRadius: 8, overflow: 'hidden',
                        border: `1px solid ${slugStatus === 'taken' ? '#ef4444' : slugStatus === 'ok' ? '#22c55e' : colors.border}`,
                        backgroundColor: colors.inputBg, transition: 'border-color 0.2s',
                    }}>
                        <span style={{ padding: '0 12px', fontSize: 13, color: colors.textSecondary, whiteSpace: 'nowrap', borderRight: `1px solid ${colors.border}`, lineHeight: '40px', backgroundColor: colors.hover }}>
                            kirimkata.com/
                        </span>
                        <input value={order.slug} onChange={e => handleSlugChange(e.target.value)}
                            placeholder="adam-hawa"
                            style={{ flex: 1, padding: '10px 12px', fontSize: 14, border: 'none', backgroundColor: 'transparent', color: colors.text, outline: 'none' }} />
                        <div style={{ padding: '0 12px' }}>
                            {slugStatus === 'checking' && <Loader2 size={15} style={{ color: colors.textSecondary, animation: 'spin 1s linear infinite' }} />}
                            {slugStatus === 'ok' && <CheckCircle2 size={15} style={{ color: '#22c55e' }} />}
                            {slugStatus === 'taken' && <AlertCircle size={15} style={{ color: '#ef4444' }} />}
                        </div>
                    </div>
                    {slugStatus === 'taken' && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 5 }}>Link ini sudah digunakan. Coba nama yang berbeda.</p>}
                    {slugStatus === 'ok' && <p style={{ fontSize: 12, color: '#22c55e', marginTop: 5 }}>Link tersedia.</p>}
                </div>

                {/* Row 4: Date */}
                <div style={{ marginBottom: 8 }}>
                    <label style={labelStyle}><Calendar size={14} /> Tanggal Acara</label>
                    <input type="date" value={order.date} onChange={e => update({ date: e.target.value })}
                        disabled={order.isDateTbd}
                        style={{ ...inputStyle(), opacity: order.isDateTbd ? 0.5 : 1 }} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, cursor: 'pointer' }}>
                    <input type="checkbox" checked={order.isDateTbd} onChange={e => update({ isDateTbd: e.target.checked, date: '' })}
                        style={{ width: 15, height: 15, cursor: 'pointer' }} />
                    <span style={{ fontSize: 13, color: colors.textSecondary }}>Belum menentukan tanggal</span>
                </label>

                {/* Info banner */}
                <div style={{ display: 'flex', gap: 10, padding: '12px 14px', backgroundColor: `${colors.primary}10`, borderRadius: 8, border: `1px solid ${colors.primary}30`, marginBottom: 28 }}>
                    <Info size={16} style={{ color: colors.primary, flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 13, color: colors.text }}>Data di atas masih bisa dilengkapi atau diubah setelah pembayaran selesai.</p>
                </div>

                <button onClick={() => isValid && setStep(2)} disabled={!isValid}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        width: '100%', padding: '12px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none',
                        backgroundColor: isValid ? colors.primary : colors.border,
                        color: isValid ? colors.primaryText : colors.textSecondary,
                        cursor: isValid ? 'pointer' : 'not-allowed', transition: 'all 0.2s',
                    }}>
                    Selanjutnya <ChevronRight size={16} />
                </button>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

/* ─────────────────────── STEP 2 ─────────────────────── */
function Step2({ colors }: { colors: any }) {
    const { order, update, setStep } = useOrder();
    const [templates, setTemplates] = useState<any[]>([]);
    const [apiAddons, setApiAddons] = useState<any[]>([]);
    const [activeCategory, setActiveCategory] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch(`${API_BASE}/v1/templates?active=true`).then(r => r.json()),
            fetch(`${API_BASE}/v1/addons?active=true`).then(r => r.json()),
        ]).then(([tpl, adn]) => {
            const tplData = tpl.data?.length ? tpl.data : FALLBACK_TEMPLATES;
            const adnData = adn.data?.length ? adn.data : FALLBACK_ADDONS;
            setTemplates(tplData);
            setApiAddons(adnData);
            const cats = [...new Set<string>(tplData.map((t: any) => t.category))];
            setActiveCategory(cats[0] || '');
        }).catch(() => {
            setTemplates(FALLBACK_TEMPLATES);
            setApiAddons(FALLBACK_ADDONS);
            setActiveCategory('Premium 3D');
        }).finally(() => setLoading(false));
    }, []);

    const categories = [...new Set<string>(templates.map(t => t.category))];
    const filtered = templates.filter(t => t.category === activeCategory);
    const selectedTemplate = templates.find(t => t.id === order.templateId);

    const getQty = (id: number) => order.addons.find(a => a.id === id)?.qty || 0;
    const updateAddon = (addon: any, delta: number) => {
        const newQty = Math.max(0, getQty(addon.id) + delta);
        const rest = order.addons.filter(a => a.id !== addon.id);
        update({ addons: newQty > 0 ? [...rest, { id: addon.id, slug: addon.slug, name: addon.name, price: addon.price, unit: addon.unit, qty: newQty }] : rest });
    };

    const addonTotal = order.addons.reduce((s, a) => s + a.price * a.qty, 0);
    const subtotal = (selectedTemplate?.basePrice || 0) + addonTotal;

    const FEATURES = ['Bebas kirim', '10 foto galeri', '1 Video', 'Hitung mundur', 'Love story',
        'Bebas pilih lagu', 'Kado online', 'RSVP & ucapan', 'Buku tamu', 'Kolom ucapan',
        'Quotes', 'Pengingat kalender', 'Bebas ganti warna', 'Atur tata letak'];

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: `3px solid ${colors.border}`, borderTopColor: colors.primary, animation: 'spin 1s linear infinite' }} />
        </div>
    );

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.text, marginBottom: 6 }}>Pilih Desain Undangan</h2>
                <p style={{ fontSize: 14, color: colors.textSecondary }}>Semua desain sudah termasuk fitur lengkap di bawah ini.</p>
            </div>

            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                {/* Left: Theme Grid */}
                <div style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, border: `1px solid ${colors.border}`, padding: 20 }}>
                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${colors.border}`, paddingBottom: 16 }}>
                        {categories.map(cat => (
                            <button key={cat} onClick={() => setActiveCategory(cat)}
                                style={{
                                    padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer',
                                    backgroundColor: activeCategory === cat ? colors.primary : 'transparent',
                                    color: activeCategory === cat ? colors.primaryText : colors.textSecondary,
                                    transition: 'all 0.15s',
                                }}>
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, maxHeight: 480, overflowY: 'auto' }}>
                        {filtered.map(t => (
                            <div key={t.id}
                                onClick={() => update({ templateId: t.id, templatePrice: t.basePrice, templateName: t.name })}
                                style={{
                                    borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
                                    border: `2px solid ${order.templateId === t.id ? colors.primary : colors.border}`,
                                    transition: 'border-color 0.15s',
                                    backgroundColor: colors.inputBg,
                                }}>
                                <div style={{ aspectRatio: '2/3', backgroundColor: colors.hover, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                    {t.thumbnailUrl
                                        ? <img src={t.thumbnailUrl} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        : <span style={{ fontSize: 13, color: colors.textSecondary, fontWeight: 500 }}>{t.name}</span>
                                    }
                                    {order.templateId === t.id && (
                                        <div style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', backgroundColor: colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Check size={13} color="#fff" />
                                        </div>
                                    )}
                                </div>
                                <div style={{ padding: '8px 10px', borderTop: `1px solid ${colors.border}` }}>
                                    <p style={{ fontSize: 12, fontWeight: 600, color: colors.text, marginBottom: 2 }}>{t.name}</p>
                                    <p style={{ fontSize: 12, color: colors.primary, fontWeight: 700 }}>
                                        Rp {t.basePrice?.toLocaleString('id-ID')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel */}
                <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 16, flexShrink: 0 }}>
                    {/* Features */}
                    <div style={{ backgroundColor: colors.card, borderRadius: 12, border: `1px solid ${colors.border}`, padding: '18px 20px' }}>
                        <h4 style={{ fontSize: 13, fontWeight: 700, color: colors.text, marginBottom: 14 }}>Fitur yang Didapat</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 8px' }}>
                            {FEATURES.map((f, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <Check size={12} style={{ color: '#22c55e', flexShrink: 0 }} />
                                    <span style={{ fontSize: 12, color: colors.textSecondary }}>{f}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Add-ons */}
                    <div style={{ backgroundColor: colors.card, borderRadius: 12, border: `1px solid ${colors.border}`, padding: '18px 20px' }}>
                        <h4 style={{ fontSize: 13, fontWeight: 700, color: colors.text, marginBottom: 14 }}>Fitur Tambahan</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {apiAddons.map(addon => {
                                const qty = getQty(addon.id);
                                return (
                                    <div key={addon.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: 12, fontWeight: 500, color: colors.text }}>{addon.name}</p>
                                            <p style={{ fontSize: 11, color: colors.textSecondary }}>Rp {addon.price?.toLocaleString('id-ID')}{addon.unit}</p>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, border: `1px solid ${colors.border}`, borderRadius: 6, overflow: 'hidden' }}>
                                            <button onClick={() => updateAddon(addon, -1)} disabled={qty === 0}
                                                style={{ width: 28, height: 28, border: 'none', backgroundColor: 'transparent', cursor: qty === 0 ? 'not-allowed' : 'pointer', color: colors.textSecondary, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                −
                                            </button>
                                            <span style={{ minWidth: 20, textAlign: 'center', fontSize: 13, fontWeight: 500, color: colors.text }}>{qty}</span>
                                            <button onClick={() => updateAddon(addon, 1)}
                                                style={{ width: 28, height: 28, border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: colors.primary, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                +
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Subtotal + Next */}
                    <div style={{ backgroundColor: colors.card, borderRadius: 12, border: `1px solid ${colors.border}`, padding: '16px 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                            <span style={{ fontSize: 13, color: colors.textSecondary }}>Subtotal</span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>Rp {subtotal.toLocaleString('id-ID')}</span>
                        </div>
                        <button onClick={() => { if (order.templateId) setStep(3); }} disabled={!order.templateId}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                width: '100%', padding: '11px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none',
                                backgroundColor: order.templateId ? colors.primary : colors.border,
                                color: order.templateId ? colors.primaryText : colors.textSecondary,
                                cursor: order.templateId ? 'pointer' : 'not-allowed', transition: 'all 0.2s',
                            }}>
                            Selanjutnya <ChevronRight size={15} />
                        </button>
                        {!order.templateId && <p style={{ fontSize: 11, color: colors.textSecondary, textAlign: 'center', marginTop: 8 }}>Pilih desain terlebih dahulu.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────── STEP 3 ─────────────────────── */
function Step3({ colors }: { colors: any }) {
    const { order, update, setStep } = useOrder();
    const router = useRouter();
    const [voucherInput, setVoucherInput] = useState('');
    const [voucherLoading, setVoucherLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const subtotal = order.templatePrice + order.addons.reduce((s, a) => s + a.price * a.qty, 0);
    const total = subtotal - order.discount;

    const applyVoucher = async () => {
        if (!voucherInput.trim()) return;
        setVoucherLoading(true);
        await new Promise(r => setTimeout(r, 700));
        if (voucherInput.trim().toUpperCase() === 'DISKON10') {
            update({ voucherCode: 'DISKON10', discount: Math.floor(subtotal * 0.1) });
        } else {
            update({ voucherCode: '', discount: 0 });
            setError('Kode voucher tidak valid.');
        }
        setVoucherLoading(false);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setError('');
        try {
            const res = await authFetch(`${API_BASE}/v1/orders`, {
                method: 'POST',
                body: JSON.stringify({
                    type: 'wedding', title: order.title, slug: order.slug,
                    mainDate: order.isDateTbd ? new Date().toISOString().slice(0, 10) : order.date,
                    inviterType: 'couple',
                    inviterData: { groom: { name: order.groomName }, bride: { name: order.brideName } },
                    templateId: order.templateId, addonIds: order.addons.map(a => a.id),
                    voucherCode: order.voucherCode || undefined,
                }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'Gagal membuat pesanan.');
            router.push(`/client-dashboard/invoice?new=1`);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const items = [
        { name: `Undangan Wedding — ${order.templateName}`, qty: 1, price: order.templatePrice },
        ...order.addons.map(a => ({ name: a.name, qty: a.qty, price: a.price * a.qty })),
    ];

    const tdStyle: React.CSSProperties = { padding: '12px 0', borderBottom: `1px solid ${colors.border}`, fontSize: 14, color: colors.text };
    const thStyle: React.CSSProperties = { padding: '8px 0', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: colors.textSecondary, fontWeight: 700, borderBottom: `1px solid ${colors.border}` };

    return (
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.text, marginBottom: 6 }}>Konfirmasi Pesanan</h2>
                <p style={{ fontSize: 14, color: colors.textSecondary }}>Periksa kembali detail pesanan sebelum melanjutkan ke pembayaran.</p>
            </div>

            <div style={{ backgroundColor: colors.card, borderRadius: 12, border: `1px solid ${colors.border}`, padding: '28px 32px' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 16 }}>Detail Pesanan</h3>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
                    <thead>
                        <tr>
                            <th style={{ ...thStyle, textAlign: 'left' }}>Item</th>
                            <th style={{ ...thStyle, textAlign: 'center', width: 80 }}>Jumlah</th>
                            <th style={{ ...thStyle, textAlign: 'right', width: 120 }}>Harga</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, i) => (
                            <tr key={i}>
                                <td style={tdStyle}>{item.name}</td>
                                <td style={{ ...tdStyle, textAlign: 'center' }}>
                                    <span style={{ display: 'inline-block', padding: '2px 10px', backgroundColor: colors.hover, borderRadius: 4, fontSize: 13 }}>{item.qty}</span>
                                </td>
                                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 500 }}>Rp {item.price.toLocaleString('id-ID')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Voucher */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                    <input value={voucherInput} onChange={e => { setVoucherInput(e.target.value.toUpperCase()); setError(''); }}
                        placeholder="Kode Voucher"
                        style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.text, fontSize: 14, outline: 'none' }} />
                    <button onClick={applyVoucher} disabled={voucherLoading || !voucherInput.trim()}
                        style={{ padding: '10px 18px', borderRadius: 8, border: `1px solid ${colors.border}`, backgroundColor: colors.hover, color: colors.text, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {voucherLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Gunakan'}
                    </button>
                </div>

                {/* Totals */}
                <div style={{ backgroundColor: colors.inputBg, borderRadius: 8, padding: '16px 18px', marginBottom: 24 }}>
                    {[
                        { label: 'Subtotal', value: `Rp ${subtotal.toLocaleString('id-ID')}`, bold: false },
                        { label: `Diskon${order.voucherCode ? ` (${order.voucherCode})` : ''}`, value: `- Rp ${order.discount.toLocaleString('id-ID')}`, bold: false, green: true },
                    ].map((row, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14 }}>
                            <span style={{ color: colors.textSecondary }}>{row.label}</span>
                            <span style={{ color: row.green ? '#22c55e' : colors.text }}>{row.value}</span>
                        </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: `1px solid ${colors.border}` }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>Total</span>
                        <span style={{ fontSize: 15, fontWeight: 700, color: colors.primary }}>Rp {total.toLocaleString('id-ID')}</span>
                    </div>
                </div>

                {error && (
                    <div style={{ display: 'flex', gap: 8, padding: '12px 14px', backgroundColor: '#fee2e2', borderRadius: 8, marginBottom: 16, color: '#dc2626', fontSize: 13 }}>
                        <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
                    </div>
                )}

                <button onClick={handleSubmit} disabled={submitting}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        width: '100%', padding: '13px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none',
                        backgroundColor: submitting ? colors.border : colors.primary,
                        color: submitting ? colors.textSecondary : colors.primaryText,
                        cursor: submitting ? 'wait' : 'pointer', transition: 'all 0.2s',
                    }}>
                    {submitting ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Memproses...</> : 'Lanjut ke Pembayaran'}
                </button>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

/* ─────────────────────── FALLBACK DATA ─────────────────────── */
const FALLBACK_TEMPLATES = [
    { id: 1, name: 'Parallax Custom', category: 'parallax', basePrice: 325000, thumbnailUrl: '/previews/parallax-custom1.jpg', slug: 'parallax/parallax-custom1' },
    { id: 2, name: 'Parallax Template', category: 'parallax', basePrice: 325000, thumbnailUrl: '/previews/parallax-template1.jpg', slug: 'parallax/parallax-template1' },
    { id: 3, name: 'Simple Scroll', category: 'premium', basePrice: 175000, thumbnailUrl: '/previews/premium-simple1.jpg', slug: 'premium/simple1' },
    { id: 4, name: 'Simple Premium', category: 'premium', basePrice: 175000, thumbnailUrl: '/previews/premium-simple2.jpg', slug: 'premium/simple2' },
];
const FALLBACK_ADDONS = [
    { id: 1, name: 'Tambah Foto', price: 2000, unit: '/foto', slug: 'add_photo' },
    { id: 2, name: 'Edit Foto Custom', price: 75000, unit: '/foto', slug: 'edit_photo' },
    { id: 3, name: 'Terima Beres', price: 50000, unit: '', slug: 'terima_beres' },
    { id: 4, name: 'WA Blast (Nomor Pribadi)', price: 200000, unit: '', slug: 'wa_blast' },
    { id: 5, name: 'IG Story Template', price: 75000, unit: '', slug: 'ig_template' },
];

/* ─────────────────────── MAIN PAGE ─────────────────────── */
export default function NewOrderPage() {
    const router = useRouter();
    const { colors } = useTheme();
    const [step, setStep] = useState(1);
    const [order, setOrder] = useState<OrderData>({
        groomName: '', brideName: '', title: '', slug: '', date: '', isDateTbd: false,
        templateId: null, templatePrice: 0, templateName: '', addons: [], voucherCode: '', discount: 0,
    });

    const update = useCallback((d: Partial<OrderData>) => setOrder(prev => ({ ...prev, ...d })), []);

    const handleBack = () => {
        if (step > 1) setStep(s => s - 1);
        else router.push('/client-dashboard/invitations');
    };

    return (
        <Ctx.Provider value={{ order, update, step, setStep }}>
            <div style={{ minHeight: '100vh', backgroundColor: colors.background, display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 32px', backgroundColor: colors.sidebar,
                    borderBottom: `1px solid ${colors.border}`,
                    position: 'sticky', top: 0, zIndex: 20,
                }}>
                    <button onClick={handleBack}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: colors.textSecondary, fontSize: 14, fontWeight: 500 }}>
                        <ChevronLeft size={16} />
                        {step > 1 ? 'Kembali' : 'Ke Dashboard'}
                    </button>

                    <StepBar step={step} colors={colors} />

                    <div style={{ width: 120, display: 'flex', justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: 13, color: colors.textSecondary }}>Langkah {step} dari 3</span>
                    </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, padding: step === 2 ? '32px 32px' : '48px 32px', maxWidth: step === 2 ? 1200 : undefined, margin: '0 auto', width: '100%' }}>
                    {step === 1 && <Step1 colors={colors} />}
                    {step === 2 && <Step2 colors={colors} />}
                    {step === 3 && <Step3 colors={colors} />}
                </div>
            </div>
        </Ctx.Provider>
    );
}
