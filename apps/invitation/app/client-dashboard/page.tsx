'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Event {
  id: string;
  event_name: string;
  event_date: string;
  event_time?: string;
  venue_name?: string;
  venue_address?: string;
  is_active: boolean;
  created_at: string;
}

// Helper untuk build URL - sekarang menggunakan relative path
const buildUrl = (path: string) => {
  // Gunakan relative path agar otomatis menggunakan origin yang sama
  return path;
};

export default function ClientDashboard() {
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [createForm, setCreateForm] = useState({
      event_name: '',
      event_date: '',
      event_time: '',
      venue_name: '',
      venue_address: ''
    });

    const getAuthToken = useCallback(() => {
      if (typeof window === 'undefined') return null;
      return localStorage.getItem('client_token');
    }, []);

    const fetchEvents = useCallback(async () => {
      const token = getAuthToken();
      if (!token) {
        router.push('/client-dashboard/login');
        return;
      }

      try {
        setIsLoading(true);
        setError('');
        const res = await fetch('/api/guestbook/events', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.status === 401) {
          setError('Sesi berakhir. Silakan login ulang.');
          router.push('/client-dashboard/login');
          return;
        }

        const data = await res.json();
        if (data.success && data.data) {
          setEvents(data.data);
        } else {
          setError(data.error || 'Gagal mengambil data event');
        }
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Gagal mengambil data event. Periksa koneksi Anda.');
      } finally {
        setIsLoading(false);
      }
    }, [getAuthToken, router]);

    const handleCreateEvent = async () => {
      if (!createForm.event_name || !createForm.event_date) {
        alert('Nama event dan tanggal wajib diisi');
        return;
      }

      const token = getAuthToken();
      if (!token) return;

      try {
        setIsCreating(true);
        const res = await fetch('/api/guestbook/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: createForm.event_name,
            event_date: createForm.event_date,
            location: createForm.venue_name,
            options: {
              event_time: createForm.event_time,
              venue_address: createForm.venue_address
            }
          })
        });

        const data = await res.json();
        if (data.success) {
          setShowCreateModal(false);
          setCreateForm({
            event_name: '',
            event_date: '',
            event_time: '',
            venue_name: '',
            venue_address: ''
          });
          fetchEvents();
        } else {
          alert(data.error || 'Gagal membuat event');
        }
      } catch (err) {
        console.error('Error creating event:', err);
        alert('Gagal membuat event');
      } finally {
        setIsCreating(false);
      }
    };

    const handleEventClick = (eventId: string) => {
      // Store selected event in localStorage
      localStorage.setItem('selected_event_id', eventId);
      // Navigate to guestbook with event context
      router.push('/client-dashboard/guestbook');
    };

    useEffect(() => {
      fetchEvents();
    }, [fetchEvents]);

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
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      );
    }

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

        {/* Header */}
        <div style={{
          padding: '32px',
          backgroundColor: '#fff',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 700, color: '#111827' }}>
                Event Management
              </h1>
              <p style={{ marginTop: '8px', marginBottom: 0, color: '#6b7280', fontSize: '16px' }}>
                Pilih event untuk mengelola undangan dan guestbook
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#fff',
                fontWeight: 600,
                fontSize: '15px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1d4ed8';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
              }}
            >
              <span style={{ fontSize: '20px' }}>➕</span>
              Buat Event Baru
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '16px 24px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: '12px',
            color: '#b91c1c',
            fontWeight: 500
          }}>
            {error}
          </div>
        )}

        {/* Events List */}
        {events.length === 0 ? (
          <div style={{
            padding: '64px 24px',
            backgroundColor: '#fff',
            borderRadius: '16px',
            border: '2px dashed #d1d5db',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '80px', marginBottom: '24px' }}>📅</div>
            <h2 style={{ margin: '0 0 12px', fontSize: '24px', fontWeight: 600, color: '#111827' }}>
              Belum Ada Event
            </h2>
            <p style={{ margin: '0 0 24px', color: '#6b7280', fontSize: '16px', lineHeight: 1.6 }}>
              Anda belum memiliki event. Silakan buat event baru atau hubungi admin untuk bantuan.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#fff',
                fontWeight: 600,
                fontSize: '15px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
              }}
            >
              <span style={{ fontSize: '20px' }}>➕</span>
              Buat Event Pertama
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            {events.map(event => (
              <button
                key={event.id}
                onClick={() => handleEventClick(event.id)}
                style={{
                  padding: '24px',
                  borderRadius: '16px',
                  border: '2px solid #e5e7eb',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(37, 99, 235, 0.15)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {!event.is_active && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    fontSize: '12px',
                    fontWeight: 600
                  }}>
                    Inactive
                  </div>
                )}
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
                <h3 style={{
                  margin: '0 0 12px',
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#111827',
                  lineHeight: 1.3
                }}>
                  {event.event_name}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '14px' }}>
                    <span>📅</span>
                    <span>
                      {new Date(event.event_date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  {event.event_time && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '14px' }}>
                      <span>🕐</span>
                      <span>{event.event_time}</span>
                    </div>
                  )}
                  {event.venue_name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '14px' }}>
                      <span>📍</span>
                      <span>{event.venue_name}</span>
                    </div>
                  )}
                </div>
                <div style={{
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid #e5e7eb',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#2563eb'
                }}>
                  Kelola Event →
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Create Event Modal */}
        {showCreateModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <h2 style={{ margin: '0 0 24px', fontSize: '24px', fontWeight: 700, color: '#111827' }}>
                Buat Event Baru
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151', fontSize: '14px' }}>
                    Nama Event *
                  </label>
                  <input
                    type="text"
                    value={createForm.event_name}
                    onChange={(e) => setCreateForm({ ...createForm, event_name: e.target.value })}
                    placeholder="Contoh: Pernikahan Budi & Ani"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151', fontSize: '14px' }}>
                    Tanggal Event *
                  </label>
                  <input
                    type="date"
                    value={createForm.event_date}
                    onChange={(e) => setCreateForm({ ...createForm, event_date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151', fontSize: '14px' }}>
                    Waktu Event
                  </label>
                  <input
                    type="time"
                    value={createForm.event_time}
                    onChange={(e) => setCreateForm({ ...createForm, event_time: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151', fontSize: '14px' }}>
                    Nama Venue
                  </label>
                  <input
                    type="text"
                    value={createForm.venue_name}
                    onChange={(e) => setCreateForm({ ...createForm, venue_name: e.target.value })}
                    placeholder="Contoh: Gedung Serbaguna"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151', fontSize: '14px' }}>
                    Alamat Venue
                  </label>
                  <textarea
                    value={createForm.venue_address}
                    onChange={(e) => setCreateForm({ ...createForm, venue_address: e.target.value })}
                    placeholder="Alamat lengkap venue"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  onClick={() => setShowCreateModal(false)}
                  disabled={isCreating}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#fff',
                    color: '#374151',
                    fontWeight: 600,
                    cursor: isCreating ? 'not-allowed' : 'pointer',
                    opacity: isCreating ? 0.5 : 1
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={handleCreateEvent}
                  disabled={isCreating}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: isCreating ? 'not-allowed' : 'pointer',
                    opacity: isCreating ? 0.5 : 1
                  }}
                >
                  {isCreating ? 'Membuat...' : 'Buat Event'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
}
