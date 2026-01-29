'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Guest {
  id: string;
  event_id: string;
  guest_name: string;
  guest_phone: string | null;
  guest_email: string | null;
  guest_type_id: string | null;
  guest_group: string | null;
  max_companions: number;
  actual_companions: number;
  seating_config_id: string | null;
  qr_token: string | null;
  is_checked_in: boolean;
  checked_in_at: string | null;
  invitation_sent: boolean;
  source: string;
  created_at: string;
}

interface GuestType {
  id: string;
  type_name: string;
  display_name: string;
  color_code: string;
}

interface SeatingConfig {
  id: string;
  name: string;
  seating_type: string;
}

export default function GuestListPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [guests, setGuests] = useState<Guest[]>([]);
  const [guestTypes, setGuestTypes] = useState<GuestType[]>([]);
  const [seatingConfigs, setSeatingConfigs] = useState<SeatingConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set());
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGuestType, setFilterGuestType] = useState('');
  const [filterCheckedIn, setFilterCheckedIn] = useState('');
  const [filterSeating, setFilterSeating] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    guest_name: '',
    guest_phone: '',
    guest_email: '',
    guest_type_id: '',
    guest_group: '',
    max_companions: 0,
    seating_config_id: '',
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    const token = localStorage.getItem('client_token');
    
    try {
      // Fetch guests
      const guestsRes = await fetch(`/api/guestbook/guests?event_id=${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (guestsRes.ok) {
        const guestsData = await guestsRes.json();
        setGuests(guestsData.data || []);
      }

      // Fetch guest types
      const typesRes = await fetch(`/api/guestbook/guest-types?event_id=${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (typesRes.ok) {
        const typesData = await typesRes.json();
        setGuestTypes(typesData.data || []);
      }

      // Fetch seating configs
      const seatingRes = await fetch(`/api/guestbook/seating?event_id=${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (seatingRes.ok) {
        const seatingData = await seatingRes.json();
        setSeatingConfigs(seatingData.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (guest?: Guest) => {
    if (guest) {
      setEditingGuest(guest);
      setFormData({
        guest_name: guest.guest_name,
        guest_phone: guest.guest_phone || '',
        guest_email: guest.guest_email || '',
        guest_type_id: guest.guest_type_id || '',
        guest_group: guest.guest_group || '',
        max_companions: guest.max_companions,
        seating_config_id: guest.seating_config_id || '',
      });
    } else {
      setEditingGuest(null);
      setFormData({
        guest_name: '',
        guest_phone: '',
        guest_email: '',
        guest_type_id: guestTypes[0]?.id || '',
        guest_group: '',
        max_companions: 0,
        seating_config_id: '',
      });
    }
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const token = localStorage.getItem('client_token');

    try {
      const url = editingGuest
        ? `/api/guestbook/guests/${editingGuest.id}`
        : '/api/guestbook/guests';
      
      const method = editingGuest ? 'PUT' : 'POST';
      
      const payload = editingGuest
        ? formData
        : { ...formData, event_id: eventId, source: 'manual' };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        await fetchData();
        setShowModal(false);
      } else {
        setError(data.error || 'Failed to save guest');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (guestId: string) => {
    if (!confirm('Are you sure you want to delete this guest?')) {
      return;
    }

    const token = localStorage.getItem('client_token');

    try {
      const res = await fetch(`/api/guestbook/guests/${guestId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.success) {
        await fetchData();
      } else {
        alert(data.error || 'Failed to delete guest');
      }
    } catch (err) {
      alert('An error occurred. Please try again.');
    }
  };

  const handleGenerateQR = async (guestId: string) => {
    const token = localStorage.getItem('client_token');

    try {
      const res = await fetch(`/api/guestbook/guests/${guestId}/generate-qr`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.success) {
        await fetchData();
        alert('QR code generated successfully');
      } else {
        alert(data.error || 'Failed to generate QR code');
      }
    } catch (err) {
      alert('An error occurred. Please try again.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedGuests.size === 0) return;
    
    if (!confirm(`Delete ${selectedGuests.size} selected guests?`)) {
      return;
    }

    const token = localStorage.getItem('client_token');

    try {
      const res = await fetch('/api/guestbook/guests/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ guest_ids: Array.from(selectedGuests) }),
      });

      const data = await res.json();

      if (data.success) {
        await fetchData();
        setSelectedGuests(new Set());
      } else {
        alert(data.error || 'Failed to delete guests');
      }
    } catch (err) {
      alert('An error occurred. Please try again.');
    }
  };

  const handleExport = async () => {
    const token = localStorage.getItem('client_token');

    try {
      const res = await fetch(`/api/guestbook/guests/export?event_id=${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `guests_${eventId}_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to export guests');
      }
    } catch (err) {
      alert('An error occurred. Please try again.');
    }
  };

  const toggleSelectGuest = (guestId: string) => {
    const newSelected = new Set(selectedGuests);
    if (newSelected.has(guestId)) {
      newSelected.delete(guestId);
    } else {
      newSelected.add(guestId);
    }
    setSelectedGuests(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedGuests.size === filteredGuests.length) {
      setSelectedGuests(new Set());
    } else {
      setSelectedGuests(new Set(filteredGuests.map(g => g.id)));
    }
  };

  // Filter guests
  const filteredGuests = guests.filter(guest => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = guest.guest_name.toLowerCase().includes(query);
      const matchesPhone = guest.guest_phone?.toLowerCase().includes(query);
      const matchesEmail = guest.guest_email?.toLowerCase().includes(query);
      if (!matchesName && !matchesPhone && !matchesEmail) return false;
    }

    // Guest type filter
    if (filterGuestType && guest.guest_type_id !== filterGuestType) {
      return false;
    }

    // Check-in filter
    if (filterCheckedIn === 'checked_in' && !guest.is_checked_in) return false;
    if (filterCheckedIn === 'not_checked_in' && guest.is_checked_in) return false;

    // Seating filter
    if (filterSeating === 'assigned' && !guest.seating_config_id) return false;
    if (filterSeating === 'unassigned' && guest.seating_config_id) return false;

    return true;
  });

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

  const getSeatingName = (configId: string | null) => {
    if (!configId) return 'Not Assigned';
    const config = seatingConfigs.find(c => c.id === configId);
    return config?.name || 'Unknown';
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
        <style dangerouslySetInnerHTML={{__html: `
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

  const buttonStyle = (variant: 'primary' | 'secondary' | 'danger' | 'text') => {
    const base = {
      padding: '8px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      border: 'none',
      transition: 'all 0.2s',
      fontFamily: 'inherit'
    };

    switch (variant) {
      case 'primary':
        return { ...base, backgroundColor: '#2563eb', color: 'white' };
      case 'danger':
        return { ...base, backgroundColor: '#dc2626', color: 'white' };
      case 'text':
        return { ...base, backgroundColor: 'transparent', color: '#4b5563', padding: '4px 8px' };
      case 'secondary':
      default:
        return { ...base, backgroundColor: 'white', border: '1px solid #d1d5db', color: '#374151' };
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '8px'
  };

  const thStyle = {
    padding: '12px 24px',
    textAlign: 'left' as const,
    fontSize: '12px',
    fontWeight: '500',
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb'
  };

  const tdStyle = {
    padding: '16px 24px',
    fontSize: '14px',
    color: '#111827',
    borderBottom: '1px solid #e5e7eb'
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Guest List</h1>
          <p style={{ color: '#4b5563', marginTop: '8px', margin: 0 }}>
            {filteredGuests.length} of {guests.length} guests
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowImportModal(true)}
            style={buttonStyle('secondary')}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            <svg style={{ width: '20px', height: '20px', marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import
          </button>
          <button
            onClick={handleExport}
            style={buttonStyle('secondary')}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            <svg style={{ width: '20px', height: '20px', marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
          <button
            onClick={() => handleOpenModal()}
            style={buttonStyle('primary')}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          >
            <svg style={{ width: '20px', height: '20px', marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Guest
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name, phone, email..."
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Guest Type</label>
            <select
              value={filterGuestType}
              onChange={(e) => setFilterGuestType(e.target.value)}
              style={inputStyle}
            >
              <option value="">All Types</option>
              {guestTypes.map(type => (
                <option key={type.id} value={type.id}>{type.display_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Check-in Status</label>
            <select
              value={filterCheckedIn}
              onChange={(e) => setFilterCheckedIn(e.target.value)}
              style={inputStyle}
            >
              <option value="">All Status</option>
              <option value="checked_in">Checked In</option>
              <option value="not_checked_in">Not Checked In</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Seating</label>
            <select
              value={filterSeating}
              onChange={(e) => setFilterSeating(e.target.value)}
              style={inputStyle}
            >
              <option value="">All</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedGuests.size > 0 && (
        <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#1e3a8a' }}>
              {selectedGuests.size} guest(s) selected
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleBulkDelete}
                style={buttonStyle('danger')}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedGuests(new Set())}
                style={buttonStyle('secondary')}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {filteredGuests.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>
                    <input
                      type="checkbox"
                      checked={selectedGuests.size === filteredGuests.length && filteredGuests.length > 0}
                      onChange={toggleSelectAll}
                      style={{ width: '16px', height: '16px', accentColor: '#2563eb', cursor: 'pointer' }}
                    />
                  </th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Contact</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Companions</th>
                  <th style={thStyle}>Seating</th>
                  <th style={thStyle}>Status</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGuests.map((guest) => (
                  <tr key={guest.id} style={{ borderBottom: '1px solid #e5e7eb', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={tdStyle}>
                      <input
                        type="checkbox"
                        checked={selectedGuests.has(guest.id)}
                        onChange={() => toggleSelectGuest(guest.id)}
                        style={{ width: '16px', height: '16px', accentColor: '#2563eb', cursor: 'pointer' }}
                      />
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: '500', color: '#111827' }}>{guest.guest_name}</div>
                      {guest.guest_group && (
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Group: {guest.guest_group}</div>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: '14px', color: '#111827' }}>{guest.guest_phone || '-'}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{guest.guest_email || '-'}</div>
                    </td>
                    <td style={tdStyle}>
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
                    </td>
                    <td style={tdStyle}>
                      {guest.actual_companions} / {guest.max_companions}
                    </td>
                    <td style={tdStyle}>
                      {getSeatingName(guest.seating_config_id)}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{
                          padding: '2px 8px',
                          fontSize: '12px',
                          fontWeight: '500',
                          borderRadius: '4px',
                          backgroundColor: guest.is_checked_in ? '#dcfce7' : '#f3f4f6',
                          color: guest.is_checked_in ? '#166534' : '#1f2937',
                          width: 'fit-content'
                        }}>
                          {guest.is_checked_in ? 'Checked In' : 'Not Checked In'}
                        </span>
                        {guest.qr_token && (
                          <span style={{
                            padding: '2px 8px',
                            fontSize: '12px',
                            fontWeight: '500',
                            borderRadius: '4px',
                            backgroundColor: '#dbeafe',
                            color: '#1e40af',
                            width: 'fit-content'
                          }}>
                            Has QR
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        {!guest.qr_token && (
                          <button
                            onClick={() => handleGenerateQR(guest.id)}
                            style={{ ...buttonStyle('text'), color: '#16a34a' }}
                            title="Generate QR"
                          >
                            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenModal(guest)}
                          style={{ ...buttonStyle('text'), color: '#2563eb' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(guest.id)}
                          style={{ ...buttonStyle('text'), color: '#dc2626' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <svg style={{ margin: '0 auto', marginBottom: '16px', width: '48px', height: '48px', color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#111827', marginTop: '8px' }}>No guests found</h3>
            <p style={{ marginTop: '4px', fontSize: '14px', color: '#6b7280' }}>
              {searchQuery || filterGuestType || filterCheckedIn || filterSeating
                ? 'Try adjusting your filters'
                : 'Get started by adding a guest'}
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Guest Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', width: '100%', maxWidth: '448px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                {editingGuest ? 'Edit Guest' : 'Add Guest'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
              >
                <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
                <p style={{ fontSize: '14px', color: '#991b1b', margin: 0 }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>
                  Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.guest_name}
                  onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Phone</label>
                <input
                  type="tel"
                  value={formData.guest_phone}
                  onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={formData.guest_email}
                  onChange={(e) => setFormData({ ...formData, guest_email: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Guest Type</label>
                <select
                  value={formData.guest_type_id}
                  onChange={(e) => setFormData({ ...formData, guest_type_id: e.target.value })}
                  style={inputStyle}
                >
                  <option value="">Select Type</option>
                  {guestTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.display_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Group</label>
                <input
                  type="text"
                  value={formData.guest_group}
                  onChange={(e) => setFormData({ ...formData, guest_group: e.target.value })}
                  placeholder="e.g., Family, Friends"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Max Companions</label>
                <input
                  type="number"
                  min="0"
                  value={formData.max_companions}
                  onChange={(e) => setFormData({ ...formData, max_companions: parseInt(e.target.value) })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Seating</label>
                <select
                  value={formData.seating_config_id}
                  onChange={(e) => setFormData({ ...formData, seating_config_id: e.target.value })}
                  style={inputStyle}
                >
                  <option value="">Not Assigned</option>
                  {seatingConfigs.map(config => (
                    <option key={config.id} value={config.id}>{config.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ ...buttonStyle('secondary'), flex: 1, justifyContent: 'center' }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ ...buttonStyle('primary'), flex: 1, justifyContent: 'center', opacity: isSubmitting ? 0.5 : 1 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : editingGuest ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal Placeholder */}
      {showImportModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', width: '100%', maxWidth: '448px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Import Guests</h2>
              <button
                onClick={() => setShowImportModal(false)}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
              >
                <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <p style={{ color: '#4b5563', margin: 0 }}>Import functionality coming soon...</p>
              <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>Support for CSV and Excel files</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
