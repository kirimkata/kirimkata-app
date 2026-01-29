'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_ENDPOINTS, getAuthToken, removeAuthToken } from '@/lib/api-config';

interface Event {
  id: string;
  event_name: string;
  event_date: string;
  event_time: string | null;
  venue_name: string | null;
  has_invitation: boolean;
  has_guestbook: boolean;
  is_active: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchEvents();
  }, []);

  const checkAuth = () => {
    const token = getAuthToken();
    if (!token) {
      router.push('/dashboard/login');
    }
  };

  const fetchEvents = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch(API_ENDPOINTS.guestbook.events, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setEvents(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    localStorage.removeItem('client_user');
    router.push('/dashboard/login');
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
        fontFamily: 'Segoe UI, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: '4px solid #e5e7eb',
            borderTopColor: '#2563eb',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <p style={{ marginTop: '16px', color: '#4b5563' }}>Loading...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      fontFamily: 'Segoe UI, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '16px 24px', // px-6 py-4 equivalent
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#111827',
              margin: 0
            }}>KirimKata Dashboard</h1>
            <p style={{
              fontSize: '14px',
              color: '#4b5563',
              margin: '4px 0 0 0'
            }}>Manage your events</p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              color: '#374151',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '32px 24px'
      }}>
        {/* Page Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <div>
            <h2 style={{
              fontSize: '30px',
              fontWeight: 'bold',
              color: '#111827',
              margin: 0
            }}>My Events</h2>
            <p style={{
              marginTop: '4px',
              fontSize: '14px',
              color: '#4b5563'
            }}>
              Create and manage your invitation and guestbook events
            </p>
          </div>
          <Link
            href="/dashboard/events/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '8px 16px',
              backgroundColor: '#2563eb',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          >
            <span style={{ marginRight: '8px', fontSize: '18px' }}>+</span>
            Create New Event
          </Link>
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '2px dashed #d1d5db'
          }}>
            <div style={{ color: '#9ca3af', marginBottom: '8px' }}>
              <svg style={{ width: '48px', height: '48px', margin: '0 auto' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#111827', margin: '8px 0' }}>No events</h3>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 24px' }}>Get started by creating a new event.</p>
            <div>
              <Link
                href="/dashboard/events/new"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '8px 16px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Create Event
              </Link>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/dashboard/events/${event.id}/overview`}
                style={{
                  display: 'block',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ padding: '24px' }}>
                  {/* Event Name */}
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '8px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {event.event_name}
                  </h3>

                  {/* Event Date */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '14px',
                    color: '#4b5563',
                    marginBottom: '12px'
                  }}>
                    <span style={{ marginRight: '8px' }}>📅</span>
                    {new Date(event.event_date).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                    {event.event_time && ` • ${event.event_time}`}
                  </div>

                  {/* Venue */}
                  {event.venue_name && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '14px',
                      color: '#4b5563',
                      marginBottom: '16px'
                    }}>
                      <span style={{ marginRight: '8px' }}>📍</span>
                      <span style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>{event.venue_name}</span>
                    </div>
                  )}

                  {/* Module Badges */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                    {event.has_invitation && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '2px 10px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: '#f3e8ff',
                        color: '#6b21a8'
                      }}>
                        📧 Invitation
                      </span>
                    )}
                    {event.has_guestbook && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '2px 10px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: '#dcfce7',
                        color: '#166534'
                      }}>
                        📖 Guestbook
                      </span>
                    )}
                    {!event.is_active && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '2px 10px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: '#f3f4f6',
                        color: '#1f2937'
                      }}>
                        Inactive
                      </span>
                    )}
                  </div>

                  {/* Action Button */}
                  <div style={{ paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#2563eb'
                    }}>
                      Manage Event →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
