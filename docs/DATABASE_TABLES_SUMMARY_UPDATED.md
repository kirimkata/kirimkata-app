# Ringkasan Tabel Database - Invitation & Guestbook System (UPDATED)

## Overview
Sistem terdiri dari 2 aplikasi terintegrasi:
1. **Invitation App**: Mengelola undangan digital, konten, dan daftar tamu
2. **Guestbook App**: Mengelola check-in, redemption, dan staff management untuk event

**Total: 14 tabel** (6 existing + 8 new guestbook tables)

---

## Tabel Existing (Production Schema)

### 1. `admins`
**Fungsi**: Menyimpan kredensial admin internal untuk mengelola sistem
- Admin dapat CRUD data clients dan konten
- Tidak memiliki FK langsung ke tabel lain
- Password terenkripsi dengan AES/Bcrypt

**Kolom**:
- `id` (uuid, PK, default gen_random_uuid())
- `username` (varchar(255), unique, not null)
- `password_encrypted` (text, not null)
- `email` (varchar(255), nullable)
- `created_at` (timestamp, default now())
- `updated_at` (timestamp, default now())

**Indexes**:
- `idx_admins_username`

**Triggers**:
- `trigger_update_admins_updated_at` → update `updated_at` on UPDATE

---

### 2. `invitation_contents`
**Fungsi**: Menyimpan konten undangan digital (profil pasangan, event, galeri, dll)
- Data dalam format JSONB untuk fleksibilitas
- Dirender oleh Next.js invitation app berdasarkan slug
- **MUST BE CREATED BEFORE `clients`** karena FK dependency

**Kolom**:
- `id` (uuid, PK, default uuid_generate_v4())
- `slug` (text, unique, not null)
- `client_profile` (jsonb, not null)
- `bride` (jsonb, not null) - data mempelai wanita
- `groom` (jsonb, not null) - data mempelai pria
- `event` (jsonb, not null) - detail acara
- `clouds` (jsonb, not null)
- `event_cloud` (jsonb, not null)
- `love_story` (jsonb, not null)
- `gallery` (jsonb, not null)
- `wedding_gift` (jsonb, not null)
- `closing` (jsonb, not null)
- `background_music` (jsonb, nullable)
- `custom_images` (jsonb, nullable)
- `theme_key` (text, default 'parallax/parallax-custom1')
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

**Indexes**:
- `idx_invitation_contents_slug`

---

### 3. `clients`
**Fungsi**: Data akun client/pengguna yang membuat undangan dan menggunakan guestbook
- Setiap client memiliki kuota upload media (foto, musik, video)
- Field `guestbook_access` menentukan apakah client bisa akses fitur guestbook
- Memiliki slug unik untuk URL undangan

**Kolom**:
- `id` (uuid, PK, default gen_random_uuid())
- `username` (varchar(255), unique, not null)
- `password_encrypted` (text, not null)
- `email` (varchar(255), nullable)
- `slug` (varchar(255), unique, nullable) - FK ke `invitation_contents.slug`
- `quota_photos` (integer, default 10)
- `quota_music` (integer, default 1)
- `quota_videos` (integer, default 1)
- `message_template` (text, nullable)
- `guestbook_access` (boolean, default false)
- `created_at` (timestamp, default now())
- `updated_at` (timestamp, default now())

**Constraints**:
- FK: `fk_clients_slug` → `invitation_contents(slug)` ON DELETE SET NULL

**Indexes**:
- `idx_clients_username`
- `idx_clients_slug`

**Triggers**:
- `trigger_update_clients_updated_at` → update `updated_at` on UPDATE

**Relasi**:
- 1:1 dengan `invitation_contents` via `slug`
- 1:N dengan `client_media`
- 1:N dengan `invitation_guests`
- 1:N dengan `guestbook_staff` (new)
- 1:N dengan `events` (new)

---

### 4. `client_media`
**Fungsi**: Metadata file yang diunggah client (foto galeri, musik, video)
- Menyimpan URL file di storage (R2/S3)
- Digunakan untuk render galeri di undangan

**Kolom**:
- `id` (serial, PK)
- `client_id` (uuid, FK ke `clients.id`, cascade delete, not null)
- `file_name` (varchar(255), not null)
- `file_url` (text, not null)
- `file_type` (varchar(50), not null) - 'music', 'photo', 'video'
- `file_size` (integer, not null) - dalam byte
- `mime_type` (varchar(100), not null)
- `uploaded_at` (timestamptz, default CURRENT_TIMESTAMP)

**Indexes**:
- `idx_client_media_client_type` (client_id, file_type)
- `idx_client_media_uploaded_at` (uploaded_at DESC)

---

### 5. `invitation_guests`
**Fungsi**: Daftar tamu yang menerima undangan dan akan di-check-in di guestbook
- Single source of truth untuk data tamu
- Digunakan oleh invitation app untuk kirim undangan
- Digunakan oleh guestbook app untuk check-in
- **Extended dengan kolom guestbook** (ditambahkan via ALTER TABLE)

**Kolom Base (Existing)**:
- `id` (uuid, PK, default uuid_generate_v4())
- `client_id` (uuid, FK ke `clients.id`, cascade delete, not null)
- `name` (varchar(255), not null)
- `phone` (varchar(50), not null) - nomor WhatsApp/telepon
- `sent` (boolean, default false) - status kirim undangan
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

**Kolom Extended (Guestbook)**:
- `event_id` (uuid, FK ke `events.id`, cascade delete)
- `guest_code` (varchar(50), unique) - kode unik tamu
- `qr_code` (text) - QR code untuk check-in
- `guest_type_id` (uuid, FK ke `guest_types.id`, set null) - REGULAR/VIP/VVIP
- `source` (varchar(20), default 'registered') - 'registered' atau 'walkin'
- `max_companions` (integer, default 0)
- `actual_companions` (integer, default 0)
- `table_number` (integer, nullable)
- `seat_number` (varchar(20), nullable)
- `seating_area` (varchar(100), nullable)
- `is_checked_in` (boolean, default false)
- `checked_in_at` (timestamptz, nullable)
- `notes` (text, nullable)

**Constraints**:
- CHECK: `source IN ('registered', 'walkin')`

**Indexes**:
- `idx_invitation_guests_client_id`
- `idx_invitation_guests_event_id`
- `idx_invitation_guests_guest_code`
- `idx_invitation_guests_is_checked_in`
- `idx_invitation_guests_guest_type`

**Triggers**:
- `update_invitation_guests_updated_at` → update `updated_at` on UPDATE

---

### 6. `wishes`
**Fungsi**: Ucapan dan konfirmasi kehadiran dari tamu melalui website undangan
- Tamu bisa kirim ucapan dan konfirmasi kehadiran
- Linked ke undangan via `invitation_slug`

**Kolom**:
- `id` (bigserial, PK)
- `invitation_slug` (text, not null)
- `name` (text, not null)
- `message` (text, not null)
- `attendance` (text, not null) - 'hadir', 'tidak-hadir', 'masih-ragu'
- `guest_count` (integer, default 1, not null)
- `created_at` (timestamptz, default now())

**Constraints**:
- CHECK: `attendance IN ('hadir', 'tidak-hadir', 'masih-ragu')`

**Indexes**:
- `idx_wishes_invitation_slug`
- `idx_wishes_created_at` (DESC)

---

## Tabel Baru untuk Guestbook System

### 7. `events`
**Fungsi**: Mengelola multiple events per client (wedding, reception, etc)
- Satu client bisa punya banyak event
- Setiap event punya staff dan tamu sendiri

**Kolom**:
- `id` (uuid, PK, default uuid_generate_v4())
- `client_id` (uuid, FK ke `clients.id`, cascade delete, not null)
- `event_name` (varchar(255), not null)
- `event_date` (date, not null)
- `event_time` (time, nullable)
- `venue_name` (varchar(255), nullable)
- `venue_address` (text, nullable)
- `is_active` (boolean, default true)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

**Indexes**:
- `idx_events_client_id`
- `idx_events_date`

**Triggers**:
- `trigger_update_events_updated_at` → update `updated_at` on UPDATE

---

### 8. `guest_types`
**Fungsi**: Kategori tamu dengan benefit berbeda (REGULAR, VIP, VVIP)
- Menentukan entitlement tamu (souvenir, snack, VIP lounge)
- Per client, bisa custom guest types

**Kolom**:
- `id` (uuid, PK, default uuid_generate_v4())
- `client_id` (uuid, FK ke `clients.id`, cascade delete, not null)
- `type_name` (varchar(50), not null) - 'REGULAR', 'VIP', 'VVIP'
- `display_name` (varchar(100), not null) - nama tampilan
- `color_code` (varchar(20), nullable) - untuk UI (green/gold/purple)
- `priority_order` (integer, default 0) - urutan prioritas
- `created_at` (timestamptz, default now())

**Constraints**:
- UNIQUE: (client_id, type_name)

**Indexes**:
- `idx_guest_types_client_id`

---

### 9. `guest_type_benefits`
**Fungsi**: Benefit yang dimiliki setiap guest type
- Relasi M:N antara guest_types dan benefits
- Quantity tracking per benefit

**Kolom**:
- `id` (uuid, PK, default uuid_generate_v4())
- `guest_type_id` (uuid, FK ke `guest_types.id`, cascade delete, not null)
- `benefit_type` (varchar(50), not null) - 'SOUVENIR', 'SNACK', 'VIP_LOUNGE'
- `quantity` (integer, default 1) - jumlah yang berhak
- `description` (text, nullable)
- `created_at` (timestamptz, default now())

---

### 10. `guestbook_staff`
**Fungsi**: Staff yang mengelola operasional guestbook (check-in, redemption)
- Permission-based access control (bukan role-based)
- Setiap client punya kuota staff
- Username unique per client

**Kolom**:
- `id` (uuid, PK, default uuid_generate_v4())
- `client_id` (uuid, FK ke `clients.id`, cascade delete, not null)
- `event_id` (uuid, FK ke `events.id`, cascade delete, nullable)
- `username` (varchar(100), not null)
- `password_encrypted` (text, not null)
- `full_name` (varchar(255), not null)
- `phone` (varchar(50), nullable)
- `can_checkin` (boolean, default false)
- `can_redeem_souvenir` (boolean, default false)
- `can_redeem_snack` (boolean, default false)
- `can_access_vip_lounge` (boolean, default false)
- `is_active` (boolean, default true)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

**Constraints**:
- UNIQUE: (client_id, username)

**Indexes**:
- `idx_guestbook_staff_client_id`
- `idx_guestbook_staff_event_id`
- `idx_guestbook_staff_client_username` (composite)

**Triggers**:
- `trigger_update_guestbook_staff_updated_at` → update `updated_at` on UPDATE
- `trigger_enforce_staff_quota` → BEFORE INSERT, check quota
- `trigger_increment_staff_quota` → AFTER INSERT, increment counter
- `trigger_decrement_staff_quota` → AFTER DELETE, decrement counter

---

### 11. `guestbook_checkins`
**Fungsi**: Record check-in tamu di event
- Audit trail siapa check-in kapan
- Menyimpan method check-in (QR/manual)
- One check-in per guest (UNIQUE constraint)

**Kolom**:
- `id` (uuid, PK, default uuid_generate_v4())
- `guest_id` (uuid, FK ke `invitation_guests.id`, cascade delete, not null)
- `staff_id` (uuid, FK ke `guestbook_staff.id`, set null, nullable)
- `checked_in_at` (timestamptz, default now())
- `checkin_method` (varchar(20), not null) - 'QR_SCAN' atau 'MANUAL_SEARCH'
- `device_info` (jsonb, nullable) - user agent, IP, dll
- `notes` (text, nullable)
- `created_at` (timestamptz, default now())

**Constraints**:
- UNIQUE: (guest_id) - prevent duplicate check-in
- CHECK: `checkin_method IN ('QR_SCAN', 'MANUAL_SEARCH')`

**Indexes**:
- `idx_guestbook_checkins_guest_id`
- `idx_guestbook_checkins_staff_id`
- `idx_guestbook_checkins_checked_in_at` (DESC)

**Triggers**:
- `trigger_update_guest_checkin_status` → AFTER INSERT, update `invitation_guests.is_checked_in = TRUE`

---

### 12. `guestbook_redemptions`
**Fungsi**: Record pengambilan souvenir/snack/VIP lounge access
- Tracking quantity yang diambil
- Audit trail redemption
- Multiple redemptions allowed per guest

**Kolom**:
- `id` (uuid, PK, default uuid_generate_v4())
- `guest_id` (uuid, FK ke `invitation_guests.id`, cascade delete, not null)
- `staff_id` (uuid, FK ke `guestbook_staff.id`, set null, nullable)
- `entitlement_type` (varchar(50), not null) - 'SOUVENIR', 'SNACK', 'VIP_LOUNGE'
- `quantity` (integer, default 1)
- `redeemed_at` (timestamptz, default now())
- `notes` (text, nullable)
- `created_at` (timestamptz, default now())

**Constraints**:
- CHECK: `entitlement_type IN ('SOUVENIR', 'SNACK', 'VIP_LOUNGE')`

**Indexes**:
- `idx_guestbook_redemptions_guest_id`
- `idx_guestbook_redemptions_staff_id`
- `idx_guestbook_redemptions_type`
- `idx_guestbook_redemptions_redeemed_at` (DESC)

---

### 13. `staff_logs`
**Fungsi**: Audit log untuk semua aksi staff
- Tracking siapa melakukan apa kapan
- Untuk accountability dan debugging
- JSONB untuk flexible action details

**Kolom**:
- `id` (uuid, PK, default uuid_generate_v4())
- `staff_id` (uuid, FK ke `guestbook_staff.id`, cascade delete, not null)
- `guest_id` (uuid, FK ke `invitation_guests.id`, cascade delete, nullable)
- `action_type` (varchar(50), not null) - 'checkin', 'redeem', 'update_guest', dll
- `action_details` (jsonb, nullable) - detail aksi
- `notes` (text, nullable)
- `created_at` (timestamptz, default now())

**Indexes**:
- `idx_staff_logs_staff_id`
- `idx_staff_logs_guest_id`
- `idx_staff_logs_created_at` (DESC)
- `idx_staff_logs_action_type`

---

### 14. `client_staff_quota`
**Fungsi**: Mengelola kuota staff per client
- Enforce limit berapa staff yang bisa dibuat
- Auto-increment/decrement via trigger
- Default max: 10 staff per client

**Kolom**:
- `id` (uuid, PK, default uuid_generate_v4())
- `client_id` (uuid, FK ke `clients.id`, unique, cascade delete, not null)
- `max_staff` (integer, default 10)
- `staff_used` (integer, default 0)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

**Constraints**:
- CHECK: `staff_used >= 0`

**Triggers**:
- `trigger_update_staff_quota_updated_at` → update `updated_at` on UPDATE

---

## Diagram Relasi

```
┌─────────────┐
│   admins    │ (internal admin panel)
└─────────────┘

┌──────────────────────────────────────────────────────────────┐
│                       invitation_contents                     │
│  (JSONB: bride, groom, event, gallery, etc)                  │
└──────────────┬───────────────────────────────────────────────┘
               │ slug (FK)
               ▼
┌──────────────────────────────────────────────────────────────┐
│                          clients                              │
│  - guestbook_access (boolean)                                │
│  - quota_photos, quota_music, quota_videos                   │
└──────────────┬───────────────────────────────────────────────┘
               │
       ┌───────┴────────┬──────────────┬─────────────┬────────────┬─────────┐
       │                │              │             │            │         │
       ▼                ▼              ▼             ▼            ▼         ▼
┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ ┌──────────┐
│  client_ │  │ invitation_  │  │  events  │  │guestbook_│  │  client_ │ │  wishes  │
│  media   │  │   guests     │◄─┤          │  │  staff   │  │  staff_  │ │ (via slug)│
│ (files)  │  │ (extended)   │  │          │  │          │  │  quota   │ └──────────┘
└──────────┘  └──────┬───────┘  └────┬─────┘  └────┬─────┘  └──────────┘
                     │                │             │
                     │ FK             │ FK          │
              ┌──────┴────────────────┴─────────────┘
              │
              ▼
       ┌──────────────┐
       │ guest_types  │
       │ (REGULAR/VIP)│
       └──────┬───────┘
              │
              ▼
       ┌──────────────────┐
       │  guest_type_     │
       │   benefits       │
       └──────────────────┘

invitation_guests (hub untuk guestbook):
       │
       ├─→ guestbook_checkins (1:1, UNIQUE guest_id)
       ├─→ guestbook_redemptions (1:N)
       └─→ staff_logs (1:N)
```

---

## Trigger Functions

### 1. `update_updated_at_column()`
Generic function untuk update `updated_at` timestamp pada semua tabel

### 2. `update_admins_updated_at()`
Specific untuk tabel `admins`

### 3. `update_clients_updated_at()`
Specific untuk tabel `clients`

### 4. `enforce_staff_quota()`
**BEFORE INSERT** pada `guestbook_staff`:
- Check apakah `staff_used < max_staff`
- Jika quota habis, RAISE EXCEPTION
- Auto-create quota record jika belum ada

### 5. `increment_staff_quota()`
**AFTER INSERT** pada `guestbook_staff`:
- Increment `staff_used` di `client_staff_quota`
- ON CONFLICT DO UPDATE

### 6. `decrement_staff_quota()`
**AFTER DELETE** pada `guestbook_staff`:
- Decrement `staff_used` di `client_staff_quota`
- GREATEST(staff_used - 1, 0) untuk prevent negative

### 7. `update_guest_checkin_status()`
**AFTER INSERT** pada `guestbook_checkins`:
- Update `invitation_guests.is_checked_in = TRUE`
- Update `invitation_guests.checked_in_at`
- Sync status check-in

---

## Key Features

1. ✅ **Multi-event support** per client via `events` table
2. ✅ **Permission-based staff access** control (bukan role-based)
3. ✅ **Guest type dengan benefits** (REGULAR/VIP/VVIP) via `guest_types` + `guest_type_benefits`
4. ✅ **Check-in tracking** (QR scan & manual) via `guestbook_checkins`
5. ✅ **Redemption tracking** (souvenir/snack/VIP lounge) via `guestbook_redemptions`
6. ✅ **Audit trail lengkap** via `staff_logs`
7. ✅ **Staff quota enforcement** via triggers + `client_staff_quota`
8. ✅ **Seating management** via extended columns di `invitation_guests`
9. ✅ **Integration dengan invitation** via `invitation_guests` (single source of truth)
10. ✅ **Wishes/RSVP system** via `wishes` table

---

## Migration Strategy

### Untuk Database Baru (Fresh Install):
```bash
psql -U postgres -d your_database -f docs/CREATE_TABLES_FIXED.sql
```

### Untuk Database Existing (Production):
Script sudah idempotent dengan:
- `CREATE TABLE IF NOT EXISTS`
- `CREATE INDEX IF NOT EXISTS`
- `DROP TRIGGER IF EXISTS` sebelum `CREATE TRIGGER`
- `DO $$ BEGIN ... IF NOT EXISTS ... END $$` untuk ALTER TABLE

**Aman dijalankan berulang kali tanpa error!**

---

## Summary

**Total Tables**: 14 tabel
- **Existing**: 6 tabel (admins, invitation_contents, clients, client_media, invitation_guests, wishes)
- **New for Guestbook**: 8 tabel (events, guest_types, guest_type_benefits, guestbook_staff, guestbook_checkins, guestbook_redemptions, staff_logs, client_staff_quota)

**Total Indexes**: 30+ indexes untuk performance optimization

**Total Triggers**: 10 triggers untuk automation dan data integrity

**Total Functions**: 7 PL/pgSQL functions untuk business logic
