'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useClient } from '@/lib/contexts/ClientContext';
import { InvitationAPI } from '@/lib/api/client';

// ============================================================================
// INTERFACES
// ============================================================================

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

interface Event {
  id: string;
  name: string;
  event_date: string;
  location?: string;
  slug?: string;
  has_invitation: boolean;
  has_guestbook: boolean;
  is_active: boolean;
  created_at: string;
}

interface GuestType {
  id: string;
  type_name: string;
  display_name: string;
  color_code: string;
  priority_order: number;
}

interface Guest {
  id: string;
  name: string;
  phone: string;
  guest_type_id?: string;
  guest_code?: string;
  qr_code?: string;
  guest_group?: string;
  table_number?: number;
  seat_number?: string;
  seating_area?: string;
  is_checked_in: boolean;
  checked_in_at?: string;
  notes?: string;
  source: 'registered' | 'walkin';
}

interface CheckinLog {
  id: string;
  guest_name: string;
  staff_name: string;
  checkin_method: 'QR_SCAN' | 'MANUAL_SEARCH';
  checked_in_at: string;
}

interface RedemptionLog {
  id: string;
  guest_name: string;
  staff_name: string;
  entitlement_type: 'SOUVENIR' | 'SNACK' | 'VIP_LOUNGE';
  quantity: number;
  redeemed_at: string;
}

interface StaffQuota {
  max_staff: number;
  staff_used: number;
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

// Helper untuk build URL - menggunakan relative path
const buildUrl = (path: string) => {
  // Gunakan relative path agar otomatis menggunakan origin yang sama
  return path;
};

export default function GuestbookPage() {
  const router = useRouter();

  const { events, selectedEvent: contextSelectedEvent, setSelectedEvent: setContextSelectedEvent, isLoading: isContextLoading } = useClient();
  const selectedEvent = contextSelectedEvent?.id; // Derived for compatibility

  // State management
  const [activeTab, setActiveTab] = useState<'overview' | 'guests' | 'staff' | 'seating' | 'logs'>('overview');
  const [staff, setStaff] = useState<Staff[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  // events state removed
  const [guestTypes, setGuestTypes] = useState<GuestType[]>([]);
  // selectedEvent state removed (derived from context)
  // isLoadingEvents removed
  const [guestStats, setGuestStats] = useState<GuestStats | null>(null);
  const [seatingStats, setSeatingStats] = useState<SeatingStats | null>(null);
  const [checkinLogs, setCheckinLogs] = useState<CheckinLog[]>([]);
  const [redemptionLogs, setRedemptionLogs] = useState<RedemptionLog[]>([]);
  const [staffQuota, setStaffQuota] = useState<StaffQuota | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterCheckedIn, setFilterCheckedIn] = useState<string>('all');

  // Staff modal state
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [isSubmittingStaff, setIsSubmittingStaff] = useState(false);
  const [staffForm, setStaffForm] = useState({
    username: '',
    password: '',
    full_name: '',
    phone: '',
    can_checkin: false,
    can_redeem_souvenir: false,
    can_redeem_snack: false,
    can_access_vip_lounge: false
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // ============================================================================
  // AUTH & TOKEN MANAGEMENT
  // ============================================================================

  const getAuthToken = useCallback(() => {
    return localStorage.getItem('client_token');
  }, []);

  const checkAuth = useCallback(() => {
    const user = localStorage.getItem('client_user');
    const token = getAuthToken();

    if (!user || !token) {
      router.push('/client-dashboard/login');
      return false;
    }

    try {
      const clientData = JSON.parse(user);
      if (!clientData?.guestbook_access) {
        setError('Anda tidak memiliki akses guestbook. Hubungi admin untuk mengaktifkan.');
        setIsLoading(false);
        return false;
      }
      return true;
    } catch (e) {
      router.push('/client-dashboard/login');
      return false;
    }
  }, [router, getAuthToken]);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  // fetchEvents removed - using ClientContext



  // ... (existing helper function buildUrl can be removed if not used anymore, or kept)

  // ...

  const fetchData = useCallback(async () => {
    const token = getAuthToken();
    if (!token || !selectedEvent) return;

    try {
      setError('');
      setIsLoading(true);

      // Fetch all data in parallel with event_id filter
      const [staffData, guestStatsData, seatingData, guestsData] =
        await Promise.all([
          InvitationAPI.getGuestbookStaff(token, selectedEvent),
          InvitationAPI.getGuestbookCheckinStats(token, selectedEvent),
          InvitationAPI.getGuestbookSeatingStats(token, selectedEvent),
          InvitationAPI.getGuestbookGuests(token, selectedEvent)
        ]);

      // Handle 401 to force relogin - check if any request returned 401/Unauthorized equivalent
      const results = [staffData, guestStatsData, seatingData, guestsData];
      if (results.some(res => !res.success && (res.error === 'Unauthorized' || res.status === 401))) {
        setError('Sesi berakhir atau token tidak valid. Silakan login ulang.');
        router.push('/client-dashboard/login');
        return;
      }

      if (staffData.success) setStaff(staffData.data || []);
      if (guestStatsData.success) setGuestStats(guestStatsData.data);
      if (seatingData.success) setSeatingStats(seatingData.data);
      if (guestsData.success) setGuests(guestsData.data || []);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Gagal mengambil data. Silakan refresh halaman.');
    } finally {
      setIsLoading(false);
    }
  }, [getAuthToken, selectedEvent, router]);

  const fetchCheckinLogs = useCallback(async () => {
    const token = getAuthToken();
    if (!token || !selectedEvent) return;

    try {
      const data = await InvitationAPI.getGuestbookCheckinLogs(token, selectedEvent);
      if (data.success) {
        setCheckinLogs(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching checkin logs:', err);
    }
  }, [getAuthToken, selectedEvent]);

  const fetchRedemptionLogs = useCallback(async () => {
    const token = getAuthToken();
    if (!token || !selectedEvent) return;

    try {
      const data = await InvitationAPI.getGuestbookRedemptionLogs(token, selectedEvent);
      if (data.success) {
        setRedemptionLogs(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching redemption logs:', err);
    }
  }, [getAuthToken, selectedEvent]);

  // ...

  const handleCreateStaff = async () => {
    if (!staffForm.username || !staffForm.password || !staffForm.full_name) {
      showNotification('error', 'Username, password, dan nama lengkap wajib diisi');
      return;
    }

    if (staffForm.password.length < 6) {
      showNotification('error', 'Password minimal 6 karakter');
      return;
    }

    const token = getAuthToken();
    if (!token) return;

    setIsSubmittingStaff(true);
    try {
      const data = await InvitationAPI.createGuestbookStaff(token, {
        event_id: selectedEvent,
        username: staffForm.username,
        password: staffForm.password,
        full_name: staffForm.full_name,
        phone: staffForm.phone || undefined,
        permissions: {
          can_checkin: staffForm.can_checkin,
          can_redeem_souvenir: staffForm.can_redeem_souvenir,
          can_redeem_snack: staffForm.can_redeem_snack,
          can_access_vip_lounge: staffForm.can_access_vip_lounge
        }
      });

      if (data.success) {
        setStaff(prev => [data.data, ...prev]);
        setShowStaffModal(false);
        resetStaffForm();
        showNotification('success', 'Staff berhasil dibuat');
        fetchData(); // Refresh quota
      } else {
        showNotification('error', data.error || 'Gagal membuat staff');
      }
    } catch (err) {
      console.error('Create staff error', err);
      showNotification('error', 'Terjadi kesalahan server');
    } finally {
      setIsSubmittingStaff(false);
    }
  };

  const handleUpdateStaff = async (staffId: string, updates: Partial<Staff>) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const data = await InvitationAPI.updateGuestbookStaff(token, staffId, updates);

      if (data.success) {
        setStaff(prev => prev.map(s => s.id === staffId ? data.data : s));
        showNotification('success', 'Staff berhasil diupdate');
      } else {
        showNotification('error', data.error || 'Gagal update staff');
      }
    } catch (err) {
      console.error('Update staff error', err);
      showNotification('error', 'Terjadi kesalahan server');
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Yakin ingin menghapus staff ini?')) return;

    const token = getAuthToken();
    if (!token) return;

    try {
      const data = await InvitationAPI.deleteGuestbookStaff(token, staffId);

      if (data.success) {
        setStaff(prev => prev.filter(s => s.id !== staffId));
        showNotification('success', 'Staff berhasil dihapus');
        fetchData(); // Refresh quota
      } else {
        showNotification('error', data.error || 'Gagal menghapus staff');
      }
    } catch (err) {
      console.error('Delete staff error', err);
      showNotification('error', 'Terjadi kesalahan server');
    }
  };

  const resetStaffForm = () => {
    setStaffForm({
      username: '',
      password: '',
      full_name: '',
      phone: '',
      can_checkin: false,
      can_redeem_souvenir: false,
      can_redeem_snack: false,
      can_access_vip_lounge: false
    });
    setEditingStaff(null);
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // ============================================================================
  // GUEST FILTERING
  // ============================================================================

  const filteredGuests = guests.filter(guest => {
    const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.phone.includes(searchTerm) ||
      (guest.guest_group && guest.guest_group.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = filterCategory === 'all' || guest.guest_type_id === filterCategory;
    const matchesCheckedIn = filterCheckedIn === 'all' ||
      (filterCheckedIn === 'checked_in' && guest.is_checked_in) ||
      (filterCheckedIn === 'not_checked_in' && !guest.is_checked_in);

    return matchesSearch && matchesCategory && matchesCheckedIn;
  });

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const getPermissionBadges = (staff: Staff) => {
    const permissions = [];
    if (staff.can_checkin) permissions.push('Check-in');
    if (staff.can_redeem_souvenir) permissions.push('Souvenir');
    if (staff.can_redeem_snack) permissions.push('Snack');
    if (staff.can_access_vip_lounge) permissions.push('VIP Lounge');
    return permissions;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderNotification = () => {
    if (!notification) return null;

    return (
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '16px 24px',
        borderRadius: '12px',
        backgroundColor: notification.type === 'success' ? '#d1fae5' : '#fee2e2',
        border: `1px solid ${notification.type === 'success' ? '#6ee7b7' : '#fca5a5'}`,
        color: notification.type === 'success' ? '#065f46' : '#991b1b',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        zIndex: 9999,
        fontWeight: 600
      }}>
        {notification.message}
      </div>
    );
  };

  const renderStaffModal = () => {
    if (!showStaffModal) return null;

    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }} onClick={() => !isSubmittingStaff && setShowStaffModal(false)}>
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto'
        }} onClick={(e) => e.stopPropagation()}>
          <h2 style={{ margin: '0 0 24px', fontSize: '24px', fontWeight: 700 }}>
            {editingStaff ? 'Edit Staff' : 'Tambah Staff Baru'}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Username *</label>
              <input
                type="text"
                value={staffForm.username}
                onChange={(e) => setStaffForm(prev => ({ ...prev, username: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '15px'
                }}
                placeholder="username_staff"
                disabled={isSubmittingStaff}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Nama Lengkap *</label>
              <input
                type="text"
                value={staffForm.full_name}
                onChange={(e) => setStaffForm(prev => ({ ...prev, full_name: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '15px'
                }}
                placeholder="Nama Staff"
                disabled={isSubmittingStaff}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Password *</label>
              <input
                type="password"
                value={staffForm.password}
                onChange={(e) => setStaffForm(prev => ({ ...prev, password: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '15px'
                }}
                placeholder="Minimal 6 karakter"
                disabled={isSubmittingStaff}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>No. HP</label>
              <input
                type="tel"
                value={staffForm.phone}
                onChange={(e) => setStaffForm(prev => ({ ...prev, phone: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '15px'
                }}
                placeholder="08xxxxxxxxxx"
                disabled={isSubmittingStaff}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600 }}>Permissions</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { key: 'can_checkin', label: 'Check-in Tamu' },
                  { key: 'can_redeem_souvenir', label: 'Redeem Souvenir' },
                  { key: 'can_redeem_snack', label: 'Redeem Snack' },
                  { key: 'can_access_vip_lounge', label: 'Akses VIP Lounge' }
                ].map(({ key, label }) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={staffForm[key as keyof typeof staffForm] as boolean}
                      onChange={(e) => setStaffForm(prev => ({ ...prev, [key]: e.target.checked }))}
                      style={{ width: '18px', height: '18px' }}
                      disabled={isSubmittingStaff}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                onClick={handleCreateStaff}
                disabled={isSubmittingStaff}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#2563eb',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: isSubmittingStaff ? 'not-allowed' : 'pointer',
                  opacity: isSubmittingStaff ? 0.6 : 1
                }}
              >
                {isSubmittingStaff ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button
                onClick={() => {
                  setShowStaffModal(false);
                  resetStaffForm();
                }}
                disabled={isSubmittingStaff}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#fff',
                  color: '#374151',
                  fontWeight: 600,
                  cursor: isSubmittingStaff ? 'not-allowed' : 'pointer'
                }}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderOverviewTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        {[
          { label: 'Total Guests', value: guestStats?.total || 0, icon: '👥', color: '#2563eb' },
          { label: 'Checked In', value: guestStats?.checked_in || 0, icon: '✅', color: '#16a34a' },
          { label: 'Seated', value: seatingStats?.total_assigned || 0, icon: '📍', color: '#7c3aed' },
          { label: 'Active Staff', value: staff.filter(s => s.is_active).length, icon: '🛡️', color: '#ea580c' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{
            padding: '24px',
            background: '#fff',
            borderRadius: '18px',
            border: '1px solid #eef2ff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>{icon}</div>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>{label}</p>
            <p style={{ margin: '8px 0 0', fontSize: '32px', fontWeight: 700, color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Staff Quota */}
      {staffQuota && (
        <div style={{
          background: '#fff',
          borderRadius: '18px',
          border: '1px solid #e5e7eb',
          padding: '24px'
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600 }}>Staff Quota</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <div style={{
                height: '12px',
                borderRadius: '999px',
                backgroundColor: '#e5e7eb',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(staffQuota.staff_used / staffQuota.max_staff) * 100}%`,
                  height: '100%',
                  background: staffQuota.staff_used >= staffQuota.max_staff ? '#dc2626' : '#2563eb',
                  transition: 'width 300ms'
                }} />
              </div>
            </div>
            <div style={{ fontWeight: 600, color: '#374151' }}>
              {staffQuota.staff_used} / {staffQuota.max_staff}
            </div>
          </div>
        </div>
      )}

      {/* Guest Categories */}
      <div style={{
        background: '#fff',
        borderRadius: '18px',
        border: '1px solid #e5e7eb',
        padding: '24px'
      }}>
        <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 600 }}>Guest Categories</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {[
            { label: 'Regular', value: guestStats?.regular || 0, color: '#1f2937' },
            { label: 'VIP', value: guestStats?.vip || 0, color: '#7c3aed' },
            { label: 'VVIP', value: guestStats?.vvip || 0, color: '#b45309' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: 700, color }}>{value}</div>
              <div style={{ marginTop: '4px', color: '#6b7280' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Check-in Progress */}
      <div style={{
        background: '#fff',
        borderRadius: '18px',
        border: '1px solid #e5e7eb',
        padding: '24px'
      }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600 }}>Check-in Progress</h3>
        <div style={{
          height: '12px',
          borderRadius: '999px',
          backgroundColor: '#e5e7eb',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${guestStats?.total ? (guestStats.checked_in / guestStats.total) * 100 : 0}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #34d399, #059669)',
            transition: 'width 300ms'
          }} />
        </div>
        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
          <span>{guestStats?.checked_in || 0} checked in</span>
          <span>{guestStats?.total || 0} total guests</span>
        </div>
      </div>
    </div>
  );

  const renderGuestsTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="🔎 Cari tamu..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            minWidth: '250px',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            fontSize: '15px'
          }}
        />
        <select
          value={filterCheckedIn}
          onChange={(e) => setFilterCheckedIn(e.target.value)}
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            fontSize: '15px',
            cursor: 'pointer'
          }}
        >
          <option value="all">Semua Status</option>
          <option value="checked_in">Sudah Check-in</option>
          <option value="not_checked_in">Belum Check-in</option>
        </select>
      </div>

      {/* Guest List */}
      <div style={{
        background: '#fff',
        borderRadius: '18px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
            Daftar Tamu ({filteredGuests.length})
          </h3>
        </div>
        <div>
          {filteredGuests.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
              {searchTerm ? 'Tidak ada tamu yang sesuai dengan pencarian' : 'Belum ada tamu'}
            </div>
          ) : (
            filteredGuests.map((guest) => (
              <div key={guest.id} style={{
                padding: '20px 24px',
                borderBottom: '1px solid #f3f4f6',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1 }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: guest.is_checked_in ? '#d1fae5' : '#eef2ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    color: guest.is_checked_in ? '#065f46' : '#4338ca'
                  }}>
                    {guest.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '16px' }}>{guest.name}</p>
                      {guest.is_checked_in && (
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: '#d1fae5',
                          color: '#065f46'
                        }}>
                          ✓ Checked In
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '4px 0', color: '#6b7280' }}>{guest.phone}</p>
                    {guest.table_number && (
                      <p style={{ margin: '4px 0', color: '#2563eb', fontWeight: 600 }}>
                        Meja {guest.table_number}
                        {guest.seat_number && ` - Kursi ${guest.seat_number}`}
                      </p>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}>
                    📋 Detail
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderStaffTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Staff List */}
      <div style={{
        background: '#fff',
        borderRadius: '18px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
            Daftar Staff ({staff.length})
          </h3>
          <p style={{ marginTop: '6px', color: '#6b7280', fontSize: '14px' }}>
            Kelola staff yang memiliki akses ke sistem guestbook
          </p>
        </div>
        <div>
          {staff.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
              Belum ada staff. Klik "Tambah Staff" untuk menambahkan staff pertama.
            </div>
          ) : (
            staff.map((staffMember) => (
              <div key={staffMember.id} style={{
                padding: '20px 24px',
                borderBottom: '1px solid #f3f4f6',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1 }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#dbeafe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1d4ed8',
                    fontWeight: 600
                  }}>
                    {staffMember.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '16px' }}>{staffMember.full_name}</p>
                      {!staffMember.is_active && (
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: '#fee2e2',
                          color: '#b91c1c'
                        }}>
                          Nonaktif
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '4px 0', color: '#6b7280' }}>@{staffMember.username}</p>
                    {staffMember.phone && <p style={{ margin: '4px 0', color: '#6b7280' }}>{staffMember.phone}</p>}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {getPermissionBadges(staffMember).map((permission) => (
                        <span key={permission} style={{
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: '#dbeafe',
                          color: '#1d4ed8'
                        }}>
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleUpdateStaff(staffMember.id, { is_active: !staffMember.is_active })}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      backgroundColor: '#fff',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    {staffMember.is_active ? '🔒 Nonaktifkan' : '✅ Aktifkan'}
                  </button>
                  <button
                    onClick={() => handleDeleteStaff(staffMember.id)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid #fca5a5',
                      backgroundColor: '#fee2e2',
                      color: '#b91c1c',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    🗑️ Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderSeatingTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Seating Stats */}
      <div style={{
        background: '#fff',
        borderRadius: '18px',
        border: '1px solid #e5e7eb',
        padding: '24px'
      }}>
        <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 600 }}>Seating Assignment</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: 700, color: '#16a34a' }}>
              {seatingStats?.total_assigned || 0}
            </div>
            <div style={{ color: '#6b7280' }}>Guests Assigned</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: 700, color: '#ea580c' }}>
              {seatingStats?.total_unassigned || 0}
            </div>
            <div style={{ color: '#6b7280' }}>Unassigned</div>
          </div>
        </div>
      </div>

      {/* Tables */}
      {seatingStats && Object.keys(seatingStats.tables).length > 0 && (
        <div style={{
          background: '#fff',
          borderRadius: '18px',
          border: '1px solid #e5e7eb',
          padding: '24px'
        }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 600 }}>Tables</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '16px'
          }}>
            {Object.entries(seatingStats.tables).map(([table, count]) => (
              <div key={table} style={{
                padding: '16px',
                borderRadius: '16px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '18px', fontWeight: 600 }}>Meja {table}</div>
                <div style={{ marginTop: '4px', color: '#6b7280' }}>{count} guests</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Areas */}
      {seatingStats && Object.keys(seatingStats.areas).length > 0 && (
        <div style={{
          background: '#fff',
          borderRadius: '18px',
          border: '1px solid #e5e7eb',
          padding: '24px'
        }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 600 }}>Seating Areas</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '16px'
          }}>
            {Object.entries(seatingStats.areas).map(([area, count]) => (
              <div key={area} style={{
                padding: '16px',
                borderRadius: '16px',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#1d4ed8' }}>{area}</div>
                <div style={{ marginTop: '4px', color: '#1d4ed8' }}>{count} guests</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderLogsTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Check-in Logs */}
      <div style={{
        background: '#fff',
        borderRadius: '18px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Check-in Logs</h3>
          <p style={{ marginTop: '6px', color: '#6b7280', fontSize: '14px' }}>
            20 check-in terbaru
          </p>
        </div>
        <div>
          {checkinLogs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
              Belum ada log check-in
            </div>
          ) : (
            checkinLogs.map((log) => (
              <div key={log.id} style={{
                padding: '16px 24px',
                borderBottom: '1px solid #f3f4f6',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{log.guest_name}</p>
                  <p style={{ margin: '4px 0', color: '#6b7280', fontSize: '14px' }}>
                    oleh {log.staff_name} • {log.checkin_method === 'QR_SCAN' ? '📱 QR Scan' : '🔍 Manual'}
                  </p>
                </div>
                <div style={{ color: '#6b7280', fontSize: '14px' }}>
                  {formatDateTime(log.checked_in_at)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Redemption Logs */}
      <div style={{
        background: '#fff',
        borderRadius: '18px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Redemption Logs</h3>
          <p style={{ marginTop: '6px', color: '#6b7280', fontSize: '14px' }}>
            20 redemption terbaru
          </p>
        </div>
        <div>
          {redemptionLogs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
              Belum ada log redemption
            </div>
          ) : (
            redemptionLogs.map((log) => (
              <div key={log.id} style={{
                padding: '16px 24px',
                borderBottom: '1px solid #f3f4f6',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{log.guest_name}</p>
                  <p style={{ margin: '4px 0', color: '#6b7280', fontSize: '14px' }}>
                    {log.entitlement_type} ({log.quantity}x) • oleh {log.staff_name}
                  </p>
                </div>
                <div style={{ color: '#6b7280', fontSize: '14px' }}>
                  {formatDateTime(log.redeemed_at)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // LOADING & ERROR STATES
  // ============================================================================

  if (isLoading) {
    return (
      <div style={{
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: '4px solid #e5e7eb',
          borderTopColor: '#2563eb',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  if (error && !checkAuth()) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center'
      }}>
        <div style={{
          padding: '24px',
          borderRadius: '12px',
          backgroundColor: '#fee2e2',
          border: '1px solid #fca5a5',
          color: '#b91c1c',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <p style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{error}</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      paddingBottom: '48px'
    }}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {renderNotification()}
      {renderStaffModal()}

      {/* Event Selector */}
      {isContextLoading ? (
        <div style={{
          padding: '24px',
          backgroundColor: '#fff',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '3px solid #e5e7eb',
            borderTopColor: '#2563eb',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }} />
          <p style={{ marginTop: '12px', color: '#6b7280' }}>Memuat event...</p>
        </div>
      ) : events.length === 0 ? (
        <div style={{
          padding: '40px 24px',
          backgroundColor: '#fff',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📅</div>
          <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 600, color: '#111827' }}>
            Belum Ada Event
          </h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
            Silakan buat event terlebih dahulu untuk menggunakan fitur guestbook
          </p>
        </div>
      ) : events.length > 1 && !selectedEvent ? (
        <div style={{
          padding: '24px',
          backgroundColor: '#fff',
          borderRadius: '16px',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: 600, color: '#111827' }}>
            Pilih Event
          </h2>
          <p style={{ margin: '0 0 20px', color: '#6b7280', fontSize: '14px' }}>
            Anda memiliki {events.length} event. Pilih salah satu untuk melanjutkan:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {events.map(event => (
              <button
                key={event.id}
                onClick={() => setContextSelectedEvent(event)}
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
                  {event.name}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: '#6b7280', fontSize: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📅</span>
                    {formatDateTime(event.event_date)}
                  </div>
                  {event.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>📍</span>
                      {event.location}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Show dashboard only when event is selected */}
      {selectedEvent && (
        <>
          {/* Header */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '16px',
            padding: '24px',
            backgroundColor: '#fff',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <div style={{ maxWidth: '520px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#111827' }}>
                  Digital Guestbook
                </h1>
                {events.length > 1 && (
                  <select
                    value={selectedEvent || ''}
                    onChange={(e) => {
                      const selected = events.find(ev => ev.id === e.target.value);
                      if (selected) setContextSelectedEvent(selected);
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#374151',
                      cursor: 'pointer',
                      backgroundColor: '#fff'
                    }}
                  >
                    {events.map(event => (
                      <option key={event.id} value={event.id}>
                        {event.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <p style={{ marginTop: '8px', marginBottom: 0, color: '#4b5563', fontSize: '16px', lineHeight: 1.5 }}>
                Pusat pengaturan guestbook: kelola tamu, staff, seating, dan monitoring real-time
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {activeTab === 'staff' && (
                <button
                  onClick={() => setShowStaffModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 18px',
                    borderRadius: '999px',
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                  }}
                >
                  <span>➕</span>
                  Tambah Staff
                </button>
              )}
              {activeTab === 'guests' && (
                <>
                  <button style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 18px',
                    borderRadius: '999px',
                    border: 'none',
                    backgroundColor: '#16a34a',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
                  }}>
                    <span>📥</span>
                    Import CSV
                  </button>
                  <button style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 18px',
                    borderRadius: '999px',
                    border: 'none',
                    backgroundColor: '#7c3aed',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
                  }}>
                    <span>📤</span>
                    Export
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '24px',
            padding: '0 4px',
            borderBottom: '2px solid #e5e7eb',
            overflowX: 'auto'
          }}>
            {[
              { key: 'overview', label: 'Overview', icon: '📊' },
              { key: 'guests', label: 'Guests', icon: '👥' },
              { key: 'staff', label: 'Staff', icon: '🛡️' },
              { key: 'seating', label: 'Seating', icon: '📍' },
              { key: 'logs', label: 'Logs', icon: '📋' },
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 4px',
                  border: 'none',
                  borderBottom: activeTab === key ? '3px solid #2563eb' : '3px solid transparent',
                  background: 'transparent',
                  color: activeTab === key ? '#2563eb' : '#6b7280',
                  fontWeight: activeTab === key ? 700 : 500,
                  cursor: 'pointer',
                  fontSize: '15px',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'guests' && renderGuestsTab()}
          {activeTab === 'staff' && renderStaffTab()}
          {activeTab === 'seating' && renderSeatingTab()}
          {activeTab === 'logs' && renderLogsTab()}
        </>
      )}
    </div>
  );
}
