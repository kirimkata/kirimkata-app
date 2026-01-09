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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Guest List</h1>
          <p className="text-gray-600 mt-2">
            {filteredGuests.length} of {guests.length} guests
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Guest
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name, phone, email..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Guest Type</label>
            <select
              value={filterGuestType}
              onChange={(e) => setFilterGuestType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              {guestTypes.map(type => (
                <option key={type.id} value={type.id}>{type.display_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Check-in Status</label>
            <select
              value={filterCheckedIn}
              onChange={(e) => setFilterCheckedIn(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="checked_in">Checked In</option>
              <option value="not_checked_in">Not Checked In</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Seating</label>
            <select
              value={filterSeating}
              onChange={(e) => setFilterSeating(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedGuests.size} guest(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedGuests(new Set())}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredGuests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedGuests.size === filteredGuests.length && filteredGuests.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Companions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredGuests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedGuests.has(guest.id)}
                        onChange={() => toggleSelectGuest(guest.id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{guest.guest_name}</div>
                      {guest.guest_group && (
                        <div className="text-xs text-gray-500">Group: {guest.guest_group}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{guest.guest_phone || '-'}</div>
                      <div className="text-xs text-gray-500">{guest.guest_email || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className="px-2 py-1 text-xs font-medium rounded"
                        style={{
                          backgroundColor: getGuestTypeColor(guest.guest_type_id) + '20',
                          color: getGuestTypeColor(guest.guest_type_id)
                        }}
                      >
                        {getGuestTypeName(guest.guest_type_id)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {guest.actual_companions} / {guest.max_companions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getSeatingName(guest.seating_config_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          guest.is_checked_in ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {guest.is_checked_in ? 'Checked In' : 'Not Checked In'}
                        </span>
                        {guest.qr_token && (
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                            Has QR
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {!guest.qr_token && (
                          <button
                            onClick={() => handleGenerateQR(guest.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Generate QR"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenModal(guest)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(guest.id)}
                          className="text-red-600 hover:text-red-900"
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
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No guests found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || filterGuestType || filterCheckedIn || filterSeating
                ? 'Try adjusting your filters'
                : 'Get started by adding a guest'}
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Guest Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingGuest ? 'Edit Guest' : 'Add Guest'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.guest_name}
                  onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.guest_phone}
                  onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.guest_email}
                  onChange={(e) => setFormData({ ...formData, guest_email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Guest Type</label>
                <select
                  value={formData.guest_type_id}
                  onChange={(e) => setFormData({ ...formData, guest_type_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Type</option>
                  {guestTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.display_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Group</label>
                <input
                  type="text"
                  value={formData.guest_group}
                  onChange={(e) => setFormData({ ...formData, guest_group: e.target.value })}
                  placeholder="e.g., Family, Friends"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Companions</label>
                <input
                  type="number"
                  min="0"
                  value={formData.max_companions}
                  onChange={(e) => setFormData({ ...formData, max_companions: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Seating</label>
                <select
                  value={formData.seating_config_id}
                  onChange={(e) => setFormData({ ...formData, seating_config_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Not Assigned</option>
                  {seatingConfigs.map(config => (
                    <option key={config.id} value={config.id}>{config.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Import Guests</h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="text-center py-8">
              <p className="text-gray-600">Import functionality coming soon...</p>
              <p className="text-sm text-gray-500 mt-2">Support for CSV and Excel files</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
