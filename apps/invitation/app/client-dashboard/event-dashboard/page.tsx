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
    CheckCircle,
    AlertCircle,
    ClipboardList,
    Globe,
    EyeOff,
    Loader
} from 'lucide-react';
import { InvitationAPI } from '@/lib/api/client';

export default function EventDashboardPage() {
    const { selectedEvent, isLoading, clientData } = useClient();
    const { colors } = useTheme();
    const router = useRouter();
    const [stats, setStats] = useState({
        guests: 0,
        wishes: 0,
        rsvps: 0
    });
    const [isPublished, setIsPublished] = useState<boolean | null>(null);
    const [publishing, setPublishing] = useState(false);
    const [registrationComplete, setRegistrationComplete] = useState<boolean | null>(null);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

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

    useEffect(() => {
        const fetchPublishStatus = async () => {
            if (!selectedEvent?.slug) return;
            const token = localStorage.getItem('client_token');
            if (!token) return;
            try {
                const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
                // Check invitation_pages isActive via client API
                const res = await fetch(`${API_BASE_URL}/v1/client/invitations/${selectedEvent.slug}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setIsPublished(data?.data?.isActive ?? data?.data?.is_active ?? null);
                }
            } catch { }
        };
        fetchPublishStatus();
    }, [selectedEvent]);

    useEffect(() => {
        const checkRegistrationComplete = async () => {
            if (!selectedEvent?.slug) return;
            const token = localStorage.getItem('client_token');
            if (!token) return;
            try {
                const res = await fetch(`${API_BASE_URL}/v1/registration/${selectedEvent.slug}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const reg = data?.data || data?.registration || data;
                    // Complete = bride_name + event1_date filled
                    setRegistrationComplete(!!(reg?.bride_name || reg?.brideName) && !!(reg?.event1_date || reg?.event1Date));
                } else {
                    setRegistrationComplete(false);
                }
            } catch { setRegistrationComplete(false); }
        };
        checkRegistrationComplete();
    }, [selectedEvent]);

    const handlePublish = async () => {
        if (!selectedEvent?.slug) return;
        const token = localStorage.getItem('client_token');
        if (!token) return;
        setPublishing(true);
        try {
            const res = await fetch(`${API_BASE_URL}/v1/registration/${selectedEvent.slug}/publish`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) setIsPublished(true);
        } catch { }
        finally { setPublishing(false); }
    };

    const handleUnpublish = async () => {
        if (!selectedEvent?.slug) return;
        const token = localStorage.getItem('client_token');
        if (!token) return;
        setPublishing(true);
        try {
            const res = await fetch(`${API_BASE_URL}/v1/registration/${selectedEvent.slug}/unpublish`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) setIsPublished(false);
        } catch { }
        finally { setPublishing(false); }
    };

    if (isLoading || !selectedEvent) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    borderWidth: '3px',
                    borderStyle: 'solid',
                    borderColor: `${colors.border} ${colors.border} ${colors.border} ${colors.primary}`,
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
            {/* Unpublished Warning Banner */}
            {isPublished === false && (
                <div style={{
                    padding: '14px 18px',
                    borderRadius: '10px',
                    marginBottom: '20px',
                    backgroundColor: 'rgba(251,191,36,0.1)',
                    border: '1px solid rgba(251,191,36,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AlertCircle size={20} color="#f59e0b" />
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '14px', color: colors.text }}>Undangan belum dipublikasikan</div>
                            <div style={{ fontSize: '12px', color: colors.textSecondary }}>Lengkapi Data Pernikahan dan klik Publish agar tamu bisa mengakses undangan Anda.</div>
                        </div>
                    </div>
                    <Link href="/client-dashboard/data-pernikahan" style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 14px', borderRadius: '8px', fontSize: '13px',
                        fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap',
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff',
                    }}>
                        <ClipboardList size={14} /> Lengkapi & Publish
                    </Link>
                </div>
            )}

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
                        href={`/${selectedEvent.slug}`}
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

                {/* Publish Status Card */}
                <div style={{
                    backgroundColor: colors.card,
                    borderRadius: '12px',
                    padding: '20px',
                    border: `1px solid ${isPublished ? 'rgba(34,197,94,0.4)' : colors.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        backgroundColor: isPublished ? '#dcfce7' : '#f3f4f6',
                        color: isPublished ? '#166534' : '#4b5563',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        {isPublished ? <CheckCircle size={24} /> : <Clock size={24} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '14px', color: colors.textSecondary }}>Status Undangan</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: colors.text }}>
                            {isPublished === null ? '...' : isPublished ? 'Published ✓' : 'Belum Publish'}
                        </div>
                    </div>
                    {/* Publish / Unpublish button */}
                    {isPublished === false && (
                        <button
                            onClick={registrationComplete ? handlePublish : undefined}
                            disabled={publishing || registrationComplete === false}
                            title={registrationComplete === false ? 'Lengkapi Data Pernikahan terlebih dahulu' : ''}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 14px', borderRadius: '8px', fontSize: '13px',
                                fontWeight: 700, cursor: (publishing || registrationComplete === false) ? 'not-allowed' : 'pointer',
                                border: 'none', flexShrink: 0,
                                background: registrationComplete === false
                                    ? '#e5e7eb'
                                    : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                color: registrationComplete === false ? '#9ca3af' : '#fff',
                                opacity: publishing ? 0.6 : 1,
                                boxShadow: registrationComplete === false ? 'none' : '0 2px 8px rgba(99,102,241,0.3)',
                            }}
                        >
                            {publishing ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Globe size={14} />}
                            {publishing ? '...' : 'Publish'}
                        </button>
                    )}
                    {isPublished === true && (
                        <button
                            onClick={handleUnpublish}
                            disabled={publishing}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 14px', borderRadius: '8px', fontSize: '13px',
                                fontWeight: 600, cursor: publishing ? 'not-allowed' : 'pointer',
                                border: '1px solid rgba(239,68,68,0.4)', flexShrink: 0,
                                backgroundColor: 'transparent', color: '#ef4444',
                                opacity: publishing ? 0.6 : 1,
                            }}
                        >
                            {publishing ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <EyeOff size={14} />}
                            {publishing ? '...' : 'Unpublish'}
                        </button>
                    )}
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
