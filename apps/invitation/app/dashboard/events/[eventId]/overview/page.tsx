'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface EventStats {
  total_guests: number;
  checked_in: number;
  invitations_sent: number;
  seats_assigned: number;
  guest_types_breakdown: Record<string, number>;
}

interface Event {
  id: string;
  event_name: string;
  event_date: string;
  event_time: string | null;
  venue_name: string | null;
  venue_address: string | null;
  has_invitation: boolean;
  has_guestbook: boolean;
  seating_mode: string;
}

export default function EventOverviewPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    const token = localStorage.getItem('client_token');

    try {
      // Fetch event details
      const eventRes = await fetch(`/api/guestbook/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (eventRes.ok) {
        const eventData = await eventRes.json();
        setEvent(eventData.data);
      }

      // Fetch stats
      const statsRes = await fetch(`/api/guestbook/events/${eventId}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e5e7eb',
          borderTopColor: '#2563eb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: '#4b5563' }}>Event not found</p>
      </div>
    );
  }

  const checkInPercentage = stats?.total_guests
    ? Math.round((stats.checked_in / stats.total_guests) * 100)
    : 0;

  const containerStyle = {
    padding: '32px',
    fontFamily: 'Segoe UI, sans-serif'
  };

  const badgeStyle = (bgColor: string, textColor: string) => ({
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 12px',
    borderRadius: '9999px',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: bgColor,
    color: textColor,
    marginRight: '8px'
  });

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    padding: '24px'
  };

  const iconContainerStyle = (bgColor: string) => ({
    padding: '12px',
    backgroundColor: bgColor,
    borderRadius: '8px'
  });

  const quickActionStyle = (hoverColor: string, hoverBg: string) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    textDecoration: 'none',
    transition: 'all 0.2s',
    cursor: 'pointer'
  });

  return (
    <div style={containerStyle}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>{event.event_name}</h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '14px', color: '#4b5563' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <svg style={{ width: '20px', height: '20px', marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {new Date(event.event_date).toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
            {event.event_time && ` • ${event.event_time}`}
          </div>
          {event.venue_name && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <svg style={{ width: '20px', height: '20px', marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {event.venue_name}
            </div>
          )}
        </div>

        {/* Module Badges */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          {event.has_invitation && (
            <span style={badgeStyle('#f3e8ff', '#6b21a8')}>
              📧 Invitation Module
            </span>
          )}
          {event.has_guestbook && (
            <span style={badgeStyle('#dcfce7', '#166534')}>
              📖 Guestbook Module
            </span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: '500', color: '#4b5563', margin: 0 }}>Total Guests</p>
              <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginTop: '8px', margin: 0 }}>{stats?.total_guests || 0}</p>
            </div>
            <div style={iconContainerStyle('#eff6ff')}>
              <svg style={{ width: '32px', height: '32px', color: '#2563eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: '500', color: '#4b5563', margin: 0 }}>Checked In</p>
              <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginTop: '8px', marginBottom: '4px' }}>{stats?.checked_in || 0}</p>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>{checkInPercentage}% of total</p>
            </div>
            <div style={iconContainerStyle('#f0fdf4')}>
              <svg style={{ width: '32px', height: '32px', color: '#16a34a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: '500', color: '#4b5563', margin: 0 }}>Invitations Sent</p>
              <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginTop: '8px', margin: 0 }}>{stats?.invitations_sent || 0}</p>
            </div>
            <div style={iconContainerStyle('#faf5ff')}>
              <svg style={{ width: '32px', height: '32px', color: '#9333ea' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: '500', color: '#4b5563', margin: 0 }}>Seats Assigned</p>
              <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginTop: '8px', margin: 0 }}>{stats?.seats_assigned || 0}</p>
            </div>
            <div style={iconContainerStyle('#fff7ed')}>
              <svg style={{ width: '32px', height: '32px', color: '#ea580c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ ...cardStyle, marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px', marginTop: 0 }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <Link
            href={`/dashboard/events/${eventId}/guestbook/guests`}
            style={quickActionStyle('#3b82f6', '#eff6ff')}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.backgroundColor = '#eff6ff';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <div style={{ padding: '8px', backgroundColor: '#dbeafe', borderRadius: '8px', marginRight: '16px' }}>
              <svg style={{ width: '24px', height: '24px', color: '#2563eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <p style={{ fontWeight: '500', color: '#111827', margin: 0 }}>Add Guests</p>
              <p style={{ fontSize: '14px', color: '#4b5563', margin: 0 }}>Manage guest list</p>
            </div>
          </Link>

          <Link
            href={`/dashboard/events/${eventId}/guestbook/checkin`}
            style={quickActionStyle('#22c55e', '#f0fdf4')}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#22c55e';
              e.currentTarget.style.backgroundColor = '#f0fdf4';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <div style={{ padding: '8px', backgroundColor: '#dcfce7', borderRadius: '8px', marginRight: '16px' }}>
              <svg style={{ width: '24px', height: '24px', color: '#16a34a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <div>
              <p style={{ fontWeight: '500', color: '#111827', margin: 0 }}>Check-in</p>
              <p style={{ fontSize: '14px', color: '#4b5563', margin: 0 }}>Scan QR codes</p>
            </div>
          </Link>

          <Link
            href={`/dashboard/events/${eventId}/reports`}
            style={quickActionStyle('#a855f7', '#faf5ff')}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#a855f7';
              e.currentTarget.style.backgroundColor = '#faf5ff';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <div style={{ padding: '8px', backgroundColor: '#f3e8ff', borderRadius: '8px', marginRight: '16px' }}>
              <svg style={{ width: '24px', height: '24px', color: '#9333ea' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p style={{ fontWeight: '500', color: '#111827', margin: 0 }}>View Reports</p>
              <p style={{ fontSize: '14px', color: '#4b5563', margin: 0 }}>Analytics & exports</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Guest Type Breakdown */}
      {stats?.guest_types_breakdown && Object.keys(stats.guest_types_breakdown).length > 0 && (
        <div style={cardStyle}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px', marginTop: 0 }}>Guest Type Breakdown</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Object.entries(stats.guest_types_breakdown).map(([type, count]) => (
              <div key={type}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>{type}</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{count} guests</span>
                </div>
                <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '9999px', height: '8px' }}>
                  <div
                    style={{
                      width: `${stats.total_guests ? (count / stats.total_guests) * 100 : 0}%`,
                      backgroundColor: '#2563eb',
                      height: '8px',
                      borderRadius: '9999px',
                      transition: 'width 0.5s ease-in-out'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
