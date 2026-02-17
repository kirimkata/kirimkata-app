'use client';

import { useEffect, useState } from 'react';
import { useClient } from '@/lib/contexts/ClientContext';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Calendar,
    MapPin,
    Users,
    MessageSquare,
    Share2,
    Edit3,
    ExternalLink,
    Clock,
    CheckCircle
} from 'lucide-react';
import { InvitationAPI } from '@/lib/api/client';

export default function EventDashboardPage() {
    const { selectedEvent, isLoading, clientData } = useClient();
    const { colors } = useTheme();
    const router = useRouter();
    const [stats, setStats] = useState({
        guests: 0,
        wishes: 0,
        rsvps: 0 // Placeholder if we don't have this API yet
    });

    useEffect(() => {
        if (!isLoading && !selectedEvent) {
            router.push('/client-dashboard/invitations');
        }
    }, [isLoading, selectedEvent, router]);

    // Mock stats fetching or real if available
    useEffect(() => {
        const fetchStats = async () => {
            if (selectedEvent && localStorage.getItem('client_token')) {
                const token = localStorage.getItem('client_token') as string;
                try {
                    // Try to fetch guests count
                    const guestsData = await InvitationAPI.getGuests(token);
                    if (guestsData.success && guestsData.data) {
                        setStats(prev => ({ ...prev, guests: guestsData.data.length }));
                    }

                    // Try to fetch wishes/messages count
                    const messagesData = await InvitationAPI.getMessages(token);
                    if (messagesData.success && messagesData.data) {
                        setStats(prev => ({ ...prev, wishes: messagesData.data.length }));
                    }

                } catch (e) {
                    console.error('Error fetching stats', e);
                }
            }
        };

        fetchStats();
    }, [selectedEvent]);

    if (isLoading || !selectedEvent) {
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const shortcuts = [
        { title: 'Edit Undangan', icon: Edit3, link: '/client-dashboard/edit-undangan', desc: 'Ubah detail acara, mempelai, dll' },
        { title: 'Buku Tamu', icon: Users, link: '/client-dashboard/guestbook', desc: 'Check-in tamu dan kehadiran' },
        { title: 'Ucapan', icon: MessageSquare, link: '/client-dashboard/daftar-ucapan', desc: 'Lihat ucapan dan doa dari tamu' },
        { title: 'Kirim Undangan', icon: Share2, link: '/client-dashboard/kirim-undangan', desc: 'Sebar undangan ke tamu Anda' },
    ];

    return (
        <div>
            {/* Welcome Banner */}
            <div
                className="dashboard-banner"
                style={{
                    marginBottom: '32px',
                    backgroundColor: colors.card,
                    borderRadius: '16px',
                    padding: '24px',
                    border: `1px solid ${colors.border}`,
                }}
            >
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.text, marginBottom: '8px' }}>
                        Dashboard Acara
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.textSecondary }}>
                        <span style={{ fontSize: '16px', fontWeight: 600 }}>{selectedEvent.name}</span>
                        <span>•</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
                            <Calendar size={14} />
                            {formatDate(selectedEvent.event_date)}
                        </div>
                    </div>
                </div>

                {selectedEvent.slug && (
                    <a
                        href={`https://kirimkata.com/${selectedEvent.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 16px',
                            backgroundColor: colors.hover,
                            borderRadius: '8px',
                            color: colors.primary,
                            fontWeight: 600,
                            fontSize: '14px',
                            textDecoration: 'none',
                            transition: 'background-color 0.2s'
                        }}
                    >
                        Lihat Undangan
                        <ExternalLink size={16} />
                    </a>
                )}
            </div>

            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '24px',
                marginBottom: '32px'
            }}>
                <div style={{
                    backgroundColor: colors.card,
                    borderRadius: '12px',
                    padding: '20px',
                    border: `1px solid ${colors.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        backgroundColor: '#dbeafe',
                        color: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Users size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '14px', color: colors.textSecondary }}>Total Tamu</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors.text }}>{stats.guests}</div>
                    </div>
                </div>

                <div style={{
                    backgroundColor: colors.card,
                    borderRadius: '12px',
                    padding: '20px',
                    border: `1px solid ${colors.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        backgroundColor: '#fce7f3',
                        color: '#db2777',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <MessageSquare size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '14px', color: colors.textSecondary }}>Ucapan & Doa</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors.text }}>{stats.wishes}</div>
                    </div>
                </div>

                <div style={{
                    backgroundColor: colors.card,
                    borderRadius: '12px',
                    padding: '20px',
                    border: `1px solid ${colors.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        backgroundColor: selectedEvent.is_active ? '#dcfce7' : '#f3f4f6',
                        color: selectedEvent.is_active ? '#166534' : '#4b5563',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {selectedEvent.is_active ? <CheckCircle size={24} /> : <Clock size={24} />}
                    </div>
                    <div>
                        <div style={{ fontSize: '14px', color: colors.textSecondary }}>Status Undangan</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: colors.text }}>{selectedEvent.is_active ? 'Aktif' : 'Draft'}</div>
                    </div>
                </div>
            </div>

            {/* Shortcuts */}
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: colors.text, marginBottom: '16px' }}>
                Akses Cepat
            </h2>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '16px'
            }}>
                {shortcuts.map((item, index) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={index}
                            href={item.link}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                padding: '20px',
                                backgroundColor: colors.card,
                                borderRadius: '12px',
                                border: `1px solid ${colors.border}`,
                                textDecoration: 'none',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = colors.primary;
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = colors.border;
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                backgroundColor: colors.hover,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: colors.text,
                                marginBottom: '12px'
                            }}>
                                <Icon size={20} />
                            </div>
                            <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.text, marginBottom: '4px' }}>
                                {item.title}
                            </h3>
                            <p style={{ fontSize: '13px', color: colors.textSecondary }}>
                                {item.desc}
                            </p>
                        </Link>
                    );
                })}
            </div>
            <style jsx>{`
                .dashboard-banner {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                @media (min-width: 768px) {
                    .dashboard-banner {
                        flex-direction: row;
                        justify-content: space-between;
                        align-items: center;
                    }
                }
            `}</style>
        </div>
    );
}
