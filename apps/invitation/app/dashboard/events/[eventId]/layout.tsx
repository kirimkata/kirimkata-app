'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import Link from 'next/link';

interface Event {
  id: string;
  event_name: string;
  event_date: string;
  has_invitation: boolean;
  has_guestbook: boolean;
}

export default function EventLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [showEventSwitcher, setShowEventSwitcher] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  const fetchEventData = async () => {
    const token = localStorage.getItem('client_token');
    if (!token) {
      router.push('/dashboard/login');
      return;
    }

    try {
      // Fetch current event
      const eventRes = await fetch(`/api/guestbook/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (eventRes.ok) {
        const eventData = await eventRes.json();
        setEvent(eventData.data);
      } else {
        router.push('/dashboard');
        return;
      }

      // Fetch all events for switcher
      const allEventsRes = await fetch('/api/guestbook/events', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (allEventsRes.ok) {
        const allEventsData = await allEventsRes.json();
        setAllEvents(allEventsData.data);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventSwitch = (newEventId: string) => {
    router.push(`/dashboard/events/${newEventId}/overview`);
    setShowEventSwitcher(false);
  };

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#4b5563' }}>Event not found</p>
          <Link href="/dashboard" style={{ color: '#2563eb', marginTop: '16px', display: 'inline-block', textDecoration: 'none' }}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    display: 'flex',
    fontFamily: 'Segoe UI, sans-serif'
  };

  const sidebarStyle = {
    width: isSidebarOpen ? '260px' : '80px',
    backgroundColor: 'white',
    borderRight: '1px solid #e5e7eb',
    transition: 'width 0.3s ease',
    display: 'flex',
    flexDirection: 'column' as const,
    flexShrink: 0
  };

  const menuItemStyle = (active: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: '8px',
    color: active ? '#1d4ed8' : '#374151',
    backgroundColor: active ? '#eff6ff' : 'transparent',
    textDecoration: 'none',
    transition: 'background-color 0.2s',
    marginBottom: '2px',
    cursor: 'pointer' // Ensure it looks clickable
  });

  const iconStyle = {
    width: '20px',
    height: '20px',
    flexShrink: 0
  };

  const sectionLabelStyle = {
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    marginTop: '16px'
  };

  return (
    <div style={containerStyle}>
      {/* Sidebar */}
      <aside style={sidebarStyle}>
        {/* Sidebar Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            {isSidebarOpen && (
              <Link href="/dashboard" style={{ fontSize: '14px', color: '#4b5563', textDecoration: 'none' }}>
                ← All Events
              </Link>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              style={{
                padding: '8px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                color: '#4b5563'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg style={iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Event Switcher */}
          {isSidebarOpen && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowEventSwitcher(!showEventSwitcher)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.event_name}</p>
                    <p style={{ fontSize: '12px', color: '#4b5563', margin: 0 }}>
                      {new Date(event.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <svg style={{ width: '16px', height: '16px', color: '#6b7280', marginLeft: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Event Switcher Dropdown */}
              {showEventSwitcher && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '8px',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  zIndex: 50,
                  maxHeight: '256px',
                  overflowY: 'auto'
                }}>
                  <div style={{ padding: '8px' }}>
                    <div style={{ padding: '8px 12px', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Switch Event</div>
                    {allEvents.map(e => (
                      <button
                        key={e.id}
                        onClick={() => handleEventSwitch(e.id)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: e.id === eventId ? '#eff6ff' : 'transparent',
                          color: e.id === eventId ? '#1d4ed8' : '#374151',
                          cursor: 'pointer',
                          marginBottom: '2px'
                        }}
                        onMouseOver={(evt) => { if (e.id !== eventId) evt.currentTarget.style.backgroundColor = '#f9fafb'; }}
                        onMouseOut={(evt) => { if (e.id !== eventId) evt.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '14px', fontWeight: '500', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.event_name}</p>
                            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                              {new Date(e.event_date).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                          {e.id === eventId && (
                            <svg style={{ width: '16px', height: '16px', color: '#2563eb' }} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div style={{ borderTop: '1px solid #e5e7eb', padding: '8px' }}>
                    <Link
                      href="/dashboard"
                      style={{ display: 'block', padding: '8px 12px', fontSize: '14px', color: '#374151', textDecoration: 'none', borderRadius: '8px' }}
                      onClick={() => setShowEventSwitcher(false)}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      View All Events
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
          {/* Overview */}
          <Link
            href={`/dashboard/events/${eventId}/overview`}
            style={menuItemStyle(isActive(`/dashboard/events/${eventId}/overview`))}
          >
            <svg style={iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {isSidebarOpen && <span style={{ marginLeft: '12px', fontWeight: '500' }}>Overview</span>}
          </Link>

          {/* Invitation Module */}
          {event.has_invitation && (
            <>
              {isSidebarOpen && (
                <div style={sectionLabelStyle}>
                  📧 Invitation
                </div>
              )}
              <Link
                href={`/dashboard/events/${eventId}/invitation/design`}
                style={menuItemStyle(isActive(`/dashboard/events/${eventId}/invitation/design`))}
              >
                <svg style={iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                {isSidebarOpen && <span style={{ marginLeft: '12px' }}>Design</span>}
              </Link>
              <Link
                href={`/dashboard/events/${eventId}/invitation/guests`}
                style={menuItemStyle(isActive(`/dashboard/events/${eventId}/invitation/guests`))}
              >
                <svg style={iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {isSidebarOpen && <span style={{ marginLeft: '12px' }}>Guest List</span>}
              </Link>
            </>
          )}

          {/* Guestbook Module */}
          {event.has_guestbook && (
            <>
              {isSidebarOpen && (
                <div style={sectionLabelStyle}>
                  📖 Guestbook
                </div>
              )}
              <Link
                href={`/dashboard/events/${eventId}/guestbook`}
                style={menuItemStyle(pathname === `/dashboard/events/${eventId}/guestbook`)}
              >
                <svg style={iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {isSidebarOpen && <span style={{ marginLeft: '12px' }}>Dashboard</span>}
              </Link>
              <Link
                href={`/dashboard/events/${eventId}/guestbook/guests`}
                style={menuItemStyle(isActive(`/dashboard/events/${eventId}/guestbook/guests`))}
              >
                <svg style={iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                {isSidebarOpen && <span style={{ marginLeft: '12px' }}>Guests</span>}
              </Link>
              <Link
                href={`/dashboard/events/${eventId}/guestbook/types`}
                style={menuItemStyle(isActive(`/dashboard/events/${eventId}/guestbook/types`))}
              >
                <svg style={iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {isSidebarOpen && <span style={{ marginLeft: '12px' }}>Guest Types</span>}
              </Link>
              <Link
                href={`/dashboard/events/${eventId}/guestbook/benefits`}
                style={menuItemStyle(isActive(`/dashboard/events/${eventId}/guestbook/benefits`))}
              >
                <svg style={iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
                {isSidebarOpen && <span style={{ marginLeft: '12px' }}>Benefits</span>}
              </Link>
              <Link
                href={`/dashboard/events/${eventId}/guestbook/seating`}
                style={menuItemStyle(isActive(`/dashboard/events/${eventId}/guestbook/seating`))}
              >
                <svg style={iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                {isSidebarOpen && <span style={{ marginLeft: '12px' }}>Seating</span>}
              </Link>
              <Link
                href={`/dashboard/events/${eventId}/guestbook/staff`}
                style={menuItemStyle(isActive(`/dashboard/events/${eventId}/guestbook/staff`))}
              >
                <svg style={iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {isSidebarOpen && <span style={{ marginLeft: '12px' }}>Staff</span>}
              </Link>
            </>
          )}

          {/* Reports & Settings */}
          {isSidebarOpen && (
            <div style={sectionLabelStyle}>
              Analytics
            </div>
          )}
          <Link
            href={`/dashboard/events/${eventId}/reports`}
            style={menuItemStyle(isActive(`/dashboard/events/${eventId}/reports`))}
          >
            <svg style={iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {isSidebarOpen && <span style={{ marginLeft: '12px' }}>Reports</span>}
          </Link>

          {isSidebarOpen && (
            <div style={sectionLabelStyle}>
              Settings
            </div>
          )}
          <Link
            href={`/dashboard/events/${eventId}/settings`}
            style={menuItemStyle(isActive(`/dashboard/events/${eventId}/settings`))}
          >
            <svg style={iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {isSidebarOpen && <span style={{ marginLeft: '12px' }}>Event Settings</span>}
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
