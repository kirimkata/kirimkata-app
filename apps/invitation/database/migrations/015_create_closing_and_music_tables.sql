-- Migration: 015_create_closing_and_music_tables.sql
-- Description: Create closing_settings and background_music_settings tables
-- Date: 2026-02-02

-- ============================================================================
-- CREATE TABLE: closing_settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS closing_settings (
  registration_id UUID PRIMARY KEY REFERENCES wedding_registrations(id) ON DELETE CASCADE,
  background_color VARCHAR(50) DEFAULT '#F5F5F0',
  photo_url TEXT,
  names_display VARCHAR(255),
  message_line1 TEXT DEFAULT 'Kami sangat menantikan kehadiran Anda untuk berbagi kebahagiaan di hari istimewa kami.',
  message_line2 TEXT DEFAULT 'Kehadiran dan doa restu Anda merupakan kebahagiaan bagi kami.',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CREATE TABLE: background_music_settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS background_music_settings (
  registration_id UUID PRIMARY KEY REFERENCES wedding_registrations(id) ON DELETE CASCADE,
  media_id INTEGER REFERENCES client_media(id) ON DELETE SET NULL,
  
  -- Metadata
  title VARCHAR(255),
  artist VARCHAR(255),
  loop_enabled BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_closing_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_closing_settings_updated_at
  BEFORE UPDATE ON closing_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_closing_settings_updated_at();

CREATE OR REPLACE FUNCTION update_background_music_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_background_music_settings_updated_at
  BEFORE UPDATE ON background_music_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_background_music_settings_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE closing_settings IS 'Settings and messages for the closing section';
COMMENT ON TABLE background_music_settings IS 'Background music configuration. References client_media table for the audio file.';
COMMENT ON COLUMN background_music_settings.media_id IS 'Foreign key to client_media table where file_type=music';
