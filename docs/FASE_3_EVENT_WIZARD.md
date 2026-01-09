# FASE 3: Event Creation Wizard (3-Step)

## Objective
Implement wizard 3-step untuk create event dengan pilihan modul sesuai UI-FLOW PRD.

## Duration: 3-4 hari

---

## Wizard Flow

### Step 1: Informasi Event
- Nama Event (required)
- Tanggal Event (required)
- Waktu Event (optional)
- Lokasi/Venue (optional)
- Alamat Venue (optional)
- Timezone (default: Asia/Jakarta)

### Step 2: Pilih Modul Event
- ☑ Invitation (checkbox + description)
- ☑ Guestbook (checkbox + description)
- Minimal 1 modul harus dipilih

### Step 3: Konfigurasi Awal
**Jika Invitation dipilih:**
- RSVP aktif/tidak
- Max tamu per undangan
- Generate QR otomatis

**Jika Guestbook dipilih:**
- Mode check-in (QR Scan / Manual / Both)
- Offline support (PWA)
- Validasi QR (Strict / Loose)
- Seating mode (No Seat / Table / Numbered / Zone)

---

## Task 3.1: Create Wizard Component

### File: `apps/invitation/app/dashboard/events/new/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type WizardStep = 1 | 2 | 3;

interface EventFormData {
  // Step 1
  event_name: string;
  event_date: string;
  event_time: string;
  venue_name: string;
  venue_address: string;
  timezone: string;
  
  // Step 2
  has_invitation: boolean;
  has_guestbook: boolean;
  
  // Step 3 - Invitation Config
  invitation_rsvp_enabled: boolean;
  invitation_max_guests: number;
  invitation_auto_qr: boolean;
  
  // Step 3 - Guestbook Config
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
        // Redirect to event overview
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
    <div className="wizard-container">
      <div className="wizard-header">
        <h1>Buat Event Baru</h1>
        <p>Ikuti langkah-langkah berikut untuk membuat event</p>
      </div>

      {/* Step Indicator */}
      <div className="step-indicator">
        <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-label">Informasi Event</div>
        </div>
        <div className="step-line"></div>
        <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">Pilih Modul</div>
        </div>
        <div className="step-line"></div>
        <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-label">Konfigurasi</div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Step Content */}
      <div className="wizard-content">
        {currentStep === 1 && <Step1Content formData={formData} updateFormData={updateFormData} />}
        {currentStep === 2 && <Step2Content formData={formData} updateFormData={updateFormData} />}
        {currentStep === 3 && <Step3Content formData={formData} updateFormData={updateFormData} />}
      </div>

      {/* Navigation Buttons */}
      <div className="wizard-actions">
        <button
          onClick={() => router.push('/dashboard')}
          className="btn-cancel"
          disabled={isSubmitting}
        >
          Batal
        </button>
        
        <div className="btn-group">
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="btn-back"
              disabled={isSubmitting}
            >
              ← Kembali
            </button>
          )}
          
          {currentStep < 3 ? (
            <button onClick={handleNext} className="btn-next">
              Lanjut →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Membuat...' : 'Buat Event'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Step 1: Event Information
function Step1Content({ formData, updateFormData }: any) {
  return (
    <div className="step-content">
      <h2>Informasi Event</h2>
      <p className="step-description">Masukkan detail dasar event Anda</p>

      <div className="form-group">
        <label>Nama Event *</label>
        <input
          type="text"
          value={formData.event_name}
          onChange={(e) => updateFormData({ event_name: e.target.value })}
          placeholder="Contoh: Pernikahan Budi & Ani"
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Tanggal Event *</label>
          <input
            type="date"
            value={formData.event_date}
            onChange={(e) => updateFormData({ event_date: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Waktu Event</label>
          <input
            type="time"
            value={formData.event_time}
            onChange={(e) => updateFormData({ event_time: e.target.value })}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Nama Venue</label>
        <input
          type="text"
          value={formData.venue_name}
          onChange={(e) => updateFormData({ venue_name: e.target.value })}
          placeholder="Contoh: Gedung Serbaguna"
        />
      </div>

      <div className="form-group">
        <label>Alamat Venue</label>
        <textarea
          value={formData.venue_address}
          onChange={(e) => updateFormData({ venue_address: e.target.value })}
          placeholder="Alamat lengkap venue"
          rows={3}
        />
      </div>

      <div className="form-group">
        <label>Timezone</label>
        <select
          value={formData.timezone}
          onChange={(e) => updateFormData({ timezone: e.target.value })}
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
    <div className="step-content">
      <h2>Pilih Modul Event</h2>
      <p className="step-description">Pilih fitur yang ingin Anda gunakan (minimal 1)</p>

      <div className="module-cards">
        <div
          className={`module-card ${formData.has_invitation ? 'selected' : ''}`}
          onClick={() => updateFormData({ has_invitation: !formData.has_invitation })}
        >
          <div className="module-checkbox">
            <input
              type="checkbox"
              checked={formData.has_invitation}
              onChange={(e) => updateFormData({ has_invitation: e.target.checked })}
            />
          </div>
          <div className="module-icon">📧</div>
          <h3>Invitation</h3>
          <p>Kirim undangan digital, RSVP, dan QR code untuk tamu</p>
          <ul className="module-features">
            <li>✓ Design undangan custom</li>
            <li>✓ RSVP management</li>
            <li>✓ QR code generation</li>
            <li>✓ Broadcast via WhatsApp</li>
          </ul>
        </div>

        <div
          className={`module-card ${formData.has_guestbook ? 'selected' : ''}`}
          onClick={() => updateFormData({ has_guestbook: !formData.has_guestbook })}
        >
          <div className="module-checkbox">
            <input
              type="checkbox"
              checked={formData.has_guestbook}
              onChange={(e) => updateFormData({ has_guestbook: e.target.checked })}
            />
          </div>
          <div className="module-icon">📖</div>
          <h3>Guestbook</h3>
          <p>Kelola check-in tamu, scan QR, dan seating arrangement</p>
          <ul className="module-features">
            <li>✓ QR scan check-in</li>
            <li>✓ Guest type management</li>
            <li>✓ Seating arrangement</li>
            <li>✓ Staff management</li>
            <li>✓ Offline support</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Step 3: Configuration
function Step3Content({ formData, updateFormData }: any) {
  return (
    <div className="step-content">
      <h2>Konfigurasi Awal</h2>
      <p className="step-description">Atur preferensi untuk modul yang dipilih</p>

      {/* Invitation Configuration */}
      {formData.has_invitation && (
        <div className="config-section">
          <h3>📧 Konfigurasi Invitation</h3>
          
          <div className="form-group-inline">
            <label>
              <input
                type="checkbox"
                checked={formData.invitation_rsvp_enabled}
                onChange={(e) => updateFormData({ invitation_rsvp_enabled: e.target.checked })}
              />
              <span>Aktifkan RSVP</span>
            </label>
            <p className="help-text">Tamu dapat konfirmasi kehadiran</p>
          </div>

          <div className="form-group">
            <label>Max Tamu per Undangan</label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.invitation_max_guests}
              onChange={(e) => updateFormData({ invitation_max_guests: parseInt(e.target.value) })}
            />
            <p className="help-text">Jumlah maksimal tamu yang bisa dibawa</p>
          </div>

          <div className="form-group-inline">
            <label>
              <input
                type="checkbox"
                checked={formData.invitation_auto_qr}
                onChange={(e) => updateFormData({ invitation_auto_qr: e.target.checked })}
              />
              <span>Generate QR Code Otomatis</span>
            </label>
          </div>
        </div>
      )}

      {/* Guestbook Configuration */}
      {formData.has_guestbook && (
        <div className="config-section">
          <h3>📖 Konfigurasi Guestbook</h3>
          
          <div className="form-group">
            <label>Mode Check-in</label>
            <select
              value={formData.guestbook_checkin_mode}
              onChange={(e) => updateFormData({ guestbook_checkin_mode: e.target.value })}
            >
              <option value="qr_scan">QR Scan Only</option>
              <option value="manual">Manual Search Only</option>
              <option value="both">QR Scan & Manual</option>
            </select>
          </div>

          <div className="form-group">
            <label>Seating Mode</label>
            <select
              value={formData.guestbook_seating_mode}
              onChange={(e) => updateFormData({ guestbook_seating_mode: e.target.value })}
            >
              <option value="no_seat">Tanpa Seat</option>
              <option value="table_based">Table Based (Meja)</option>
              <option value="numbered_seat">Numbered Seat (Kursi Bernomor)</option>
              <option value="zone_based">Zone Based (Area/Zona)</option>
            </select>
            <p className="help-text">Pilih cara pengaturan tempat duduk</p>
          </div>

          <div className="form-group-inline">
            <label>
              <input
                type="checkbox"
                checked={formData.guestbook_offline_support}
                onChange={(e) => updateFormData({ guestbook_offline_support: e.target.checked })}
              />
              <span>Aktifkan Offline Support (PWA)</span>
            </label>
            <p className="help-text">Check-in tetap berjalan saat koneksi lambat/offline</p>
          </div>

          <div className="form-group">
            <label>Validasi QR Code</label>
            <select
              value={formData.guestbook_qr_validation}
              onChange={(e) => updateFormData({ guestbook_qr_validation: e.target.value })}
            >
              <option value="strict">Strict (Ketat)</option>
              <option value="loose">Loose (Longgar)</option>
            </select>
            <p className="help-text">Strict: QR harus valid dan belum digunakan. Loose: Lebih toleran</p>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Task 3.2: Update Event Repository

### File: `apps/invitation/lib/guestbook/repositories/eventRepository.ts`

Add new function:

```typescript
export async function createEventWithModules(
  clientId: string,
  eventData: {
    name: string;
    event_date: string;
    event_time?: string | null;
    location?: string | null;
    venue_address?: string | null;
    timezone?: string;
    has_invitation: boolean;
    has_guestbook: boolean;
    invitation_config?: any;
    guestbook_config?: any;
    seating_mode?: string;
  }
): Promise<Event | null> {
  const supabase = getSupabaseServiceClient();

  const insertData: any = {
    client_id: clientId,
    event_name: eventData.name,
    event_date: eventData.event_date,
    event_time: eventData.event_time,
    venue_name: eventData.location,
    venue_address: eventData.venue_address,
    is_active: true,
    has_invitation: eventData.has_invitation,
    has_guestbook: eventData.has_guestbook,
    invitation_config: eventData.invitation_config || {},
    guestbook_config: eventData.guestbook_config || {},
    seating_mode: eventData.seating_mode || 'no_seat',
    staff_quota: 5,
    staff_quota_used: 0,
  };

  const { data, error } = await supabase
    .from('events')
    .insert(insertData)
    .select()
    .single();

  if (error || !data) {
    console.error('Error creating event:', error);
    return null;
  }

  // Default guest types will be auto-created by trigger
  // (see FASE 1 migration script)

  return data as Event;
}
```

---

## Task 3.3: Update API Route

### File: `apps/invitation/app/api/guestbook/events/route.ts`

Update POST handler:

```typescript
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Token tidak valid' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyClientToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Token tidak valid' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      event_date,
      event_time,
      location,
      venue_address,
      timezone,
      has_invitation,
      has_guestbook,
      invitation_config,
      guestbook_config,
      seating_mode,
    } = body;

    // Validation
    if (!name || !event_date) {
      return NextResponse.json(
        { success: false, error: 'Nama dan tanggal event wajib diisi' },
        { status: 400 }
      );
    }

    if (!has_invitation && !has_guestbook) {
      return NextResponse.json(
        { success: false, error: 'Pilih minimal 1 modul' },
        { status: 400 }
      );
    }

    const event = await createEventWithModules(payload.client_id, {
      name,
      event_date,
      event_time,
      location,
      venue_address,
      timezone,
      has_invitation,
      has_guestbook,
      invitation_config,
      guestbook_config,
      seating_mode,
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Gagal membuat event' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
```

---

## Task 3.4: Add Styling

### File: `apps/invitation/app/dashboard/events/new/styles.css`

```css
.wizard-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

.wizard-header {
  text-align: center;
  margin-bottom: 40px;
}

.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40px;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  transition: all 0.3s;
}

.step.active .step-number {
  background: #2563eb;
  color: white;
}

.step.completed .step-number {
  background: #10b981;
  color: white;
}

.step-line {
  width: 100px;
  height: 2px;
  background: #e5e7eb;
  margin: 0 16px;
}

.module-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 24px;
}

.module-card {
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.module-card:hover {
  border-color: #2563eb;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
}

.module-card.selected {
  border-color: #2563eb;
  background: #eff6ff;
}

.module-checkbox {
  position: absolute;
  top: 16px;
  right: 16px;
}

.module-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.wizard-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 40px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.btn-group {
  display: flex;
  gap: 12px;
}
```

---

## Validation Checklist

- [ ] Wizard UI created with 3 steps
- [ ] Step indicator shows progress
- [ ] Step 1 validates required fields
- [ ] Step 2 validates at least 1 module selected
- [ ] Step 3 shows conditional config based on modules
- [ ] Form submission creates event with modules
- [ ] Default guest types auto-created (via trigger)
- [ ] Redirect to event overview after creation
- [ ] Error handling works
- [ ] Responsive design

---

## Next Steps
After FASE 3 complete, proceed to FASE 4: Guest Type & Benefit Management
