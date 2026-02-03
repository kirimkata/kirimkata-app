'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InvitationAPI } from '@/lib/api/client';

// Event type configurations untuk berbagai agama
const EVENT_TYPES = {
    islam: {
        label: 'Islam',
        event1Label: 'Akad Nikah',
        event2Label: 'Resepsi',
    },
    kristen: {
        label: 'Kristen',
        event1Label: 'Holy Matrimony',
        event2Label: 'Reception',
    },
    katolik: {
        label: 'Katolik',
        event1Label: 'Holy Matrimony',
        event2Label: 'Reception',
    },
    hindu: {
        label: 'Hindu',
        event1Label: 'Upacara Adat',
        event2Label: 'Resepsi',
    },
    buddha: {
        label: 'Buddha',
        event1Label: 'Upacara Pernikahan',
        event2Label: 'Resepsi',
    },
    custom: {
        label: 'Custom',
        event1Label: 'Acara 1',
        event2Label: 'Acara 2',
    },
};

type EventType = keyof typeof EVENT_TYPES;

// Raw data types - data mentah dari user
interface RawWeddingData {
    slug: string;
    eventType: EventType;
    customEvent1Label?: string;
    customEvent2Label?: string;
    brideName: string;
    brideFullName: string;
    brideFatherName?: string;
    brideMotherName?: string;
    brideInstagram?: string;
    groomName: string;
    groomFullName: string;
    groomFatherName?: string;
    groomMotherName?: string;
    groomInstagram?: string;
    event1Date: string;
    event2SameDate: boolean;
    event2Date?: string;
    timezone: 'WIB' | 'WITA' | 'WIT';
    event1Time: string;
    event1EndTime?: string;
    event1VenueName?: string;
    event1VenueAddress?: string;
    event1VenueCity?: string;
    event1VenueProvince?: string;
    event1MapsUrl?: string;
    event2SameVenue: boolean;
    event2Time?: string;
    event2EndTime?: string;
    event2VenueName?: string;
    event2VenueAddress?: string;
    event2VenueCity?: string;
    event2VenueProvince?: string;
    event2MapsUrl?: string;
}

export default function WeddingRegistrationPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [formData, setFormData] = useState<RawWeddingData>({
        slug: '',
        eventType: 'islam',
        brideName: '',
        brideFullName: '',
        groomName: '',
        groomFullName: '',
        event1Date: '',
        event2SameDate: true,
        timezone: 'WIB',
        event1Time: '08:00',
        event2SameVenue: true,
        event2Time: '12:00',
    });

    const handleChange = (field: keyof RawWeddingData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validateForm = (): boolean => {
        if (!formData.slug.trim()) {
            setMessage({ type: 'error', text: 'URL undangan wajib diisi' });
            return false;
        }
        if (!/^[a-z0-9-]+$/.test(formData.slug)) {
            setMessage({ type: 'error', text: 'URL hanya boleh huruf kecil, angka, dan tanda hubung (-)' });
            return false;
        }
        if (!formData.brideName.trim() || !formData.brideFullName.trim()) {
            setMessage({ type: 'error', text: 'Nama mempelai wanita wajib diisi' });
            return false;
        }
        if (!formData.groomName.trim() || !formData.groomFullName.trim()) {
            setMessage({ type: 'error', text: 'Nama mempelai pria wajib diisi' });
            return false;
        }
        if (!formData.event1Date) {
            setMessage({ type: 'error', text: 'Tanggal acara pertama wajib diisi' });
            return false;
        }
        if (!formData.event2SameDate && !formData.event2Date) {
            setMessage({ type: 'error', text: 'Tanggal acara kedua wajib diisi jika berbeda dari acara pertama' });
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!validateForm()) return;

        setLoading(true);

        try {
            const data = await InvitationAPI.createRegistration(formData);

            if (!data.success) {
                throw new Error(data.error || 'Gagal menyimpan data');
            }

            setMessage({ type: 'success', text: 'Data berhasil disimpan! Redirecting...' });
            setTimeout(() => router.push(`/${formData.slug}`), 2000);

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Terjadi kesalahan. Silakan coba lagi.' });
        } finally {
            setLoading(false);
        }
    };

    // Get current event labels based on selected type
    const getEvent1Label = () => {
        if (formData.eventType === 'custom' && formData.customEvent1Label) {
            return formData.customEvent1Label;
        }
        return EVENT_TYPES[formData.eventType].event1Label;
    };

    const getEvent2Label = () => {
        if (formData.eventType === 'custom' && formData.customEvent2Label) {
            return formData.customEvent2Label;
        }
        return EVENT_TYPES[formData.eventType].event2Label;
    };

    const inputStyle = {
        width: '100%',
        padding: '10px 16px',
        border: '1px solid rgba(139, 115, 85, 0.2)',
        borderRadius: '8px',
        fontSize: '14px',
        outline: 'none',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        color: '#3d3d3d',
        fontFamily: 'Segoe UI, sans-serif',
    };

    const labelStyle = {
        display: 'block',
        fontSize: '13px',
        fontWeight: '500',
        color: '#5d4e3a',
        marginBottom: '6px',
        fontFamily: 'Segoe UI, sans-serif',
    };

    const sectionStyle = {
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(139, 115, 85, 0.1)',
        padding: '28px',
        border: '1px solid rgba(139, 115, 85, 0.1)',
        marginBottom: '24px',
    };

    const sectionHeaderStyle = {
        fontSize: '20px',
        fontWeight: '400',
        color: '#5d4e3a',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        fontFamily: 'Georgia, serif',
        letterSpacing: '0.02em',
    };

    const badgeStyle = {
        background: 'rgba(139, 115, 85, 0.1)',
        color: '#8B7355',
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: '12px',
        fontSize: '14px',
        fontWeight: '500',
        fontFamily: 'Segoe UI, sans-serif',
    };

    const checkboxContainerStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px',
        background: 'rgba(139, 115, 85, 0.05)',
        borderRadius: '8px',
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f5f0e8 0%, #faf8f4 50%, #f0ebe3 100%)',
            backgroundAttachment: 'fixed',
        }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 20px' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{
                        fontSize: '32px',
                        fontWeight: '300',
                        color: '#5d4e3a',
                        marginBottom: '8px',
                        fontFamily: 'Georgia, serif',
                        letterSpacing: '0.05em',
                    }}>
                        Buat Undangan Digital
                    </h1>
                    <p style={{ color: '#8B7355', fontSize: '15px', fontFamily: 'Segoe UI, sans-serif' }}>
                        Isi data di bawah untuk membuat undangan pernikahan Anda
                    </p>
                </div>

                {/* Message */}
                {message && (
                    <div style={{
                        marginBottom: '24px',
                        padding: '14px 18px',
                        borderRadius: '8px',
                        background: message.type === 'success' ? 'rgba(34, 139, 34, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                        color: message.type === 'success' ? '#228B22' : '#DC2626',
                        border: message.type === 'success' ? '1px solid rgba(34, 139, 34, 0.2)' : '1px solid rgba(220, 38, 38, 0.2)',
                        fontSize: '14px',
                        fontFamily: 'Segoe UI, sans-serif',
                    }}>
                        {message.text}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    {/* Section 1: Informasi Dasar */}
                    <div style={sectionStyle}>
                        <h2 style={sectionHeaderStyle}>
                            <span style={badgeStyle}>1</span>
                            Informasi Dasar
                        </h2>

                        <div style={{ display: 'grid', gap: '16px' }}>
                            <div>
                                <label style={labelStyle}>
                                    URL Undangan <span style={{ color: '#DC2626' }}>*</span>
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <span style={{
                                        background: 'rgba(139, 115, 85, 0.08)',
                                        padding: '10px 16px',
                                        borderTopLeftRadius: '8px',
                                        borderBottomLeftRadius: '8px',
                                        border: '1px solid rgba(139, 115, 85, 0.2)',
                                        borderRight: '0',
                                        color: '#8B7355',
                                        fontSize: '14px',
                                        fontFamily: 'Segoe UI, sans-serif',
                                    }}>
                                        kirimkata.com/
                                    </span>
                                    <input
                                        type="text"
                                        value={formData.slug}
                                        onChange={(e) => handleChange('slug', e.target.value.toLowerCase())}
                                        placeholder="siti-budi"
                                        style={{ ...inputStyle, borderTopLeftRadius: '0', borderBottomLeftRadius: '0', flex: 1 }}
                                        required
                                    />
                                </div>
                                <p style={{ fontSize: '12px', color: '#8B7355', marginTop: '6px', fontFamily: 'Segoe UI, sans-serif', opacity: 0.8 }}>
                                    Huruf kecil, angka, dan tanda hubung (-) saja
                                </p>
                            </div>

                            {/* Event Type Selection */}
                            <div>
                                <label style={labelStyle}>
                                    Jenis Acara <span style={{ color: '#DC2626' }}>*</span>
                                </label>
                                <select
                                    value={formData.eventType}
                                    onChange={(e) => handleChange('eventType', e.target.value as EventType)}
                                    style={inputStyle}
                                >
                                    {Object.entries(EVENT_TYPES).map(([key, config]) => (
                                        <option key={key} value={key}>
                                            {config.label}
                                        </option>
                                    ))}
                                </select>
                                <p style={{ fontSize: '12px', color: '#8B7355', marginTop: '6px', fontFamily: 'Segoe UI, sans-serif', opacity: 0.8 }}>
                                    Label acara akan menyesuaikan dengan pilihan Anda
                                </p>
                            </div>

                            {/* Custom Labels (if event type is custom) */}
                            {formData.eventType === 'custom' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '16px', background: 'rgba(139, 115, 85, 0.05)', borderRadius: '8px' }}>
                                    <div>
                                        <label style={labelStyle}>Label Acara 1</label>
                                        <input
                                            type="text"
                                            value={formData.customEvent1Label || ''}
                                            onChange={(e) => handleChange('customEvent1Label', e.target.value)}
                                            placeholder="Contoh: Akad Nikah"
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Label Acara 2</label>
                                        <input
                                            type="text"
                                            value={formData.customEvent2Label || ''}
                                            onChange={(e) => handleChange('customEvent2Label', e.target.value)}
                                            placeholder="Contoh: Resepsi"
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section 2: Data Mempelai */}
                    <div style={sectionStyle}>
                        <h2 style={sectionHeaderStyle}>
                            <span style={badgeStyle}>2</span>
                            Data Mempelai
                        </h2>

                        <div style={{ marginBottom: '24px' }}>
                            {/* Bride */}
                            <div style={{ borderLeft: '3px solid #D4A574', paddingLeft: '20px', marginBottom: '28px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '500', color: '#5d4e3a', marginBottom: '16px', fontFamily: 'Georgia, serif' }}>
                                    Mempelai Wanita
                                </h3>
                                <div style={{ display: 'grid', gap: '14px' }}>
                                    <div>
                                        <label style={labelStyle}>Nama Panggilan <span style={{ color: '#DC2626' }}>*</span></label>
                                        <input
                                            type="text"
                                            value={formData.brideName}
                                            onChange={(e) => handleChange('brideName', e.target.value)}
                                            placeholder="Siti"
                                            style={inputStyle}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Nama Lengkap <span style={{ color: '#DC2626' }}>*</span></label>
                                        <input
                                            type="text"
                                            value={formData.brideFullName}
                                            onChange={(e) => handleChange('brideFullName', e.target.value)}
                                            placeholder="Siti Nurhaliza Putri"
                                            style={inputStyle}
                                            required
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <label style={labelStyle}>Nama Ayah</label>
                                            <input
                                                type="text"
                                                value={formData.brideFatherName || ''}
                                                onChange={(e) => handleChange('brideFatherName', e.target.value)}
                                                placeholder="Bapak Ahmad"
                                                style={inputStyle}
                                            />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Nama Ibu</label>
                                            <input
                                                type="text"
                                                value={formData.brideMotherName || ''}
                                                onChange={(e) => handleChange('brideMotherName', e.target.value)}
                                                placeholder="Ibu Siti"
                                                style={inputStyle}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Instagram</label>
                                        <input
                                            type="text"
                                            value={formData.brideInstagram || ''}
                                            onChange={(e) => handleChange('brideInstagram', e.target.value)}
                                            placeholder="sitinurhaliza (tanpa @)"
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Groom */}
                            <div style={{ borderLeft: '3px solid #8B7355', paddingLeft: '20px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '500', color: '#5d4e3a', marginBottom: '16px', fontFamily: 'Georgia, serif' }}>
                                    Mempelai Pria
                                </h3>
                                <div style={{ display: 'grid', gap: '14px' }}>
                                    <div>
                                        <label style={labelStyle}>Nama Panggilan <span style={{ color: '#DC2626' }}>*</span></label>
                                        <input
                                            type="text"
                                            value={formData.groomName}
                                            onChange={(e) => handleChange('groomName', e.target.value)}
                                            placeholder="Budi"
                                            style={inputStyle}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Nama Lengkap <span style={{ color: '#DC2626' }}>*</span></label>
                                        <input
                                            type="text"
                                            value={formData.groomFullName}
                                            onChange={(e) => handleChange('groomFullName', e.target.value)}
                                            placeholder="Budi Setiawan"
                                            style={inputStyle}
                                            required
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <label style={labelStyle}>Nama Ayah</label>
                                            <input
                                                type="text"
                                                value={formData.groomFatherName || ''}
                                                onChange={(e) => handleChange('groomFatherName', e.target.value)}
                                                placeholder="Bapak Sutrisno"
                                                style={inputStyle}
                                            />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Nama Ibu</label>
                                            <input
                                                type="text"
                                                value={formData.groomMotherName || ''}
                                                onChange={(e) => handleChange('groomMotherName', e.target.value)}
                                                placeholder="Ibu Yuliana"
                                                style={inputStyle}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Instagram</label>
                                        <input
                                            type="text"
                                            value={formData.groomInstagram || ''}
                                            onChange={(e) => handleChange('groomInstagram', e.target.value)}
                                            placeholder="budisetiawan (tanpa @)"
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Tanggal & Waktu */}
                    <div style={sectionStyle}>
                        <h2 style={sectionHeaderStyle}>
                            <span style={badgeStyle}>3</span>
                            Tanggal & Waktu Acara
                        </h2>

                        <div style={{ display: 'grid', gap: '18px' }}>
                            {/* Event 1 Date & Time */}
                            <div>
                                <h3 style={{ fontSize: '15px', fontWeight: '500', color: '#5d4e3a', marginBottom: '14px', fontFamily: 'Segoe UI, sans-serif' }}>
                                    {getEvent1Label()}
                                </h3>
                                <div style={{ display: 'grid', gap: '12px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <label style={labelStyle}>Tanggal <span style={{ color: '#DC2626' }}>*</span></label>
                                            <input
                                                type="date"
                                                value={formData.event1Date}
                                                onChange={(e) => handleChange('event1Date', e.target.value)}
                                                style={inputStyle}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Zona Waktu</label>
                                            <select
                                                value={formData.timezone}
                                                onChange={(e) => handleChange('timezone', e.target.value as 'WIB' | 'WITA' | 'WIT')}
                                                style={inputStyle}
                                            >
                                                <option value="WIB">WIB</option>
                                                <option value="WITA">WITA</option>
                                                <option value="WIT">WIT</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <label style={labelStyle}>Jam Mulai</label>
                                            <input
                                                type="time"
                                                step="60"
                                                value={formData.event1Time}
                                                onChange={(e) => handleChange('event1Time', e.target.value)}
                                                style={inputStyle}
                                            />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Jam Selesai</label>
                                            <input
                                                type="time"
                                                step="60"
                                                value={formData.event1EndTime || ''}
                                                onChange={(e) => handleChange('event1EndTime', e.target.value)}
                                                style={inputStyle}
                                                placeholder="Opsional"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Same Date Checkbox */}
                            <div style={checkboxContainerStyle}>
                                <input
                                    type="checkbox"
                                    id="sameDate"
                                    checked={formData.event2SameDate}
                                    onChange={(e) => handleChange('event2SameDate', e.target.checked)}
                                    style={{ width: '18px', height: '18px', accentColor: '#8B7355', cursor: 'pointer' }}
                                />
                                <label htmlFor="sameDate" style={{ fontSize: '14px', fontWeight: '400', color: '#5d4e3a', cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif' }}>
                                    {getEvent2Label()} di tanggal yang sama
                                </label>
                            </div>

                            {/* Event 2 Date & Time */}
                            <div style={{ borderTop: '1px solid rgba(139, 115, 85, 0.15)', paddingTop: '18px' }}>
                                <h3 style={{ fontSize: '15px', fontWeight: '500', color: '#5d4e3a', marginBottom: '14px', fontFamily: 'Segoe UI, sans-serif' }}>
                                    {getEvent2Label()}
                                </h3>
                                <div style={{ display: 'grid', gap: '12px' }}>
                                    {!formData.event2SameDate && (
                                        <div>
                                            <label style={labelStyle}>Tanggal <span style={{ color: '#DC2626' }}>*</span></label>
                                            <input
                                                type="date"
                                                value={formData.event2Date || ''}
                                                onChange={(e) => handleChange('event2Date', e.target.value)}
                                                style={inputStyle}
                                                required={!formData.event2SameDate}
                                            />
                                        </div>
                                    )}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <label style={labelStyle}>Jam Mulai</label>
                                            <input
                                                type="time"
                                                step="60"
                                                value={formData.event2Time || ''}
                                                onChange={(e) => handleChange('event2Time', e.target.value)}
                                                style={inputStyle}
                                            />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Jam Selesai</label>
                                            <input
                                                type="time"
                                                step="60"
                                                value={formData.event2EndTime || ''}
                                                onChange={(e) => handleChange('event2EndTime', e.target.value)}
                                                style={inputStyle}
                                                placeholder="Opsional"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Lokasi */}
                    <div style={sectionStyle}>
                        <h2 style={sectionHeaderStyle}>
                            <span style={badgeStyle}>4</span>
                            Lokasi Acara
                        </h2>

                        <div style={{ display: 'grid', gap: '24px' }}>
                            {/* Event 1 Venue */}
                            <div>
                                <h3 style={{ fontSize: '15px', fontWeight: '500', color: '#5d4e3a', marginBottom: '14px', fontFamily: 'Segoe UI, sans-serif' }}>
                                    Lokasi {getEvent1Label()}
                                </h3>
                                <div style={{ display: 'grid', gap: '12px' }}>
                                    <input
                                        type="text"
                                        value={formData.event1VenueName || ''}
                                        onChange={(e) => handleChange('event1VenueName', e.target.value)}
                                        placeholder="Nama Tempat (contoh: Masjid Agung)"
                                        style={inputStyle}
                                    />
                                    <textarea
                                        value={formData.event1VenueAddress || ''}
                                        onChange={(e) => handleChange('event1VenueAddress', e.target.value)}
                                        placeholder="Alamat Lengkap"
                                        rows={2}
                                        style={inputStyle}
                                    />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <input
                                            type="text"
                                            value={formData.event1VenueCity || ''}
                                            onChange={(e) => handleChange('event1VenueCity', e.target.value)}
                                            placeholder="Kota/Kabupaten"
                                            style={inputStyle}
                                        />
                                        <input
                                            type="text"
                                            value={formData.event1VenueProvince || ''}
                                            onChange={(e) => handleChange('event1VenueProvince', e.target.value)}
                                            placeholder="Provinsi"
                                            style={inputStyle}
                                        />
                                    </div>
                                    <input
                                        type="url"
                                        value={formData.event1MapsUrl || ''}
                                        onChange={(e) => handleChange('event1MapsUrl', e.target.value)}
                                        placeholder="Link Google Maps"
                                        style={inputStyle}
                                    />
                                </div>
                            </div>

                            {/* Same Venue Checkbox */}
                            <div style={checkboxContainerStyle}>
                                <input
                                    type="checkbox"
                                    id="sameVenue"
                                    checked={formData.event2SameVenue}
                                    onChange={(e) => handleChange('event2SameVenue', e.target.checked)}
                                    style={{ width: '18px', height: '18px', accentColor: '#8B7355', cursor: 'pointer' }}
                                />
                                <label htmlFor="sameVenue" style={{ fontSize: '14px', fontWeight: '400', color: '#5d4e3a', cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif' }}>
                                    {getEvent2Label()} di lokasi yang sama
                                </label>
                            </div>

                            {/* Event 2 Venue (conditionally shown) */}
                            {!formData.event2SameVenue && (
                                <div>
                                    <h3 style={{ fontSize: '15px', fontWeight: '500', color: '#5d4e3a', marginBottom: '14px', fontFamily: 'Segoe UI, sans-serif' }}>
                                        Lokasi {getEvent2Label()}
                                    </h3>
                                    <div style={{ display: 'grid', gap: '12px' }}>
                                        <input
                                            type="text"
                                            value={formData.event2VenueName || ''}
                                            onChange={(e) => handleChange('event2VenueName', e.target.value)}
                                            placeholder="Nama Tempat"
                                            style={inputStyle}
                                        />
                                        <textarea
                                            value={formData.event2VenueAddress || ''}
                                            onChange={(e) => handleChange('event2VenueAddress', e.target.value)}
                                            placeholder="Alamat Lengkap"
                                            rows={2}
                                            style={inputStyle}
                                        />
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <input
                                                type="text"
                                                value={formData.event2VenueCity || ''}
                                                onChange={(e) => handleChange('event2VenueCity', e.target.value)}
                                                placeholder="Kota/Kabupaten"
                                                style={inputStyle}
                                            />
                                            <input
                                                type="text"
                                                value={formData.event2VenueProvince || ''}
                                                onChange={(e) => handleChange('event2VenueProvince', e.target.value)}
                                                placeholder="Provinsi"
                                                style={inputStyle}
                                            />
                                        </div>
                                        <input
                                            type="url"
                                            value={formData.event2MapsUrl || ''}
                                            onChange={(e) => handleChange('event2MapsUrl', e.target.value)}
                                            placeholder="Link Google Maps"
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div style={sectionStyle}>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                background: loading ? 'rgba(139, 115, 85, 0.5)' : '#8B7355',
                                color: '#F5F5F0',
                                fontWeight: '500',
                                padding: '14px 28px',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s',
                                fontSize: '15px',
                                letterSpacing: '0.05em',
                                fontFamily: 'Segoe UI, sans-serif',
                            }}
                            onMouseEnter={(e) => {
                                if (!loading) e.currentTarget.style.background = '#6d5b44';
                            }}
                            onMouseLeave={(e) => {
                                if (!loading) e.currentTarget.style.background = '#8B7355';
                            }}
                        >
                            {loading ? 'Menyimpan...' : 'Buat Undangan'}
                        </button>
                        <p style={{ fontSize: '12px', color: '#8B7355', textAlign: 'center', marginTop: '10px', opacity: 0.8, fontFamily: 'Segoe UI, sans-serif' }}>
                            Dengan klik tombol di atas, undangan Anda akan dibuat dan data akan disimpan
                        </p>
                    </div>
                </form>

                {/* Info */}
                <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '13px', color: '#8B7355', opacity: 0.8, fontFamily: 'Segoe UI, sans-serif' }}>
                    <p style={{ marginBottom: '4px' }}>Siapkan data lengkap untuk hasil terbaik</p>
                    <p>Field bertanda <span style={{ color: '#DC2626' }}>*</span> wajib diisi</p>
                </div>
            </div>
        </div>
    );
}
