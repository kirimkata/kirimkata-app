'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard,
    Edit3,
    Heart,
    BookOpen,
    Send,
    MessageSquare,
    Image,
    Palette,
    Settings,
    LogOut,
    Sun,
    Moon,
    Menu,
    ChevronDown,
    Calendar,
    Check,
    FileText,
    Share2,
    DollarSign,
    CreditCard,
    User,
    ArrowLeft,
    ClipboardList
} from 'lucide-react';

import { ClientProvider, useClient } from '@/lib/contexts/ClientContext';
import { ThemeProvider, useTheme } from '@/lib/contexts/ThemeContext';
import { ToastProvider } from '@/components/ui';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    return (
        <ClientProvider>
            <ThemeProvider>
                <ToastProvider>
                    <ClientLayoutContent>{children}</ClientLayoutContent>
                </ToastProvider>
            </ThemeProvider>
        </ClientProvider>
    );
}

function ClientLayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, isLoading, clientData, events, selectedEvent, setSelectedEvent, logout } = useClient();
    const { theme, toggleTheme, colors } = useTheme();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showEventDropdown, setShowEventDropdown] = useState(false);

    // Define Global Routes
    const globalRoutes = [
        '/client-dashboard',
        '/client-dashboard/invitations',
        '/client-dashboard/invoice',
        '/client-dashboard/profile',
        '/client-dashboard/affiliate',
        '/client-dashboard/history-bonus',
        '/client-dashboard/history-penarikan'
    ];

    const isGlobalContext = globalRoutes.includes(pathname);

    // Redirect if not authenticated
    useEffect(() => {
        const isPublicRoute = ['/client-dashboard/login', '/client-dashboard/register', '/client-dashboard/verify-email'].some(path => pathname.startsWith(path));

        if (!isLoading && !isAuthenticated && !isPublicRoute) {
            router.push('/client-dashboard/login');
        }
        if (!isLoading && isAuthenticated && isPublicRoute) {
            router.push('/client-dashboard');
        }
    }, [isLoading, isAuthenticated, pathname, router]);

    useEffect(() => {
        document.body.classList.add('dashboard-page');
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
        // If we are in global context, switching event should probably take us to event dashboard?
        // Or just let user navigate there. For now, let's keep it simple.
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
                backgroundColor: colors.background
            }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    borderWidth: '4px',
                    borderStyle: 'solid',
                    borderColor: `${colors.border} ${colors.border} ${colors.border} #2563eb`,
                    animation: 'spin 1s linear infinite'
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const isPublicRoute = ['/client-dashboard/login', '/client-dashboard/register', '/client-dashboard/verify-email', '/client-dashboard/new-order'].some(path => pathname.startsWith(path));

    if (!isAuthenticated && !isPublicRoute) {
        return null;
    }

    if (isPublicRoute) {
        return <>{children}</>;
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.background, color: colors.text, transition: 'background-color 0.3s, color 0.3s' }}>
            {/* Sidebar */}
            <aside style={{
                width: isSidebarOpen ? '280px' : '0',
                backgroundColor: colors.sidebar,
                borderRight: `1px solid ${colors.sidebarBorder}`,
                position: 'fixed',
                top: 0,
                left: 0,
                bottom: 0,
                zIndex: 40,
                transition: 'width 0.3s ease, background-color 0.3s, border-color 0.3s',
                overflow: 'hidden',
                boxShadow: isSidebarOpen ? '4px 0 24px rgba(0,0,0,0.05)' : 'none'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
                    {/* Logo Area */}
                    <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Link href="/client-dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img
                                src="/k_logo.png"
                                alt="KirimKata"
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    objectFit: 'contain',
                                }}
                            />
                            <span style={{ fontSize: '20px', fontWeight: 'bold', color: colors.text, letterSpacing: '-0.02em', fontFamily: 'Inter, sans-serif' }}>
                                KirimKata
                            </span>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav style={{ flex: 1, padding: '0 16px' }}>
                        {isGlobalContext ? (
                            // --- GLOBAL SIDEBAR ---
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: colors.textSecondary, marginBottom: '8px', paddingLeft: '12px', letterSpacing: '0.05em' }}>MAIN MENU</div>
                                {[
                                    { path: '/client-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                                    { path: '/client-dashboard/invitations', icon: Send, label: 'Undangan Saya' }, // Using Send as "Undangan" icon? Or maybe Mail. Send matches "Kirim Undangan" but "Undangan Saya" is closer to list.
                                    { path: '/client-dashboard/invoice', icon: FileText, label: 'Invoice' },
                                ].map((item) => {
                                    const isActive = pathname === item.path;
                                    const Icon = item.icon;
                                    return (
                                        <Link key={item.path} href={item.path} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '10px 12px',
                                            borderRadius: '8px',
                                            backgroundColor: isActive ? colors.primary : 'transparent',
                                            color: isActive ? colors.primaryText : colors.textSecondary,
                                            textDecoration: 'none',
                                            transition: 'all 0.2s',
                                            fontWeight: isActive ? 600 : 500,
                                            marginBottom: '4px'
                                        }}>
                                            <Icon size={18} />
                                            <span style={{ fontSize: '14px' }}>{item.label}</span>
                                        </Link>
                                    );
                                })}

                                <div style={{ height: '24px' }}></div>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: colors.textSecondary, marginBottom: '8px', paddingLeft: '12px', letterSpacing: '0.05em' }}>AFFILIATE</div>
                                {[
                                    { path: '/client-dashboard/affiliate', icon: Share2, label: 'Affiliate' },
                                    { path: '/client-dashboard/history-bonus', icon: DollarSign, label: 'History Bonus' },
                                    { path: '/client-dashboard/history-penarikan', icon: CreditCard, label: 'History Penarikan' },
                                ].map((item) => {
                                    const isActive = pathname === item.path;
                                    const Icon = item.icon;
                                    return (
                                        <Link key={item.path} href={item.path} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '10px 12px',
                                            borderRadius: '8px',
                                            backgroundColor: isActive ? colors.primary : 'transparent',
                                            color: isActive ? colors.primaryText : colors.textSecondary,
                                            textDecoration: 'none',
                                            transition: 'all 0.2s',
                                            fontWeight: isActive ? 600 : 500,
                                            marginBottom: '4px'
                                        }}>
                                            <Icon size={18} />
                                            <span style={{ fontSize: '14px' }}>{item.label}</span>
                                        </Link>
                                    );
                                })}

                                <div style={{ height: '24px' }}></div>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: colors.textSecondary, marginBottom: '8px', paddingLeft: '12px', letterSpacing: '0.05em' }}>ACCOUNT</div>
                                {[
                                    { path: '/client-dashboard/profile', icon: User, label: 'Edit Profil' },
                                ].map((item) => {
                                    const isActive = pathname === item.path;
                                    const Icon = item.icon;
                                    return (
                                        <Link key={item.path} href={item.path} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '10px 12px',
                                            borderRadius: '8px',
                                            backgroundColor: isActive ? colors.primary : 'transparent',
                                            color: isActive ? colors.primaryText : colors.textSecondary,
                                            textDecoration: 'none',
                                            transition: 'all 0.2s',
                                            fontWeight: isActive ? 600 : 500,
                                            marginBottom: '4px'
                                        }}>
                                            <Icon size={18} />
                                            <span style={{ fontSize: '14px' }}>{item.label}</span>
                                        </Link>
                                    );
                                })}
                                <button
                                    onClick={logout}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        backgroundColor: 'transparent',
                                        color: colors.textSecondary,
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontWeight: 500,
                                        width: '100%',
                                        textAlign: 'left'
                                    }}
                                >
                                    <LogOut size={18} />
                                    <span style={{ fontSize: '14px' }}>Log Out</span>
                                </button>
                            </div>
                        ) : (
                            // --- EVENT SIDEBAR ---
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <Link href="/client-dashboard/invitations" style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    backgroundColor: 'transparent',
                                    color: colors.textSecondary,
                                    textDecoration: 'none',
                                    transition: 'all 0.2s',
                                    fontWeight: 500,
                                    marginBottom: '16px',
                                    border: `1px solid ${colors.border}`
                                }}>
                                    <ArrowLeft size={18} />
                                    <span style={{ fontSize: '14px' }}>Kembali ke Daftar</span>
                                </Link>

                                <div style={{ fontSize: '11px', fontWeight: 700, color: colors.textSecondary, marginBottom: '8px', paddingLeft: '12px', letterSpacing: '0.05em' }}>MENU UNDANGAN</div>

                                {[
                                    { path: '/client-dashboard/data-pernikahan', icon: ClipboardList, label: 'Data Pernikahan' },
                                    { path: '/client-dashboard/event-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                                    { path: '/client-dashboard/edit-undangan', icon: Edit3, label: 'Edit Undangan' },
                                    { path: '/client-dashboard/daftar-ucapan', icon: Heart, label: 'Daftar Ucapan' },
                                    { path: '/client-dashboard/guestbook', icon: BookOpen, label: 'Buku Tamu' },
                                    { path: '/client-dashboard/kirim-undangan', icon: Send, label: 'Kirim Undangan' },
                                    { path: '/client-dashboard/message-template', icon: MessageSquare, label: 'Message Template' },
                                    { path: '/client-dashboard/media-library', icon: Image, label: 'Media Library' },
                                    { path: '/client-dashboard/custom-tema', icon: Palette, label: 'Custom Tema' },
                                    { path: '/client-dashboard/pengaturan', icon: Settings, label: 'Pengaturan' }
                                ].map((item) => {
                                    const isActive = pathname === item.path;
                                    const Icon = item.icon;

                                    return (
                                        <Link key={item.path} href={item.path} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '10px 12px',
                                            borderRadius: '8px',
                                            backgroundColor: isActive ? colors.primary : 'transparent',
                                            color: isActive ? colors.primaryText : colors.textSecondary,
                                            textDecoration: 'none',
                                            transition: 'all 0.2s',
                                            fontWeight: isActive ? 600 : 500
                                        }}>
                                            <Icon size={18} />
                                            <span style={{ fontSize: '14px' }}>{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </nav>

                    {!isGlobalContext && (
                        <div style={{ padding: '16px', borderTop: `1px solid ${colors.border}` }}>
                            <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '8px' }}>Active Event:</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px' }}>
                                <Calendar size={16} />
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {selectedEvent?.name || 'Loading...'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main style={{
                flex: 1,
                marginLeft: isSidebarOpen ? '280px' : '0',
                transition: 'margin-left 0.3s ease, background-color 0.3s',
                minHeight: '100vh',
                position: 'relative',
                backgroundColor: colors.background
            }}>
                {/* Mobile Header */}
                <header style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 24px',
                    backgroundColor: colors.sidebar,
                    borderBottom: `1px solid ${colors.border}`,
                    position: 'sticky',
                    top: 0,
                    zIndex: 30,
                    transition: 'background-color 0.3s, border-color 0.3s'
                }}>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        style={{
                            padding: '6px',
                            borderRadius: '6px',
                            border: `1px solid ${colors.border}`,
                            backgroundColor: 'transparent',
                            color: colors.text,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Menu size={20} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {/* Theme Toggle */}
                        <button onClick={toggleTheme} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.text }}>
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
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
