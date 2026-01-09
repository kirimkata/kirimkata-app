'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { QrCode, Search, Users, CheckCircle, XCircle, LogOut } from 'lucide-react';
import { Button, Card, CardHeader, CardContent, Input, Badge } from '@/components/ui';
import { OfflineIndicator } from '@/components/offline/OfflineIndicator';
import { QRScanner } from '@/components/scanner/QRScanner';

interface Guest {
  id: string;
  guest_name: string;
  guest_phone: string | null;
  guest_email: string | null;
  guest_type_id: string | null;
  max_companions: number;
  actual_companions: number;
  is_checked_in: boolean;
  checked_in_at: string | null;
}

interface CheckInStats {
  total_guests: number;
  checked_in: number;
  not_checked_in: number;
  check_in_rate: number;
}

export default function CheckInPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [mode, setMode] = useState<'qr' | 'manual'>('manual');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Guest[]>([]);
  const [stats, setStats] = useState<CheckInStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [companionCount, setCompanionCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('staff_token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchStats();
    setIsLoading(false);

    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [eventId, router]);

  const fetchStats = async () => {
    const token = localStorage.getItem('staff_token');
    
    try {
      const res = await fetch(`/api/checkin/stats?event_id=${eventId}`, {
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
    const token = localStorage.getItem('staff_token');

    try {
      const res = await fetch(`/api/checkin/search?event_id=${eventId}&query=${encodeURIComponent(searchQuery)}`, {
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
    const token = localStorage.getItem('staff_token');

    try {
      const res = await fetch('/api/checkin', {
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
        setMessage({ type: 'success', text: `${selectedGuest.guest_name} checked in!` });
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
    const token = localStorage.getItem('staff_token');
    setShowQRScanner(false);

    try {
      const res = await fetch('/api/checkin/qr', {
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
        setMessage({ type: 'success', text: `${data.data.guest_name} checked in via QR!` });
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

  const handleLogout = () => {
    localStorage.removeItem('staff_token');
    localStorage.removeItem('staff_data');
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OfflineIndicator />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Guest Check-In</h1>
              <p className="text-sm text-gray-600 mt-1">Scan QR or search manually</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Message Banner */}
        {message && (
          <div className={`p-4 rounded-lg ${
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total_guests}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Checked In</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{stats.checked_in}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-orange-600 mt-1">{stats.not_checked_in}</p>
                  </div>
                  <XCircle className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Rate</p>
                    <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.check_in_rate}%</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-600 font-bold text-sm">{stats.check_in_rate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Mode Selector */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Button
                variant={mode === 'qr' ? 'primary' : 'secondary'}
                onClick={() => setMode('qr')}
                className="flex-1"
              >
                <QrCode className="w-4 h-4 mr-2" />
                QR Scan
              </Button>
              <Button
                variant={mode === 'manual' ? 'primary' : 'secondary'}
                onClick={() => setMode('manual')}
                className="flex-1"
              >
                <Search className="w-4 h-4 mr-2" />
                Manual Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* QR Scanner Mode */}
        {mode === 'qr' && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">QR Code Scanner</h2>
            </CardHeader>
            <CardContent>
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center p-6">
                  <QrCode className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">QR Scanner will be implemented here</p>
                  <p className="text-sm text-gray-500 mt-2">Using html5-qrcode library</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Manual Search Mode */}
        {mode === 'manual' && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Search Guest</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="search"
                  placeholder="Search by name, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} isLoading={isSearching}>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((guest) => (
                    <div
                      key={guest.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        guest.is_checked_in
                          ? 'bg-green-50 border-green-200'
                          : 'bg-white border-gray-200 hover:border-indigo-300'
                      }`}
                      onClick={() => !guest.is_checked_in && handleSelectGuest(guest)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{guest.guest_name}</h3>
                          {guest.guest_phone && (
                            <p className="text-sm text-gray-600">{guest.guest_phone}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">
                              Max companions: {guest.max_companions}
                            </span>
                          </div>
                        </div>
                        <div>
                          {guest.is_checked_in ? (
                            <Badge variant="success">Checked In</Badge>
                          ) : (
                            <Button size="sm">Check In</Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchQuery && searchResults.length === 0 && !isSearching && (
                <div className="text-center py-8 text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No guests found</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirm Modal */}
      {showConfirmModal && selectedGuest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <h2 className="text-xl font-bold">Confirm Check-In</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Guest Name</p>
                <p className="font-semibold text-lg">{selectedGuest.guest_name}</p>
              </div>

              {selectedGuest.guest_phone && (
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{selectedGuest.guest_phone}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Companions
                </label>
                <Input
                  type="number"
                  min="0"
                  max={selectedGuest.max_companions}
                  value={companionCount}
                  onChange={(e) => setCompanionCount(parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum: {selectedGuest.max_companions}
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setSelectedGuest(null);
                  }}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCheckIn}
                  className="flex-1"
                  isLoading={isProcessing}
                >
                  Confirm Check-In
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={showQRScanner}
        onScan={handleQRScan}
        onClose={() => setShowQRScanner(false)}
        onError={(error) => {
          setMessage({ type: 'error', text: error });
          setTimeout(() => setMessage(null), 3000);
        }}
      />
    </div>
  );
}
