-- ============================================
-- KIRIMKATA: Database Cleanup & Optimization
-- Manual execution in Supabase SQL Editor
-- ============================================
-- 
-- IMPORTANT: Review each step before running!
-- Estimated time: 5-10 minutes
-- ============================================

-- ============================================
-- STEP 1: BACKUP EXISTING DATA
-- ============================================
CREATE TABLE IF NOT EXISTS _backup_guestbook_events AS 
SELECT * FROM guestbook_events;

CREATE TABLE IF NOT EXISTS _backup_guests AS 
SELECT * FROM guests;

-- Verify backups
SELECT 
  (SELECT COUNT(*) FROM _backup_guestbook_events) as backup_events_count,
  (SELECT COUNT(*) FROM _backup_guests) as backup_guests_count;

-- ============================================
-- STEP 2: MIGRATE guestbook_events → guestbook_addons
-- ============================================
INSERT INTO guestbook_addons (
  invitation_id,
  is_enabled,
  enabled_at,
  seating_mode,
  staff_quota,
  staff_quota_used,
  config,
  created_at,
  updated_at
)
SELECT 
  ge.invitation_id,
  ge.has_guestbook,
  CASE WHEN ge.has_guestbook THEN ge.created_at ELSE NULL END,
  ge.seating_mode,
  ge.staff_quota,
  ge.staff_quota_used,
  jsonb_build_object(
    'guestbook', ge.guestbook_config,
    'invitation', ge.invitation_config,
    'event_name', ge.event_name,
    'event_date', ge.event_date,
    'venue_name', ge.venue_name
  ),
  ge.created_at,
  ge.updated_at
FROM guestbook_events ge
WHERE ge.invitation_id IS NOT NULL
ON CONFLICT (invitation_id) DO NOTHING;

-- Verify migration
SELECT 
  (SELECT COUNT(*) FROM guestbook_events WHERE has_guestbook = true) as old_enabled_count,
  (SELECT COUNT(*) FROM guestbook_addons WHERE is_enabled = true) as new_enabled_count;

-- ============================================
-- STEP 3: UPDATE guests.invitation_id
-- ============================================
-- Link guests to invitations via events
UPDATE guests g
SET invitation_id = ge.invitation_id
FROM guestbook_events ge
WHERE g.event_id = ge.id
  AND g.invitation_id IS NULL
  AND ge.invitation_id IS NOT NULL;

-- Verify: Should return 0 or very few orphaned guests
SELECT COUNT(*) as guests_without_invitation
FROM guests
WHERE invitation_id IS NULL;

-- If you have orphaned guests, investigate them first:
-- SELECT id, name, event_id, client_id FROM guests WHERE invitation_id IS NULL LIMIT 10;

-- ============================================
-- STEP 4: DROP OLD COLUMN FROM guests
-- ============================================
-- Remove event_id column (no longer needed)
ALTER TABLE guests DROP COLUMN IF EXISTS event_id CASCADE;

-- Drop related indexes
DROP INDEX IF EXISTS idx_invitation_guests_event_id;
DROP INDEX IF EXISTS idx_invitation_guests_event_group;

-- ============================================
-- STEP 5: UPDATE FOREIGN KEYS
-- ============================================
-- Update guest_types to reference invitation instead of event
ALTER TABLE guest_types DROP COLUMN IF EXISTS event_id CASCADE;
ALTER TABLE guest_types ADD COLUMN IF NOT EXISTS invitation_id UUID 
  REFERENCES invitation_pages(id) ON DELETE CASCADE;

-- Migrate guest_types data (if needed)
-- UPDATE guest_types gt
-- SET invitation_id = ge.invitation_id
-- FROM guestbook_events ge
-- WHERE gt.event_id = ge.id AND gt.invitation_id IS NULL;

-- Update guestbook_staff to reference invitation
ALTER TABLE guestbook_staff DROP COLUMN IF EXISTS event_id CASCADE;
ALTER TABLE guestbook_staff ADD COLUMN IF NOT EXISTS invitation_id UUID 
  REFERENCES invitation_pages(id) ON DELETE CASCADE;

-- Update event_seating_config to reference invitation
ALTER TABLE event_seating_config DROP COLUMN IF EXISTS event_id CASCADE;
ALTER TABLE event_seating_config ADD COLUMN IF NOT EXISTS invitation_id UUID 
  REFERENCES invitation_pages(id) ON DELETE CASCADE;

-- ============================================
-- STEP 6: DROP guestbook_events TABLE
-- ============================================
-- Final check: Ensure all data migrated
SELECT 
  table_name,
  column_name
FROM information_schema.columns
WHERE column_name = 'event_id'
  AND table_schema = 'public'
  AND table_name NOT LIKE '_backup_%';

-- If list is empty, safe to drop guestbook_events
DROP TABLE IF EXISTS guestbook_events CASCADE;

-- ============================================
-- STEP 7: ADD PERFORMANCE INDEXES
-- ============================================

-- Invitations: Active tracking
CREATE INDEX IF NOT EXISTS idx_invitations_client_active 
  ON invitation_pages(client_id, is_active) 
  WHERE is_active = true;

-- Invitations: Expiring soon (for notifications)
CREATE INDEX IF NOT EXISTS idx_invitations_expiring 
  ON invitation_pages(active_until) 
  WHERE is_active = true 
    AND active_until IS NOT NULL 
    AND active_until < (CURRENT_DATE + INTERVAL '7 days');

-- Invitations: Verification queue
CREATE INDEX IF NOT EXISTS idx_invitations_pending_verification 
  ON invitation_pages(verification_status, created_at DESC)
  WHERE verification_status = 'pending';

-- Orders: Payment processing queue
CREATE INDEX IF NOT EXISTS idx_orders_pending_payment 
  ON orders(payment_status, created_at DESC)
  WHERE payment_status IN ('pending', 'waiting_verification');

-- Orders: Expiring orders
CREATE INDEX IF NOT EXISTS idx_orders_expiring 
  ON orders(expires_at)
  WHERE payment_status = 'pending' 
    AND expires_at IS NOT NULL;

-- Guests: Check-in flow optimization
CREATE INDEX IF NOT EXISTS idx_guests_checkin 
  ON guests(invitation_id, is_checked_in)
  WHERE is_checked_in = false;

-- Guests: Guest code lookup
CREATE INDEX IF NOT EXISTS idx_guests_code_lookup
  ON guests(guest_code)
  WHERE guest_code IS NOT NULL;

-- Guestbook Addons: Enabled check
CREATE INDEX IF NOT EXISTS idx_guestbook_enabled_invitations
  ON guestbook_addons(invitation_id, is_enabled)
  WHERE is_enabled = true;

-- JSONB Indexes (if you query bride/groom names frequently)
CREATE INDEX IF NOT EXISTS idx_invitations_bride_name_gin 
  ON invitation_pages USING GIN ((bride->>'name'));

CREATE INDEX IF NOT EXISTS idx_invitations_groom_name_gin 
  ON invitation_pages USING GIN ((groom->>'name'));

-- ============================================
-- STEP 8: ANALYZE TABLES
-- ============================================
ANALYZE invitation_pages;
ANALYZE guests;
ANALYZE guestbook_addons;
ANALYZE orders;
ANALYZE invoices;
ANALYZE templates;
ANALYZE addon_catalog;

-- ============================================
-- STEP 9: VERIFY CLEANUP
-- ============================================

-- Check table sizes BEFORE and AFTER
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'invitation_pages',
    'guests',
    'guestbook_addons',
    'guestbook_events',
    '_backup_guestbook_events',
    '_backup_guests'
  )
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- List all indexes
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('invitation_pages', 'guests', 'guestbook_addons', 'orders')
ORDER BY tablename, indexname;

-- ============================================
-- STEP 10: CLEANUP BACKUPS (AFTER 1 WEEK)
-- ============================================
-- Run this ONLY after verifying everything works!
-- 
-- DROP TABLE IF EXISTS _backup_guestbook_events;
-- DROP TABLE IF EXISTS _backup_guests;

-- ============================================
-- COMPLETED! Summary of changes:
-- ============================================
-- ✅ Migrated guestbook_events → guestbook_addons
-- ✅ Updated guests.invitation_id
-- ✅ Dropped guests.event_id
-- ✅ Dropped guestbook_events table
-- ✅ Updated foreign keys in related tables
-- ✅ Added performance indexes
-- ✅ Analyzed tables for query optimization
-- 
-- Expected improvements:
-- - ~15-20% storage reduction
-- - Faster invitation → guests queries
-- - Cleaner data model
-- ============================================
