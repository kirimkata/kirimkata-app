'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useClient } from '@/lib/contexts/ClientContext';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import { InvitationAPI } from '@/lib/api/client';
import { Save, Globe, EyeOff, CheckCircle, AlertCircle, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import { FormField, TextInput, SelectInput, Button, useToast } from '@/components/ui';
import { useFormValidation } from '@/hooks/useFormValidation';

type SectionKey = 'mempelai' | 'event1' | 'event2' | 'streaming';

/** Label nama acara per tipe */
const EVENT_LABELS: Record<string, { event1: string; event2: string }> = {
    islam: { event1: 'Akad Nikah', event2: 'Resepsi' },
    kristen: { event1: 'Pemberkatan', event2: 'Resepsi' },
    katolik: { event1: 'Pemberkatan', event2: 'Resepsi' },
    hindu: { event1: 'Upacara Agama', event2: 'Resepsi' },
    buddha: { event1: 'Upacara Agama', event2: 'Resepsi' },
    custom: { event1: 'Acara Pertama', event2: 'Acara Kedua' },
};

const eventTypeOptions = [
    { value: 'islam', label: 'Islam' },
    { value: 'kristen', label: 'Kristen' },
    { value: 'katolik', label: 'Katolik' },
    { value: 'hindu', label: 'Hindu' },
    { value: 'buddha', label: 'Buddha' },
    { value: 'custom', label: 'Custom' },
];

const timezoneOptions = [
    { value: 'WIB', label: 'WIB (Waktu Indonesia Barat)' },
    { value: 'WITA', label: 'WITA (Waktu Indonesia Tengah)' },
    { value: 'WIT', label: 'WIT (Waktu Indonesia Timur)' },
];

/** Shared label wrapper — reads colors from ThemeContext */
const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <FormField label={label}>{children}</FormField>
);

/** Collapsible section header — reads colors from ThemeContext */
const SectionHead = ({ sectionKey, num, title, sub, isOpen, onToggle }: {
    sectionKey: SectionKey; num: number; title: string; sub: string;
    isOpen: boolean;
    onToggle: () => void;
}) => {
    const { colors } = useTheme();
    return (
        <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', cursor: 'pointer', userSelect: 'none' }}
            onClick={onToggle}
        >
            <div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: colors.text }}>{num}. {title}</div>
                <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>{sub}</div>
            </div>
            {isOpen ? <ChevronUp size={18} color={colors.textSecondary} /> : <ChevronDown size={18} color={colors.textSecondary} />}
        </div>
    );
};

export default function DataPernikahanPage() {
    const { selectedEvent, isLoading } = useClient();
    const { colors } = useTheme();
    const router = useRouter();

    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [publishStatus, setPublishStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [isPublished, setIsPublished] = useState(false);
    const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
        mempelai: true, event1: true, event2: false, streaming: false
    });

    const [form, setForm] = useState({
        event_type: 'islam',
        timezone: 'WIB',
        // Custom labels (hanya untuk event_type = 'custom')
        custom_event1_label: '',
        custom_event2_label: '',
        // Mempelai Wanita
        bride_name: '',
        bride_full_name: '',
        bride_father_name: '',
        bride_mother_name: '',
        bride_instagram: '',
        // Mempelai Pria
        groom_name: '',
        groom_full_name: '',
        groom_father_name: '',
        groom_mother_name: '',
        groom_instagram: '',
        // Acara 1
        event1_date: '',
        event1_time: '',
        event1_end_time: '',
        event1_venue_name: '',
        event1_venue_address: '',
        event1_venue_city: '',
        event1_venue_province: '',
        event1_maps_url: '',
        // Acara 2
        event2_same_date: false,
        event2_date: '',
        event2_same_venue: false,
        event2_time: '',
        event2_end_time: '',
        event2_venue_name: '',
        event2_venue_address: '',
        event2_venue_city: '',
        event2_venue_province: '',
        event2_maps_url: '',
        // Streaming
        streaming_enabled: false,
        streaming_url: '',
        streaming_description: '',
        streaming_button_label: 'Watch Live',
    });

    const slug = selectedEvent?.slug;

    const fetchRegistration = useCallback(async () => {
        if (!slug) return;
        const token = localStorage.getItem('client_token');
        if (!token) return;

        try {
            const res = await InvitationAPI.getRegistrationBySlug(slug, token);
            if (res.success && res.data) {
                const d = res.data;
                setForm(prev => ({
                    ...prev,
                    event_type: d.event_type || 'islam',
                    timezone: d.timezone || 'WIB',
                    custom_event1_label: d.custom_event1_label || '',
                    custom_event2_label: d.custom_event2_label || '',
                    bride_name: d.bride_name || '',
                    bride_full_name: d.bride_full_name || '',
                    bride_father_name: d.bride_father_name || '',
                    bride_mother_name: d.bride_mother_name || '',
                    bride_instagram: d.bride_instagram || '',
                    groom_name: d.groom_name || '',
                    groom_full_name: d.groom_full_name || '',
                    groom_father_name: d.groom_father_name || '',
                    groom_mother_name: d.groom_mother_name || '',
                    groom_instagram: d.groom_instagram || '',
                    event1_date: d.event1_date || '',
                    event1_time: d.event1_time || '',
                    event1_end_time: d.event1_end_time || '',
                    event1_venue_name: d.event1_venue_name || '',
                    event1_venue_address: d.event1_venue_address || '',
                    event1_venue_city: d.event1_venue_city || '',
                    event1_venue_province: d.event1_venue_province || '',
                    event1_maps_url: d.event1_maps_url || '',
                    event2_same_date: d.event2_same_date ?? false,
                    event2_date: d.event2_date || '',
                    event2_same_venue: d.event2_same_venue ?? false,
                    event2_time: d.event2_time || '',
                    event2_end_time: d.event2_end_time || '',
                    event2_venue_name: d.event2_venue_name || '',
                    event2_venue_address: d.event2_venue_address || '',
                    event2_venue_city: d.event2_venue_city || '',
                    event2_venue_province: d.event2_venue_province || '',
                    event2_maps_url: d.event2_maps_url || '',
                    streaming_enabled: d.streaming_enabled ?? false,
                    streaming_url: d.streaming_url || '',
                    streaming_description: d.streaming_description || '',
                    streaming_button_label: d.streaming_button_label || 'Watch Live',
                }));
            }
        } catch (e) {
            console.error('Failed to load registration:', e);
        }

        // Check publish status via client API
        try {
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
            const token = localStorage.getItem('client_token');
            if (!token) return;
            const pubRes = await fetch(`${API_BASE_URL}/v1/client/invitations/${slug}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).catch(() => null);
            if (pubRes?.ok) {
                const pubData = await pubRes.json();
                setIsPublished(pubData?.data?.isActive ?? false);
            }
        } catch { }
    }, [slug]);

    useEffect(() => {
        if (!isLoading && !selectedEvent) {
            router.push('/client-dashboard/invitations');
        }
    }, [isLoading, selectedEvent, router]);

    useEffect(() => {
        fetchRegistration();
    }, [fetchRegistration]);

    // ── Derived labels (needed in validation rules) ──────────────
    const labels = EVENT_LABELS[form.event_type] || EVENT_LABELS.custom;
    const event1Label = form.event_type === 'custom' && form.custom_event1_label
        ? form.custom_event1_label
        : labels.event1;
    const event2Label = form.event_type === 'custom' && form.custom_event2_label
        ? form.custom_event2_label
        : labels.event2;

    // ── Validation rules ─────────────────────────────────────────
    const validationRules = useMemo(() => [
        { field: 'bride_name' as const, label: 'Nama panggilan pengantin wanita' },
        { field: 'bride_full_name' as const, label: 'Nama lengkap pengantin wanita' },
        { field: 'groom_name' as const, label: 'Nama panggilan pengantin pria' },
        { field: 'groom_full_name' as const, label: 'Nama lengkap pengantin pria' },
        { field: 'event1_date' as const, label: `Tanggal ${event1Label}` },
        { field: 'event1_time' as const, label: `Waktu mulai ${event1Label}` },
    ], [event1Label]);

    const { errors: formErrors, validate, clearError } = useFormValidation(validationRules, form);

    const handleChange = (field: string, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
        // Auto-clear error when user starts fixing the field
        clearError(field as keyof typeof form);
    };

    const handleSave = async () => {
        if (!slug) return;
        const token = localStorage.getItem('client_token');
        if (!token) return;

        // Run validation — open sections with errors automatically
        const ok = validate();
        if (!ok) {
            const needsMempelai = !form.bride_name.trim() || !form.bride_full_name.trim() || !form.groom_name.trim() || !form.groom_full_name.trim();
            const needsEvent1 = !form.event1_date || !form.event1_time;
            setOpenSections(prev => ({
                ...prev,
                mempelai: prev.mempelai || needsMempelai,
                event1: prev.event1 || needsEvent1,
            }));
            return;
        }

        setSaving(true);
        setSaveStatus('idle');
        try {
            const res = await InvitationAPI.updateRegistration(slug, {
                event_type: form.event_type,
                timezone: form.timezone,
                custom_event1_label: form.event_type === 'custom' ? (form.custom_event1_label || undefined) : undefined,
                custom_event2_label: form.event_type === 'custom' ? (form.custom_event2_label || undefined) : undefined,
                bride_name: form.bride_name,
                bride_full_name: form.bride_full_name,
                bride_father_name: form.bride_father_name || undefined,
                bride_mother_name: form.bride_mother_name || undefined,
                bride_instagram: form.bride_instagram || undefined,
                groom_name: form.groom_name,
                groom_full_name: form.groom_full_name,
                groom_father_name: form.groom_father_name || undefined,
                groom_mother_name: form.groom_mother_name || undefined,
                groom_instagram: form.groom_instagram || undefined,
                event1_date: form.event1_date,
                event1_time: form.event1_time,
                event1_end_time: form.event1_end_time || undefined,
                event1_venue_name: form.event1_venue_name || undefined,
                event1_venue_address: form.event1_venue_address || undefined,
                event1_venue_city: form.event1_venue_city || undefined,
                event1_venue_province: form.event1_venue_province || undefined,
                event1_maps_url: form.event1_maps_url || undefined,
                event2_same_date: form.event2_same_date,
                event2_date: form.event2_same_date ? form.event1_date : (form.event2_date || undefined),
                event2_same_venue: form.event2_same_venue,
                event2_time: form.event2_time || undefined,
                event2_end_time: form.event2_end_time || undefined,
                event2_venue_name: form.event2_same_venue ? form.event1_venue_name : (form.event2_venue_name || undefined),
                event2_venue_address: form.event2_same_venue ? form.event1_venue_address : (form.event2_venue_address || undefined),
                event2_venue_city: form.event2_same_venue ? form.event1_venue_city : (form.event2_venue_city || undefined),
                event2_venue_province: form.event2_same_venue ? form.event1_venue_province : (form.event2_venue_province || undefined),
                event2_maps_url: form.event2_same_venue ? form.event1_maps_url : (form.event2_maps_url || undefined),
            }, token);

            setSaveStatus(res.success ? 'success' : 'error');
        } catch {
            setSaveStatus('error');
        } finally {
            setSaving(false);
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    };

    const handlePublish = async () => {
        if (!slug) return;
        const token = localStorage.getItem('client_token');
        if (!token) return;
        setPublishing(true);
        setPublishStatus('idle');
        try {
            const res = await InvitationAPI.publishRegistration(slug, token);
            if (res.success) { setIsPublished(true); setPublishStatus('success'); }
            else setPublishStatus('error');
        } catch { setPublishStatus('error'); }
        finally {
            setPublishing(false);
            setTimeout(() => setPublishStatus('idle'), 3000);
        }
    };

    const handleUnpublish = async () => {
        if (!slug) return;
        const token = localStorage.getItem('client_token');
        if (!token) return;
        setPublishing(true);
        try {
            const res = await InvitationAPI.unpublishRegistration(slug, token);
            if (res.success) setIsPublished(false);
        } catch { }
        finally { setPublishing(false); }
    };

    const toggleSection = (key: SectionKey) => {
        setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    if (isLoading || !selectedEvent) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                <Loader size={32} style={{ animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }


    const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };

    const card: React.CSSProperties = {
        backgroundColor: colors.sidebar,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        marginBottom: '16px',
        overflow: 'hidden',
    };



    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '28px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: colors.text, margin: 0 }}>Data Pernikahan</h1>
                <p style={{ fontSize: '14px', color: colors.textSecondary, marginTop: '6px' }}>
                    Isi data lengkap pernikahan Anda. Simpan dulu, lalu publish jika sudah siap.
                </p>
            </div>

            {/* Publish Status Banner */}
            <div style={{
                padding: '14px 18px', borderRadius: '10px', marginBottom: '24px',
                backgroundColor: isPublished ? 'rgba(34,197,94,0.1)' : 'rgba(251,191,36,0.1)',
                border: `1px solid ${isPublished ? 'rgba(34,197,94,0.3)' : 'rgba(251,191,36,0.3)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isPublished ? <CheckCircle size={18} color="#22c55e" /> : <AlertCircle size={18} color="#f59e0b" />}
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: colors.text }}>
                            {isPublished ? 'Undangan Sudah Dipublikasikan' : 'Undangan Belum Dipublikasikan'}
                        </div>
                        <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                            {isPublished ? `Tamu dapat mengakses undangan di /${slug}` : 'Simpan data, lalu klik Publish agar tamu bisa mengakses undangan.'}
                        </div>
                    </div>
                </div>
                {isPublished && (
                    <button onClick={handleUnpublish} disabled={publishing} style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                        cursor: 'pointer', border: '1px solid rgba(239,68,68,0.4)',
                        backgroundColor: 'transparent', color: '#ef4444', opacity: publishing ? 0.6 : 1,
                    }}>
                        <EyeOff size={14} /> Unpublish
                    </button>
                )}
            </div>

            {/* === 1. DATA MEMPELAI === */}
            <div style={card}>
                <SectionHead sectionKey="mempelai" num={1} title="Data Mempelai" sub="Nama dan informasi kedua mempelai" isOpen={openSections.mempelai} onToggle={() => toggleSection('mempelai')} />
                {openSections.mempelai && (
                    <div style={{ padding: '20px', borderTop: `1px solid ${colors.border}` }}>
                        <div style={{ ...grid2, marginBottom: '16px' }}>
                            <F label="Tipe Acara">
                                <SelectInput value={form.event_type} onChange={e => handleChange('event_type', e.target.value)}>
                                    {eventTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </SelectInput>
                            </F>
                            <F label="Timezone">
                                <SelectInput value={form.timezone} onChange={e => handleChange('timezone', e.target.value)}>
                                    {timezoneOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </SelectInput>
                            </F>
                        </div>

                        {/* Custom event labels */}
                        {form.event_type === 'custom' && (
                            <div style={{ ...grid2, marginBottom: '16px', padding: '14px', borderRadius: '8px', backgroundColor: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
                                <F label={`Nama Acara Pertama`}>
                                    <TextInput value={form.custom_event1_label} onChange={e => handleChange('custom_event1_label', e.target.value)} placeholder="e.g. Ijab Qabul" />
                                </F>
                                <F label={`Nama Acara Kedua`}>
                                    <TextInput value={form.custom_event2_label} onChange={e => handleChange('custom_event2_label', e.target.value)} placeholder="e.g. Walimahan" />
                                </F>
                            </div>
                        )}

                        <div style={{ fontWeight: 700, fontSize: '13px', color: colors.textSecondary, marginBottom: '12px', letterSpacing: '0.05em' }}>PENGANTIN WANITA</div>
                        <div style={{ ...grid2, marginBottom: '16px' }}>
                            <FormField label="Nama Panggilan" required error={formErrors.bride_name}>
                                <TextInput error={!!formErrors.bride_name} value={form.bride_name} onChange={e => handleChange('bride_name', e.target.value)} placeholder="e.g. Sarah" />
                            </FormField>
                            <FormField label="Nama Lengkap" required error={formErrors.bride_full_name}>
                                <TextInput error={!!formErrors.bride_full_name} value={form.bride_full_name} onChange={e => handleChange('bride_full_name', e.target.value)} placeholder="e.g. Sarah Amelia" />
                            </FormField>
                            <F label="Nama Ayah"><TextInput value={form.bride_father_name} onChange={e => handleChange('bride_father_name', e.target.value)} placeholder="Opsional" /></F>
                            <F label="Nama Ibu"><TextInput value={form.bride_mother_name} onChange={e => handleChange('bride_mother_name', e.target.value)} placeholder="Opsional" /></F>
                            <F label="Instagram"><TextInput value={form.bride_instagram} onChange={e => handleChange('bride_instagram', e.target.value)} placeholder="@username" /></F>
                        </div>

                        <div style={{ fontWeight: 700, fontSize: '13px', color: colors.textSecondary, marginBottom: '12px', letterSpacing: '0.05em' }}>PENGANTIN PRIA</div>
                        <div style={grid2}>
                            <FormField label="Nama Panggilan" required error={formErrors.groom_name}>
                                <TextInput error={!!formErrors.groom_name} value={form.groom_name} onChange={e => handleChange('groom_name', e.target.value)} placeholder="e.g. Budi" />
                            </FormField>
                            <FormField label="Nama Lengkap" required error={formErrors.groom_full_name}>
                                <TextInput error={!!formErrors.groom_full_name} value={form.groom_full_name} onChange={e => handleChange('groom_full_name', e.target.value)} placeholder="e.g. Budi Santoso" />
                            </FormField>
                            <F label="Nama Ayah"><TextInput value={form.groom_father_name} onChange={e => handleChange('groom_father_name', e.target.value)} placeholder="Opsional" /></F>
                            <F label="Nama Ibu"><TextInput value={form.groom_mother_name} onChange={e => handleChange('groom_mother_name', e.target.value)} placeholder="Opsional" /></F>
                            <F label="Instagram"><TextInput value={form.groom_instagram} onChange={e => handleChange('groom_instagram', e.target.value)} placeholder="@username" /></F>
                        </div>
                    </div>
                )}
            </div>

            {/* === 2. ACARA PERTAMA (dinamis label) === */}
            <div style={card}>
                <SectionHead
                    sectionKey="event1"
                    num={2}
                    title={event1Label}
                    sub={`Tanggal, waktu, dan lokasi ${event1Label.toLowerCase()}`}
                    isOpen={openSections.event1} onToggle={() => toggleSection('event1')}
                />
                {openSections.event1 && (
                    <div style={{ padding: '20px', borderTop: `1px solid ${colors.border}` }}>
                        <div style={{ ...grid2, marginBottom: '16px' }}>
                            <FormField label={`Tanggal ${event1Label}`} required error={formErrors.event1_date}>
                                <TextInput type="date" error={!!formErrors.event1_date} value={form.event1_date} onChange={e => handleChange('event1_date', e.target.value)} />
                            </FormField>
                            <FormField label="Waktu Mulai" required error={formErrors.event1_time}>
                                <TextInput type="time" error={!!formErrors.event1_time} value={form.event1_time} onChange={e => handleChange('event1_time', e.target.value)} />
                            </FormField>
                            <F label="Waktu Selesai"><TextInput type="time" value={form.event1_end_time} onChange={e => handleChange('event1_end_time', e.target.value)} /></F>
                            <F label="Nama Gedung/Venue"><TextInput value={form.event1_venue_name} onChange={e => handleChange('event1_venue_name', e.target.value)} placeholder="e.g. Masjid Al-Ikhlas" /></F>
                        </div>
                        <F label="Alamat Lengkap">
                            <textarea rows={2} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, backgroundColor: colors.background, color: colors.text, fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} value={form.event1_venue_address} onChange={e => handleChange('event1_venue_address', e.target.value)} placeholder="Alamat lengkap venue" />
                        </F>
                        <div style={{ ...grid2, marginTop: '16px' }}>
                            <F label="Kota"><TextInput value={form.event1_venue_city} onChange={e => handleChange('event1_venue_city', e.target.value)} /></F>
                            <F label="Provinsi"><TextInput value={form.event1_venue_province} onChange={e => handleChange('event1_venue_province', e.target.value)} /></F>
                        </div>
                        <div style={{ marginTop: '16px' }}>
                            <F label="Link Google Maps"><TextInput value={form.event1_maps_url} onChange={e => handleChange('event1_maps_url', e.target.value)} placeholder="https://maps.google.com/..." /></F>
                        </div>
                    </div>
                )}
            </div>

            {/* === 3. ACARA KEDUA (dinamis label) === */}
            <div style={card}>
                <SectionHead
                    sectionKey="event2"
                    num={3}
                    title={event2Label}
                    sub={`Tanggal, waktu, dan lokasi ${event2Label.toLowerCase()}`}
                    isOpen={openSections.event2} onToggle={() => toggleSection('event2')}
                />
                {openSections.event2 && (
                    <div style={{ padding: '20px', borderTop: `1px solid ${colors.border}` }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={form.event2_same_date} onChange={e => handleChange('event2_same_date', e.target.checked)} />
                            <span style={{ fontSize: '14px', color: colors.text }}>Tanggal {event2Label.toLowerCase()} sama dengan {event1Label.toLowerCase()}</span>
                        </label>
                        {!form.event2_same_date && (
                            <div style={{ marginBottom: '16px' }}>
                                <F label={`Tanggal ${event2Label}`}><TextInput type="date" value={form.event2_date} onChange={e => handleChange('event2_date', e.target.value)} /></F>
                            </div>
                        )}
                        <div style={{ ...grid2, marginBottom: '16px' }}>
                            <F label="Waktu Mulai"><TextInput type="time" value={form.event2_time} onChange={e => handleChange('event2_time', e.target.value)} /></F>
                            <F label="Waktu Selesai"><TextInput type="time" value={form.event2_end_time} onChange={e => handleChange('event2_end_time', e.target.value)} /></F>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={form.event2_same_venue} onChange={e => handleChange('event2_same_venue', e.target.checked)} />
                            <span style={{ fontSize: '14px', color: colors.text }}>Lokasi {event2Label.toLowerCase()} sama dengan {event1Label.toLowerCase()}</span>
                        </label>
                        {!form.event2_same_venue && (
                            <>
                                <F label="Nama Gedung/Venue">
                                    <TextInput value={form.event2_venue_name} onChange={e => handleChange('event2_venue_name', e.target.value)} placeholder="e.g. Ballroom Hotel XYZ" />
                                </F>
                                <div style={{ marginTop: '12px' }}>
                                    <F label="Alamat Lengkap">
                                        <textarea rows={2} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, backgroundColor: colors.background, color: colors.text, fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} value={form.event2_venue_address} onChange={e => handleChange('event2_venue_address', e.target.value)} />
                                    </F>
                                </div>
                                <div style={{ ...grid2, marginTop: '12px' }}>
                                    <F label="Kota"><TextInput value={form.event2_venue_city} onChange={e => handleChange('event2_venue_city', e.target.value)} /></F>
                                    <F label="Provinsi"><TextInput value={form.event2_venue_province} onChange={e => handleChange('event2_venue_province', e.target.value)} /></F>
                                </div>
                                <div style={{ marginTop: '12px' }}>
                                    <F label="Link Google Maps"><TextInput value={form.event2_maps_url} onChange={e => handleChange('event2_maps_url', e.target.value)} placeholder="https://maps.google.com/..." /></F>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* === 4. STREAMING (Opsional) === */}
            <div style={card}>
                <SectionHead sectionKey="streaming" num={4} title="Streaming (Opsional)" sub="Tambahkan link siaran langsung acara" isOpen={openSections.streaming} onToggle={() => toggleSection('streaming')} />
                {openSections.streaming && (
                    <div style={{ padding: '20px', borderTop: `1px solid ${colors.border}` }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={form.streaming_enabled} onChange={e => handleChange('streaming_enabled', e.target.checked)} />
                            <span style={{ fontSize: '14px', color: colors.text }}>Aktifkan fitur live streaming</span>
                        </label>
                        {form.streaming_enabled && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <F label="URL Streaming"><TextInput value={form.streaming_url} onChange={e => handleChange('streaming_url', e.target.value)} placeholder="https://youtube.com/..." /></F>
                                <F label="Deskripsi">
                                    <textarea rows={2} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, backgroundColor: colors.background, color: colors.text, fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} value={form.streaming_description} onChange={e => handleChange('streaming_description', e.target.value)} placeholder="Keterangan singkat tentang live streaming" />
                                </F>
                                <F label="Label Tombol"><TextInput value={form.streaming_button_label} onChange={e => handleChange('streaming_button_label', e.target.value)} /></F>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div style={{
                display: 'flex', gap: '12px', justifyContent: 'flex-end',
                padding: '20px 0', position: 'sticky', bottom: 0,
                backgroundColor: colors.background, borderTop: `1px solid ${colors.border}`,
            }}>
                <Button
                    variant="secondary"
                    size="lg"
                    onClick={handleSave}
                    loading={saving}
                    icon={saveStatus === 'success' ? <CheckCircle size={16} /> : saveStatus === 'error' ? <AlertCircle size={16} /> : <Save size={16} />}
                    style={saveStatus === 'success' ? { background: '#22c55e', color: '#fff', border: 'none' } : saveStatus === 'error' ? { background: '#ef4444', color: '#fff', border: 'none' } : {}}
                >
                    {saving ? 'Menyimpan...' : saveStatus === 'success' ? 'Tersimpan!' : saveStatus === 'error' ? 'Gagal Simpan' : 'Simpan'}
                </Button>

                {!isPublished && (
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={handlePublish}
                        loading={publishing}
                        icon={publishStatus === 'success' ? <CheckCircle size={16} /> : publishStatus === 'error' ? <AlertCircle size={16} /> : <Globe size={16} />}
                        style={publishStatus === 'success' ? { background: '#22c55e' } : publishStatus === 'error' ? { background: '#ef4444' } : {}}
                    >
                        {publishing ? 'Publishing...' : publishStatus === 'success' ? 'Published!' : 'Publish Undangan'}
                    </Button>
                )}
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
