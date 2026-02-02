-- Migration: 013_create_gallery_settings.sql
-- Description: Create gallery_settings table
-- Date: 2026-02-02

-- ============================================================================
-- CREATE TABLE: gallery_settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS gallery_settings (
  registration_id UUID PRIMARY KEY REFERENCES wedding_registrations(id) ON DELETE CASCADE,
  main_title VARCHAR(255) DEFAULT 'Our Moments',
  background_color VARCHAR(50) DEFAULT '#F5F5F0',
  show_youtube BOOLEAN DEFAULT false,
  youtube_embed_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CREATE TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_gallery_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_gallery_settings_updated_at
  BEFORE UPDATE ON gallery_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_gallery_settings_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE gallery_settings IS 'Settings for gallery section. Photos are stored in client_media table.';
COMMENT ON COLUMN gallery_settings.youtube_embed_url IS 'URL for embedded YouTube video in gallery';
