'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InvitationAPI } from '@/lib/api/client';

export default function RegisterPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [formData, setFormData] = useState({
        slug: '',
        client_id: '00000000-0000-0000-0000-000000000000', // Temporary - should be replaced with actual client ID
        bride_name: '',
        bride_full_name: '',
        bride_father_name: '',
        bride_mother_name: '',
        bride_instagram: '',
        groom_name: '',
        groom_full_name: '',
        groom_father_name: '',
        groom_mother_name: '',
        groom_instagram: '',
        event1_date: '',
        event1_time: '10:00:00',
        event1_venue_name: '',
        event1_venue_address: '',
        event1_maps_url: '',
        event2_date: '',
        event2_time: '14:00:00',
        event2_venue_name: '',
        event2_venue_address: '',
        event2_maps_url: '',
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validateForm = (): boolean => {
        if (!formData.slug.trim()) {
            setMessage({ type: 'error', text: 'Slug wajib diisi' });
            return false;
        }
        if (!/^[a-z0-9-]+$/.test(formData.slug)) {
            setMessage({ type: 'error', text: 'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung (-)' });
            return false;
        }
        if (!formData.bride_name.trim() || !formData.bride_full_name.trim()) {
            setMessage({ type: 'error', text: 'Nama mempelai wanita wajib diisi' });
            return false;
        }
        if (!formData.groom_name.trim() || !formData.groom_full_name.trim()) {
            setMessage({ type: 'error', text: 'Nama mempelai pria wajib diisi' });
            return false;
        }
        if (!formData.event1_date) {
            setMessage({ type: 'error', text: 'Tanggal acara wajib diisi' });
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!validateForm()) return;

        setSaving(true);

        try {
            const response = await InvitationAPI.createRegistration(formData);

            if (!response.success) {
                throw new Error(response.error || 'Gagal membuat registration');
            }

            setMessage({ type: 'success', text: `Registration berhasil dibuat! Slug: /${formData.slug}` });

            setTimeout(() => {
                router.push(`/dashboard/${formData.slug}/love-story`);
            }, 2000);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Terjadi kesalahan. Silakan coba lagi.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
                    Daftar Undangan Baru
                </h1>
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                    Buat undangan pernikahan baru dengan mengisi form di bawah ini
                </p>
            </div>

            {message && (
                <div style={{
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    marginBottom: '1.5rem',
                    fontWeight: '500',
                    backgroundColor: message.type === 'success' ? '#d1fae5' : '#fee2e2',
                    color: message.type === 'success' ? '#065f46' : '#991b1b',
                    border: `1px solid ${message.type === 'success' ? '#10b981' : '#dc2626'}`,
                }}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Basic Info */}
                <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1rem', padding: '1.5rem' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
                        ⚙️ Pengaturan Dasar
                    </h2>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                            Slug (URL) <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: '0.375rem', overflow: 'hidden' }}>
                            <span style={{ padding: '0.625rem 0.75rem', background: '#f9fafb', color: '#6b7280', fontSize: '0.875rem', borderRight: '1px solid #d1d5db' }}>
                                kirimkata.com/
                            </span>
                            <input
                                type="text"
                                value={formData.slug}
                                onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                placeholder="nama-mempelai"
                                style={{ flex: 1, padding: '0.625rem 0.75rem', border: 'none', fontSize: '0.875rem' }}
                                disabled={saving}
                                required
                            />
                        </div>
                        <small style={{ display: 'block', marginTop: '0.375rem', fontSize: '0.75rem', color: '#6b7280' }}>
                            Hanya huruf kecil, angka, dan tanda hubung (-)
                        </small>
                    </div>
                </div>

                {/* Bride Info */}
                <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1rem', padding: '1.5rem' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
                        👰 Mempelai Wanita
                    </h2>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                            Nama Panggilan <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.bride_name}
                            onChange={(e) => handleChange('bride_name', e.target.value)}
                            placeholder="Sarah"
                            style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                            disabled={saving}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                            Nama Lengkap <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.bride_full_name}
                            onChange={(e) => handleChange('bride_full_name', e.target.value)}
                            placeholder="Sarah Amanda Putri"
                            style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                            disabled={saving}
                            required
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                Nama Ayah
                            </label>
                            <input
                                type="text"
                                value={formData.bride_father_name}
                                onChange={(e) => handleChange('bride_father_name', e.target.value)}
                                placeholder="Bapak Ahmad"
                                style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                                disabled={saving}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                Nama Ibu
                            </label>
                            <input
                                type="text"
                                value={formData.bride_mother_name}
                                onChange={(e) => handleChange('bride_mother_name', e.target.value)}
                                placeholder="Ibu Siti"
                                style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                                disabled={saving}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                            Instagram
                        </label>
                        <input
                            type="text"
                            value={formData.bride_instagram}
                            onChange={(e) => handleChange('bride_instagram', e.target.value)}
                            placeholder="@sarahamanda"
                            style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                            disabled={saving}
                        />
                    </div>
                </div>

                {/* Groom Info */}
                <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1rem', padding: '1.5rem' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
                        🤵 Mempelai Pria
                    </h2>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                            Nama Panggilan <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.groom_name}
                            onChange={(e) => handleChange('groom_name', e.target.value)}
                            placeholder="David"
                            style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                            disabled={saving}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                            Nama Lengkap <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.groom_full_name}
                            onChange={(e) => handleChange('groom_full_name', e.target.value)}
                            placeholder="David Rahman Pratama"
                            style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                            disabled={saving}
                            required
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                Nama Ayah
                            </label>
                            <input
                                type="text"
                                value={formData.groom_father_name}
                                onChange={(e) => handleChange('groom_father_name', e.target.value)}
                                placeholder="Bapak Budi"
                                style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                                disabled={saving}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                Nama Ibu
                            </label>
                            <input
                                type="text"
                                value={formData.groom_mother_name}
                                onChange={(e) => handleChange('groom_mother_name', e.target.value)}
                                placeholder="Ibu Ani"
                                style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                                disabled={saving}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                            Instagram
                        </label>
                        <input
                            type="text"
                            value={formData.groom_instagram}
                            onChange={(e) => handleChange('groom_instagram', e.target.value)}
                            placeholder="@davidrahman"
                            style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                            disabled={saving}
                        />
                    </div>
                </div>

                {/* Event Info */}
                <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1rem', padding: '1.5rem' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
                        📅 Informasi Acara
                    </h2>

                    <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
                        Akad Nikah / Holy Matrimony
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                Tanggal <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <input
                                type="date"
                                value={formData.event1_date}
                                onChange={(e) => handleChange('event1_date', e.target.value)}
                                style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                                disabled={saving}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                Jam
                            </label>
                            <input
                                type="time"
                                step="60"
                                value={formData.event1_time}
                                onChange={(e) => handleChange('event1_time', e.target.value)}
                                style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                                disabled={saving}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                            Nama Gedung/Venue
                        </label>
                        <input
                            type="text"
                            value={formData.event1_venue_name}
                            onChange={(e) => handleChange('event1_venue_name', e.target.value)}
                            placeholder="Masjid Istiqlal"
                            style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                            disabled={saving}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                            Alamat
                        </label>
                        <textarea
                            value={formData.event1_venue_address}
                            onChange={(e) => handleChange('event1_venue_address', e.target.value)}
                            placeholder="Jl. Taman Wijaya Kusuma, Jakarta Pusat"
                            rows={2}
                            style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem', fontFamily: 'inherit' }}
                            disabled={saving}
                        />
                    </div>

                    <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151', marginTop: '1.5rem' }}>
                        Resepsi (Opsional)
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                Tanggal
                            </label>
                            <input
                                type="date"
                                value={formData.event2_date}
                                onChange={(e) => handleChange('event2_date', e.target.value)}
                                style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                                disabled={saving}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                Jam
                            </label>
                            <input
                                type="time"
                                step="60"
                                value={formData.event2_time}
                                onChange={(e) => handleChange('event2_time', e.target.value)}
                                style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                                disabled={saving}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                            Nama Gedung/Venue
                        </label>
                        <input
                            type="text"
                            value={formData.event2_venue_name}
                            onChange={(e) => handleChange('event2_venue_name', e.target.value)}
                            placeholder="Balai Sudirman"
                            style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                            disabled={saving}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                            Alamat
                        </label>
                        <textarea
                            value={formData.event2_venue_address}
                            onChange={(e) => handleChange('event2_venue_address', e.target.value)}
                            placeholder="Jl. Jenderal Sudirman No. 123, Jakarta Selatan"
                            rows={2}
                            style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem', fontFamily: 'inherit' }}
                            disabled={saving}
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid #e5e7eb' }}>
                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            width: '100%',
                            padding: '0.875rem 1.5rem',
                            background: saving ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontWeight: '600',
                            fontSize: '1rem',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)',
                        }}
                    >
                        {saving ? '⏳ Menyimpan...' : '✅ Buat Undangan'}
                    </button>
                </div>
            </form>
        </div>
    );
}
