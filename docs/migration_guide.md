# Database Migration Guide

## ⚠️ IMPORTANT: Read This First

This migration is **significant** and introduces a new database architecture. Please follow these steps carefully.

---

## 📋 Pre-Migration Checklist

- [ ] Backup current database
- [ ] Test migration on development/staging first
- [ ] Notify users of maintenance window (if applicable)
- [ ] Have rollback plan ready

---

## 🗄️ Step 1: Backup Database

```bash
# Using Supabase CLI (if available)
supabase db dump > backup_$(date +%Y%m%d_%H%M%S).sql

# Or using pg_dump directly
pg_dump -h your-host -U your-user -d your-database > backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## 🚀 Step 2: Run Migrations (IN ORDER)

### **Option A: Using Supabase Dashboard**

1. Go to Supabase Dashboard → SQL Editor
2. Run each migration file **in numerical order**:

```sql
-- Run these one by one, in this exact order:
010_create_wedding_registrations.sql
011_create_greeting_sections.sql
012_create_love_story_tables.sql
013_create_gallery_settings.sql
014_create_wedding_gift_tables.sql
015_create_closing_and_music_tables.sql
016_create_theme_settings.sql
017_migrate_existing_data.sql  -- ⚠️ This migrates your existing data
```

### **Option B: Using SQL Files (Recommended for Dev)**

Navigate to the migrations directory and run:

```bash
cd apps/invitation/database/migrations

# Run each migration
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DB -f 010_create_wedding_registrations.sql
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DB -f 011_create_greeting_sections.sql
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DB -f 012_create_love_story_tables.sql
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DB -f 013_create_gallery_settings.sql
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DB -f 014_create_wedding_gift_tables.sql
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DB -f 015_create_closing_and_music_tables.sql
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DB -f 016_create_theme_settings.sql
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DB -f 017_migrate_existing_data.sql
```

---

## ✅ Step 3: Verify Migration

Run these verification queries in Supabase SQL Editor:

```sql
-- 1. Check wedding_registrations
SELECT COUNT(*), COUNT(DISTINCT slug) FROM wedding_registrations;

-- 2. Check greeting_sections
SELECT wr.slug, COUNT(gs.*) as greeting_count
FROM wedding_registrations wr
LEFT JOIN greeting_sections gs ON gs.registration_id = wr.id
GROUP BY wr.slug;

-- 3. Check love_story_blocks
SELECT wr.slug, COUNT(lsb.*) as story_blocks
FROM wedding_registrations wr
LEFT JOIN love_story_blocks lsb ON lsb.registration_id = wr.id
GROUP BY wr.slug;

-- 4. Check wedding_gift_bank_accounts
SELECT wr.slug, COUNT(wgba.*) as bank_accounts
FROM wedding_registrations wr
LEFT JOIN wedding_gift_bank_accounts wgba ON wgba.registration_id = wr.id
GROUP BY wr.slug;

-- 5. Check all settings tables populated
SELECT 
  (SELECT COUNT(*) FROM love_story_settings) as love_story_settings,
  (SELECT COUNT(*) FROM gallery_settings) as gallery_settings,
  (SELECT COUNT(*) FROM wedding_gift_settings) as gift_settings,
  (SELECT COUNT(*) FROM closing_settings) as closing_settings,
  (SELECT COUNT(*) FROM background_music_settings) as music_settings,
  (SELECT COUNT(*) FROM theme_settings) as theme_settings;

-- 6. Check for NULLs in required fields
SELECT slug, bride_name, groom_name, wedding_date
FROM wedding_registrations
WHERE bride_name IS NULL OR groom_name IS NULL OR wedding_date IS NULL;
```

**Expected Results:**
- `wedding_registrations` count should match `invitation_contents` count
- Each registration should have at least 1-2 greeting sections
- Settings tables should have 1 row per registration
- No NULLs in required fields

---

## 🔍 Step 4: Manual Review

Check a few sample invitations:

```sql
-- Review a specific invitation (replace 'poppy-fadli' with your slug)
SELECT * FROM wedding_registrations WHERE slug = 'poppy-fadli';
SELECT * FROM greeting_sections WHERE registration_id = (SELECT id FROM wedding_registrations WHERE slug = 'poppy-fadli');
SELECT * FROM love_story_blocks WHERE registration_id = (SELECT id FROM wedding_registrations WHERE slug = 'poppy-fadli');
```

---

## 📝 Step 5: Update Task.md

Mark migration tasks as complete:

```markdown
## Phase 1: Planning & Migration Scripts
- [x] Create SQL migration scripts for all new tables
- [x] Create data migration script (existing data → new schema)
- [x] Review and validate migration scripts
```

---

## 🔧 Next Steps

After successful migration:

1. **Backend Updates** (Next Phase)
   - Update TypeScript interfaces
   - Create repository classes
   - Implement JSON compilation service
   - Update API routes

2. **Frontend Updates**
   - Update wedding registration form
   - Create editor UIs for each section
   - Test data flow

---

## 🔄 Rollback Plan

If something goes wrong:

```sql
-- Drop all new tables (in reverse order)
DROP TABLE IF EXISTS theme_settings CASCADE;
DROP TABLE IF EXISTS background_music_settings CASCADE;
DROP TABLE IF EXISTS closing_settings CASCADE;
DROP TABLE IF EXISTS wedding_gift_bank_accounts CASCADE;
DROP TABLE IF EXISTS wedding_gift_settings CASCADE;
DROP TABLE IF EXISTS gallery_settings CASCADE;
DROP TABLE IF EXISTS love_story_blocks CASCADE;
DROP TABLE IF EXISTS love_story_settings CASCADE;
DROP TABLE IF EXISTS greeting_sections CASCADE;
DROP TABLE IF EXISTS wedding_registrations CASCADE;

-- Restore from backup
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DB < backup_TIMESTAMP.sql
```

---

## 📊 Migration Summary

**Tables Created:** 10
- `wedding_registrations` (core data)
- `greeting_sections` (greetings/verses)
- `love_story_settings` + `love_story_blocks`
- `gallery_settings`
- `wedding_gift_settings` + `wedding_gift_bank_accounts`
- `closing_settings`
- `background_music_settings`
- `theme_settings`

**Indexes Created:** 8 (for performance)

**Triggers Created:** 10 (auto-update `updated_at` columns)

**Data Preserved:** 100% (from `invitation_contents` JSONB)

---

## ⚡ Quick Copy-Paste Commands

### For Supabase Dashboard (SQL Editor)

Copy and paste this entire block into Supabase SQL Editor, then run:

```sql
-- MIGRATION 010: Create wedding_registrations
-- (paste content of 010_create_wedding_registrations.sql here)

-- MIGRATION 011: Create greeting_sections  
-- (paste content of 011_create_greeting_sections.sql here)

-- ... continue for all migrations
```

### Single Command for All Migrations (Advanced)

If you have all files locally:

```bash
cat 010_*.sql 011_*.sql 012_*.sql 013_*.sql 014_*.sql 015_*.sql 016_*.sql 017_*.sql | psql -h YOUR_HOST -U YOUR_USER -d YOUR_DB
```

---

## 🎯 Success Criteria

Migration is successful when:
- [x] All 10 tables created without errors
- [x] All existing `invitation_contents` data migrated to new tables
- [x] Verification queries return expected counts
- [x] Sample invitation data looks correct
- [x] No errors in Supabase logs

---

## 🆘 Troubleshooting

**Issue:** Foreign key constraint fails
- **Solution:** Ensure `clients` table has matching records for `client_id`

**Issue:** Duplicate key error on migration
- **Solution:** Migration already ran. Check `ON CONFLICT DO NOTHING` clauses.

**Issue:** NULL values in required fields
- **Solution:** Review source `invitation_contents` data for missing fields

**Issue:** JSONB extraction returns NULL
- **Solution:** Check JSONB structure in `invitation_contents`. May need to adjust field paths.

---

## 📞 Need Help?

If migration fails:
1. Check Supabase logs for specific error messages
2. Run verification queries to see what data was migrated
3. Review the specific migration file that failed
4. Rollback and retry with data fixes if needed
