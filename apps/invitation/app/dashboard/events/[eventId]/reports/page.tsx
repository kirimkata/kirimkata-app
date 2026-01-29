'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Event {
  id: string;
  event_name: string;
  event_date: string;
  location: string;
}

interface ReportStats {
  total_guests: number;
  checked_in: number;
  not_checked_in: number;
  check_in_rate: number;
  by_guest_type: Array<{
    type_name: string;
    display_name: string;
    color_code: string;
    total: number;
    checked_in: number;
  }>;
  by_seating: Array<{
    seating_name: string;
    capacity: number;
    assigned: number;
  }>;
  hourly_checkins: Array<{
    hour: string;
    count: number;
  }>;
}

export default function ReportsPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<'overview' | 'guests' | 'checkin' | 'seating'>('overview');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    const token = localStorage.getItem('client_token');

    try {
      // Fetch event
      const eventRes = await fetch(`/api/guestbook/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (eventRes.ok) {
        const eventData = await eventRes.json();
        setEvent(eventData.data);
      }

      // Fetch report stats
      const statsRes = await fetch(`/api/guestbook/reports/stats?event_id=${eventId}`, {
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

  const handleExport = async (format: 'pdf' | 'excel') => {
    setIsExporting(true);
    const token = localStorage.getItem('client_token');

    try {
      const res = await fetch(`/api/guestbook/reports/export?event_id=${eventId}&format=${format}&report=${selectedReport}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${selectedReport}_${eventId}_${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to export report');
      }
    } catch (err) {
      alert('An error occurred. Please try again.');
    } finally {
      setIsExporting(false);
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

  const containerStyle = {
    padding: '32px',
    fontFamily: 'Segoe UI, sans-serif'
  };

  const buttonStyle = (variant: 'secondary' | 'primary') => ({
    padding: '8px 16px',
    border: variant === 'secondary' ? '1px solid #d1d5db' : 'none',
    backgroundColor: variant === 'secondary' ? 'transparent' : '#2563eb',
    color: variant === 'secondary' ? '#374151' : 'white',
    borderRadius: '8px',
    cursor: isExporting ? 'not-allowed' : 'pointer',
    opacity: isExporting ? 0.5 : 1,
    display: 'flex',
    alignItems: 'center',
    transition: 'background-color 0.2s'
  });

  const tabButtonStyle = (isActive: boolean) => ({
    padding: '12px 16px',
    borderRadius: '8px',
    fontWeight: '500',
    backgroundColor: isActive ? '#2563eb' : '#f3f4f6',
    color: isActive ? 'white' : '#374151',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
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

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Reports & Analytics</h1>
          <p style={{ color: '#4b5563', marginTop: '8px', margin: 0 }}>
            {event?.event_name} - {event?.event_date ? new Date(event.event_date).toLocaleDateString() : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => handleExport('excel')}
            disabled={isExporting}
            style={buttonStyle('secondary')}
            onMouseOver={(e) => { if (!isExporting) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
            onMouseOut={(e) => { if (!isExporting) e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <svg style={{ width: '20px', height: '20px', marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            style={buttonStyle('primary')}
            onMouseOver={(e) => { if (!isExporting) e.currentTarget.style.backgroundColor = '#1d4ed8'; }}
            onMouseOut={(e) => { if (!isExporting) e.currentTarget.style.backgroundColor = '#2563eb'; }}
          >
            <svg style={{ width: '20px', height: '20px', marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Export PDF
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
          <button
            onClick={() => setSelectedReport('overview')}
            style={tabButtonStyle(selectedReport === 'overview')}
            onMouseOver={(e) => { if (selectedReport !== 'overview') e.currentTarget.style.backgroundColor = '#e5e7eb'; }}
            onMouseOut={(e) => { if (selectedReport !== 'overview') e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
          >
            <svg style={{ width: '20px', height: '20px', marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Overview
          </button>
          <button
            onClick={() => setSelectedReport('guests')}
            style={tabButtonStyle(selectedReport === 'guests')}
            onMouseOver={(e) => { if (selectedReport !== 'guests') e.currentTarget.style.backgroundColor = '#e5e7eb'; }}
            onMouseOut={(e) => { if (selectedReport !== 'guests') e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
          >
            <svg style={{ width: '20px', height: '20px', marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Guest List
          </button>
          <button
            onClick={() => setSelectedReport('checkin')}
            style={tabButtonStyle(selectedReport === 'checkin')}
            onMouseOver={(e) => { if (selectedReport !== 'checkin') e.currentTarget.style.backgroundColor = '#e5e7eb'; }}
            onMouseOut={(e) => { if (selectedReport !== 'checkin') e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
          >
            <svg style={{ width: '20px', height: '20px', marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Check-in
          </button>
          <button
            onClick={() => setSelectedReport('seating')}
            style={tabButtonStyle(selectedReport === 'seating')}
            onMouseOver={(e) => { if (selectedReport !== 'seating') e.currentTarget.style.backgroundColor = '#e5e7eb'; }}
            onMouseOut={(e) => { if (selectedReport !== 'seating') e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
          >
            <svg style={{ width: '20px', height: '20px', marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            Seating
          </button>
        </div>
      </div>

      {/* Report Content */}
      {stats && (
        <>
          {/* Overview Report */}
          {selectedReport === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                <div style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: '#4b5563', margin: 0 }}>Total Guests</p>
                      <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginTop: '8px', margin: 0 }}>{stats.total_guests}</p>
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
                      <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#16a34a', marginTop: '8px', margin: 0 }}>{stats.checked_in}</p>
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
                      <p style={{ fontSize: '14px', fontWeight: '500', color: '#4b5563', margin: 0 }}>Not Checked In</p>
                      <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#ea580c', marginTop: '8px', margin: 0 }}>{stats.not_checked_in}</p>
                    </div>
                    <div style={iconContainerStyle('#fff7ed')}>
                      <svg style={{ width: '32px', height: '32px', color: '#ea580c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: '#4b5563', margin: 0 }}>Check-In Rate</p>
                      <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#9333ea', marginTop: '8px', margin: 0 }}>{stats.check_in_rate}%</p>
                    </div>
                    <div style={iconContainerStyle('#faf5ff')}>
                      <svg style={{ width: '32px', height: '32px', color: '#9333ea' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guest Type Breakdown */}
              <div style={cardStyle}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px', marginTop: 0 }}>Guest Type Breakdown</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {stats.by_guest_type.map((type) => (
                    <div key={type.type_name}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div
                            style={{ width: '12px', height: '12px', borderRadius: '50%', marginRight: '12px', backgroundColor: type.color_code }}
                          ></div>
                          <span style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{type.display_name}</span>
                        </div>
                        <span style={{ fontSize: '14px', color: '#4b5563' }}>
                          {type.checked_in} / {type.total} ({type.total > 0 ? Math.round((type.checked_in / type.total) * 100) : 0}%)
                        </span>
                      </div>
                      <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '9999px', height: '8px' }}>
                        <div
                          style={{
                            width: `${type.total > 0 ? (type.checked_in / type.total) * 100 : 0}%`,
                            backgroundColor: type.color_code,
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

              {/* Seating Utilization */}
              {stats.by_seating.length > 0 && (
                <div style={cardStyle}>
                  <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px', marginTop: 0 }}>Seating Utilization</h2>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ backgroundColor: '#f9fafb' }}>
                        <tr>
                          <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>Seating</th>
                          <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>Capacity</th>
                          <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>Assigned</th>
                          <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>Available</th>
                          <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>Utilization</th>
                        </tr>
                      </thead>
                      <tbody style={{ backgroundColor: 'white' }}>
                        {stats.by_seating.map((seat, index) => {
                          const utilization = seat.capacity > 0 ? Math.round((seat.assigned / seat.capacity) * 100) : 0;
                          return (
                            <tr key={index} style={{ borderTop: '1px solid #e5e7eb' }}>
                              <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '14px', fontWeight: '500', color: '#111827' }}>{seat.seating_name}</td>
                              <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '14px', color: '#111827' }}>{seat.capacity}</td>
                              <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '14px', color: '#111827' }}>{seat.assigned}</td>
                              <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '14px', color: '#111827' }}>{seat.capacity - seat.assigned}</td>
                              <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                  <div style={{ width: '100px', backgroundColor: '#e5e7eb', borderRadius: '9999px', height: '8px', marginRight: '12px' }}>
                                    <div
                                      style={{
                                        width: `${utilization}%`,
                                        backgroundColor: '#2563eb',
                                        height: '8px',
                                        borderRadius: '9999px'
                                      }}
                                    ></div>
                                  </div>
                                  <span style={{ fontSize: '14px', color: '#111827' }}>{utilization}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Other report types placeholders */}
          {selectedReport === 'guests' && (
            <div style={{ ...cardStyle, padding: '48px', textAlign: 'center' }}>
              <svg style={{ margin: '0 auto', marginBottom: '16px', width: '48px', height: '48px', color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#111827', marginBottom: '8px', marginTop: 0 }}>Guest List Report</h3>
              <p style={{ color: '#4b5563', marginBottom: '16px', margin: 0 }}>Detailed guest list with all information</p>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Use Export button to download full report</p>
            </div>
          )}

          {selectedReport === 'checkin' && (
            <div style={{ ...cardStyle, padding: '48px', textAlign: 'center' }}>
              <svg style={{ margin: '0 auto', marginBottom: '16px', width: '48px', height: '48px', color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#111827', marginBottom: '8px', marginTop: 0 }}>Check-in Report</h3>
              <p style={{ color: '#4b5563', marginBottom: '16px', margin: 0 }}>Check-in analytics and timeline</p>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Use Export button to download full report</p>
            </div>
          )}

          {selectedReport === 'seating' && (
            <div style={{ ...cardStyle, padding: '48px', textAlign: 'center' }}>
              <svg style={{ margin: '0 auto', marginBottom: '16px', width: '48px', height: '48px', color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#111827', marginBottom: '8px', marginTop: 0 }}>Seating Report</h3>
              <p style={{ color: '#4b5563', marginBottom: '16px', margin: 0 }}>Seating arrangement and utilization</p>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Use Export button to download full report</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
