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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Guest Check-In</h1>
        <p className="text-gray-600 mt-2">Scan QR code or search manually</p>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <p className={`text-sm font-medium ${
            message.type === 'success' ? 'text-green-800' : 'text-red-800'
          }`}>
            {message.text}
          </p>
        </div>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Guests</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_guests}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Checked In</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.checked_in}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Not Checked In</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{stats.not_checked_in}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Check-In Rate</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{stats.check_in_rate}%</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setMode('qr')}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition ${
              mode === 'qr'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              QR Code Scanner
            </div>
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition ${
              mode === 'manual'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Manual Search
            </div>
          </button>
        </div>
      </div>

      {/* QR Scanner Mode */}
      {mode === 'qr' && (
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-blue-50 rounded-full mb-6">
              <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">QR Code Scanner</h3>
            <p className="text-gray-600 mb-6">
              Position the QR code within the frame to scan
            </p>
            <div className="bg-gray-50 rounded-lg p-8 mb-6">
              <p className="text-sm text-gray-500">
                QR Scanner component will be integrated here
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Using html5-qrcode library for camera access
              </p>
            </div>
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-2">Instructions:</p>
              <ul className="text-left inline-block space-y-1">
                <li>• Allow camera access when prompted</li>
                <li>• Hold QR code steady in frame</li>
                <li>• Wait for automatic detection</li>
                <li>• Guest will be checked in automatically</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Manual Search Mode */}
      {mode === 'manual' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Guest
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter name, phone, or email..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">
                Found {searchResults.length} guest(s)
              </h3>
              {searchResults.map((guest) => (
                <div
                  key={guest.id}
                  className={`border rounded-lg p-4 transition ${
                    guest.is_checked_in
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 hover:border-blue-500 cursor-pointer'
                  }`}
                  onClick={() => !guest.is_checked_in && handleSelectGuest(guest)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{guest.guest_name}</h4>
                        <span
                          className="px-2 py-1 text-xs font-medium rounded"
                          style={{
                            backgroundColor: getGuestTypeColor(guest.guest_type_id) + '20',
                            color: getGuestTypeColor(guest.guest_type_id)
                          }}
                        >
                          {getGuestTypeName(guest.guest_type_id)}
                        </span>
                        {guest.is_checked_in && (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                            ✓ Checked In
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {guest.guest_phone && <span>{guest.guest_phone}</span>}
                        {guest.guest_group && <span className="ml-4">Group: {guest.guest_group}</span>}
                        {guest.max_companions > 0 && (
                          <span className="ml-4">Companions: {guest.actual_companions}/{guest.max_companions}</span>
                        )}
                      </div>
                      {guest.is_checked_in && guest.checked_in_at && (
                        <div className="text-xs text-gray-500 mt-1">
                          Checked in at: {new Date(guest.checked_in_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                    {!guest.is_checked_in && (
                      <button
                        onClick={() => handleSelectGuest(guest)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        Check In
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery && !isSearching ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p>No guests found matching "{searchQuery}"</p>
            </div>
          ) : null}
        </div>
      )}

      {/* Check-In Confirmation Modal */}
      {showConfirmModal && selectedGuest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Confirm Check-In</h2>
            
            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedGuest.guest_name}</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Type: {getGuestTypeName(selectedGuest.guest_type_id)}</p>
                  {selectedGuest.guest_phone && <p>Phone: {selectedGuest.guest_phone}</p>}
                  {selectedGuest.guest_group && <p>Group: {selectedGuest.guest_group}</p>}
                </div>
              </div>

              {selectedGuest.max_companions > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Companions (Max: {selectedGuest.max_companions})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={selectedGuest.max_companions}
                    value={companionCount}
                    onChange={(e) => setCompanionCount(Math.min(selectedGuest.max_companions, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedGuest(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleCheckIn}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
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
