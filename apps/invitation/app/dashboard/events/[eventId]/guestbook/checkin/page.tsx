'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Guest {
  id: string;
  guest_name: string;
  guest_phone: string | null;
  guest_type_id: string | null;
  guest_group: string | null;
  max_companions: number;
  actual_companions: number;
  seating_config_id: string | null;
  is_checked_in: boolean;
  checked_in_at: string | null;
}

interface GuestType {
  id: string;
  display_name: string;
  color_code: string;
}

interface CheckInStats {
  total_guests: number;
  checked_in: number;
  not_checked_in: number;
  check_in_rate: number;
}

export default function CheckInPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [mode, setMode] = useState<'qr' | 'manual'>('qr');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Guest[]>([]);
  const [guestTypes, setGuestTypes] = useState<GuestType[]>([]);
  const [stats, setStats] = useState<CheckInStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [companionCount, setCompanionCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchStats, 10000); // Refresh stats every 10s
    return () => clearInterval(interval);
  }, [eventId]);

  const fetchData = async () => {
    await Promise.all([fetchGuestTypes(), fetchStats()]);
    setIsLoading(false);
  };

  const fetchGuestTypes = async () => {
    const token = localStorage.getItem('client_token');

    try {
      const res = await fetch(`/api/guestbook/guest-types?event_id=${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setGuestTypes(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching guest types:', error);
    }
  };

  const fetchStats = async () => {
    const token = localStorage.getItem('client_token');

    try {
      const res = await fetch(`/api/guestbook/checkin/stats?event_id=${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const token = localStorage.getItem('client_token');

    try {
      const res = await fetch(`/api/guestbook/checkin/search?event_id=${eventId}&query=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.data || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching guests:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectGuest = (guest: Guest) => {
    setSelectedGuest(guest);
    setCompanionCount(guest.actual_companions);
    setShowConfirmModal(true);
  };

  const handleCheckIn = async () => {
    if (!selectedGuest) return;

    setIsProcessing(true);
    const token = localStorage.getItem('client_token');

    try {
      const res = await fetch('/api/guestbook/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          guest_id: selectedGuest.id,
          event_id: eventId,
          actual_companions: companionCount,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: `${selectedGuest.guest_name} checked in successfully!` });
        setShowConfirmModal(false);
        setSelectedGuest(null);
        setSearchQuery('');
        setSearchResults([]);
        await fetchStats();

        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Check-in failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQRScan = async (qrData: string) => {
    const token = localStorage.getItem('client_token');

    try {
      const res = await fetch('/api/guestbook/checkin/qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          qr_token: qrData,
          event_id: eventId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: `${data.data.guest_name} checked in successfully!` });
        await fetchStats();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Invalid QR code' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const getGuestTypeName = (typeId: string | null) => {
    if (!typeId) return 'No Type';
    const type = guestTypes.find(t => t.id === typeId);
    return type?.display_name || 'Unknown';
  };

  const getGuestTypeColor = (typeId: string | null) => {
    if (!typeId) return '#6b7280';
    const type = guestTypes.find(t => t.id === typeId);
    return type?.color_code || '#6b7280';
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

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    padding: '24px'
  };

  const buttonStyle = (variant: 'primary' | 'secondary' | 'danger') => {
    const base = {
      padding: '8px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'none',
      transition: 'all 0.2s',
      fontFamily: 'inherit'
    };

    switch (variant) {
      case 'primary':
        return { ...base, backgroundColor: '#2563eb', color: 'white' };
      case 'danger':
        return { ...base, backgroundColor: '#dc2626', color: 'white' };
      case 'secondary':
      default:
        return { ...base, backgroundColor: 'white', border: '1px solid #d1d5db', color: '#374151' };
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box' as const
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Guest Check-In</h1>
        <p style={{ color: '#4b5563', marginTop: '8px', margin: 0 }}>Scan QR code or search manually</p>
      </div>

      {/* Message Banner */}
      {message && (
        <div style={{
          marginBottom: '24px',
          padding: '16px',
          borderRadius: '8px',
          backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`
        }}>
          <p style={{
            fontSize: '14px',
            fontWeight: '500',
            color: message.type === 'success' ? '#166534' : '#991b1b',
            margin: 0
          }}>
            {message.text}
          </p>
        </div>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: '500', color: '#4b5563', margin: 0 }}>Total Guests</p>
                <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginTop: '8px', margin: 0 }}>{stats.total_guests}</p>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#eff6ff', borderRadius: '8px' }}>
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
              <div style={{ padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
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
              <div style={{ padding: '12px', backgroundColor: '#fff7ed', borderRadius: '8px' }}>
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
              <div style={{ padding: '12px', backgroundColor: '#faf5ff', borderRadius: '8px' }}>
                <svg style={{ width: '32px', height: '32px', color: '#9333ea' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode Selector */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button
            onClick={() => setMode('qr')}
            style={{
              flex: 1,
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: '500',
              transition: 'background-color 0.2s',
              backgroundColor: mode === 'qr' ? '#2563eb' : '#f3f4f6',
              color: mode === 'qr' ? 'white' : '#374151',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg style={{ width: '20px', height: '20px', marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            QR Code Scanner
          </button>
          <button
            onClick={() => setMode('manual')}
            style={{
              flex: 1,
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: '500',
              transition: 'background-color 0.2s',
              backgroundColor: mode === 'manual' ? '#2563eb' : '#f3f4f6',
              color: mode === 'manual' ? 'white' : '#374151',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg style={{ width: '20px', height: '20px', marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Manual Search
          </button>
        </div>
      </div>

      {/* QR Scanner Mode */}
      {mode === 'qr' && (
        <div style={{ ...cardStyle, padding: '32px', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '128px',
            height: '128px',
            backgroundColor: '#eff6ff',
            borderRadius: '50%',
            marginBottom: '24px'
          }}>
            <svg style={{ width: '64px', height: '64px', color: '#2563eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>QR Code Scanner</h3>
          <p style={{ color: '#4b5563', marginBottom: '24px' }}>
            Position the QR code within the frame to scan
          </p>
          <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '32px', marginBottom: '24px' }}>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>
              QR Scanner component will be integrated here
            </p>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
              Using html5-qrcode library for camera access
            </p>
          </div>
          <div style={{ fontSize: '14px', color: '#4b5563' }}>
            <p style={{ fontWeight: '500', marginBottom: '8px' }}>Instructions:</p>
            <ul style={{ textAlign: 'left', display: 'inline-block', padding: 0, listStyle: 'none' }}>
              <li style={{ marginBottom: '4px' }}>• Allow camera access when prompted</li>
              <li style={{ marginBottom: '4px' }}>• Hold QR code steady in frame</li>
              <li style={{ marginBottom: '4px' }}>• Wait for automatic detection</li>
              <li>• Guest will be checked in automatically</li>
            </ul>
          </div>
        </div>
      )}

      {/* Manual Search Mode */}
      {mode === 'manual' && (
        <div style={cardStyle}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Search Guest
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter name, phone, or email..."
                style={inputStyle}
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                style={{
                  ...buttonStyle('primary'),
                  padding: '12px 24px',
                  fontSize: '16px',
                  opacity: isSearching || !searchQuery.trim() ? 0.5 : 1,
                  cursor: isSearching || !searchQuery.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                Found {searchResults.length} guest(s)
              </h3>
              {searchResults.map((guest) => (
                <div
                  key={guest.id}
                  style={{
                    border: `1px solid ${guest.is_checked_in ? '#bbf7d0' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    padding: '16px',
                    transition: 'all 0.2s',
                    backgroundColor: guest.is_checked_in ? '#f0fdf4' : 'transparent',
                    cursor: guest.is_checked_in ? 'default' : 'pointer',
                    ':hover': {
                      borderColor: '#3b82f6'
                    }
                  } as any}
                  onClick={() => !guest.is_checked_in && handleSelectGuest(guest)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>{guest.guest_name}</h4>
                        <span
                          style={{
                            padding: '2px 8px',
                            fontSize: '12px',
                            fontWeight: '500',
                            borderRadius: '4px',
                            backgroundColor: getGuestTypeColor(guest.guest_type_id) + '20',
                            color: getGuestTypeColor(guest.guest_type_id)
                          }}
                        >
                          {getGuestTypeName(guest.guest_type_id)}
                        </span>
                        {guest.is_checked_in && (
                          <span style={{ padding: '2px 8px', fontSize: '12px', fontWeight: '500', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '4px' }}>
                            ✓ Checked In
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '14px', color: '#4b5563' }}>
                        {guest.guest_phone && <span>{guest.guest_phone}</span>}
                        {guest.guest_group && <span style={{ marginLeft: '16px' }}>Group: {guest.guest_group}</span>}
                        {guest.max_companions > 0 && (
                          <span style={{ marginLeft: '16px' }}>Companions: {guest.actual_companions}/{guest.max_companions}</span>
                        )}
                      </div>
                      {guest.is_checked_in && guest.checked_in_at && (
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                          Checked in at: {new Date(guest.checked_in_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                    {!guest.is_checked_in && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectGuest(guest);
                        }}
                        style={buttonStyle('primary')}
                      >
                        Check In
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery && !isSearching ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
              <svg style={{ margin: '0 auto', marginBottom: '16px', width: '48px', height: '48px', color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p>No guests found matching "{searchQuery}"</p>
            </div>
          ) : null}
        </div>
      )}

      {/* Check-In Confirmation Modal */}
      {showConfirmModal && selectedGuest && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', width: '100%', maxWidth: '448px', padding: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', marginBottom: '16px', margin: '0 0 16px 0' }}>Confirm Check-In</h2>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px', margin: '0 0 4px 0' }}>{selectedGuest.guest_name}</h3>
                <div style={{ fontSize: '14px', color: '#4b5563' }}>
                  <p style={{ margin: 0 }}>Type: {getGuestTypeName(selectedGuest.guest_type_id)}</p>
                  {selectedGuest.guest_phone && <p style={{ margin: 0 }}>Phone: {selectedGuest.guest_phone}</p>}
                  {selectedGuest.guest_group && <p style={{ margin: 0 }}>Group: {selectedGuest.guest_group}</p>}
                </div>
              </div>

              {selectedGuest.max_companions > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Number of Companions (Max: {selectedGuest.max_companions})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={selectedGuest.max_companions}
                    value={companionCount}
                    onChange={(e) => setCompanionCount(Math.min(selectedGuest.max_companions, Math.max(0, parseInt(e.target.value) || 0)))}
                    style={inputStyle}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedGuest(null);
                }}
                style={{ ...buttonStyle('secondary'), flex: 1 }}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleCheckIn}
                style={{ ...buttonStyle('primary'), flex: 1, opacity: isProcessing ? 0.5 : 1 }}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Confirm Check-In'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
