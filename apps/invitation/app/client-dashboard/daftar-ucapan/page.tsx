'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '@/lib/api-config';

interface Wish {
    id: number;
    name: string;
    message: string;
    attendance: 'hadir' | 'tidak-hadir' | 'masih-ragu';
    guestCount: number;
    createdAt: string;
}

export default function DaftarUcapanPage() {
    const [wishes, setWishes] = useState<Wish[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchWishes = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('client_token');
            if (!token) return;

            const { InvitationAPI } = await import('@/lib/api/client');
            const data = await InvitationAPI.getMessages(token);

            if (!data.success && !data.wishes) { // InvitationAPI doesn't return ok/status directly, we infer from success or data presence
                if (data.error === 'Unauthorized' || data.error === 'Invalid token') {
                    localStorage.removeItem('client_token');
                    localStorage.removeItem('client_user');
                    window.location.href = '/client-dashboard/login';
                    return;
                }

                // Check if error is about no slug assigned
                if (data.error && data.error.includes('no slug assigned')) {
                    setError('no-slug');
                } else {
                    throw new Error(data.error || 'Failed to fetch messages');
                }
                return;
            }

            setWishes(data.wishes || []);
        } catch (err) {
            console.error('Error fetching wishes:', err);
            setError('Gagal memuat daftar ucapan');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWishes();
    }, [fetchWishes]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = date.toLocaleDateString('id-ID', { day: '2-digit' });
        const month = date.toLocaleDateString('id-ID', { month: 'short' });
        const year = date.toLocaleDateString('id-ID', { year: 'numeric' });
        const time = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });

        return (
            <div style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: '1.4' }}>
                <div>{day} {month} {year}</div>
                <div>{time}</div>
            </div>
        );
    };

    const getAttendanceIcon = (status: string) => {
        switch (status) {
            case 'hadir':
                return (
                    <span style={{
                        fontSize: '1.25rem',
                        color: '#16a34a',
                    }} title="Hadir">
                        ✓
                    </span>
                );
            case 'tidak-hadir':
                return (
                    <span style={{
                        fontSize: '1.25rem',
                        color: '#dc2626',
                    }} title="Tidak Hadir">
                        ✗
                    </span>
                );
            case 'masih-ragu':
                return (
                    <span style={{
                        fontSize: '1.25rem',
                        color: '#ca8a04',
                    }} title="Masih Ragu">
                        ?
                    </span>
                );
            default:
                return status;
        }
    };

    const totalGuests = wishes
        .filter(w => w.attendance === 'hadir')
        .reduce((sum, w) => sum + (w.guestCount || 0), 0);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <button
                    onClick={fetchWishes}
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        color: '#374151',
                        fontFamily: 'Segoe UI, sans-serif',
                    }}
                >
                    🔄 Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                columnGap: '0.75rem',
                rowGap: '0.75rem',
                marginBottom: '1rem',
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                }}>
                    <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '0.25rem' }}>Total Ucapan</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>{wishes.length}</div>
                </div>
                <div style={{
                    backgroundColor: 'white',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                }}>
                    <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '0.25rem' }}>Estimasi Tamu Hadir</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>{totalGuests}</div>
                </div>
            </div>

            <div style={{
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
            }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                        Loading...
                    </div>
                ) : error === 'no-slug' ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                        <div style={{
                            fontSize: '3rem',
                            marginBottom: '1rem',
                        }}>
                            📋
                        </div>
                        <h3 style={{
                            fontSize: '1.25rem',
                            fontWeight: 600,
                            color: '#111827',
                            marginBottom: '0.5rem',
                        }}>
                            Belum Ada Undangan
                        </h3>
                        <p style={{
                            color: '#6b7280',
                            fontSize: '0.875rem',
                            maxWidth: '400px',
                            margin: '0 auto',
                            lineHeight: 1.6,
                        }}>
                            Akun Anda belum memiliki undangan yang ditugaskan.
                            Silakan hubungi admin untuk mendapatkan akses ke undangan.
                        </p>
                    </div>
                ) : error ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#dc2626' }}>
                        {error}
                    </div>
                ) : wishes.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                        Belum ada ucapan yang masuk.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            minWidth: '720px',
                        }}>
                            <colgroup>
                                <col style={{ width: '100px' }} />
                                <col style={{ width: '120px' }} />
                                <col style={{ width: 'auto' }} />
                                <col style={{ width: '80px' }} />
                                <col style={{ width: '90px' }} />
                            </colgroup>
                            <thead style={{ backgroundColor: '#f9fafb' }}>
                                <tr>
                                    <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 600, color: '#374151', fontSize: '0.8125rem', borderRight: '1px solid #e5e7eb' }}>Tanggal</th>
                                    <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 600, color: '#374151', fontSize: '0.8125rem', borderRight: '1px solid #e5e7eb' }}>Nama</th>
                                    <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 600, color: '#374151', fontSize: '0.8125rem', borderRight: '1px solid #e5e7eb' }}>Ucapan</th>
                                    <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 600, color: '#374151', fontSize: '0.8125rem', borderRight: '1px solid #e5e7eb' }}>Kehadiran</th>
                                    <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 600, color: '#374151', fontSize: '0.8125rem' }}>Jml Tamu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {wishes.map((wish) => (
                                    <tr key={wish.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                                        <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.75rem', verticalAlign: 'top' }}>
                                            {formatDate(wish.createdAt)}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', color: '#111827', fontSize: '0.875rem', fontWeight: 500, verticalAlign: 'top' }}>
                                            {wish.name}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', color: '#374151', fontSize: '0.875rem', minWidth: '260px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.6' }}>
                                            {wish.message}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                            {getAttendanceIcon(wish.attendance)}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
                                            {wish.guestCount}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
