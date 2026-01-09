'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
      const token = localStorage.getItem('client_token');
      
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

      const res = await fetch('/api/guestbook/events', {
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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Buat Event Baru</h1>
          <p className="text-gray-600">Ikuti langkah-langkah berikut untuk membuat event</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                {currentStep > 1 ? '✓' : '1'}
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Informasi Event</span>
            </div>
            <div className={`w-16 sm:w-24 h-1 mx-2 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                {currentStep > 2 ? '✓' : '2'}
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Pilih Modul</span>
            </div>
            <div className={`w-16 sm:w-24 h-1 mx-2 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                3
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Konfigurasi</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 mb-6">
          {currentStep === 1 && <Step1Content formData={formData} updateFormData={updateFormData} />}
          {currentStep === 2 && <Step2Content formData={formData} updateFormData={updateFormData} />}
          {currentStep === 3 && <Step3Content formData={formData} updateFormData={updateFormData} />}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium transition"
            disabled={isSubmitting}
          >
            Batal
          </button>
          
          <div className="flex gap-3">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
                disabled={isSubmitting}
              >
                ← Kembali
              </button>
            )}
            
            {currentStep < 3 ? (
              <button 
                onClick={handleNext} 
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
              >
                Lanjut →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
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

// Step 1: Event Information
function Step1Content({ formData, updateFormData }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Informasi Event</h2>
        <p className="text-sm text-gray-600">Masukkan detail dasar event Anda</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nama Event <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.event_name}
          onChange={(e) => updateFormData({ event_name: e.target.value })}
          placeholder="Contoh: Pernikahan Budi & Ani"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tanggal Event <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.event_date}
            onChange={(e) => updateFormData({ event_date: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Waktu Event
          </label>
          <input
            type="time"
            value={formData.event_time}
            onChange={(e) => updateFormData({ event_time: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nama Venue
        </label>
        <input
          type="text"
          value={formData.venue_name}
          onChange={(e) => updateFormData({ venue_name: e.target.value })}
          placeholder="Contoh: Gedung Serbaguna"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Alamat Venue
        </label>
        <textarea
          value={formData.venue_address}
          onChange={(e) => updateFormData({ venue_address: e.target.value })}
          placeholder="Alamat lengkap venue"
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Timezone
        </label>
        <select
          value={formData.timezone}
          onChange={(e) => updateFormData({ timezone: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Pilih Modul Event</h2>
        <p className="text-sm text-gray-600">Pilih fitur yang ingin Anda gunakan (minimal 1)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          className={`border-2 rounded-lg p-6 cursor-pointer transition ${
            formData.has_invitation 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => updateFormData({ has_invitation: !formData.has_invitation })}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="text-4xl">📧</div>
            <input
              type="checkbox"
              checked={formData.has_invitation}
              onChange={(e) => updateFormData({ has_invitation: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded"
            />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Invitation</h3>
          <p className="text-sm text-gray-600 mb-4">
            Kirim undangan digital, RSVP, dan QR code untuk tamu
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Design undangan custom
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              RSVP management
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              QR code generation
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Broadcast via WhatsApp
            </li>
          </ul>
        </div>

        <div
          className={`border-2 rounded-lg p-6 cursor-pointer transition ${
            formData.has_guestbook 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => updateFormData({ has_guestbook: !formData.has_guestbook })}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="text-4xl">📖</div>
            <input
              type="checkbox"
              checked={formData.has_guestbook}
              onChange={(e) => updateFormData({ has_guestbook: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded"
            />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Guestbook</h3>
          <p className="text-sm text-gray-600 mb-4">
            Kelola check-in tamu, scan QR, dan seating arrangement
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              QR scan check-in
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Guest type management
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Seating arrangement
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Staff management
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Offline support
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Step 3: Configuration
function Step3Content({ formData, updateFormData }: any) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Konfigurasi Awal</h2>
        <p className="text-sm text-gray-600">Atur preferensi untuk modul yang dipilih</p>
      </div>

      {/* Invitation Configuration */}
      {formData.has_invitation && (
        <div className="border border-gray-200 rounded-lg p-6 bg-purple-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">📧</span>
            Konfigurasi Invitation
          </h3>
          
          <div className="space-y-4">
            <label className="flex items-start">
              <input
                type="checkbox"
                checked={formData.invitation_rsvp_enabled}
                onChange={(e) => updateFormData({ invitation_rsvp_enabled: e.target.checked })}
                className="mt-1 w-4 h-4 text-blue-600 rounded"
              />
              <div className="ml-3">
                <span className="text-sm font-medium text-gray-900">Aktifkan RSVP</span>
                <p className="text-xs text-gray-600">Tamu dapat konfirmasi kehadiran</p>
              </div>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Tamu per Undangan
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.invitation_max_guests}
                onChange={(e) => updateFormData({ invitation_max_guests: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-600 mt-1">Jumlah maksimal tamu yang bisa dibawa</p>
            </div>

            <label className="flex items-start">
              <input
                type="checkbox"
                checked={formData.invitation_auto_qr}
                onChange={(e) => updateFormData({ invitation_auto_qr: e.target.checked })}
                className="mt-1 w-4 h-4 text-blue-600 rounded"
              />
              <div className="ml-3">
                <span className="text-sm font-medium text-gray-900">Generate QR Code Otomatis</span>
                <p className="text-xs text-gray-600">QR code dibuat saat tamu ditambahkan</p>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Guestbook Configuration */}
      {formData.has_guestbook && (
        <div className="border border-gray-200 rounded-lg p-6 bg-green-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">📖</span>
            Konfigurasi Guestbook
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mode Check-in
              </label>
              <select
                value={formData.guestbook_checkin_mode}
                onChange={(e) => updateFormData({ guestbook_checkin_mode: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="qr_scan">QR Scan Only</option>
                <option value="manual">Manual Search Only</option>
                <option value="both">QR Scan & Manual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seating Mode
              </label>
              <select
                value={formData.guestbook_seating_mode}
                onChange={(e) => updateFormData({ guestbook_seating_mode: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="no_seat">Tanpa Seat</option>
                <option value="table_based">Table Based (Meja)</option>
                <option value="numbered_seat">Numbered Seat (Kursi Bernomor)</option>
                <option value="zone_based">Zone Based (Area/Zona)</option>
              </select>
              <p className="text-xs text-gray-600 mt-1">Pilih cara pengaturan tempat duduk</p>
            </div>

            <label className="flex items-start">
              <input
                type="checkbox"
                checked={formData.guestbook_offline_support}
                onChange={(e) => updateFormData({ guestbook_offline_support: e.target.checked })}
                className="mt-1 w-4 h-4 text-blue-600 rounded"
              />
              <div className="ml-3">
                <span className="text-sm font-medium text-gray-900">Aktifkan Offline Support (PWA)</span>
                <p className="text-xs text-gray-600">Check-in tetap berjalan saat koneksi lambat/offline</p>
              </div>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Validasi QR Code
              </label>
              <select
                value={formData.guestbook_qr_validation}
                onChange={(e) => updateFormData({ guestbook_qr_validation: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="strict">Strict (Ketat)</option>
                <option value="loose">Loose (Longgar)</option>
              </select>
              <p className="text-xs text-gray-600 mt-1">
                Strict: QR harus valid dan belum digunakan. Loose: Lebih toleran
              </p>
            </div>
          </div>
        </div>
      )}

      {!formData.has_invitation && !formData.has_guestbook && (
        <div className="text-center py-8 text-gray-500">
          <p>Pilih minimal 1 modul di langkah sebelumnya</p>
        </div>
      )}
    </div>
  );
}
