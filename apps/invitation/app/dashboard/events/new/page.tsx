'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_ENDPOINTS, getAuthToken } from '@/lib/api-config';

type WizardStep = 1 | 2 | 3;

interface EventFormData {
  // Step 1: Event Information
  event_name: string;
  event_date: string;
  event_time: string;
  venue_name: string;
  venue_address: string;
  timezone: string;

  // Step 2: Module Selection
  has_invitation: boolean;
  has_guestbook: boolean;

  // Step 3: Invitation Config
  invitation_rsvp_enabled: boolean;
  invitation_max_guests: number;
  invitation_auto_qr: boolean;

  // Step 3: Guestbook Config
  guestbook_checkin_mode: 'qr_scan' | 'manual' | 'both';
  guestbook_offline_support: boolean;
  guestbook_qr_validation: 'strict' | 'loose';
  guestbook_seating_mode: 'no_seat' | 'table_based' | 'numbered_seat' | 'zone_based';
}

export default function CreateEventWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<EventFormData>({
    event_name: '',
    event_date: '',
    event_time: '',
    venue_name: '',
    venue_address: '',
    timezone: 'Asia/Jakarta',
    has_invitation: true,
    has_guestbook: false,
    invitation_rsvp_enabled: true,
    invitation_max_guests: 2,
    invitation_auto_qr: true,
    guestbook_checkin_mode: 'both',
    guestbook_offline_support: true,
    guestbook_qr_validation: 'strict',
    guestbook_seating_mode: 'table_based',
  });

  const updateFormData = (updates: Partial<EventFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const validateStep1 = (): boolean => {
    if (!formData.event_name.trim()) {
      setError('Nama event wajib diisi');
      return false;
    }
    if (!formData.event_date) {
      setError('Tanggal event wajib diisi');
      return false;
    }
    setError('');
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!formData.has_invitation && !formData.has_guestbook) {
      setError('Pilih minimal 1 modul (Invitation atau Guestbook)');
      return false;
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;

    if (currentStep < 3) {
      setCurrentStep((currentStep + 1) as WizardStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as WizardStep);
      setError('');
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const token = getAuthToken();

      const payload = {
        name: formData.event_name,
        event_date: formData.event_date,
        event_time: formData.event_time || null,
        location: formData.venue_name || null,
        venue_address: formData.venue_address || null,
        timezone: formData.timezone,
        has_invitation: formData.has_invitation,
        has_guestbook: formData.has_guestbook,
        invitation_config: formData.has_invitation ? {
          rsvp_enabled: formData.invitation_rsvp_enabled,
          max_guests_per_invitation: formData.invitation_max_guests,
          auto_generate_qr: formData.invitation_auto_qr,
        } : {},
        guestbook_config: formData.has_guestbook ? {
          checkin_mode: formData.guestbook_checkin_mode,
          offline_support: formData.guestbook_offline_support,
          qr_validation: formData.guestbook_qr_validation,
        } : {},
        seating_mode: formData.has_guestbook ? formData.guestbook_seating_mode : 'no_seat',
      };

      const res = await fetch(API_ENDPOINTS.guestbook.events, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success && data.data) {
        router.push(`/dashboard/events/${data.data.id}/overview`);
      } else {
        setError(data.error || 'Gagal membuat event');
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    padding: '48px 16px',
    fontFamily: 'Segoe UI, sans-serif'
  };

  const wizardContainerStyle = {
    maxWidth: '768px',
    margin: '0 auto'
  };

  const stepIndicatorStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '32px'
  };

  const stepCircleStyle = (active: boolean, completed: boolean) => ({
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    backgroundColor: active || completed ? '#2563eb' : '#e5e7eb',
    color: active || completed ? 'white' : '#9ca3af',
    transition: 'background-color 0.2s'
  });

  const stepLineStyle = (active: boolean) => ({
    height: '4px',
    flex: 1,
    margin: '0 16px',
    backgroundColor: active ? '#2563eb' : '#e5e7eb',
    maxWidth: '100px'
  });

  return (
    <div style={containerStyle}>
      <div style={wizardContainerStyle}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>Buat Event Baru</h1>
          <p style={{ color: '#4b5563', fontSize: '14px' }}>Ikuti langkah-langkah berikut untuk membuat event</p>
        </div>

        {/* Step Indicator */}
        <div style={stepIndicatorStyle}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={stepCircleStyle(currentStep === 1, currentStep > 1)}>
                {currentStep > 1 ? '✓' : '1'}
              </div>
              <span style={{ marginLeft: '8px', fontWeight: '500', display: 'none', color: currentStep >= 1 ? '#2563eb' : '#9ca3af' }}>Informasi Event</span>
            </div>
            <div style={stepLineStyle(currentStep >= 2)}></div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={stepCircleStyle(currentStep === 2, currentStep > 2)}>
                {currentStep > 2 ? '✓' : '2'}
              </div>
            </div>
            <div style={stepLineStyle(currentStep >= 3)}></div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={stepCircleStyle(currentStep === 3, currentStep > 3)}>
                3
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            marginBottom: '24px',
            padding: '16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px'
          }}>
            <p style={{ fontSize: '14px', color: '#991b1b', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Step Content */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb',
          padding: '32px',
          marginBottom: '24px'
        }}>
          {currentStep === 1 && <Step1Content formData={formData} updateFormData={updateFormData} />}
          {currentStep === 2 && <Step2Content formData={formData} updateFormData={updateFormData} />}
          {currentStep === 3 && <Step3Content formData={formData} updateFormData={updateFormData} />}
        </div>

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => router.push('/dashboard')}
            disabled={isSubmitting}
            style={{
              padding: '8px 24px',
              color: '#374151',
              backgroundColor: 'transparent',
              border: 'none',
              fontWeight: '500',
              cursor: 'pointer',
              fontSize: '16px',
              borderRadius: '8px',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            Batal
          </button>

          <div style={{ display: 'flex', gap: '12px' }}>
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                disabled={isSubmitting}
                style={{
                  padding: '8px 24px',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  color: '#374151',
                  borderRadius: '8px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                ← Kembali
              </button>
            )}

            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                style={{
                  padding: '8px 24px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
              >
                Lanjut →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{
                  padding: '8px 24px',
                  backgroundColor: isSubmitting ? '#93c5fd' : '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '500',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  transition: 'background-color 0.2s'
                }}
              >
                {isSubmitting ? 'Membuat...' : 'Buat Event'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helpers styles
const labelStyle = {
  display: 'block',
  fontSize: '14px',
  fontWeight: '500',
  color: '#374151',
  marginBottom: '8px'
};

const inputStyle = {
  width: '100%',
  padding: '8px 16px',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  fontSize: '16px',
  outline: 'none',
  transition: 'border-color 0.2s',
  display: 'block',
  boxSizing: 'border-box' as const
};

// Step 1: Event Information
function Step1Content({ formData, updateFormData }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px', marginTop: 0 }}>Informasi Event</h2>
        <p style={{ fontSize: '14px', color: '#4b5563', margin: 0 }}>Masukkan detail dasar event Anda</p>
      </div>

      <div>
        <label style={labelStyle}>
          Nama Event <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          type="text"
          value={formData.event_name}
          onChange={(e) => updateFormData({ event_name: e.target.value })}
          placeholder="Contoh: Pernikahan Budi & Ani"
          style={inputStyle}
          required
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>
            Tanggal Event <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="date"
            value={formData.event_date}
            onChange={(e) => updateFormData({ event_date: e.target.value })}
            style={inputStyle}
            required
          />
        </div>

        <div>
          <label style={labelStyle}>
            Waktu Event
          </label>
          <input
            type="time"
            value={formData.event_time}
            onChange={(e) => updateFormData({ event_time: e.target.value })}
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>
          Nama Venue
        </label>
        <input
          type="text"
          value={formData.venue_name}
          onChange={(e) => updateFormData({ venue_name: e.target.value })}
          placeholder="Contoh: Gedung Serbaguna"
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>
          Alamat Venue
        </label>
        <textarea
          value={formData.venue_address}
          onChange={(e) => updateFormData({ venue_address: e.target.value })}
          placeholder="Alamat lengkap venue"
          rows={3}
          style={{ ...inputStyle, fontFamily: 'inherit' }}
        />
      </div>

      <div>
        <label style={labelStyle}>
          Timezone
        </label>
        <select
          value={formData.timezone}
          onChange={(e) => updateFormData({ timezone: e.target.value })}
          style={inputStyle}
        >
          <option value="Asia/Jakarta">WIB (Jakarta)</option>
          <option value="Asia/Makassar">WITA (Makassar)</option>
          <option value="Asia/Jayapura">WIT (Jayapura)</option>
        </select>
      </div>
    </div>
  );
}

// Step 2: Module Selection
function Step2Content({ formData, updateFormData }: any) {
  const cardStyle = (selected: boolean) => ({
    border: `2px solid ${selected ? '#3b82f6' : '#e5e7eb'}`,
    borderRadius: '8px',
    padding: '24px',
    cursor: 'pointer',
    backgroundColor: selected ? '#eff6ff' : 'white',
    transition: 'all 0.2s'
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px', marginTop: 0 }}>Pilih Modul Event</h2>
        <p style={{ fontSize: '14px', color: '#4b5563', margin: 0 }}>Pilih fitur yang ingin Anda gunakan (minimal 1)</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        <div
          style={cardStyle(formData.has_invitation)}
          onClick={() => updateFormData({ has_invitation: !formData.has_invitation })}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ fontSize: '32px' }}>📧</div>
            <input
              type="checkbox"
              checked={formData.has_invitation}
              onChange={(e) => updateFormData({ has_invitation: e.target.checked })}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>Invitation</h3>
          <p style={{ fontSize: '14px', color: '#4b5563', margin: '0 0 16px 0' }}>
            Kirim undangan digital, RSVP, dan QR code untuk tamu
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: '14px', color: '#374151' }}>
            <li style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>✓ Design undangan custom</li>
            <li style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>✓ RSVP management</li>
            <li style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>✓ QR code generation</li>
            <li style={{ display: 'flex', alignItems: 'center' }}>✓ Broadcast via WhatsApp</li>
          </ul>
        </div>

        <div
          style={cardStyle(formData.has_guestbook)}
          onClick={() => updateFormData({ has_guestbook: !formData.has_guestbook })}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ fontSize: '32px' }}>📖</div>
            <input
              type="checkbox"
              checked={formData.has_guestbook}
              onChange={(e) => updateFormData({ has_guestbook: e.target.checked })}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>Guestbook</h3>
          <p style={{ fontSize: '14px', color: '#4b5563', margin: '0 0 16px 0' }}>
            Kelola check-in tamu, scan QR, dan seating arrangement
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: '14px', color: '#374151' }}>
            <li style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>✓ QR scan check-in</li>
            <li style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>✓ Guest type management</li>
            <li style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>✓ Seating arrangement</li>
            <li style={{ display: 'flex', alignItems: 'center' }}>✓ Offline support</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Step 3: Configuration
function Step3Content({ formData, updateFormData }: any) {
  const sectionStyle = (bgColor: string) => ({
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '24px',
    backgroundColor: bgColor
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px', marginTop: 0 }}>Konfigurasi Awal</h2>
        <p style={{ fontSize: '14px', color: '#4b5563', margin: 0 }}>Atur preferensi untuk modul yang dipilih</p>
      </div>

      {/* Invitation Configuration */}
      {formData.has_invitation && (
        <div style={sectionStyle('#f3e8ff')}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px', marginTop: 0, display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '24px', marginRight: '8px' }}>📧</span>
            Konfigurasi Invitation
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start' }}>
              <input
                type="checkbox"
                checked={formData.invitation_rsvp_enabled}
                onChange={(e) => updateFormData({ invitation_rsvp_enabled: e.target.checked })}
                style={{ marginTop: '4px', width: '16px', height: '16px' }}
              />
              <div style={{ marginLeft: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#111827', display: 'block' }}>Aktifkan RSVP</span>
                <p style={{ fontSize: '12px', color: '#4b5563', margin: 0 }}>Tamu dapat konfirmasi kehadiran</p>
              </div>
            </label>

            <div>
              <label style={labelStyle}>
                Max Tamu per Undangan
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.invitation_max_guests}
                onChange={(e) => updateFormData({ invitation_max_guests: parseInt(e.target.value) })}
                style={inputStyle}
              />
              <p style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px' }}>Jumlah maksimal tamu yang bisa dibawa</p>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start' }}>
              <input
                type="checkbox"
                checked={formData.invitation_auto_qr}
                onChange={(e) => updateFormData({ invitation_auto_qr: e.target.checked })}
                style={{ marginTop: '4px', width: '16px', height: '16px' }}
              />
              <div style={{ marginLeft: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#111827', display: 'block' }}>Generate QR Code Otomatis</span>
                <p style={{ fontSize: '12px', color: '#4b5563', margin: 0 }}>QR code dibuat saat tamu ditambahkan</p>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Guestbook Configuration */}
      {formData.has_guestbook && (
        <div style={sectionStyle('#dcfce7')}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px', marginTop: 0, display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '24px', marginRight: '8px' }}>📖</span>
            Konfigurasi Guestbook
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>
                Mode Check-in
              </label>
              <select
                value={formData.guestbook_checkin_mode}
                onChange={(e) => updateFormData({ guestbook_checkin_mode: e.target.value })}
                style={inputStyle}
              >
                <option value="qr_scan">QR Scan Only</option>
                <option value="manual">Manual Search Only</option>
                <option value="both">QR Scan & Manual</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>
                Seating Mode
              </label>
              <select
                value={formData.guestbook_seating_mode}
                onChange={(e) => updateFormData({ guestbook_seating_mode: e.target.value })}
                style={inputStyle}
              >
                <option value="no_seat">Tanpa Seat</option>
                <option value="table_based">Table Based (Meja)</option>
                <option value="numbered_seat">Numbered Seat (Kursi Bernomor)</option>
                <option value="zone_based">Zone Based (Area/Zona)</option>
              </select>
              <p style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px' }}>Pilih cara pengaturan tempat duduk</p>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start' }}>
              <input
                type="checkbox"
                checked={formData.guestbook_offline_support}
                onChange={(e) => updateFormData({ guestbook_offline_support: e.target.checked })}
                style={{ marginTop: '4px', width: '16px', height: '16px' }}
              />
              <div style={{ marginLeft: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#111827', display: 'block' }}>Aktifkan Offline Support (PWA)</span>
                <p style={{ fontSize: '12px', color: '#4b5563', margin: 0 }}>Check-in tetap berjalan saat koneksi lambat/offline</p>
              </div>
            </label>

            <div>
              <label style={labelStyle}>
                Validasi QR Code
              </label>
              <select
                value={formData.guestbook_qr_validation}
                onChange={(e) => updateFormData({ guestbook_qr_validation: e.target.value })}
                style={inputStyle}
              >
                <option value="strict">Strict (Ketat)</option>
                <option value="loose">Loose (Longgar)</option>
              </select>
              <p style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px' }}>
                Strict: QR harus valid dan belum digunakan. Loose: Lebih toleran
              </p>
            </div>
          </div>
        </div>
      )}

      {!formData.has_invitation && !formData.has_guestbook && (
        <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
          <p>Pilih minimal 1 modul di langkah sebelumnya</p>
        </div>
      )}
    </div>
  );
}
