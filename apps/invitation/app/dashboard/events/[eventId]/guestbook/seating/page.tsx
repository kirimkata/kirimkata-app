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

  const buttonStyle = (variant: 'primary' | 'secondary' | 'danger' | 'outline' | 'text') => {
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
        return { ...base, backgroundColor: 'transparent', color: '#dc2626', padding: '4px 8px' };
      case 'outline':
        return { ...base, backgroundColor: 'white', border: '1px solid #2563eb', color: '#2563eb' };
      case 'text':
        return { ...base, backgroundColor: 'transparent', color: '#2563eb', padding: '4px 8px' };
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
    borderBottom: '1px solid #e5e7eb',
    whiteSpace: 'nowrap' as const
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

  if (event?.seating_mode === 'no_seat') {
    return (
      <div style={{ padding: '32px' }}>
        <div style={{
          textAlign: 'center',
          padding: '48px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '2px dashed #d1d5db'
        }}>
          <svg style={{ margin: '0 auto', width: '48px', height: '48px', color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 style={{ marginTop: '8px', fontSize: '14px', fontWeight: '500', color: '#111827' }}>Seating Not Enabled</h3>
          <p style={{ marginTop: '4px', fontSize: '14px', color: '#6b7280' }}>
            This event is configured with "No Seating" mode. To enable seating, please update the event settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Seating Management</h1>
          <p style={{ color: '#4b5563', marginTop: '8px', margin: 0 }}>
            Mode: <span style={{ fontWeight: '600' }}>{getSeatingModeLabel(event?.seating_mode || '')}</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowBulkModal(true)}
            style={buttonStyle('outline')}
          >
            <svg style={{ width: '20px', height: '20px', marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Bulk Create
          </button>
          <button
            onClick={() => handleOpenModal()}
            style={buttonStyle('primary')}
          >
            <svg style={{ width: '20px', height: '20px', marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add {getSeatingTypeLabel(formData.seating_type)}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: '500', color: '#4b5563', margin: 0 }}>Total Capacity</p>
                <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginTop: '8px', margin: 0 }}>{stats.total_capacity}</p>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#eff6ff', borderRadius: '8px' }}>
                <svg style={{ width: '32px', height: '32px', color: '#2563eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: '500', color: '#4b5563', margin: 0 }}>Assigned</p>
                <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginTop: '8px', margin: 0 }}>{stats.assigned_seats}</p>
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
                <p style={{ fontSize: '14px', fontWeight: '500', color: '#4b5563', margin: 0 }}>Available</p>
                <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginTop: '8px', margin: 0 }}>{stats.available_seats}</p>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#fff7ed', borderRadius: '8px' }}>
                <svg style={{ width: '32px', height: '32px', color: '#ea580c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Assign Button */}
      {seatingConfigs.length > 0 && stats && stats.available_seats > 0 && (
        <div style={{ marginBottom: '24px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1e3a8a', margin: 0 }}>Auto-Assign Guests</h3>
              <p style={{ fontSize: '14px', color: '#1e40af', marginTop: '4px', margin: 0 }}>
                Automatically assign unassigned guests to available seats based on guest types and capacity.
              </p>
            </div>
            <button
              onClick={handleAutoAssign}
              style={{ ...buttonStyle('primary'), whiteSpace: 'nowrap' }}
            >
              <svg style={{ width: '20px', height: '20px', marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Auto-Assign
            </button>
          </div>
        </div>
      )}

      {/* Seating List */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
            {getSeatingTypeLabel(event?.seating_mode === 'table_based' ? 'table' : event?.seating_mode === 'numbered_seat' ? 'seat' : 'zone')} List
          </h2>
        </div>

        {seatingConfigs.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Capacity</th>
                  <th style={thStyle}>Restrictions</th>
                  <th style={thStyle}>Status</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody style={{ backgroundColor: 'white' }}>
                {seatingConfigs.map((config) => (
                  <tr key={config.id} style={{ borderBottom: '1px solid #e5e7eb', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={tdStyle}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{config.name}</div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ padding: '2px 8px', fontSize: '12px', fontWeight: '500', backgroundColor: '#f3f4f6', color: '#1f2937', borderRadius: '4px' }}>
                        {getSeatingTypeLabel(config.seating_type)}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: '14px', color: '#111827' }}>{config.capacity} seats</div>
                    </td>
                    <td style={tdStyle}>
                      {config.allowed_guest_type_ids.length > 0 ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {config.allowed_guest_type_ids.slice(0, 2).map((typeId) => {
                            const guestType = guestTypes.find(gt => gt.id === typeId);
                            return guestType ? (
                              <span
                                key={typeId}
                                style={{
                                  padding: '2px 8px',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  borderRadius: '4px',
                                  backgroundColor: guestType.color_code + '20',
                                  color: guestType.color_code
                                }}
                              >
                                {guestType.display_name}
                              </span>
                            ) : null;
                          })}
                          {config.allowed_guest_type_ids.length > 2 && (
                            <span style={{ padding: '2px 8px', fontSize: '12px', fontWeight: '500', backgroundColor: '#f3f4f6', color: '#4b5563', borderRadius: '4px' }}>
                              +{config.allowed_guest_type_ids.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>All types</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '2px 8px',
                        fontSize: '12px',
                        fontWeight: '500',
                        borderRadius: '4px',
                        backgroundColor: config.is_active ? '#dcfce7' : '#f3f4f6',
                        color: config.is_active ? '#166534' : '#1f2937'
                      }}>
                        {config.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={() => handleOpenModal(config)}
                          style={buttonStyle('text')}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(config.id)}
                          style={buttonStyle('danger')}
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
            <svg style={{ margin: '0 auto', marginBottom: '8px', width: '48px', height: '48px', color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>No seating configured</h3>
            <p style={{ marginTop: '4px', fontSize: '14px', color: '#6b7280' }}>Get started by creating seating configurations.</p>
            <div style={{ marginTop: '24px' }}>
              <button
                onClick={() => handleOpenModal()}
                style={buttonStyle('primary')}
              >
                <svg style={{ width: '20px', height: '20px', marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', width: '100%', maxWidth: '448px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                {editingConfig ? 'Edit Seating' : 'Add Seating'}
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
                  Type <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={formData.seating_type}
                  onChange={(e) => setFormData({ ...formData, seating_type: e.target.value as any })}
                  style={inputStyle}
                  disabled={!!editingConfig}
                >
                  <option value="table">Table</option>
                  <option value="seat">Seat</option>
                  <option value="zone">Zone</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>
                  Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Table 1, Seat A1, VIP Zone"
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Capacity <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  style={inputStyle}
                  required
                />
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Maximum number of guests</p>
              </div>

              <div>
                <label style={labelStyle}>
                  Guest Type Restrictions
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px' }}>
                  {guestTypes.map((type) => (
                    <label key={type.id} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
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
                        style={{ width: '16px', height: '16px', accentColor: '#2563eb', marginRight: '8px' }}
                      />
                      <span style={{ fontSize: '14px', color: '#374151', display: 'flex', alignItems: 'center' }}>
                        <span
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: type.color_code,
                            marginRight: '8px'
                          }}
                        ></span>
                        {type.display_name}
                      </span>
                    </label>
                  ))}
                </div>
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Leave empty to allow all guest types</p>
              </div>

              <div style={{ display: 'flex', gap: '12px', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ ...buttonStyle('secondary'), flex: 1 }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ ...buttonStyle('primary'), flex: 1, opacity: isSubmitting ? 0.5 : 1 }}
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
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', width: '100%', maxWidth: '448px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Bulk Create</h2>
              <button
                onClick={() => setShowBulkModal(false)}
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

            <form onSubmit={handleBulkCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>
                  Type
                </label>
                <select
                  value={bulkForm.seating_type}
                  onChange={(e) => setBulkForm({ ...bulkForm, seating_type: e.target.value as any })}
                  style={inputStyle}
                >
                  <option value="table">Table</option>
                  <option value="seat">Seat</option>
                  <option value="zone">Zone</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>
                  Prefix
                </label>
                <input
                  type="text"
                  value={bulkForm.prefix}
                  onChange={(e) => setBulkForm({ ...bulkForm, prefix: e.target.value })}
                  placeholder="e.g., Table, Seat"
                  style={inputStyle}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>
                    Start Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={bulkForm.start_number}
                    onChange={(e) => setBulkForm({ ...bulkForm, start_number: parseInt(e.target.value) })}
                    style={inputStyle}
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={bulkForm.count}
                    onChange={(e) => setBulkForm({ ...bulkForm, count: parseInt(e.target.value) })}
                    style={inputStyle}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>
                  Capacity per {getSeatingTypeLabel(bulkForm.seating_type)}
                </label>
                <input
                  type="number"
                  min="1"
                  value={bulkForm.capacity}
                  onChange={(e) => setBulkForm({ ...bulkForm, capacity: parseInt(e.target.value) })}
                  style={inputStyle}
                  required
                />
              </div>

              <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '12px' }}>
                <p style={{ fontSize: '14px', color: '#374151', margin: 0 }}>
                  <strong style={{ fontWeight: '600' }}>Preview:</strong> Will create {bulkForm.count} {getSeatingTypeLabel(bulkForm.seating_type).toLowerCase()}s:
                </p>
                <p style={{ fontSize: '14px', color: '#4b5563', marginTop: '4px' }}>
                  {bulkForm.prefix} {bulkForm.start_number}, {bulkForm.prefix} {bulkForm.start_number + 1}, ... {bulkForm.prefix} {bulkForm.start_number + bulkForm.count - 1}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  style={{ ...buttonStyle('secondary'), flex: 1 }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ ...buttonStyle('primary'), flex: 1, opacity: isSubmitting ? 0.5 : 1 }}
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
