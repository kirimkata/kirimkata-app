# FASE 2: Routing Restructure

## Objective
Refactor routing dari flat structure ke event-contextual pattern sesuai UI-FLOW PRD.

## Duration: 3-4 hari

---

## Current vs Target Structure

### Current (Problem)
```
/client-dashboard                    → Event list
/client-dashboard/login              → Login
/client-dashboard/guestbook          → Guestbook (flat, no event context)
/client-dashboard/kirim-undangan     → Send invitation
/client-dashboard/edit-undangan      → Edit invitation
/client-dashboard/daftar-ucapan      → Guest wishes
/client-dashboard/pengaturan         → Settings
```

**Issues**:
- No event context in URL
- Can't bookmark specific event
- Hard to manage multiple events
- Not scalable

### Target (Solution)
```
/dashboard                                      → Event List (Client Dashboard)
/dashboard/events/new                           → Create Event Wizard
/dashboard/events/[eventId]                     → Event Dashboard (redirect to overview)
/dashboard/events/[eventId]/overview            → Event Overview
/dashboard/events/[eventId]/invitation/design   → Invitation Design
/dashboard/events/[eventId]/invitation/guests   → Invitation Guest List
/dashboard/events/[eventId]/invitation/rsvp     → RSVP Management
/dashboard/events/[eventId]/invitation/broadcast → Broadcast Messages
/dashboard/events/[eventId]/guestbook           → Guestbook Dashboard
/dashboard/events/[eventId]/guestbook/guests    → Guest Management
/dashboard/events/[eventId]/guestbook/types     → Guest Types Management
/dashboard/events/[eventId]/guestbook/benefits  → Benefits Management
/dashboard/events/[eventId]/guestbook/seating   → Seating Management
/dashboard/events/[eventId]/guestbook/checkin   → Check-in Interface
/dashboard/events/[eventId]/guestbook/staff     → Staff Management
/dashboard/events/[eventId]/reports             → Reports & Analytics
/dashboard/events/[eventId]/settings            → Event Settings
```

---

## Task 2.1: Create New Route Structure

### Directory Structure
```
apps/invitation/app/
├── dashboard/
│   ├── page.tsx                    → Event List (move from client-dashboard)
│   ├── layout.tsx                  → Main dashboard layout
│   ├── events/
│   │   ├── new/
│   │   │   └── page.tsx           → Create Event Wizard (FASE 3)
│   │   └── [eventId]/
│   │       ├── layout.tsx         → Event contextual layout ⭐
│   │       ├── page.tsx           → Redirect to overview
│   │       ├── overview/
│   │       │   └── page.tsx       → Event Overview Dashboard
│   │       ├── invitation/
│   │       │   ├── page.tsx       → Redirect to design
│   │       │   ├── design/
│   │       │   │   └── page.tsx
│   │       │   ├── guests/
│   │       │   │   └── page.tsx
│   │       │   ├── rsvp/
│   │       │   │   └── page.tsx
│   │       │   └── broadcast/
│   │       │       └── page.tsx
│   │       ├── guestbook/
│   │       │   ├── page.tsx       → Guestbook Dashboard
│   │       │   ├── guests/
│   │       │   │   └── page.tsx
│   │       │   ├── types/
│   │       │   │   └── page.tsx   → Guest Types Management (FASE 4)
│   │       │   ├── benefits/
│   │       │   │   └── page.tsx   → Benefits Management (FASE 4)
│   │       │   ├── seating/
│   │       │   │   └── page.tsx   → Seating Management (FASE 5)
│   │       │   ├── checkin/
│   │       │   │   └── page.tsx   → Check-in Interface (FASE 7)
│   │       │   └── staff/
│   │       │       └── page.tsx
│   │       ├── reports/
│   │       │   └── page.tsx       → Reports (FASE 8)
│   │       └── settings/
│   │           └── page.tsx       → Event Settings
│   └── login/
│       └── page.tsx               → Login (keep existing)
```

---

## Task 2.2: Create Event Contextual Layout

### File: `apps/invitation/app/dashboard/events/[eventId]/layout.tsx`

```typescript
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventSwitch = (newEventId: string) => {
    router.push(`/dashboard/events/${newEventId}/overview`);
    setShowEventSwitcher(false);
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!event) {
    return <div className="error">Event not found</div>;
  }

  return (
    <div className="event-layout">
      {/* Sidebar */}
      <aside className="event-sidebar">
        {/* Event Header with Switcher */}
        <div className="event-header">
          <button 
            className="event-switcher-btn"
            onClick={() => setShowEventSwitcher(!showEventSwitcher)}
          >
            <div className="event-info">
              <h2>{event.event_name}</h2>
              <p>{new Date(event.event_date).toLocaleDateString('id-ID')}</p>
            </div>
            <svg className="chevron" width="20" height="20" viewBox="0 0 24 24">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
          </button>

          {/* Event Switcher Dropdown */}
          {showEventSwitcher && (
            <div className="event-switcher-dropdown">
              <div className="dropdown-header">
                <span>Switch Event</span>
                <Link href="/dashboard" className="view-all-link">
                  View All Events
                </Link>
              </div>
              <div className="event-list">
                {allEvents.map(e => (
                  <button
                    key={e.id}
                    className={`event-item ${e.id === eventId ? 'active' : ''}`}
                    onClick={() => handleEventSwitch(e.id)}
                  >
                    <div className="event-item-info">
                      <span className="event-name">{e.event_name}</span>
                      <span className="event-date">
                        {new Date(e.event_date).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    {e.id === eventId && <span className="check-icon">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="event-nav">
          {/* Overview - Always visible */}
          <Link 
            href={`/dashboard/events/${eventId}/overview`}
            className={pathname.includes('/overview') ? 'active' : ''}
          >
            🏠 Overview
          </Link>

          {/* Invitation Module - Conditional */}
          {event.has_invitation && (
            <>
              <div className="nav-section-title">📧 Invitation</div>
              <Link 
                href={`/dashboard/events/${eventId}/invitation/design`}
                className={pathname.includes('/invitation/design') ? 'active' : ''}
              >
                Design
              </Link>
              <Link 
                href={`/dashboard/events/${eventId}/invitation/guests`}
                className={pathname.includes('/invitation/guests') ? 'active' : ''}
              >
                Guest List
              </Link>
              <Link 
                href={`/dashboard/events/${eventId}/invitation/rsvp`}
                className={pathname.includes('/invitation/rsvp') ? 'active' : ''}
              >
                RSVP
              </Link>
              <Link 
                href={`/dashboard/events/${eventId}/invitation/broadcast`}
                className={pathname.includes('/invitation/broadcast') ? 'active' : ''}
              >
                Broadcast
              </Link>
            </>
          )}

          {/* Guestbook Module - Conditional */}
          {event.has_guestbook && (
            <>
              <div className="nav-section-title">📖 Guestbook</div>
              <Link 
                href={`/dashboard/events/${eventId}/guestbook`}
                className={pathname === `/dashboard/events/${eventId}/guestbook` ? 'active' : ''}
              >
                Dashboard
              </Link>
              <Link 
                href={`/dashboard/events/${eventId}/guestbook/guests`}
                className={pathname.includes('/guestbook/guests') ? 'active' : ''}
              >
                Guest List
              </Link>
              <Link 
                href={`/dashboard/events/${eventId}/guestbook/types`}
                className={pathname.includes('/guestbook/types') ? 'active' : ''}
              >
                Guest Types
              </Link>
              <Link 
                href={`/dashboard/events/${eventId}/guestbook/benefits`}
                className={pathname.includes('/guestbook/benefits') ? 'active' : ''}
              >
                Benefits
              </Link>
              <Link 
                href={`/dashboard/events/${eventId}/guestbook/seating`}
                className={pathname.includes('/guestbook/seating') ? 'active' : ''}
              >
                Seating
              </Link>
              <Link 
                href={`/dashboard/events/${eventId}/guestbook/staff`}
                className={pathname.includes('/guestbook/staff') ? 'active' : ''}
              >
                Staff
              </Link>
            </>
          )}

          {/* Reports & Settings - Always visible */}
          <div className="nav-section-title">📊 Analytics</div>
          <Link 
            href={`/dashboard/events/${eventId}/reports`}
            className={pathname.includes('/reports') ? 'active' : ''}
          >
            Reports
          </Link>
          
          <div className="nav-section-title">⚙️ Settings</div>
          <Link 
            href={`/dashboard/events/${eventId}/settings`}
            className={pathname.includes('/settings') ? 'active' : ''}
          >
            Event Settings
          </Link>
        </nav>

        {/* Back to Dashboard */}
        <Link href="/dashboard" className="back-to-dashboard">
          ← All Events
        </Link>
      </aside>

      {/* Main Content */}
      <main className="event-content">
        {children}
      </main>
    </div>
  );
}
```

---

## Task 2.3: Create Overview Page

### File: `apps/invitation/app/dashboard/events/[eventId]/overview/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function EventOverviewPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [eventId]);

  const fetchStats = async () => {
    const token = localStorage.getItem('client_token');
    
    try {
      const res = await fetch(`/api/guestbook/events/${eventId}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="overview-page">
      <h1>Event Overview</h1>
      
      {/* Quick Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>Total Guests</h3>
            <p className="stat-value">{stats?.total_guests || 0}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>Checked In</h3>
            <p className="stat-value">{stats?.checked_in || 0}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📧</div>
          <div className="stat-info">
            <h3>Invitations Sent</h3>
            <p className="stat-value">{stats?.invitations_sent || 0}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💺</div>
          <div className="stat-info">
            <h3>Seats Assigned</h3>
            <p className="stat-value">{stats?.seats_assigned || 0}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <Link href={`/dashboard/events/${eventId}/guestbook/guests`} className="action-btn">
            ➕ Add Guests
          </Link>
          <Link href={`/dashboard/events/${eventId}/guestbook/checkin`} className="action-btn">
            📱 Check-in
          </Link>
          <Link href={`/dashboard/events/${eventId}/reports`} className="action-btn">
            📊 View Reports
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h2>Recent Activity</h2>
        {/* TODO: Show recent check-ins, RSVP, etc */}
      </div>
    </div>
  );
}
```

---

## Task 2.4: Update API Routes

### Add Event ID Validation Middleware

File: `apps/invitation/lib/guestbook/middleware/eventAccess.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyClientToken } from '../services/jwt';
import { getEventById } from '../repositories/eventRepository';

export async function validateEventAccess(
  request: NextRequest,
  eventId: string
): Promise<{ authorized: boolean; clientId?: string; error?: string }> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { authorized: false, error: 'No token provided' };
  }

  const token = authHeader.substring(7);
  const payload = verifyClientToken(token);

  if (!payload) {
    return { authorized: false, error: 'Invalid token' };
  }

  // Verify event belongs to client
  const event = await getEventById(eventId);
  
  if (!event) {
    return { authorized: false, error: 'Event not found' };
  }

  if (event.client_id !== payload.client_id) {
    return { authorized: false, error: 'Unauthorized access to event' };
  }

  return { authorized: true, clientId: payload.client_id };
}
```

### Update Event Repository

File: `apps/invitation/lib/guestbook/repositories/eventRepository.ts`

Add function to get event by ID with validation:

```typescript
export async function getEventByIdWithAccess(
  eventId: string,
  clientId: string
): Promise<Event | null> {
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .eq('client_id', clientId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Event;
}
```

---

## Task 2.5: Add Redirects for Legacy URLs

### File: `apps/invitation/middleware.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Redirect legacy client-dashboard URLs to new structure
  const redirects: Record<string, string> = {
    '/client-dashboard': '/dashboard',
    '/client-dashboard/login': '/dashboard/login',
  };

  if (redirects[path]) {
    return NextResponse.redirect(new URL(redirects[path], request.url));
  }

  // For other client-dashboard paths, we need event context
  // Show migration notice or redirect to event selection
  if (path.startsWith('/client-dashboard/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/client-dashboard/:path*'],
};
```

---

## Validation Checklist

- [ ] New route structure created
- [ ] Event contextual layout working
- [ ] Sidebar shows/hides modules based on event flags
- [ ] Event switcher functional
- [ ] Overview page displays stats
- [ ] All API routes validate event access
- [ ] Legacy URLs redirect properly
- [ ] No broken links
- [ ] TypeScript no errors

---

## Next Steps
After FASE 2 complete, proceed to FASE 3: Event Creation Wizard
