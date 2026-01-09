'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [clientData, setClientData] = useState<any>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [events, setEvents] = useState<any[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [showEventDropdown, setShowEventDropdown] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('client_token');
        const user = localStorage.getItem('client_user');

        if (!token && pathname !== '/client-dashboard/login') {
            router.push('/client-dashboard/login');
            return;
        }

        if (token && user) {
            setIsAuthenticated(true);
            setClientData(JSON.parse(user));
            fetchEvents(token);
        }

        setLoading(false);

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
            // Remove class on unmount
            document.body.classList.remove('dashboard-page');
        };
    }, [pathname, router]);

    const fetchEvents = async (token: string) => {
        try {
            const res = await fetch('/api/guestbook/events', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.data) {
                    setEvents(data.data);
                    // Load selected event from localStorage or use first event
                    const savedEventId = localStorage.getItem('selected_event_id');
                    const eventToSelect = savedEventId 
                        ? data.data.find((e: any) => e.id === savedEventId) || data.data[0]
                        : data.data[0];
                    setSelectedEvent(eventToSelect);
                    if (eventToSelect) {
                        localStorage.setItem('selected_event_id', eventToSelect.id);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const handleEventChange = (event: any) => {
        setSelectedEvent(event);
        localStorage.setItem('selected_event_id', event.id);
        setShowEventDropdown(false);
        // Reload page if on guestbook to refresh data
        if (pathname === '/client-dashboard/guestbook') {
            window.location.reload();
        }
    };

    const handleLogout = () => {
        // Get client ID before clearing localStorage
        const user = localStorage.getItem('client_user');
        if (user) {
            const data = JSON.parse(user);
            const clientId = data.id;

            // Clear draft data
            if (clientId) {
                localStorage.removeItem(`guests_draft_${clientId}`);
            }
        }

        localStorage.removeItem('client_token');
        localStorage.removeItem('client_user');
        router.push('/client-dashboard/login');
    };

    if (pathname === '/client-dashboard/login') {
        return <>{children}</>;
    }

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Segoe UI, sans-serif',
            }}>
                Loading...
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    const pageTitles: Record<string, string> = {
        '/client-dashboard/kirim-undangan': 'Kirim Undangan',
        '/client-dashboard/message-template': 'Template Pesan',
        '/client-dashboard/media-library': 'Media Library',
        '/client-dashboard/edit-undangan': 'Edit Undangan',
        '/client-dashboard/custom-tema': 'Custom Tema',
        '/client-dashboard/daftar-ucapan': 'Daftar Ucapan',
        '/client-dashboard/guestbook': 'Digital Guestbook',
        '/client-dashboard/pengaturan': 'Pengaturan',
    };

    const currentTitle =
        pageTitles[pathname] ||
        (pathname?.startsWith('/client-dashboard') ? 'Dashboard Klien' : 'Dashboard');

    return (
        <>
            <div className="dashboard-layout">
                {/* Mobile Overlay */}
                {isSidebarOpen && (
                    <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
                )}

                {/* Sidebar */}
                <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                    <div className="sidebar-header">
                        <div style={{ flex: 1 }}>
                            <h1>KirimKata</h1>
                            <p>{clientData?.username}</p>
                        </div>
                        <button className="close-btn" onClick={() => setIsSidebarOpen(false)}>
                            ✕
                        </button>
                    </div>

                    {/* Event Selector Dropdown */}
                    {events.length > 0 && (
                        <div className="event-selector">
                            <label>Event Aktif:</label>
                            <div className="dropdown-wrapper">
                                <button 
                                    className="event-dropdown-btn"
                                    onClick={() => setShowEventDropdown(!showEventDropdown)}
                                >
                                    <span className="event-name">
                                        {selectedEvent?.event_name || 'Pilih Event'}
                                    </span>
                                    <svg 
                                        width="16" 
                                        height="16" 
                                        viewBox="0 0 24 24" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        strokeWidth="2"
                                        style={{ transform: showEventDropdown ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
                                    >
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </button>
                                {showEventDropdown && (
                                    <div className="event-dropdown-menu">
                                        {events.map((event) => (
                                            <button
                                                key={event.id}
                                                className={`event-dropdown-item ${selectedEvent?.id === event.id ? 'active' : ''}`}
                                                onClick={() => handleEventChange(event)}
                                            >
                                                <div className="event-item-content">
                                                    <div className="event-item-name">{event.event_name}</div>
                                                    <div className="event-item-date">
                                                        {event.event_date ? new Date(event.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                                    </div>
                                                </div>
                                                {selectedEvent?.id === event.id && (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                    </svg>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <nav className="sidebar-nav">
                        {/* Menu Undangan - Show if no event selected OR event has invitation features */}
                        {(!selectedEvent || selectedEvent) && (
                            <>
                                <div className="menu-group-title">📧 Undangan</div>
                                <Link
                                    href="/client-dashboard/kirim-undangan"
                                    className={pathname === '/client-dashboard/kirim-undangan' ? 'active' : ''}
                                    onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
                                >
                                    Kirim Undangan
                                </Link>
                                <Link
                                    href="/client-dashboard/message-template"
                                    className={pathname === '/client-dashboard/message-template' ? 'active' : ''}
                                    onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
                                >
                                    Template Pesan
                                </Link>
                                <Link
                                    href="/client-dashboard/media-library"
                                    className={pathname === '/client-dashboard/media-library' ? 'active' : ''}
                                    onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
                                >
                                    Media Library
                                </Link>
                                <Link
                                    href="/client-dashboard/edit-undangan"
                                    className={pathname === '/client-dashboard/edit-undangan' ? 'active' : ''}
                                    onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
                                >
                                    Edit Undangan
                                </Link>
                                {(!clientData?.theme_key || clientData?.theme_key === 'parallax/parallax-template1') && (
                                    <Link
                                        href="/client-dashboard/custom-tema"
                                        className={pathname === '/client-dashboard/custom-tema' ? 'active' : ''}
                                        onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
                                    >
                                        Custom Tema
                                    </Link>
                                )}
                                <Link
                                    href="/client-dashboard/daftar-ucapan"
                                    className={pathname === '/client-dashboard/daftar-ucapan' ? 'active' : ''}
                                    onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
                                >
                                    Daftar Ucapan
                                </Link>
                            </>
                        )}

                        {/* Menu Guestbook - Show only if client has guestbook access */}
                        {clientData?.guestbook_access && selectedEvent && (
                            <>
                                <div className="menu-group-title">📋 Digital Guestbook</div>
                                <Link
                                    href="/client-dashboard/guestbook"
                                    className={pathname === '/client-dashboard/guestbook' ? 'active' : ''}
                                    onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
                                >
                                    Dashboard Guestbook
                                </Link>
                            </>
                        )}

                        {/* Menu Pengaturan */}
                        <div className="menu-group-title">⚙️ Pengaturan</div>
                        <Link
                            href="/client-dashboard/pengaturan"
                            className={pathname === '/client-dashboard/pengaturan' ? 'active' : ''}
                            onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
                        >
                            Pengaturan Akun
                        </Link>
                    </nav>

                    <button className="logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </aside>

                {/* Main Content */}
                <main className="main-content">
                    <div className="page-header-bar">
                        <button className="hamburger-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>
                        <div className="page-title-text">{currentTitle}</div>
                    </div>
                    <div className="page-content">{children}</div>
                </main>
            </div>

            <style jsx>{`
                /* Override global heading fonts for dashboard */
                :global(.dashboard-layout h1),
                :global(.dashboard-layout h2),
                :global(.dashboard-layout h3),
                :global(.dashboard-layout h4) {
                    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif !important;
                }

                .dashboard-layout {
                    display: flex;
                    min-height: 100vh;
                    font-family: 'Segoe UI', sans-serif;
                    position: relative;
                }

                .sidebar {
                    width: 250px;
                    background-color: #1f2937;
                    color: white;
                    padding: 1.5rem;
                    padding-bottom: 2rem; /* Extra padding for logout button */
                    display: flex;
                    flex-direction: column;
                    transition: transform 0.3s ease;
                    position: fixed;
                    top: 0;
                    left: 0;
                    height: 100vh;
                    height: calc(var(--vh, 1vh) * 100); /* Use CSS variable for mobile */
                    max-height: 100vh;
                    max-height: calc(var(--vh, 1vh) * 100);
                    z-index: 1000;
                    overflow-y: auto;
                }

                .sidebar-header {
                    margin-bottom: 2rem;
                    padding-bottom: 1.5rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }

                .sidebar-header h1 {
                    font-size: 1.5rem;
                    font-weight: bold;
                    margin: 0 0 0.5rem 0;
                    background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .sidebar-header p {
                    font-size: 0.875rem;
                    color: #9ca3af;
                    margin: 0;
                }

                .close-btn {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 0;
                    display: none;
                    line-height: 1;
                    opacity: 0.7;
                    transition: opacity 0.2s;
                }

                .close-btn:hover {
                    opacity: 1;
                }

                .sidebar-nav {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .sidebar-nav a {
                    display: flex;
                    align-items: center;
                    padding: 0.875rem 1rem;
                    border-radius: 0.5rem;
                    text-decoration: none;
                    color: #d1d5db;
                    background-color: transparent;
                    transition: all 0.2s ease;
                    font-size: 0.9375rem;
                    font-weight: 500;
                    position: relative;
                    border-left: 3px solid transparent;
                }

                .sidebar-nav a:hover {
                    background-color: rgba(55, 65, 81, 0.5);
                    color: white;
                    transform: translateX(2px);
                }

                .sidebar-nav a.active {
                    background: linear-gradient(90deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%);
                    color: white;
                    border-left-color: #3b82f6;
                    font-weight: 600;
                }

                .sidebar-nav a.active::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 3px;
                    background: linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%);
                    border-radius: 0 2px 2px 0;
                }

                /* Event Selector Styles */
                .event-selector {
                    margin-bottom: 1.5rem;
                    padding-bottom: 1.5rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .event-selector label {
                    display: block;
                    font-size: 0.75rem;
                    color: #9ca3af;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 0.5rem;
                    font-weight: 600;
                }

                .dropdown-wrapper {
                    position: relative;
                }

                .event-dropdown-btn {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0.75rem 1rem;
                    background: rgba(55, 65, 81, 0.5);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 0.5rem;
                    color: white;
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-family: 'Segoe UI', sans-serif;
                }

                .event-dropdown-btn:hover {
                    background: rgba(55, 65, 81, 0.7);
                    border-color: rgba(59, 130, 246, 0.5);
                }

                .event-name {
                    flex: 1;
                    text-align: left;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .event-dropdown-menu {
                    position: absolute;
                    top: calc(100% + 0.5rem);
                    left: 0;
                    right: 0;
                    background: #374151;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 0.5rem;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
                    max-height: 300px;
                    overflow-y: auto;
                    z-index: 1000;
                }

                .event-dropdown-item {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0.75rem 1rem;
                    background: transparent;
                    border: none;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    color: #d1d5db;
                    font-size: 0.875rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-align: left;
                    font-family: 'Segoe UI', sans-serif;
                }

                .event-dropdown-item:last-child {
                    border-bottom: none;
                }

                .event-dropdown-item:hover {
                    background: rgba(59, 130, 246, 0.1);
                    color: white;
                }

                .event-dropdown-item.active {
                    background: rgba(59, 130, 246, 0.15);
                    color: white;
                }

                .event-item-content {
                    flex: 1;
                }

                .event-item-name {
                    font-weight: 500;
                    margin-bottom: 0.25rem;
                }

                .event-item-date {
                    font-size: 0.75rem;
                    color: #9ca3af;
                }

                /* Menu Group Title */
                .menu-group-title {
                    font-size: 0.75rem;
                    color: #9ca3af;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    font-weight: 700;
                    padding: 1rem 1rem 0.5rem 1rem;
                    margin-top: 0.5rem;
                }

                .menu-group-title:first-child {
                    margin-top: 0;
                }

                .logout-btn {
                    margin-top: 1rem;
                    padding: 0.875rem 1rem;
                    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                    color: white;
                    border: none;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    font-weight: 600;
                    font-family: 'Segoe UI', sans-serif;
                    font-size: 0.9375rem;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);
                }

                .logout-btn:hover {
                    background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
                    box-shadow: 0 4px 8px rgba(220, 38, 38, 0.3);
                    transform: translateY(-1px);
                }

                .logout-btn:active {
                    transform: translateY(0);
                }

                .main-content {
                    flex: 1;
                    background-color: #f3f4f6;
                    margin-left: 250px;
                    transition: margin-left 0.3s ease;
                    min-height: 100vh;
                }

                .page-header-bar {
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.85rem 2rem;
                    background: white;
                    border-bottom: 1px solid #e5e7eb;
                    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
                }

                .page-title-text {
                    font-size: 1.125rem;
                    font-weight: 600;
                    color: #0f172a;
                }

                .page-content {
                    padding: 2rem;
                }

                .hamburger-btn {
                    background: #ffffff;
                    border: 1px solid #e5e7eb;
                    border-radius: 0.5rem;
                    padding: 0.5rem;
                    cursor: pointer;
                    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .hamburger-btn:hover {
                    background: #f9fafb;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                }

                .hamburger-btn:active {
                    transform: scale(0.95);
                }

                .sidebar-overlay {
                    display: none;
                }

                /* Mobile Styles */
                @media (max-width: 767px) {
                    .dashboard-layout {
                        display: block;
                        overflow-x: hidden;
                        width: 100%;
                    }

                    .sidebar {
                        transform: translateX(-100%);
                    }

                    .sidebar.open {
                        transform: translateX(0);
                        box-shadow: 4px 0 24px rgba(0, 0, 0, 0.2);
                    }

                    .close-btn {
                        display: block;
                    }

                    .main-content {
                        margin-left: 0;
                        min-height: 100vh;
                    }

                    .page-header-bar {
                        padding: 0.75rem 1rem;
                    }

                    .page-content {
                        padding: 1rem;
                    }

                    .sidebar-overlay {
                        display: block;
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.5);
                        z-index: 999;
                        backdrop-filter: blur(2px);
                    }
                }

                /* Desktop - Sidebar always visible, no minimize */
                @media (min-width: 768px) {
                    .sidebar {
                        box-shadow: 2px 0 12px rgba(0, 0, 0, 0.05);
                    }

                    .main-content {
                        width: calc(100% - 250px);
                    }

                    .hamburger-btn {
                        display: none;
                    }
                }
            `}</style>
        </>
    );
}
