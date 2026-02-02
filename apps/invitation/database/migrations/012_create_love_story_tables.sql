-- Migration: 012_create_love_story_tables.sql
-- Description: Create love_story_settings and love_story_blocks tables
-- Date: 2026-02-02

-- ============================================================================
-- CREATE TABLE: love_story_settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS love_story_settings (
  registration_id UUID PRIMARY KEY REFERENCES wedding_registrations(id) ON DELETE CASCADE,
  main_title VARCHAR(255) DEFAULT 'Our Love Story',
  background_image_url TEXT,
  overlay_opacity DECIMAL(3,2) DEFAULT 0.60 CHECK (overlay_opacity BETWEEN 0 AND 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CREATE TABLE: love_story_blocks
-- ============================================================================

CREATE TABLE IF NOT EXISTS love_story_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL REFERENCES wedding_registrations(id) ON DELETE CASCADE,
  
  block_title VARCHAR(255) NOT NULL,
  block_body TEXT NOT NULL,
  story_date DATE, -- Optional: when this moment happened
  display_order INTEGER NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_love_story_blocks_registration 
  ON love_story_blocks(registration_id, display_order);

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_love_story_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_love_story_settings_updated_at
  BEFORE UPDATE ON love_story_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_love_story_settings_updated_at();

CREATE OR REPLACE FUNCTION update_love_story_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_love_story_blocks_updated_at
  BEFORE UPDATE ON love_story_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_love_story_blocks_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE love_story_settings IS 'Settings for love story section (title, background, overlay)';
COMMENT ON TABLE love_story_blocks IS 'Individual story blocks/chapters in the love story section';
COMMENT ON COLUMN love_story_blocks.story_date IS 'Optional date when this moment in the story happened';
