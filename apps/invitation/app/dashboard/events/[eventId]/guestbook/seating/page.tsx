'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Event {
  id: string;
  event_name: string;
  seating_mode: 'no_seat' | 'table_based' | 'numbered_seat' | 'zone_based';
}

interface SeatingConfig {
  id: string;
  event_id: string;
  seating_type: 'table' | 'seat' | 'zone';
  name: string;
  capacity: number;
  allowed_guest_type_ids: string[];
  position_data?: any;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface GuestType {
  id: string;
  type_name: string;
  display_name: string;
  color_code: string;
}

interface SeatingStats {
  total_capacity: number;
  assigned_seats: number;
  available_seats: number;
  by_type: Record<string, { total: number; assigned: number }>;
}

export default function SeatingManagementPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [seatingConfigs, setSeatingConfigs] = useState<SeatingConfig[]>([]);
  const [guestTypes, setGuestTypes] = useState<GuestType[]>([]);
  const [stats, setStats] = useState<SeatingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SeatingConfig | null>(null);
  const [formData, setFormData] = useState({
    seating_type: 'table' as 'table' | 'seat' | 'zone',
    name: '',
    capacity: 10,
    allowed_guest_type_ids: [] as string[],
  });
  const [bulkForm, setBulkForm] = useState({
    prefix: 'Table',
    start_number: 1,
    count: 10,
    capacity: 10,
    seating_type: 'table' as 'table' | 'seat' | 'zone',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      // Fetch seating configs
      const configRes = await fetch(`/api/guestbook/seating?event_id=${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (configRes.ok) {
        const configData = await configRes.json();
        setSeatingConfigs(configData.data || []);
      }

      // Fetch guest types
      const typesRes = await fetch(`/api/guestbook/guest-types?event_id=${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (typesRes.ok) {
        const typesData = await typesRes.json();
        setGuestTypes(typesData.data || []);
      }

      // Fetch stats
      const statsRes = await fetch(`/api/guestbook/seating/stats?event_id=${eventId}`, {
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

  const handleOpenModal = (config?: SeatingConfig) => {
    if (config) {
      setEditingConfig(config);
      setFormData({
        seating_type: config.seating_type,
        name: config.name,
        capacity: config.capacity,
        allowed_guest_type_ids: config.allowed_guest_type_ids || [],
      });
    } else {
      setEditingConfig(null);
      const defaultType = event?.seating_mode === 'table_based' ? 'table' 
        : event?.seating_mode === 'numbered_seat' ? 'seat'
        : event?.seating_mode === 'zone_based' ? 'zone' : 'table';
      
      setFormData({
        seating_type: defaultType,
        name: '',
        capacity: 10,
        allowed_guest_type_ids: [],
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
      const url = editingConfig
        ? `/api/guestbook/seating/${editingConfig.id}`
        : '/api/guestbook/seating';
      
      const method = editingConfig ? 'PUT' : 'POST';
      
      const payload = editingConfig
        ? formData
        : { ...formData, event_id: eventId };

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
        setError(data.error || 'Failed to save seating config');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const token = localStorage.getItem('client_token');

    try {
      const configs = [];
      for (let i = 0; i < bulkForm.count; i++) {
        configs.push({
          seating_type: bulkForm.seating_type,
          name: `${bulkForm.prefix} ${bulkForm.start_number + i}`,
          capacity: bulkForm.capacity,
          allowed_guest_type_ids: [],
          sort_order: i,
        });
      }

      const res = await fetch('/api/guestbook/seating/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ event_id: eventId, configs }),
      });

      const data = await res.json();

      if (data.success) {
        await fetchData();
        setShowBulkModal(false);
      } else {
        setError(data.error || 'Failed to create seating configs');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (configId: string) => {
    if (!confirm('Are you sure you want to delete this seating configuration?')) {
      return;
    }

    const token = localStorage.getItem('client_token');

    try {
      const res = await fetch(`/api/guestbook/seating/${configId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.success) {
        await fetchData();
      } else {
        alert(data.error || 'Failed to delete seating config');
      }
    } catch (err) {
      alert('An error occurred. Please try again.');
    }
  };

  const handleAutoAssign = async () => {
    if (!confirm('Auto-assign guests to available seats? This will override existing assignments.')) {
      return;
    }

    const token = localStorage.getItem('client_token');

    try {
      const res = await fetch('/api/guestbook/seating/auto-assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ event_id: eventId }),
      });

      const data = await res.json();

      if (data.success) {
        alert(`Successfully assigned ${data.data.assigned_count} guests to seats`);
        await fetchData();
      } else {
        alert(data.error || 'Failed to auto-assign');
      }
    } catch (err) {
      alert('An error occurred. Please try again.');
    }
  };

  const getSeatingTypeLabel = (type: string) => {
    switch (type) {
      case 'table': return 'Table';
      case 'seat': return 'Seat';
      case 'zone': return 'Zone';
      default: return type;
    }
  };

  const getSeatingModeLabel = (mode: string) => {
    switch (mode) {
      case 'no_seat': return 'No Seating';
      case 'table_based': return 'Table Based';
      case 'numbered_seat': return 'Numbered Seats';
      case 'zone_based': return 'Zone Based';
      default: return mode;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (event?.seating_mode === 'no_seat') {
    return (
      <div className="p-8">
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Seating Not Enabled</h3>
          <p className="mt-1 text-sm text-gray-500">
            This event is configured with "No Seating" mode. To enable seating, please update the event settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Seating Management</h1>
          <p className="text-gray-600 mt-2">
            Mode: <span className="font-semibold">{getSeatingModeLabel(event?.seating_mode || '')}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowBulkModal(true)}
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Bulk Create
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add {getSeatingTypeLabel(formData.seating_type)}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Capacity</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_capacity}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assigned</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.assigned_seats}</p>
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
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.available_seats}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Assign Button */}
      {seatingConfigs.length > 0 && stats && stats.available_seats > 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-blue-900">Auto-Assign Guests</h3>
              <p className="text-sm text-blue-800 mt-1">
                Automatically assign unassigned guests to available seats based on guest types and capacity.
              </p>
            </div>
            <button
              onClick={handleAutoAssign}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center whitespace-nowrap"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Auto-Assign
            </button>
          </div>
        </div>
      )}

      {/* Seating List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {getSeatingTypeLabel(event?.seating_mode === 'table_based' ? 'table' : event?.seating_mode === 'numbered_seat' ? 'seat' : 'zone')} List
          </h2>
        </div>
        
        {seatingConfigs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restrictions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {seatingConfigs.map((config) => (
                  <tr key={config.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{config.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                        {getSeatingTypeLabel(config.seating_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {config.capacity} seats
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {config.allowed_guest_type_ids.length > 0 ? (
                        <div className="flex gap-1">
                          {config.allowed_guest_type_ids.slice(0, 2).map((typeId) => {
                            const guestType = guestTypes.find(gt => gt.id === typeId);
                            return guestType ? (
                              <span
                                key={typeId}
                                className="px-2 py-1 text-xs font-medium rounded"
                                style={{ backgroundColor: guestType.color_code + '20', color: guestType.color_code }}
                              >
                                {guestType.display_name}
                              </span>
                            ) : null;
                          })}
                          {config.allowed_guest_type_ids.length > 2 && (
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                              +{config.allowed_guest_type_ids.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">All types</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        config.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {config.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenModal(config)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(config.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No seating configured</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating seating configurations.</p>
            <div className="mt-6">
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Seating
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingConfig ? 'Edit Seating' : 'Add Seating'}
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
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.seating_type}
                  onChange={(e) => setFormData({ ...formData, seating_type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!!editingConfig}
                >
                  <option value="table">Table</option>
                  <option value="seat">Seat</option>
                  <option value="zone">Zone</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Table 1, Seat A1, VIP Zone"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Maximum number of guests</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Guest Type Restrictions
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {guestTypes.map((type) => (
                    <label key={type.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.allowed_guest_type_ids.includes(type.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              allowed_guest_type_ids: [...formData.allowed_guest_type_ids, type.id]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              allowed_guest_type_ids: formData.allowed_guest_type_ids.filter(id => id !== type.id)
                            });
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 flex items-center">
                        <span
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: type.color_code }}
                        ></span>
                        {type.display_name}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">Leave empty to allow all guest types</p>
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
                  {isSubmitting ? 'Saving...' : editingConfig ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Create Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Bulk Create</h2>
              <button
                onClick={() => setShowBulkModal(false)}
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

            <form onSubmit={handleBulkCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={bulkForm.seating_type}
                  onChange={(e) => setBulkForm({ ...bulkForm, seating_type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="table">Table</option>
                  <option value="seat">Seat</option>
                  <option value="zone">Zone</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prefix
                </label>
                <input
                  type="text"
                  value={bulkForm.prefix}
                  onChange={(e) => setBulkForm({ ...bulkForm, prefix: e.target.value })}
                  placeholder="e.g., Table, Seat"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={bulkForm.start_number}
                    onChange={(e) => setBulkForm({ ...bulkForm, start_number: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={bulkForm.count}
                    onChange={(e) => setBulkForm({ ...bulkForm, count: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity per {getSeatingTypeLabel(bulkForm.seating_type)}
                </label>
                <input
                  type="number"
                  min="1"
                  value={bulkForm.capacity}
                  onChange={(e) => setBulkForm({ ...bulkForm, capacity: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">
                  <strong>Preview:</strong> Will create {bulkForm.count} {getSeatingTypeLabel(bulkForm.seating_type).toLowerCase()}s:
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {bulkForm.prefix} {bulkForm.start_number}, {bulkForm.prefix} {bulkForm.start_number + 1}, ... {bulkForm.prefix} {bulkForm.start_number + bulkForm.count - 1}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
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
                  {isSubmitting ? 'Creating...' : 'Create All'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
