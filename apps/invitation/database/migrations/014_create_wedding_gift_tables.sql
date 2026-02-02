-- Migration: 014_create_wedding_gift_tables.sql
-- Description: Create wedding_gift_settings and wedding_gift_bank_accounts tables
-- Date: 2026-02-02

-- ============================================================================
-- CREATE TABLE: wedding_gift_settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS wedding_gift_settings (
  registration_id UUID PRIMARY KEY REFERENCES wedding_registrations(id) ON DELETE CASCADE,
  title VARCHAR(255) DEFAULT 'Wedding Gift',
  subtitle TEXT DEFAULT 'Doa restu Anda adalah hadiah terindah bagi kami. Namun jika ingin memberi hadiah, dapat melalui:',
  button_label VARCHAR(100) DEFAULT 'Kirim Hadiah',
  gift_image_url TEXT,
  background_overlay_opacity DECIMAL(3,2) DEFAULT 0.55 CHECK (background_overlay_opacity BETWEEN 0 AND 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CREATE TABLE: wedding_gift_bank_accounts
-- ============================================================================

CREATE TABLE IF NOT EXISTS wedding_gift_bank_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL REFERENCES wedding_registrations(id) ON DELETE CASCADE,
  
  bank_name VARCHAR(100) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  account_holder_name VARCHAR(255) NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 1,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_gift_bank_accounts_registration 
  ON wedding_gift_bank_accounts(registration_id, display_order);

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_wedding_gift_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_wedding_gift_settings_updated_at
  BEFORE UPDATE ON wedding_gift_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_wedding_gift_settings_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE wedding_gift_settings IS 'Settings and text for wedding gift section';
COMMENT ON TABLE wedding_gift_bank_accounts IS 'Bank account details for digital wedding gifts';
COMMENT ON COLUMN wedding_gift_bank_accounts.bank_name IS 'Bank name (BCA, Mandiri, BNI, etc.)';
