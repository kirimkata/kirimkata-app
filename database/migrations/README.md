# Database Migrations - FASE 1

## Overview
Migration scripts untuk FASE 1: Database Schema Enhancement yang menambahkan support untuk module-based events (Invitation & Guestbook).

## Migration Files

### 003_add_event_modules.sql
- Menambahkan kolom `has_invitation` dan `has_guestbook` ke tabel `events`
- Menambahkan kolom `invitation_config` dan `guestbook_config` (JSONB)
- Menambahkan kolom `seating_mode`
- Membuat indexes untuk performa query
- Menambahkan check constraint untuk seating_mode

### 004_create_seating_config.sql
- Membuat tabel `event_seating_config` untuk manage seats/tables/zones
- Menambahkan trigger untuk auto-update `updated_at`
- Membuat indexes untuk performa query

### 005_update_guest_types_event_scope.sql
- Menambahkan kolom `event_id` ke tabel `guest_types`
- Update unique constraint untuk support event-level guest types
- Membuat function dan trigger untuk auto-create default guest types (REGULAR, VIP, VVIP) saat event baru dibuat

### 006_update_invitation_guests.sql
- Menambahkan kolom `guest_group`, `max_companions`, `actual_companions`
- Menambahkan kolom `seating_config_id` sebagai foreign key ke `event_seating_config`
- Menambahkan check constraint untuk companions validation

### 007_enhance_benefits.sql
- Menambahkan kolom `is_active` dan `updated_at` ke `guest_type_benefits`
- Membuat tabel `benefit_catalog` untuk predefined benefits
- Insert default benefits (souvenir, snack, vip_lounge, parking, dll)

## How to Run Migrations

### Option 1: Manual via Supabase Dashboard
1. Login ke Supabase Dashboard
2. Buka SQL Editor
3. Copy-paste isi dari setiap migration file secara berurutan (003, 004, 005, 006, 007)
4. Execute setiap script

### Option 2: Via Supabase CLI
```bash
# Install Supabase CLI jika belum
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

### Option 3: Via psql (Direct Database Connection)
```bash
# Connect to database
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Run each migration
\i database/migrations/003_add_event_modules.sql
\i database/migrations/004_create_seating_config.sql
\i database/migrations/005_update_guest_types_event_scope.sql
\i database/migrations/006_update_invitation_guests.sql
\i database/migrations/007_enhance_benefits.sql
```

## Verification Checklist

### After Running Migrations

1. **Check Events Table**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('has_invitation', 'has_guestbook', 'invitation_config', 'guestbook_config', 'seating_mode');
```
Expected: 5 rows returned

2. **Check Event Seating Config Table**
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'event_seating_config'
);
```
Expected: true

3. **Check Guest Types Event Scope**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'guest_types' 
AND column_name = 'event_id';
```
Expected: 1 row returned

4. **Check Benefit Catalog**
```sql
SELECT COUNT(*) FROM benefit_catalog;
```
Expected: At least 8 rows (default benefits)

5. **Test Auto-Create Guest Types Trigger**
```sql
-- Create a test event with guestbook enabled
INSERT INTO events (client_id, event_name, event_date, has_invitation, has_guestbook)
VALUES ('YOUR_CLIENT_ID', 'Test Event', '2025-12-31', true, true)
RETURNING id;

-- Check if guest types were auto-created
SELECT * FROM guest_types WHERE event_id = 'EVENT_ID_FROM_ABOVE';
```
Expected: 3 guest types (REGULAR, VIP, VVIP) should be created automatically

6. **Check Indexes**
```sql
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('events', 'event_seating_config', 'guest_types', 'invitation_guests', 'benefit_catalog')
ORDER BY tablename, indexname;
```
Expected: All indexes created successfully

## Rollback (If Needed)

If you need to rollback these migrations:

```sql
-- Rollback 007
DROP TABLE IF EXISTS benefit_catalog CASCADE;
ALTER TABLE guest_type_benefits DROP COLUMN IF EXISTS is_active;
ALTER TABLE guest_type_benefits DROP COLUMN IF EXISTS updated_at;

-- Rollback 006
ALTER TABLE invitation_guests DROP COLUMN IF EXISTS guest_group;
ALTER TABLE invitation_guests DROP COLUMN IF EXISTS max_companions;
ALTER TABLE invitation_guests DROP COLUMN IF EXISTS actual_companions;
ALTER TABLE invitation_guests DROP COLUMN IF EXISTS seating_config_id;

-- Rollback 005
DROP TRIGGER IF EXISTS trigger_create_default_guest_types ON events;
DROP FUNCTION IF EXISTS create_default_guest_types_for_event();
ALTER TABLE guest_types DROP COLUMN IF EXISTS event_id;

-- Rollback 004
DROP TABLE IF EXISTS event_seating_config CASCADE;

-- Rollback 003
ALTER TABLE events DROP COLUMN IF EXISTS has_invitation;
ALTER TABLE events DROP COLUMN IF EXISTS has_guestbook;
ALTER TABLE events DROP COLUMN IF EXISTS invitation_config;
ALTER TABLE events DROP COLUMN IF EXISTS guestbook_config;
ALTER TABLE events DROP COLUMN IF EXISTS seating_mode;
```

## Notes

- **IMPORTANT**: Backup database sebelum menjalankan migrations
- Migrations ini backward compatible dengan data existing
- Default values sudah di-set untuk existing events
- Trigger auto-create guest types hanya berjalan untuk event baru dengan `has_guestbook = true`

## Next Steps

Setelah migrations berhasil:
1. Update TypeScript types (sudah dilakukan di `apps/invitation/lib/guestbook/types.ts`)
2. Update repository functions (sudah dilakukan)
3. Test API endpoints dengan schema baru
4. Lanjut ke FASE 2: Routing Restructure
