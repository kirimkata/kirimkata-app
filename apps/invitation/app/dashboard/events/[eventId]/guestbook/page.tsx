'use client';

import { useParams } from 'next/navigation';

export default function GuestbookDashboardPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const containerStyle = {
    padding: '32px',
    fontFamily: 'Segoe UI, sans-serif'
  };

  const alertStyle = {
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: '8px',
    padding: '24px'
  };

  return (
    <div style={containerStyle}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Guestbook Dashboard</h1>
        <p style={{ color: '#4b5563', marginTop: '8px', margin: 0 }}>Manage your guestbook operations</p>
      </div>

      <div style={alertStyle}>
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <svg style={{ width: '24px', height: '24px', color: '#d97706', marginTop: '2px', marginRight: '12px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#78350f', marginBottom: '8px', marginTop: 0 }}>Page Under Construction</h3>
            <p style={{ color: '#92400e', marginBottom: '16px', margin: 0 }}>
              This page is currently being developed as part of FASE 2 implementation.
              For now, please use the Overview page or navigate to specific sections from the sidebar.
            </p>
            <p style={{ fontSize: '14px', color: '#b45309', margin: 0 }}>
              <strong>Coming soon:</strong> Real-time dashboard with guest statistics, recent check-ins, and quick actions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
