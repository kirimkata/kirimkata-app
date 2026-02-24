'use client';

import { useState } from 'react';
import { useClient } from '@/lib/contexts/ClientContext';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Plus,
    Search,
    Calendar,
    MoreVertical,
    ExternalLink,
    Trash2,
    Edit,
    Clock,
    CheckCircle
} from 'lucide-react';

import { InvitationAPI } from '@/lib/api/client';

export default function InvitationsPage() {
    const { events, isLoading, setSelectedEvent, fetchEvents } = useClient();
    const { colors, theme } = useTheme();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'draft'>('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (event.slug && event.slug.toLowerCase().includes(searchQuery.toLowerCase()));

        if (filter === 'all') return matchesSearch;
        // Assuming 'is_active' determines active/draft. If not present, default to all.
        // The Event interface has is_active boolean.
        if (filter === 'active') return matchesSearch && event.is_active;
        if (filter === 'draft') return matchesSearch && !event.is_active;

        return matchesSearch;
    });

    const handleEventClick = (event: any) => {
        setSelectedEvent(event);
        localStorage.setItem('selected_event_id', event.id);
        router.push('/client-dashboard/event-dashboard');
    };

    const handleDeleteEvent = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Apakah Anda yakin ingin menghapus undangan ini? Tindakan ini tidak dapat dibatalkan.')) return;

        setDeletingId(id);
        try {
            const token = localStorage.getItem('client_token');
            if (token) {
                await InvitationAPI.deleteEvent(id, token);
                await fetchEvents();
            }
        } catch (error) {
            console.error('Failed to delete event:', error);
            alert('Gagal menghapus event');
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: `3px solid ${colors.border}`,
                    borderTopColor: colors.primary,
                    animation: 'spin 1s linear infinite'
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="invitations-header">
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.text, marginBottom: '8px' }}>
                        Undangan Saya
                    </h1>
                    <p style={{ color: colors.textSecondary, fontSize: '14px' }}>
                        Kelola semua undangan pernikahan Anda di sini
                    </p>
                </div>
                <Link
                    href="/client-dashboard/new-order"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        backgroundColor: colors.primary,
                        color: colors.primaryText,
                        borderRadius: '8px',
                        border: 'none',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '14px',
                        textDecoration: 'none',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}
                >
                    <Plus size={18} />
                    Buat Undangan Baru
                </Link>
            </div>

            {/* Filters & Search */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                marginBottom: '24px',
                padding: '16px',
                backgroundColor: colors.card,
                borderRadius: '12px',
                border: `1px solid ${colors.border}`
            }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', borderBottom: `1px solid ${colors.border}`, paddingBottom: '16px' }}>
                    {['all', 'active', 'draft'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '20px',
                                border: 'none',
                                backgroundColor: filter === f ? colors.primary : 'transparent',
                                color: filter === f ? colors.primaryText : colors.textSecondary,
                                fontWeight: 500,
                                cursor: 'pointer',
                                textTransform: 'capitalize',
                                fontSize: '14px',
                                transition: 'all 0.2s'
                            }}
                        >
                            {f === 'all' ? 'Semua' : f === 'active' ? 'Aktif' : 'Draft'}
                        </button>
                    ))}
                </div>

                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: colors.textSecondary }} />
                    <input
                        type="text"
                        placeholder="Cari undangan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 12px 10px 40px',
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

            {/* Event Grid */}
            {filteredEvents.length > 0 ? (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '24px'
                }}>
                    {filteredEvents.map((event) => (
                        <div
                            key={event.id}
                            onClick={() => handleEventClick(event)}
                            style={{
                                backgroundColor: colors.card,
                                borderRadius: '12px',
                                border: `1px solid ${colors.border}`,
                                overflow: 'hidden',
                                cursor: 'pointer',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                position: 'relative'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            {/* Card Header / Image Placeholder */}
                            <div style={{
                                height: '140px',
                                backgroundColor: event.is_active ? '#dbeafe' : '#f3f4f6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderBottom: `1px solid ${colors.border}`,
                                position: 'relative'
                            }}>
                                <div style={{
                                    padding: '8px 16px',
                                    backgroundColor: 'rgba(255,255,255,0.9)',
                                    borderRadius: '20px',
                                    fontSize: '24px',
                                    fontWeight: 'bold',
                                    color: colors.primary,
                                    fontFamily: 'serif' // Just for style
                                }}>
                                    {event.name.split(' ').map((n: string) => n[0]).join('')}
                                </div>

                                <div style={{
                                    position: 'absolute',
                                    top: '12px',
                                    right: '12px',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    backgroundColor: event.is_active ? '#dcfce7' : '#f3f4f6',
                                    color: event.is_active ? '#166534' : '#4b5563',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    {event.is_active ? <CheckCircle size={12} /> : <Clock size={12} />}
                                    {event.is_active ? 'Publik' : 'Draft'}
                                </div>
                            </div>

                            {/* Card Body */}
                            <div style={{ padding: '20px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: colors.text, marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {event.name}
                                </h3>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.textSecondary, fontSize: '13px', marginBottom: '4px' }}>
                                    <Calendar size={14} />
                                    <span>{formatDate(event.event_date)}</span>
                                </div>

                                {event.slug && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.primary, fontSize: '13px', marginBottom: '16px' }}>
                                        <ExternalLink size={14} />
                                        <span style={{ textDecoration: 'underline' }}>kirimkata.com/{event.slug}</span>
                                    </div>
                                )}

                                <div style={{ paddingTop: '16px', borderTop: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEventClick(event);
                                        }}
                                        style={{
                                            padding: '8px',
                                            borderRadius: '6px',
                                            backgroundColor: colors.hover,
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: colors.text
                                        }}
                                        title="Edit"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => handleDeleteEvent(e, event.id)}
                                        style={{
                                            padding: '8px',
                                            borderRadius: '6px',
                                            backgroundColor: '#fee2e2',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: '#ef4444'
                                        }}
                                        title="Hapus"
                                        disabled={deletingId === event.id}
                                    >
                                        {deletingId === event.id ? (
                                            <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #ef4444', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                                        ) : (
                                            <Trash2 size={16} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    backgroundColor: colors.card,
                    borderRadius: '16px',
                    border: `1px dashed ${colors.border}`
                }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        backgroundColor: colors.hover,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        color: colors.textSecondary
                    }}>
                        <Calendar size={32} />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: colors.text, marginBottom: '8px' }}>
                        Belum ada undangan
                    </h3>
                    <p style={{ color: colors.textSecondary, marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
                        Anda belum membuat undangan pernikahan apapun. Mulai buat undangan pertama Anda sekarang!
                    </p>
                    <Link
                        href="/client-dashboard/new-order"
                        style={{
                            padding: '10px 24px',
                            backgroundColor: colors.primary,
                            color: colors.primaryText,
                            borderRadius: '8px',
                            border: 'none',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '14px',
                            textDecoration: 'none',
                            display: 'inline-block'
                        }}
                    >
                        Buat Undangan Sekarang
                    </Link>
                </div>
            )}


            <style jsx>{`
                .invitations-header {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    margin-bottom: 32px;
                }
                @media (min-width: 768px) {
                    .invitations-header {
                        flex-direction: row;
                        justify-content: space-between;
                        align-items: center;
                    }
                }
            `}</style>
        </div>
    );
}
