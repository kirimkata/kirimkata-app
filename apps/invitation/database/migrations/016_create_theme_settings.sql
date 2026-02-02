-- Migration: 016_create_theme_settings.sql
-- Description: Create theme_settings table for theme selection and customization
-- Date: 2026-02-02

-- ============================================================================
-- CREATE TABLE: theme_settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS theme_settings (
  registration_id UUID PRIMARY KEY REFERENCES wedding_registrations(id) ON DELETE CASCADE,
  theme_key VARCHAR(100) DEFAULT 'premium/simple1',
  custom_images JSONB, -- Theme-specific image overrides (varies per theme)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CREATE TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_theme_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_theme_settings_updated_at
  BEFORE UPDATE ON theme_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_theme_settings_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE theme_settings IS 'Theme selection and theme-specific customizations';
COMMENT ON COLUMN theme_settings.theme_key IS 'Selected theme identifier (e.g., premium/simple1, premium/elegant)';
COMMENT ON COLUMN theme_settings.custom_images IS 'JSON object containing theme-specific image URL overrides';
