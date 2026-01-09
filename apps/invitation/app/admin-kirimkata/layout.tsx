'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [adminData, setAdminData] = useState<any>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        const user = localStorage.getItem('admin_user');

        if (!token && pathname !== '/admin-kirimkata/login') {
            router.push('/admin-kirimkata/login');
            return;
        }

        if (token && user) {
            setIsAuthenticated(true);
            try {
                setAdminData(JSON.parse(user));
            } catch (e) {
                setAdminData({ username: 'Admin' });
            }
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

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        router.push('/admin-kirimkata/login');
    };

    if (pathname === '/admin-kirimkata/login') {
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

    return (
        <>
            <div className="admin-dashboard-layout">
                {/* Mobile Overlay */}
                {isSidebarOpen && (
                    <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
                )}

                {/* Sidebar */}
                <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                    <div className="sidebar-header">
                        <div>
                            <h1>KirimKata Admin</h1>
                            <p>{adminData?.username || 'Administrator'}</p>
                        </div>
                        <button className="close-btn" onClick={() => setIsSidebarOpen(false)}>
                            ✕
                        </button>
                    </div>

                    <nav className="sidebar-nav">
                        <Link
                            href="/admin-kirimkata/clients"
                            className={pathname === '/admin-kirimkata/clients' ? 'active' : ''}
                            onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
                        >
                            📋 List Client
                        </Link>
                        <Link
                            href="/admin-kirimkata/tambah-undangan"
                            className={pathname === '/admin-kirimkata/tambah-undangan' ? 'active' : ''}
                            onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
                        >
                            ➕ Tambah Undangan
                        </Link>
                        <Link
                            href="/admin-kirimkata/pengaturan"
                            className={pathname === '/admin-kirimkata/pengaturan' ? 'active' : ''}
                            onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
                        >
                            ⚙️ Pengaturan
                        </Link>
                    </nav>

                    <button className="logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </aside>

                {/* Main Content */}
                <main className="main-content">
                    {/* Hamburger Menu */}
                    <button className="hamburger-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>
                    {children}
                </main>
            </div>

            <style jsx>{`
                /* Override global heading fonts for dashboard */
                :global(.admin-dashboard-layout h1),
                :global(.admin-dashboard-layout h2),
                :global(.admin-dashboard-layout h3),
                :global(.admin-dashboard-layout h4) {
                    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif !important;
                }

                .admin-dashboard-layout {
                    display: flex;
                    min-height: 100vh;
                    font-family: 'Segoe UI', sans-serif;
                    position: relative;
                }

                .sidebar {
                    width: 250px;
                    background: linear-gradient(180deg, #1f2937 0%, #111827 100%);
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
                    box-shadow: 2px 0 12px rgba(0, 0, 0, 0.1);
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
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
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
                    background: linear-gradient(90deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%);
                    color: white;
                    border-left-color: #f59e0b;
                    font-weight: 600;
                }

                .sidebar-nav a.active::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 3px;
                    background: linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%);
                    border-radius: 0 2px 2px 0;
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
                    background-color: #f9fafb;
                    padding: 2rem;
                    margin-left: 250px;
                    transition: margin-left 0.3s ease;
                    min-height: 100vh;
                }

                .hamburger-btn {
                    position: fixed;
                    top: 1rem;
                    left: 1rem;
                    z-index: 999;
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 0.5rem;
                    padding: 0.625rem;
                    cursor: pointer;
                    display: none;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    transition: all 0.2s ease;
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
                    .admin-dashboard-layout {
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
                        padding: 1rem;
                        padding-top: 4rem;
                        overflow-x: hidden;
                    }

                    .hamburger-btn {
                        display: flex;
                        align-items: center;
                        justify-content: center;
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

                /* Desktop - Sidebar always visible */
                @media (min-width: 768px) {
                    .hamburger-btn {
                        display: none;
                    }

                    .sidebar {
                        box-shadow: 2px 0 12px rgba(0, 0, 0, 0.05);
                    }

                    .main-content {
                        width: calc(100% - 250px);
                    }
                }
            `}</style>
        </>
    );
}
