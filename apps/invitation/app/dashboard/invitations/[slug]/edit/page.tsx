'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function InvitationEditorPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const [invitation, setInvitation] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // TODO: Fetch invitation data
        setLoading(false);
    }, [slug]);

    if (loading) {
        return <div style={{ padding: '24px' }}>Loading...</div>;
    }

    const menuItems = [
        { id: 'love-story', label: 'Love Story', icon: '💕' },
        { id: 'gallery', label: 'Gallery', icon: '📸' },
        { id: 'wedding-gift', label: 'Wedding Gift', icon: '🎁' },
        { id: 'closing', label: 'Closing', icon: '🎊' },
        { id: 'settings', label: 'Settings', icon: '⚙️' },
    ];

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
            {/* Header */}
            <div style={{
                backgroundColor: 'white',
                borderBottom: '1px solid #e5e7eb',
                padding: '16px 24px',
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Link href="/dashboard/invitations" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px' }}>
                            ← Back to Dashboard
                        </Link>
                        <div style={{ height: '20px', width: '1px', backgroundColor: '#e5e7eb' }} />
                        <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
                            Edit Invitation
                        </h1>
                    </div>
                    <Link href={`/${slug}`} target="_blank">
                        <button style={{
                            backgroundColor: 'white',
                            color: '#8b5a3c',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: '2px solid #8b5a3c',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                        }}>
                            Preview
                        </button>
                    </Link>
                </div>
            </div>

            {/* Content */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '20px',
                }}>
                    {menuItems.map((item) => (
                        <Link key={item.id} href={`/dashboard/invitations/${slug}/edit/${item.id}`} style={{ textDecoration: 'none' }}>
                            <div style={{
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                padding: '32px 24px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                transition: 'all 0.2s',
                                cursor: 'pointer',
                                textAlign: 'center',
                            }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>{item.icon}</div>
                                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                                    {item.label}
                                </h3>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
