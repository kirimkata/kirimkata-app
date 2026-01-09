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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Event not found</p>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            {isSidebarOpen && (
              <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                ← All Events
              </Link>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Event Switcher */}
          {isSidebarOpen && (
            <div className="relative">
              <button
                onClick={() => setShowEventSwitcher(!showEventSwitcher)}
                className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{event.event_name}</p>
                    <p className="text-xs text-gray-600">
                      {new Date(event.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-gray-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Event Switcher Dropdown */}
              {showEventSwitcher && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Switch Event</div>
                    {allEvents.map(e => (
                      <button
                        key={e.id}
                        onClick={() => handleEventSwitch(e.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition ${
                          e.id === eventId ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{e.event_name}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(e.event_date).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                          {e.id === eventId && (
                            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-gray-200 p-2">
                    <Link
                      href="/dashboard"
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                      onClick={() => setShowEventSwitcher(false)}
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
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {/* Overview */}
          <Link
            href={`/dashboard/events/${eventId}/overview`}
            className={`flex items-center px-3 py-2 rounded-lg transition ${
              isActive(`/dashboard/events/${eventId}/overview`)
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {isSidebarOpen && <span className="ml-3 font-medium">Overview</span>}
          </Link>

          {/* Invitation Module */}
          {event.has_invitation && (
            <>
              {isSidebarOpen && (
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase mt-4">
                  📧 Invitation
                </div>
              )}
              <Link
                href={`/dashboard/events/${eventId}/invitation/design`}
                className={`flex items-center px-3 py-2 rounded-lg transition ${
                  isActive(`/dashboard/events/${eventId}/invitation/design`)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                {isSidebarOpen && <span className="ml-3">Design</span>}
              </Link>
              <Link
                href={`/dashboard/events/${eventId}/invitation/guests`}
                className={`flex items-center px-3 py-2 rounded-lg transition ${
                  isActive(`/dashboard/events/${eventId}/invitation/guests`)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {isSidebarOpen && <span className="ml-3">Guest List</span>}
              </Link>
            </>
          )}

          {/* Guestbook Module */}
          {event.has_guestbook && (
            <>
              {isSidebarOpen && (
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase mt-4">
                  📖 Guestbook
                </div>
              )}
              <Link
                href={`/dashboard/events/${eventId}/guestbook`}
                className={`flex items-center px-3 py-2 rounded-lg transition ${
                  pathname === `/dashboard/events/${eventId}/guestbook`
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {isSidebarOpen && <span className="ml-3">Dashboard</span>}
              </Link>
              <Link
                href={`/dashboard/events/${eventId}/guestbook/guests`}
                className={`flex items-center px-3 py-2 rounded-lg transition ${
                  isActive(`/dashboard/events/${eventId}/guestbook/guests`)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                {isSidebarOpen && <span className="ml-3">Guests</span>}
              </Link>
              <Link
                href={`/dashboard/events/${eventId}/guestbook/types`}
                className={`flex items-center px-3 py-2 rounded-lg transition ${
                  isActive(`/dashboard/events/${eventId}/guestbook/types`)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {isSidebarOpen && <span className="ml-3">Guest Types</span>}
              </Link>
              <Link
                href={`/dashboard/events/${eventId}/guestbook/benefits`}
                className={`flex items-center px-3 py-2 rounded-lg transition ${
                  isActive(`/dashboard/events/${eventId}/guestbook/benefits`)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
                {isSidebarOpen && <span className="ml-3">Benefits</span>}
              </Link>
              <Link
                href={`/dashboard/events/${eventId}/guestbook/seating`}
                className={`flex items-center px-3 py-2 rounded-lg transition ${
                  isActive(`/dashboard/events/${eventId}/guestbook/seating`)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                {isSidebarOpen && <span className="ml-3">Seating</span>}
              </Link>
              <Link
                href={`/dashboard/events/${eventId}/guestbook/staff`}
                className={`flex items-center px-3 py-2 rounded-lg transition ${
                  isActive(`/dashboard/events/${eventId}/guestbook/staff`)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {isSidebarOpen && <span className="ml-3">Staff</span>}
              </Link>
            </>
          )}

          {/* Reports & Settings */}
          {isSidebarOpen && (
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase mt-4">
              Analytics
            </div>
          )}
          <Link
            href={`/dashboard/events/${eventId}/reports`}
            className={`flex items-center px-3 py-2 rounded-lg transition ${
              isActive(`/dashboard/events/${eventId}/reports`)
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {isSidebarOpen && <span className="ml-3">Reports</span>}
          </Link>

          {isSidebarOpen && (
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase mt-4">
              Settings
            </div>
          )}
          <Link
            href={`/dashboard/events/${eventId}/settings`}
            className={`flex items-center px-3 py-2 rounded-lg transition ${
              isActive(`/dashboard/events/${eventId}/settings`)
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {isSidebarOpen && <span className="ml-3">Event Settings</span>}
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
