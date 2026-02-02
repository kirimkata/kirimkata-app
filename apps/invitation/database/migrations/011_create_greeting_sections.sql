-- Migration: 011_create_greeting_sections.sql
-- Description: Create greeting_sections table for opening greetings, quotes, verses
-- Date: 2026-02-02

-- ============================================================================
-- CREATE TABLE: greeting_sections
-- ============================================================================

CREATE TABLE IF NOT EXISTS greeting_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL REFERENCES wedding_registrations(id) ON DELETE CASCADE,
  
  -- Section identifier (e.g., 'opening', 'verse', 'welcome', 'quote')
  section_key VARCHAR(50) NOT NULL,
  
  -- Display order
  display_order INTEGER NOT NULL DEFAULT 1,
  
  -- Content
  title TEXT,
  subtitle TEXT,
  
  -- Optional: couple name display (for opening section)
  show_bride_name BOOLEAN DEFAULT false,
  show_groom_name BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT uq_greeting_section_key UNIQUE(registration_id, section_key)
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_greeting_sections_registration 
  ON greeting_sections(registration_id, display_order);

-- ============================================================================
-- CREATE TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_greeting_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_greeting_sections_updated_at
  BEFORE UPDATE ON greeting_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_greeting_sections_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE greeting_sections IS 'Greeting messages, verses, quotes displayed in the invitation';
COMMENT ON COLUMN greeting_sections.section_key IS 'Identifier for the section type (opening, verse, quote, etc.)';
COMMENT ON COLUMN greeting_sections.display_order IS 'Order in which sections appear on the page';
