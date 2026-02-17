'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Loader2, Calendar as CalendarIcon, MapPin, Type } from 'lucide-react';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { InvitationAPI } from '@/lib/api/client';
import { useClient } from '@/lib/contexts/ClientContext';
import { useRouter } from 'next/navigation';

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface CreateEventForm {
    name: string;
    event_date: string;
    location: string;
    slug: string;
}

export default function CreateEventModal({ isOpen, onClose, onSuccess }: CreateEventModalProps) {
    const { colors, theme } = useTheme();
    const { fetchEvents } = useClient();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateEventForm>();

    const onSubmit = async (data: CreateEventForm) => {
        setIsLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('client_token');
            if (!token) {
                setError('Authentication error. Please login again.');
                return;
            }

            const res = await InvitationAPI.createEvent(data, token);

            if (res.success) {
                await fetchEvents();
                reset();
                onSuccess();
                onClose();
            } else {
                setError(res.error || 'Failed to create event');
            }
        } catch (err) {
            setError('An unexpected error occurred');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '16px'
        }}>
            <div style={{
                backgroundColor: colors.sidebar,
                borderRadius: '16px',
                width: '100%',
                maxWidth: '500px',
                padding: '24px',
                position: 'relative',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: colors.textSecondary
                    }}
                >
                    <X size={20} />
                </button>

                <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: colors.text }}>
                    Buat Undangan Baru
                </h2>
                <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '24px' }}>
                    Isi detail acara pernikahan Anda di bawah ini using the form.
                </p>

                {error && (
                    <div style={{
                        padding: '12px',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '8px',
                        color: '#ef4444',
                        fontSize: '14px',
                        marginBottom: '16px'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Event Name */}
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: colors.text, marginBottom: '6px' }}>
                            Nama Pasangan / Acara <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: colors.textSecondary }}>
                                <Type size={16} />
                            </div>
                            <input
                                {...register('name', { required: 'Nama acara wajib diisi' })}
                                type="text"
                                placeholder="Contoh: Romeo & Juliet"
                                style={{
                                    width: '100%',
                                    padding: '10px 12px 10px 36px',
                                    borderRadius: '8px',
                                    border: `1px solid ${errors.name ? '#ef4444' : colors.border}`,
                                    backgroundColor: colors.inputBg,
                                    color: colors.text,
                                    outline: 'none',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                        {errors.name && <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', display: 'block' }}>{errors.name.message}</span>}
                    </div>

                    {/* Slug */}
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: colors.text, marginBottom: '6px' }}>
                            Link Undangan (Slug) <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: colors.textSecondary }}>
                                <span style={{ fontSize: '14px', fontWeight: 600 }}>/</span>
                            </div>
                            <input
                                {...register('slug', {
                                    required: 'Slug wajib diisi',
                                    pattern: {
                                        value: /^[a-z0-9-]+$/,
                                        message: 'Hanya boleh huruf kecil, angka, dan strip (-)'
                                    }
                                })}
                                type="text"
                                placeholder="romeo-juliet"
                                style={{
                                    width: '100%',
                                    padding: '10px 12px 10px 28px',
                                    borderRadius: '8px',
                                    border: `1px solid ${errors.slug ? '#ef4444' : colors.border}`,
                                    backgroundColor: colors.inputBg,
                                    color: colors.text,
                                    outline: 'none',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                        <p style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px' }}>
                            Link undangan Anda akan menjadi: kirimkata.com/<b>slug-anda</b>
                        </p>
                        {errors.slug && <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', display: 'block' }}>{errors.slug.message}</span>}
                    </div>

                    {/* Date */}
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: colors.text, marginBottom: '6px' }}>
                            Tanggal Acara <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: colors.textSecondary }}>
                                <CalendarIcon size={16} />
                            </div>
                            <input
                                {...register('event_date', { required: 'Tanggal acara wajib diisi' })}
                                type="date"
                                style={{
                                    width: '100%',
                                    padding: '10px 12px 10px 36px',
                                    borderRadius: '8px',
                                    border: `1px solid ${errors.event_date ? '#ef4444' : colors.border}`,
                                    backgroundColor: colors.inputBg,
                                    color: colors.text,
                                    outline: 'none',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                        {errors.event_date && <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', display: 'block' }}>{errors.event_date.message}</span>}
                    </div>

                    {/* Location */}
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: colors.text, marginBottom: '6px' }}>
                            Lokasi (Opsional)
                        </label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: colors.textSecondary }}>
                                <MapPin size={16} />
                            </div>
                            <input
                                {...register('location')}
                                type="text"
                                placeholder="Nama Gedung / Hotel / Alamat"
                                style={{
                                    width: '100%',
                                    padding: '10px 12px 10px 36px',
                                    borderRadius: '8px',
                                    border: `1px solid ${colors.border}`,
                                    backgroundColor: colors.inputBg,
                                    color: colors.text,
                                    outline: 'none',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '8px',
                                border: `1px solid ${colors.border}`,
                                backgroundColor: 'transparent',
                                color: colors.text,
                                fontSize: '14px',
                                fontWeight: 500,
                                cursor: 'pointer'
                            }}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: colors.primary,
                                color: colors.primaryText,
                                fontSize: '14px',
                                fontWeight: 500,
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                opacity: isLoading ? 0.7 : 1
                            }}
                        >
                            {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                            {isLoading ? 'Memproses...' : 'Buat Undangan'}
                        </button>
                    </div>
                </form>
            </div>
            <style jsx global>{`
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
