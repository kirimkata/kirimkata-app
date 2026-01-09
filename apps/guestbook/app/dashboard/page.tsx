'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, UserPlus, Settings, LogOut, Shield, Eye, Trash2, MapPin, Calendar, BarChart3 } from 'lucide-react';

interface Staff {
  id: string;
  username: string;
  full_name: string;
  phone?: string;
  can_checkin: boolean;
  can_redeem_souvenir: boolean;
  can_redeem_snack: boolean;
  can_access_vip_lounge: boolean;
  is_active: boolean;
  created_at: string;
}

interface Client {
  id: string;
  username: string;
  email: string;
  guestbook_access: boolean;
}

interface GuestStats {
  total: number;
  regular: number;
  vip: number;
  vvip: number;
  checked_in: number;
}

interface SeatingStats {
  total_assigned: number;
  total_unassigned: number;
  tables: { [key: string]: number };
  areas: { [key: string]: number };
}

export default function ClientDashboard() {
  const [client, setClient] = useState<Client | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [guestStats, setGuestStats] = useState<GuestStats | null>(null);
  const [seatingStats, setSeatingStats] = useState<SeatingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'staff' | 'guests' | 'seating'>('staff');
  const [error, setError] = useState('');
  const [createStaffForm, setCreateStaffForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    permissions: {
      can_checkin: false,
      can_redeem_souvenir: false,
      can_redeem_snack: false,
      can_access_vip_lounge: false,
    },
  });
  const [createStaffError, setCreateStaffError] = useState('');
  const [createStaffSuccess, setCreateStaffSuccess] = useState('');
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('guestbook_token');
    const userType = localStorage.getItem('guestbook_user_type');
    const clientData = localStorage.getItem('guestbook_client');

    if (!token || userType !== 'client' || !clientData) {
      router.push('/login');
      return;
    }

    const parsedClient = JSON.parse(clientData);
    setClient(parsedClient);

    if (!parsedClient?.guestbook_access) {
      setError('Anda tidak memiliki akses guestbook');
      setIsLoading(false);
      return;
    }

    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('guestbook_token');
      
      // Fetch staff data
      const staffResponse = await fetch('/api/staff', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const staffData = await staffResponse.json();
      if (staffData.success) {
        setStaff(staffData.data);
      }

      // Fetch guest stats
      const guestResponse = await fetch('/api/guests/stats', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const guestData = await guestResponse.json();
      if (guestData.success) {
        setGuestStats(guestData.data);
      }

      // Fetch seating stats
      const seatingResponse = await fetch('/api/seating?stats=true', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const seatingData = await seatingResponse.json();
      if (seatingData.success) {
        setSeatingStats(seatingData.data);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Gagal mengambil data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('guestbook_token');
    localStorage.removeItem('guestbook_user_type');
    localStorage.removeItem('guestbook_client');
    router.push('/login');
  };

  const resetCreateStaffForm = () => {
    setCreateStaffForm({
      username: '',
      password: '',
      confirmPassword: '',
      full_name: '',
      phone: '',
      permissions: {
        can_checkin: false,
        can_redeem_souvenir: false,
        can_redeem_snack: false,
        can_access_vip_lounge: false,
      },
    });
    setCreateStaffError('');
    setCreateStaffSuccess('');
  };

  const handleCloseCreateStaffModal = () => {
    if (isCreatingStaff) return;
    setShowCreateForm(false);
    resetCreateStaffForm();
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateStaffError('');
    setCreateStaffSuccess('');

    const username = createStaffForm.username.trim();
    const fullName = createStaffForm.full_name.trim();
    const phone = createStaffForm.phone.trim();

    if (!username || !createStaffForm.password || !fullName) {
      setCreateStaffError('Username, password, dan nama lengkap wajib diisi');
      return;
    }

    if (createStaffForm.password.length < 6) {
      setCreateStaffError('Password minimal 6 karakter');
      return;
    }

    if (createStaffForm.password !== createStaffForm.confirmPassword) {
      setCreateStaffError('Konfirmasi password tidak sama');
      return;
    }

    const token = localStorage.getItem('guestbook_token');
    if (!token) {
      setCreateStaffError('Anda belum login');
      return;
    }

    setIsCreatingStaff(true);
    try {
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          username,
          password: createStaffForm.password,
          full_name: fullName,
          phone: phone || undefined,
          permissions: createStaffForm.permissions,
        }),
      });

      const data = await response.json();

      if (!data?.success) {
        setCreateStaffError(data?.error || 'Gagal membuat staff');
        return;
      }

      setStaff((prev) => [data.data, ...prev]);
      setCreateStaffSuccess('Staff berhasil dibuat');

      setTimeout(() => {
        setShowCreateForm(false);
        resetCreateStaffForm();
      }, 600);
    } catch (err) {
      console.error('Error creating staff:', err);
      setCreateStaffError('Terjadi kesalahan server');
    } finally {
      setIsCreatingStaff(false);
    }
  };

  const getPermissionBadges = (staff: Staff) => {
    const permissions = [];
    if (staff.can_checkin) permissions.push('Check-in');
    if (staff.can_redeem_souvenir) permissions.push('Souvenir');
    if (staff.can_redeem_snack) permissions.push('Snack');
    if (staff.can_access_vip_lounge) permissions.push('VIP Lounge');
    return permissions;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Client</h1>
              <p className="text-sm text-gray-600">Selamat datang, {client?.username}</p>
            </div>
            <div className="flex items-center space-x-4">
              {activeTab === 'staff' && client?.guestbook_access && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Tambah Staff
                </button>
              )}
              {activeTab === 'seating' && (
                <button
                  onClick={() => alert('Fitur assign seating akan segera tersedia')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Assign Seating
                </button>
              )}
              {activeTab === 'guests' && (
                <button
                  onClick={() => alert('Fitur export guest list akan segera tersedia')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Export Data
                </button>
              )}
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Navigation Tabs */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('staff')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'staff'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Users className="h-5 w-5 inline mr-2" />
                  Staff Management
                </button>
                <button
                  onClick={() => setActiveTab('guests')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'guests'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Calendar className="h-5 w-5 inline mr-2" />
                  Guest Overview
                </button>
                <button
                  onClick={() => setActiveTab('seating')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'seating'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <MapPin className="h-5 w-5 inline mr-2" />
                  Seating Management
                </button>
              </nav>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-indigo-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Guests</dt>
                      <dd className="text-lg font-medium text-gray-900">{guestStats?.total || 0}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Shield className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Checked In</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {guestStats?.checked_in || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <MapPin className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Seated</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {seatingStats?.total_assigned || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Settings className="h-8 w-8 text-gray-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Staff</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {staff.filter(s => s.is_active).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'staff' && (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Daftar Staff</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Kelola staff yang memiliki akses ke sistem guestbook
                </p>
              </div>
              <ul className="divide-y divide-gray-200">
                {staff.length === 0 ? (
                  <li className="px-4 py-6 text-center text-gray-500">
                    Belum ada staff. Klik "Tambah Staff" untuk menambahkan staff pertama.
                  </li>
                ) : (
                  staff.map((staffMember) => (
                    <li key={staffMember.id} className="px-4 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-indigo-600">
                                {staffMember.full_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <p className="text-sm font-medium text-gray-900">
                                {staffMember.full_name}
                              </p>
                              {!staffMember.is_active && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Nonaktif
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">@{staffMember.username}</p>
                            {staffMember.phone && (
                              <p className="text-sm text-gray-500">{staffMember.phone}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex flex-wrap gap-1">
                            {getPermissionBadges(staffMember).map((permission) => (
                              <span
                                key={permission}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {permission}
                              </span>
                            ))}
                          </div>
                          <button className="text-gray-400 hover:text-gray-600">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-gray-400 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}

          {activeTab === 'guests' && (
            <div className="space-y-6">
              {/* Guest Category Breakdown */}
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Guest Categories</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Breakdown tamu berdasarkan kategori dan status check-in
                  </p>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{guestStats?.regular || 0}</div>
                      <div className="text-sm text-gray-500">Regular Guests</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{guestStats?.vip || 0}</div>
                      <div className="text-sm text-gray-500">VIP Guests</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{guestStats?.vvip || 0}</div>
                      <div className="text-sm text-gray-500">VVIP Guests</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Check-in Progress */}
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Check-in Progress</h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-green-600 h-3 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${guestStats?.total ? (guestStats.checked_in / guestStats.total) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  <div className="mt-2 flex justify-between text-sm text-gray-600">
                    <span>{guestStats?.checked_in || 0} checked in</span>
                    <span>{guestStats?.total || 0} total guests</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'seating' && (
            <div className="space-y-6">
              {/* Seating Overview */}
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Seating Assignment</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Overview pengaturan tempat duduk tamu
                  </p>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{seatingStats?.total_assigned || 0}</div>
                      <div className="text-sm text-gray-500">Guests Assigned</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{seatingStats?.total_unassigned || 0}</div>
                      <div className="text-sm text-gray-500">Unassigned</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tables Overview */}
              {seatingStats && Object.keys(seatingStats.tables).length > 0 && (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Tables</h3>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {Object.entries(seatingStats.tables).map(([table, count]) => (
                        <div key={table} className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-semibold text-gray-900">{table}</div>
                          <div className="text-sm text-gray-500">{count} guests</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Areas Overview */}
              {seatingStats && Object.keys(seatingStats.areas).length > 0 && (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Seating Areas</h3>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(seatingStats.areas).map(([area, count]) => (
                        <div key={area} className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-lg font-semibold text-blue-900">{area}</div>
                          <div className="text-sm text-blue-600">{count} guests</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Create Staff Modal - Placeholder */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-16 mx-auto p-6 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <div className="mt-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Tambah Staff Baru</h3>
                  <p className="mt-1 text-sm text-gray-500">Buat akun staff untuk akses fitur guestbook.</p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseCreateStaffModal}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Tutup"
                >
                  ✕
                </button>
              </div>

              {(createStaffError || createStaffSuccess) && (
                <div
                  className={`mt-4 border rounded-md p-3 ${
                    createStaffError
                      ? 'bg-red-50 border-red-200'
                      : 'bg-green-50 border-green-200'
                  }`}
                >
                  <p
                    className={`text-sm ${
                      createStaffError ? 'text-red-700' : 'text-green-700'
                    }`}
                  >
                    {createStaffError || createStaffSuccess}
                  </p>
                </div>
              )}

              <form onSubmit={handleCreateStaff} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <input
                      type="text"
                      value={createStaffForm.username}
                      onChange={(e) =>
                        setCreateStaffForm((p) => ({ ...p, username: e.target.value }))
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="mis: staff1"
                      autoComplete="off"
                      disabled={isCreatingStaff}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nama lengkap</label>
                    <input
                      type="text"
                      value={createStaffForm.full_name}
                      onChange={(e) =>
                        setCreateStaffForm((p) => ({ ...p, full_name: e.target.value }))
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Nama staff"
                      disabled={isCreatingStaff}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">No. HP (opsional)</label>
                    <input
                      type="tel"
                      value={createStaffForm.phone}
                      onChange={(e) =>
                        setCreateStaffForm((p) => ({ ...p, phone: e.target.value }))
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="08xxxxxxxxxx"
                      disabled={isCreatingStaff}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Password</label>
                      <input
                        type="password"
                        value={createStaffForm.password}
                        onChange={(e) =>
                          setCreateStaffForm((p) => ({ ...p, password: e.target.value }))
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Minimal 6 karakter"
                        disabled={isCreatingStaff}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Konfirmasi</label>
                      <input
                        type="password"
                        value={createStaffForm.confirmPassword}
                        onChange={(e) =>
                          setCreateStaffForm((p) => ({ ...p, confirmPassword: e.target.value }))
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Ulangi password"
                        disabled={isCreatingStaff}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Permission</label>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className="flex items-center space-x-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={createStaffForm.permissions.can_checkin}
                          onChange={(e) =>
                            setCreateStaffForm((p) => ({
                              ...p,
                              permissions: { ...p.permissions, can_checkin: e.target.checked },
                            }))
                          }
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          disabled={isCreatingStaff}
                        />
                        <span>Check-in</span>
                      </label>

                      <label className="flex items-center space-x-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={createStaffForm.permissions.can_redeem_souvenir}
                          onChange={(e) =>
                            setCreateStaffForm((p) => ({
                              ...p,
                              permissions: { ...p.permissions, can_redeem_souvenir: e.target.checked },
                            }))
                          }
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          disabled={isCreatingStaff}
                        />
                        <span>Souvenir</span>
                      </label>

                      <label className="flex items-center space-x-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={createStaffForm.permissions.can_redeem_snack}
                          onChange={(e) =>
                            setCreateStaffForm((p) => ({
                              ...p,
                              permissions: { ...p.permissions, can_redeem_snack: e.target.checked },
                            }))
                          }
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          disabled={isCreatingStaff}
                        />
                        <span>Snack</span>
                      </label>

                      <label className="flex items-center space-x-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={createStaffForm.permissions.can_access_vip_lounge}
                          onChange={(e) =>
                            setCreateStaffForm((p) => ({
                              ...p,
                              permissions: { ...p.permissions, can_access_vip_lounge: e.target.checked },
                            }))
                          }
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          disabled={isCreatingStaff}
                        />
                        <span>VIP Lounge</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={handleCloseCreateStaffModal}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    disabled={isCreatingStaff}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-60"
                    disabled={isCreatingStaff}
                  >
                    {isCreatingStaff ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
