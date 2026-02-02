-- Migration: 010_create_wedding_registrations.sql
-- Description: Create wedding_registrations table as source of truth for wedding data
-- Date: 2026-02-02

-- ============================================================================
-- CREATE TABLE: wedding_registrations
-- ============================================================================

CREATE TABLE IF NOT EXISTS wedding_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(255) NOT NULL UNIQUE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Event Type & Metadata
  event_type VARCHAR(50) NOT NULL DEFAULT 'islam', 
  -- Options: 'islam', 'kristen', 'katolik', 'hindu', 'buddha', 'custom'
  wedding_date DATE NOT NULL,
  timezone VARCHAR(10) DEFAULT 'WIB',
  
  -- Bride Info
  bride_name VARCHAR(100) NOT NULL,
  bride_full_name VARCHAR(255) NOT NULL,
  bride_father_name VARCHAR(255),
  bride_mother_name VARCHAR(255),
  bride_instagram VARCHAR(100),
  
  -- Groom Info
  groom_name VARCHAR(100) NOT NULL,
  groom_full_name VARCHAR(255) NOT NULL,
  groom_father_name VARCHAR(255),
  groom_mother_name VARCHAR(255),
  groom_instagram VARCHAR(100),
  
  -- Event 1 (Akad/Holy Matrimony)
  event1_title VARCHAR(100) DEFAULT 'Akad Nikah',
  event1_date DATE NOT NULL,
  event1_start_time TIME NOT NULL,
  event1_end_time TIME,
  event1_venue_name VARCHAR(255),
  event1_venue_address TEXT,
  event1_venue_city VARCHAR(100),
  event1_venue_province VARCHAR(100),
  event1_maps_url TEXT,
  
  -- Event 2 (Resepsi)
  event2_title VARCHAR(100) DEFAULT 'Resepsi',
  event2_date DATE,
  event2_start_time TIME,
  event2_end_time TIME,
  event2_venue_name VARCHAR(255),
  event2_venue_address TEXT,
  event2_venue_city VARCHAR(100),
  event2_venue_province VARCHAR(100),
  event2_maps_url TEXT,
  
  -- Streaming (if applicable)
  streaming_enabled BOOLEAN DEFAULT false,
  streaming_url TEXT,
  streaming_description TEXT,
  streaming_button_label VARCHAR(100) DEFAULT 'Watch Live',
  
  -- Physical Gift Address
  gift_recipient_name VARCHAR(255),
  gift_recipient_phone VARCHAR(20),
  gift_address_line1 TEXT,
  gift_address_line2 TEXT,
  gift_address_city VARCHAR(100),
  gift_address_province VARCHAR(100),
  gift_address_postal_code VARCHAR(10),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_wedding_registrations_slug 
  ON wedding_registrations(slug);

CREATE INDEX IF NOT EXISTS idx_wedding_registrations_client_id 
  ON wedding_registrations(client_id);

CREATE INDEX IF NOT EXISTS idx_wedding_registrations_wedding_date 
  ON wedding_registrations(wedding_date);

-- ============================================================================
-- CREATE TRIGGER: auto-update updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_wedding_registrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_wedding_registrations_updated_at
  BEFORE UPDATE ON wedding_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_wedding_registrations_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE wedding_registrations IS 'Source of truth for wedding registration data. Each row represents one wedding invitation.';
COMMENT ON COLUMN wedding_registrations.slug IS 'Unique URL identifier for the invitation (e.g., "siti-budi")';
COMMENT ON COLUMN wedding_registrations.event_type IS 'Type of wedding ceremony (determines default labels for events)';
COMMENT ON COLUMN wedding_registrations.timezone IS 'Timezone for event times (WIB/WITA/WIT)';
