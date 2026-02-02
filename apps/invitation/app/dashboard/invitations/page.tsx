'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Invitation {
    id: string;
    slug: string;
    bride_name: string;
    groom_name: string;
    event1_date: string;
    created_at: string;
}

export default function DashboardInvitationsPage() {
    const router = useRouter();
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInvitations();
    }, []);

    async function fetchInvitations() {
        try {
            // TODO: Replace with actual API call
            // For now, show empty state
            setInvitations([]);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching invitations:', error);
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', color: '#6b7280' }}>Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '24px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
                            My Invitations
                        </h1>
                        <p style={{ color: '#6b7280', fontSize: '16px' }}>
                            Manage and edit your wedding invitations
                        </p>
                    </div>
                    <Link href="/wedding-registration">
                        <button style={{
                            backgroundColor: '#8b5a3c',
                            color: 'white',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#6d4830'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#8b5a3c'}>
                            + Create New Invitation
                        </button>
                    </Link>
                </div>

                {/* Empty State */}
                {invitations.length === 0 ? (
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '64px 32px',
                        textAlign: 'center',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                        <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                            No invitations yet
                        </h2>
                        <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '16px' }}>
                            Create your first wedding invitation to get started
                        </p>
                        <Link href="/wedding-registration">
                            <button style={{
                                backgroundColor: '#8b5a3c',
                                color: 'white',
                                padding: '12px 32px',
                                borderRadius: '8px',
                                border: 'none',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: 'pointer',
                            }}>
                                Create Invitation
                            </button>
                        </Link>
                    </div>
                ) : (
                    /* Invitations Grid */
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: '24px',
                    }}>
                        {invitations.map((invitation) => (
                            <div key={invitation.id} style={{
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                padding: '24px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                transition: 'all 0.2s',
                                cursor: 'pointer',
                            }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}>
                                {/* Couple Names */}
                                <h3 style={{
                                    fontSize: '20px',
                                    fontWeight: '600',
                                    color: '#1f2937',
                                    marginBottom: '8px',
                                }}>
                                    {invitation.bride_name} & {invitation.groom_name}
                                </h3>

                                {/* Event Date */}
                                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
                                    {new Date(invitation.event1_date).toLocaleDateString('id-ID', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>

                                {/* URL */}
                                <div style={{
                                    backgroundColor: '#f3f4f6',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    marginBottom: '16px',
                                    fontSize: '14px',
                                    color: '#4b5563',
                                    fontFamily: 'monospace',
                                }}>
                                    /{invitation.slug}
                                </div>

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <Link href={`/dashboard/invitations/${invitation.slug}/edit`} style={{ flex: 1 }}>
                                        <button style={{
                                            width: '100%',
                                            backgroundColor: '#8b5a3c',
                                            color: 'white',
                                            padding: '10px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                        }}>
                                            Edit
                                        </button>
                                    </Link>
                                    <Link href={`/${invitation.slug}`} target="_blank" style={{ flex: 1 }}>
                                        <button style={{
                                            width: '100%',
                                            backgroundColor: '#fff',
                                            color: '#8b5a3c',
                                            padding: '10px',
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
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
