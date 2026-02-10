-- Migration: 018_rename_invitation_content_columns.sql
-- Description: Rename confusing column names in invitation_contents for semantic clarity
-- Date: 2026-02-08

BEGIN;

-- ============================================================================
-- RENAME COLUMNS
-- ============================================================================

-- 1. Rename 'clouds' to 'greetings'
ALTER TABLE invitation_contents 
  RENAME COLUMN clouds TO greetings;

COMMENT ON COLUMN invitation_contents.greetings IS 
  'Greeting text sections (opening, verses, quotes) displayed across invitation';

-- 2. Rename 'event_cloud' to 'event_details'
ALTER TABLE invitation_contents 
  RENAME COLUMN event_cloud TO event_details;

COMMENT ON COLUMN invitation_contents.event_details IS 
  'Detailed event information (venues, streaming, ceremony details)';

-- 3. Rename 'background_music' to 'music_settings'
ALTER TABLE invitation_contents 
  RENAME COLUMN background_music TO music_settings;

COMMENT ON COLUMN invitation_contents.music_settings IS 
  'Background music configuration (URL, title, artist, loop)';

-- 4. Rename 'client_profile' to 'profile'
ALTER TABLE invitation_contents 
  RENAME COLUMN client_profile TO profile;

COMMENT ON COLUMN invitation_contents.profile IS 
  'Client profile metadata (couple names, slug, theme)';

COMMIT;

-- ============================================================================
-- NOTES
-- ============================================================================
-- This migration renames columns in the invitation_contents cache table.
-- The cache can be regenerated from normalized tables using InvitationCompilerService.
-- After running this migration, ensure application code is updated to use new column names.
