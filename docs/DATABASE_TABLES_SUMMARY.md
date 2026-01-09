# Ringkasan Tabel Database - Invitation & Guestbook System

## Overview
Sistem terdiri dari 2 aplikasi terintegrasi:
1. **Invitation App**: Mengelola undangan digital, konten, dan daftar tamu
2. **Guestbook App**: Mengelola check-in, redemption, dan staff management untuk event

---

## Tabel Existing (dari database-schema.md)

### 1. `admins`
**Fungsi**: Menyimpan kredensial admin internal untuk mengelola sistem
- Admin dapat CRUD data clients dan konten
- Tidak memiliki FK langsung ke tabel lain
- Password terenkripsi dengan AES/Bcrypt

**Kolom Utama**:
- `id` (uuid, PK)
- `username` (varchar, unique)
- `password_encrypted` (text)
- `email` (varchar, nullable)
- `created_at`, `updated_at` (timestamp)

---

### 2. `clients`
**Fungsi**: Data akun client/pengguna yang membuat undangan dan menggunakan guestbook
- Setiap client memiliki kuota upload media (foto, musik, video)
- Field `guestbook_access` menentukan apakah client bisa akses fitur guestbook
- Memiliki slug unik untuk URL undangan

**Kolom Utama**:
- `id` (uuid, PK)
- `username` (varchar, unique)
- `password_encrypted` (text)
- `email` (varchar, nullable)
- `slug` (varchar, unique, nullable) - FK ke `invitation_contents.slug`
- `quota_photos` (integer, default 10)
- `quota_music` (integer, default 1)
- `quota_videos` (integer, default 1)
- `message_template` (text, nullable)
- `guestbook_access` (boolean, default false)
- `created_at`, `updated_at` (timestamp)

**Relasi**:
- 1:1 dengan `invitation_contents` via `slug`
- 1:N dengan `client_media`
- 1:N dengan `invitation_guests`
- 1:N dengan `guestbook_staff` (new)
- 1:N dengan `events` (new)

---

### 3. `invitation_contents`
**Fungsi**: Menyimpan konten undangan digital (profil pasangan, event, galeri, dll)
- Data dalam format JSONB untuk fleksibilitas
- Dirender oleh Next.js invitation app berdasarkan slug

**Kolom Utama**:
- `id` (uuid, PK)
- `slug` (text, unique)
- `client_profile` (jsonb)
- `bride` (jsonb) - data mempelai wanita
- `groom` (jsonb) - data mempelai pria
- `event` (jsonb) - detail acara
- `clouds` (jsonb)
- `event_cloud` (jsonb)
- `love_story` (jsonb)
- `gallery` (jsonb)
- `wedding_gift` (jsonb)
- `closing` (jsonb)
- `background_music` (jsonb, nullable)
- `custom_images` (jsonb, nullable)
- `theme_key` (text, default 'parallax/parallax-custom1')
- `created_at`, `updated_at` (timestamptz)

---

### 4. `client_media`
**Fungsi**: Metadata file yang diunggah client (foto galeri, musik, video)
- Menyimpan URL file di storage (R2/S3)
- Digunakan untuk render galeri di undangan

**Kolom Utama**:
- `id` (serial, PK)
- `client_id` (uuid, FK ke `clients.id`, cascade delete)
- `file_name` (varchar)
- `file_url` (text)
- `file_type` (varchar) - 'music', 'photo', 'video'
- `file_size` (integer) - dalam byte
- `mime_type` (varchar)
- `uploaded_at` (timestamptz)

---

### 5. `invitation_guests`
**Fungsi**: Daftar tamu yang menerima undangan dan akan di-check-in di guestbook
- Single source of truth untuk data tamu
- Digunakan oleh invitation app untuk kirim undangan
- Digunakan oleh guestbook app untuk check-in

**Kolom Utama**:
- `id` (uuid, PK)
- `client_id` (uuid, FK ke `clients.id`, cascade delete)
- `name` (varchar)
- `phone` (varchar) - nomor WhatsApp/telepon
- `sent` (boolean, default false) - status kirim undangan
- `created_at`, `updated_at` (timestamptz)

**Kolom Tambahan untuk Guestbook** (perlu ditambahkan):
- `event_id` (uuid, FK ke `events.id`) - untuk multi-event support
- `guest_code` (varchar, unique) - kode unik tamu
- `qr_code` (text) - QR code untuk check-in
- `guest_type_id` (uuid, FK ke `guest_types.id`) - REGULAR/VIP/VVIP
- `source` (varchar) - 'registered' atau 'walkin'
- `max_companions` (integer, default 0)
- `actual_companions` (integer, default 0)
- `table_number` (integer, nullable)
- `seat_number` (varchar, nullable)
- `seating_area` (varchar, nullable)
- `is_checked_in` (boolean, default false)
- `checked_in_at` (timestamptz, nullable)
- `notes` (text, nullable)

---

## Tabel Baru untuk Guestbook System

### 6. `events`
**Fungsi**: Mengelola multiple events per client (wedding, reception, etc)
- Satu client bisa punya banyak event
- Setiap event punya staff dan tamu sendiri

**Kolom**:
- `id` (uuid, PK)
- `client_id` (uuid, FK ke `clients.id`, cascade delete)
- `event_name` (varchar) - nama event
- `event_date` (date)
- `event_time` (time, nullable)
- `venue_name` (varchar, nullable)
- `venue_address` (text, nullable)
- `is_active` (boolean, default true)
- `created_at`, `updated_at` (timestamptz)

---

### 7. `guest_types`
**Fungsi**: Kategori tamu dengan benefit berbeda (REGULAR, VIP, VVIP)
- Menentukan entitlement tamu (souvenir, snack, VIP lounge)

**Kolom**:
- `id` (uuid, PK)
- `client_id` (uuid, FK ke `clients.id`, cascade delete)
- `type_name` (varchar) - 'REGULAR', 'VIP', 'VVIP'
- `display_name` (varchar) - nama tampilan
- `color_code` (varchar) - untuk UI (green/gold/purple)
- `priority_order` (integer) - urutan prioritas
- `created_at` (timestamptz)

---

### 8. `guest_type_benefits`
**Fungsi**: Benefit yang dimiliki setiap guest type
- Relasi M:N antara guest_types dan benefits

**Kolom**:
- `id` (uuid, PK)
- `guest_type_id` (uuid, FK ke `guest_types.id`, cascade delete)
- `benefit_type` (varchar) - 'SOUVENIR', 'SNACK', 'VIP_LOUNGE'
- `quantity` (integer) - jumlah yang berhak
- `description` (text, nullable)
- `created_at` (timestamptz)

---

### 9. `guestbook_staff`
**Fungsi**: Staff yang mengelola operasional guestbook (check-in, redemption)
- Permission-based access control
- Setiap client punya kuota staff

**Kolom**:
- `id` (uuid, PK)
- `client_id` (uuid, FK ke `clients.id`, cascade delete)
- `event_id` (uuid, FK ke `events.id`, nullable, cascade delete)
- `username` (varchar) - unique per client
- `password_encrypted` (text)
- `full_name` (varchar)
- `phone` (varchar, nullable)
- `can_checkin` (boolean, default false)
- `can_redeem_souvenir` (boolean, default false)
- `can_redeem_snack` (boolean, default false)
- `can_access_vip_lounge` (boolean, default false)
- `is_active` (boolean, default true)
- `created_at`, `updated_at` (timestamptz)

**Constraint**: UNIQUE (`client_id`, `username`)

---

### 10. `guestbook_checkins`
**Fungsi**: Record check-in tamu di event
- Audit trail siapa check-in kapan
- Menyimpan method check-in (QR/manual)

**Kolom**:
- `id` (uuid, PK)
- `guest_id` (uuid, FK ke `invitation_guests.id`, cascade delete)
- `staff_id` (uuid, FK ke `guestbook_staff.id`, nullable, set null)
- `checked_in_at` (timestamptz, default now())
- `checkin_method` (varchar) - 'QR_SCAN' atau 'MANUAL_SEARCH'
- `device_info` (jsonb, nullable) - user agent, IP, dll
- `notes` (text, nullable)
- `created_at` (timestamptz)

**Constraint**: UNIQUE (`guest_id`) - prevent duplicate check-in

---

### 11. `guestbook_redemptions`
**Fungsi**: Record pengambilan souvenir/snack/VIP lounge access
- Tracking quantity yang diambil
- Audit trail redemption

**Kolom**:
- `id` (uuid, PK)
- `guest_id` (uuid, FK ke `invitation_guests.id`, cascade delete)
- `staff_id` (uuid, FK ke `guestbook_staff.id`, nullable, set null)
- `entitlement_type` (varchar) - 'SOUVENIR', 'SNACK', 'VIP_LOUNGE'
- `quantity` (integer, default 1)
- `redeemed_at` (timestamptz, default now())
- `notes` (text, nullable)
- `created_at` (timestamptz)

---

### 12. `staff_logs`
**Fungsi**: Audit log untuk semua aksi staff
- Tracking siapa melakukan apa kapan
- Untuk accountability dan debugging

**Kolom**:
- `id` (uuid, PK)
- `staff_id` (uuid, FK ke `guestbook_staff.id`, cascade delete)
- `guest_id` (uuid, FK ke `invitation_guests.id`, nullable, cascade delete)
- `action_type` (varchar) - 'checkin', 'redeem', 'update_guest', dll
- `action_details` (jsonb, nullable) - detail aksi
- `notes` (text, nullable)
- `created_at` (timestamptz)

---

### 13. `client_staff_quota`
**Fungsi**: Mengelola kuota staff per client
- Enforce limit berapa staff yang bisa dibuat
- Auto-increment/decrement via trigger

**Kolom**:
- `id` (uuid, PK)
- `client_id` (uuid, FK ke `clients.id`, unique, cascade delete)
- `max_staff` (integer, default 10)
- `staff_used` (integer, default 0)
- `created_at`, `updated_at` (timestamptz)

---

## Diagram Relasi

```
┌─────────────┐
│   admins    │ (internal admin panel)
└─────────────┘

┌─────────────────────────────────────────────────────────────┐
│                          clients                             │
│  - guestbook_access (boolean)                               │
│  - quota_photos, quota_music, quota_videos                  │
│  - slug (FK to invitation_contents)                         │
└──────────────┬──────────────────────────────────────────────┘
               │
       ┌───────┴────────┬──────────────┬─────────────┬────────────┐
       │                │              │             │            │
       ▼                ▼              ▼             ▼            ▼
┌──────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ invitation_  │  │  client_ │  │  events  │  │guestbook_│  │  client_ │
│  contents    │  │  media   │  │          │  │  staff   │  │  staff_  │
│ (JSONB data) │  │ (files)  │  │          │  │          │  │  quota   │
└──────────────┘  └──────────┘  └────┬─────┘  └────┬─────┘  └──────────┘
                                     │             │
                                     │             │
                              ┌──────┴─────────────┴──────┐
                              │                           │
                              ▼                           ▼
                     ┌──────────────────┐        ┌──────────────┐
                     │ invitation_guests│◄───────│ guest_types  │
                     │ (tamu + checkin) │        │ (REGULAR/VIP)│
                     └────┬─────────────┘        └──────┬───────┘
                          │                             │
                    ┌─────┴──────┬──────────────────────┘
                    │            │
                    ▼            ▼
           ┌────────────────┐  ┌──────────────────┐
           │  guestbook_    │  │  guest_type_     │
           │   checkins     │  │   benefits       │
           └────────────────┘  └──────────────────┘
                    │
                    ▼
           ┌────────────────┐
           │  guestbook_    │
           │  redemptions   │
           └────────────────┘
                    │
                    ▼
           ┌────────────────┐
           │  staff_logs    │
           │  (audit trail) │
           └────────────────┘
```

---

## Trigger & Functions yang Dibutuhkan

### 1. `update_updated_at_column()`
Fungsi generic untuk update `updated_at` timestamp

### 2. `update_admins_updated_at()`
Trigger untuk tabel `admins`

### 3. `update_clients_updated_at()`
Trigger untuk tabel `clients`

### 4. `enforce_staff_quota()`
Trigger untuk enforce kuota staff saat insert ke `guestbook_staff`

### 5. `increment_staff_quota()`
Trigger untuk increment `staff_used` saat staff dibuat

### 6. `decrement_staff_quota()`
Trigger untuk decrement `staff_used` saat staff dihapus

### 7. `update_guest_checkin_status()`
Trigger untuk set `is_checked_in = true` di `invitation_guests` saat insert ke `guestbook_checkins`

---

## Index yang Dibutuhkan

### Performance Indexes
- `idx_clients_username` ON clients(username)
- `idx_clients_slug` ON clients(slug)
- `idx_invitation_guests_client_id` ON invitation_guests(client_id)
- `idx_invitation_guests_event_id` ON invitation_guests(event_id)
- `idx_invitation_guests_guest_code` ON invitation_guests(guest_code)
- `idx_invitation_guests_is_checked_in` ON invitation_guests(is_checked_in)
- `idx_guestbook_staff_client_id` ON guestbook_staff(client_id)
- `idx_guestbook_staff_event_id` ON guestbook_staff(event_id)
- `idx_guestbook_checkins_guest_id` ON guestbook_checkins(guest_id)
- `idx_guestbook_checkins_staff_id` ON guestbook_checkins(staff_id)
- `idx_guestbook_redemptions_guest_id` ON guestbook_redemptions(guest_id)
- `idx_guestbook_redemptions_staff_id` ON guestbook_redemptions(staff_id)
- `idx_staff_logs_staff_id` ON staff_logs(staff_id)
- `idx_staff_logs_created_at` ON staff_logs(created_at DESC)

### Composite Indexes
- `idx_client_media_client_type` ON client_media(client_id, file_type)
- `idx_guestbook_staff_client_username` ON guestbook_staff(client_id, username)

---

## Summary

**Total Tables**: 13 tabel
- **Existing**: 5 tabel (admins, clients, invitation_contents, client_media, invitation_guests)
- **New for Guestbook**: 8 tabel (events, guest_types, guest_type_benefits, guestbook_staff, guestbook_checkins, guestbook_redemptions, staff_logs, client_staff_quota)

**Key Features**:
1. ✅ Multi-event support per client
2. ✅ Permission-based staff access control
3. ✅ Guest type dengan benefits (REGULAR/VIP/VVIP)
4. ✅ Check-in tracking (QR scan & manual)
5. ✅ Redemption tracking (souvenir/snack/VIP lounge)
6. ✅ Audit trail lengkap (staff_logs)
7. ✅ Staff quota enforcement
8. ✅ Seating management
9. ✅ Integration dengan invitation system via `invitation_guests`
