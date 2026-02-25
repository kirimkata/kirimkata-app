'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '@/lib/api-config';
import { RefreshCw, Check, X, HelpCircle, ClipboardList } from 'lucide-react';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { Button } from '@/components/ui';

interface Wish {
    id: number;
    name: string;
    message: string;
    attendance: 'hadir' | 'tidak-hadir' | 'masih-ragu';
    guestCount: number;
    createdAt: string;
}

export default function DaftarUcapanPage() {
    const { colors } = useTheme();
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
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#16a34a',
                    }} title="Hadir">
                        <Check size={20} />
                    </span>
                );
            case 'tidak-hadir':
                return (
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#dc2626',
                    }} title="Tidak Hadir">
                        <X size={20} />
                    </span>
                );
            case 'masih-ragu':
                return (
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ca8a04',
                    }} title="Masih Ragu">
                        <HelpCircle size={20} />
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
                <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={fetchWishes} loading={loading}>
                    Refresh
                </Button>
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
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                }}>
                    <div style={{ fontSize: '0.8125rem', color: 'rgba(245, 245, 240, 0.6)', marginBottom: '0.25rem' }}>Total Ucapan</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#F5F5F0' }}>{wishes.length}</div>
                </div>
                <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                }}>
                    <div style={{ fontSize: '0.8125rem', color: 'rgba(245, 245, 240, 0.6)', marginBottom: '0.25rem' }}>Estimasi Tamu Hadir</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#F5F5F0' }}>{totalGuests}</div>
                </div>
            </div>

            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
            }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(245, 245, 240, 0.6)' }}>
                        Loading...
                    </div>
                ) : error === 'no-slug' ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            marginBottom: '1rem',
                            color: 'rgba(245, 245, 240, 0.4)'
                        }}>
                            <ClipboardList size={48} />
                        </div>
                        <h3 style={{
                            fontSize: '1.25rem',
                            fontWeight: 600,
                            color: '#F5F5F0',
                            marginBottom: '0.5rem',
                        }}>
                            Belum Ada Undangan
                        </h3>
                        <p style={{
                            color: 'rgba(245, 245, 240, 0.6)',
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
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#fca5a5' }}>
                        {error}
                    </div>
                ) : wishes.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(245, 245, 240, 0.6)' }}>
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
                            <thead style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                                <tr>
                                    <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 600, color: '#F5F5F0', fontSize: '0.8125rem', borderRight: '1px solid rgba(255, 255, 255, 0.1)' }}>Tanggal</th>
                                    <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 600, color: '#F5F5F0', fontSize: '0.8125rem', borderRight: '1px solid rgba(255, 255, 255, 0.1)' }}>Nama</th>
                                    <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 600, color: '#F5F5F0', fontSize: '0.8125rem', borderRight: '1px solid rgba(255, 255, 255, 0.1)' }}>Ucapan</th>
                                    <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 600, color: '#F5F5F0', fontSize: '0.8125rem', borderRight: '1px solid rgba(255, 255, 255, 0.1)' }}>Kehadiran</th>
                                    <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 600, color: '#F5F5F0', fontSize: '0.8125rem' }}>Jml Tamu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {wishes.map((wish) => (
                                    <tr key={wish.id} style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                        <td style={{ padding: '0.75rem 1rem', color: 'rgba(245, 245, 240, 0.6)', fontSize: '0.75rem', verticalAlign: 'top' }}>
                                            {formatDate(wish.createdAt)}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', color: '#F5F5F0', fontSize: '0.875rem', fontWeight: 500, verticalAlign: 'top' }}>
                                            {wish.name}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', color: 'rgba(245, 245, 240, 0.9)', fontSize: '0.875rem', minWidth: '260px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.6' }}>
                                            {wish.message}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                            {getAttendanceIcon(wish.attendance)}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'rgba(245, 245, 240, 0.6)', fontSize: '0.875rem' }}>
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
