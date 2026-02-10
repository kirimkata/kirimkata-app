'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

import { ClientProvider, useClient } from '@/lib/contexts/ClientContext';

function ClientLayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, isLoading, clientData, events, selectedEvent, setSelectedEvent, logout } = useClient();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showEventDropdown, setShowEventDropdown] = useState(false);

    // Redirect if not authenticated (handled by context mostly, but double check)
    useEffect(() => {
        if (!isLoading && !isAuthenticated && pathname !== '/client-dashboard/login') {
            router.push('/client-dashboard/login');
        }
        // Redirect authenticated users away from login page
        if (!isLoading && isAuthenticated && pathname === '/client-dashboard/login') {
            router.push('/client-dashboard');
        }
    }, [isLoading, isAuthenticated, pathname, router]);

    useEffect(() => {
        // Add dashboard-page class to body for CSS targeting
        document.body.classList.add('dashboard-page');

        // Auto-close sidebar on mobile
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            document.body.classList.remove('dashboard-page');
        };
    }, []);

    const handleEventChange = (event: any) => {
        setSelectedEvent(event);
        localStorage.setItem('selected_event_id', event.id);
        setShowEventDropdown(false);
        // Reload page if on guestbook to refresh data
        if (pathname === '/client-dashboard/guestbook') {
            window.location.reload();
        }
    };

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#f3f4f6'
            }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    border: '4px solid #e5e7eb',
                    borderTopColor: '#2563eb',
                    animation: 'spin 1s linear infinite'
                }} />
                <style>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    if (!isAuthenticated && pathname !== '/client-dashboard/login') {
        return null;
    }

    if (pathname === '/client-dashboard/login') {
        return <>{children}</>;
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
            {/* Sidebar */}
            <aside style={{
                width: isSidebarOpen ? '280px' : '0',
                backgroundColor: '#fff',
                borderRight: '1px solid #e5e7eb',
                position: 'fixed',
                top: 0,
                left: 0,
                bottom: 0,
                zIndex: 40,
                transition: 'width 0.3s ease',
                overflow: 'hidden',
                boxShadow: isSidebarOpen ? '4px 0 24px rgba(0,0,0,0.02)' : 'none'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {/* Logo Area */}
                    <div style={{ padding: '24px' }}>
                        <Link href="/client-dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img
                                src="/k_logo.png"
                                alt="KirimKata"
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    objectFit: 'contain',
                                    marginRight: '12px'
                                }}
                            />
                            <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', letterSpacing: '-0.02em' }}>
                                KirimKata
                            </span>
                        </Link>
                    </div>

                    {/* Event Selector */}
                    <div style={{ padding: '0 24px 24px' }}>
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowEventDropdown(!showEventDropdown)}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    backgroundColor: '#f9fafb',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                                    <span style={{ fontSize: '18px' }}>🎉</span>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', overflow: 'hidden' }}>
                                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                                            {selectedEvent ? selectedEvent.name : 'Pilih Event'}
                                        </span>
                                        {selectedEvent && (
                                            <span style={{ fontSize: '11px', color: '#6b7280' }}>
                                                {new Date(selectedEvent.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span style={{ fontSize: '12px', color: '#6b7280' }}>▼</span>
                            </button>

                            {showEventDropdown && (
                                <div style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 8px)',
                                    left: 0,
                                    right: 0,
                                    backgroundColor: '#fff',
                                    borderRadius: '12px',
                                    border: '1px solid #e5e7eb',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                    zIndex: 50,
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    padding: '6px'
                                }}>
                                    {events.length > 0 ? (
                                        events.map((event: any) => (
                                            <button
                                                key={event.id}
                                                onClick={() => handleEventChange(event)}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 12px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    border: 'none',
                                                    backgroundColor: selectedEvent?.id === event.id ? '#eff6ff' : 'transparent',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    textAlign: 'left'
                                                }}
                                            >
                                                <span style={{ fontSize: '16px' }}>🎉</span>
                                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {event.name}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: '#6b7280' }}>
                                                        {new Date(event.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </div>
                                                </div>
                                                {selectedEvent?.id === event.id && (
                                                    <span style={{ color: '#2563eb', fontSize: '14px' }}>✓</span>
                                                )}
                                            </button>
                                        ))
                                    ) : (
                                        <div style={{ padding: '12px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
                                            Tidak ada event
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <Link href="/client-dashboard" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                backgroundColor: pathname === '/client-dashboard' ? '#eff6ff' : 'transparent',
                                color: pathname === '/client-dashboard' ? '#2563eb' : '#4b5563',
                                textDecoration: 'none',
                                transition: 'all 0.2s',
                                fontWeight: pathname === '/client-dashboard' ? 600 : 500
                            }}>
                                <span style={{ fontSize: '20px' }}>📊</span>
                                <span style={{ fontSize: '14px' }}>Dashboard</span>
                            </Link>

                            <Link href="/client-dashboard/edit-undangan" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                backgroundColor: pathname.includes('/edit-undangan') ? '#eff6ff' : 'transparent',
                                color: pathname.includes('/edit-undangan') ? '#2563eb' : '#4b5563',
                                textDecoration: 'none',
                                transition: 'all 0.2s',
                                fontWeight: pathname.includes('/edit-undangan') ? 600 : 500
                            }}>
                                <span style={{ fontSize: '20px' }}>✍️</span>
                                <span style={{ fontSize: '14px' }}>Edit Undangan</span>
                            </Link>

                            <Link href="/client-dashboard/daftar-ucapan" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                backgroundColor: pathname.includes('/daftar-ucapan') ? '#eff6ff' : 'transparent',
                                color: pathname.includes('/daftar-ucapan') ? '#2563eb' : '#4b5563',
                                textDecoration: 'none',
                                transition: 'all 0.2s',
                                fontWeight: pathname.includes('/daftar-ucapan') ? 600 : 500
                            }}>
                                <span style={{ fontSize: '20px' }}>💌</span>
                                <span style={{ fontSize: '14px' }}>Daftar Ucapan</span>
                            </Link>

                            <Link href="/client-dashboard/guestbook" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                backgroundColor: pathname.includes('/guestbook') ? '#eff6ff' : 'transparent',
                                color: pathname.includes('/guestbook') ? '#2563eb' : '#4b5563',
                                textDecoration: 'none',
                                transition: 'all 0.2s',
                                fontWeight: pathname.includes('/guestbook') ? 600 : 500
                            }}>
                                <span style={{ fontSize: '20px' }}>📖</span>
                                <span style={{ fontSize: '14px' }}>Buku Tamu</span>
                            </Link>

                            <Link href="/client-dashboard/kirim-undangan" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                backgroundColor: pathname.includes('/kirim-undangan') ? '#eff6ff' : 'transparent',
                                color: pathname.includes('/kirim-undangan') ? '#2563eb' : '#4b5563',
                                textDecoration: 'none',
                                transition: 'all 0.2s',
                                fontWeight: pathname.includes('/kirim-undangan') ? 600 : 500
                            }}>
                                <span style={{ fontSize: '20px' }}>📤</span>
                                <span style={{ fontSize: '14px' }}>Kirim Undangan</span>
                            </Link>

                            <Link href="/client-dashboard/message-template" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                backgroundColor: pathname.includes('/message-template') ? '#eff6ff' : 'transparent',
                                color: pathname.includes('/message-template') ? '#2563eb' : '#4b5563',
                                textDecoration: 'none',
                                transition: 'all 0.2s',
                                fontWeight: pathname.includes('/message-template') ? 600 : 500
                            }}>
                                <span style={{ fontSize: '20px' }}>📝</span>
                                <span style={{ fontSize: '14px' }}>Message Template</span>
                            </Link>

                            <Link href="/client-dashboard/media-library" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                backgroundColor: pathname.includes('/media-library') ? '#eff6ff' : 'transparent',
                                color: pathname.includes('/media-library') ? '#2563eb' : '#4b5563',
                                textDecoration: 'none',
                                transition: 'all 0.2s',
                                fontWeight: pathname.includes('/media-library') ? 600 : 500
                            }}>
                                <span style={{ fontSize: '20px' }}>🖼️</span>
                                <span style={{ fontSize: '14px' }}>Media Library</span>
                            </Link>

                            <Link href="/client-dashboard/custom-tema" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                backgroundColor: pathname.includes('/custom-tema') ? '#eff6ff' : 'transparent',
                                color: pathname.includes('/custom-tema') ? '#2563eb' : '#4b5563',
                                textDecoration: 'none',
                                transition: 'all 0.2s',
                                fontWeight: pathname.includes('/custom-tema') ? 600 : 500
                            }}>
                                <span style={{ fontSize: '20px' }}>🎨</span>
                                <span style={{ fontSize: '14px' }}>Custom Tema</span>
                            </Link>

                            <Link href="/client-dashboard/pengaturan" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                backgroundColor: pathname.includes('/pengaturan') ? '#eff6ff' : 'transparent',
                                color: pathname.includes('/pengaturan') ? '#2563eb' : '#4b5563',
                                textDecoration: 'none',
                                transition: 'all 0.2s',
                                fontWeight: pathname.includes('/pengaturan') ? 600 : 500
                            }}>
                                <span style={{ fontSize: '20px' }}>⚙️</span>
                                <span style={{ fontSize: '14px' }}>Pengaturan</span>
                            </Link>
                        </div>
                    </nav>

                    {/* User Profile */}
                    <div style={{ padding: '24px', borderTop: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: '#bfdbfe',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#1e40af',
                                fontWeight: 'bold',
                                fontSize: '16px'
                            }}>
                                {clientData?.name?.charAt(0) || 'U'}
                            </div>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {clientData?.name || 'User'}
                                </div>
                                <div style={{ fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {clientData?.email}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '8px',
                                border: '1px solid #fee2e2',
                                backgroundColor: '#fef2f2',
                                color: '#dc2626',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <span>🚪</span> Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{
                flex: 1,
                marginLeft: isSidebarOpen ? '280px' : '0',
                transition: 'margin-left 0.3s ease',
                minHeight: '100vh',
                position: 'relative'
            }}>
                {/* Mobile Header */}
                <header style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 24px',
                    backgroundColor: '#fff',
                    borderBottom: '1px solid #e5e7eb',
                    position: 'sticky',
                    top: 0,
                    zIndex: 30
                }}>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        style={{
                            padding: '8px',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            backgroundColor: '#fff',
                            color: '#4b5563',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <span style={{ fontSize: '20px' }}>☰</span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {selectedEvent && (
                            <div style={{
                                padding: '6px 12px',
                                backgroundColor: '#eff6ff',
                                borderRadius: '20px',
                                color: '#1e40af',
                                fontSize: '13px',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <span>🎉</span>
                                {selectedEvent.name}
                            </div>
                        )}
                    </div>
                </header>

                {/* Content Area */}
                <div style={{ padding: '32px' }}>
                    {children}
                </div>
            </main>
        </div>
    );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    return (
        <ClientProvider>
            <ClientLayoutContent>{children}</ClientLayoutContent>
        </ClientProvider>
    );
}
