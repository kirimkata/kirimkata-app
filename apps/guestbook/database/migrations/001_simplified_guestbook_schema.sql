-- =====================================================
-- MULTI-INVITATION GUESTBOOK SCHEMA
-- Support multiple invitations per client using invitation_id in invitation_guests
-- =====================================================

-- 1. ADD INVITATION_ID TO INVITATION_GUESTS FOR MULTI-INVITATION SUPPORT
-- Each guest belongs to a specific invitation (client can have multiple invitations)
ALTER TABLE invitation_guests
ADD COLUMN IF NOT EXISTS invitation_id VARCHAR(100);

-- Add guestbook settings per invitation via invitation_id
CREATE TABLE IF NOT EXISTS invitation_settings (
  invitation_id VARCHAR(100) PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  guestbook_enabled BOOLEAN DEFAULT false,
  guestbook_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invitation_settings_client ON invitation_settings(client_id);
CREATE INDEX idx_invitation_settings_guestbook ON invitation_settings(guestbook_enabled) WHERE guestbook_enabled = true;

COMMENT ON TABLE invitation_settings IS 'Settings per invitation termasuk guestbook enable/disable';
COMMENT ON COLUMN invitation_settings.guestbook_enabled IS 'Flag untuk invitation yang menggunakan fitur guestbook';
COMMENT ON COLUMN invitation_settings.guestbook_settings IS 'Settings khusus guestbook per invitation (theme, features, dll)';

-- 2. CREATE GUESTBOOK_CATEGORIES TABLE
-- Custom categories per invitation
CREATE TABLE IF NOT EXISTS guestbook_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invitation_id VARCHAR(100) NOT NULL REFERENCES invitation_settings(invitation_id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7), -- hex color code
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate category names per invitation
  CONSTRAINT unique_invitation_category UNIQUE(invitation_id, name)
);

CREATE INDEX idx_guestbook_categories_invitation ON guestbook_categories(invitation_id);
CREATE INDEX idx_guestbook_categories_active ON guestbook_categories(invitation_id, is_active) WHERE is_active = true;

COMMENT ON TABLE guestbook_categories IS 'Custom guest categories per invitation (REGULAR, VIP, VVIP, dll)';

-- 3. CREATE GUESTBOOK_CATEGORY_ENTITLEMENTS TABLE
-- Mapping categories to entitlements
CREATE TABLE IF NOT EXISTS guestbook_category_entitlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES guestbook_categories(id) ON DELETE CASCADE,
  entitlement_type VARCHAR(20) NOT NULL CHECK (entitlement_type IN ('VIP_LOUNGE', 'SOUVENIR', 'SNACK')),
  is_entitled BOOLEAN NOT NULL DEFAULT false,
  max_quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate entitlements per category
  CONSTRAINT unique_category_entitlement UNIQUE(category_id, entitlement_type)
);

CREATE INDEX idx_guestbook_category_entitlements_category ON guestbook_category_entitlements(category_id);
CREATE INDEX idx_guestbook_category_entitlements_type ON guestbook_category_entitlements(entitlement_type);

COMMENT ON TABLE guestbook_category_entitlements IS 'Template entitlements per category yang bisa diatur client';

-- 4. ADD GUESTBOOK FIELDS TO INVITATION_GUESTS TABLE
-- Gunakan invitation_guests sebagai data tamu, tambahkan field untuk guestbook
-- QR Code akan langsung menggunakan guest.id (UUID) untuk efisiensi maksimal
ALTER TABLE invitation_guests
ADD COLUMN IF NOT EXISTS guest_category_id UUID REFERENCES guestbook_categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS guest_group VARCHAR(100),
ADD COLUMN IF NOT EXISTS table_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS seat_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS seating_area VARCHAR(50),
ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN invitation_guests.guest_category_id IS 'Reference ke custom category yang dibuat client';
COMMENT ON COLUMN invitation_guests.guest_group IS 'Grup tamu untuk verifikasi (sekolah, pekerjaan, keluarga, dll)';
COMMENT ON COLUMN invitation_guests.table_number IS 'Nomor meja untuk seating arrangement (misal: T1, T2, VIP-1)';
COMMENT ON COLUMN invitation_guests.seat_number IS 'Nomor kursi dalam meja (misal: A1, A2, atau 1, 2, 3)';
COMMENT ON COLUMN invitation_guests.seating_area IS 'Area tempat duduk (misal: Main Hall, VIP Lounge, Outdoor)';
COMMENT ON COLUMN invitation_guests.notes IS 'Catatan tambahan untuk tamu';
COMMENT ON COLUMN invitation_guests.id IS 'UUID ini langsung digunakan sebagai QR token untuk check-in (hemat resource)';

-- 5. CREATE GUESTBOOK_CHECKINS TABLE
-- Simplified check-in tracking
CREATE TABLE IF NOT EXISTS guestbook_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_id UUID NOT NULL REFERENCES invitation_guests(id) ON DELETE CASCADE,
  invitation_id VARCHAR(100) NOT NULL REFERENCES invitation_settings(invitation_id) ON DELETE CASCADE,
  checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  check_in_method VARCHAR(20) NOT NULL CHECK (check_in_method IN ('QR_SCAN', 'MANUAL_SEARCH')),
  device_info JSONB,
  notes TEXT,
  
  -- Prevent duplicate check-ins
  CONSTRAINT unique_guest_checkin UNIQUE(guest_id)
);

CREATE INDEX idx_guestbook_checkins_guest ON guestbook_checkins(guest_id);
CREATE INDEX idx_guestbook_checkins_invitation ON guestbook_checkins(invitation_id);
CREATE INDEX idx_guestbook_checkins_time ON guestbook_checkins(checked_in_at DESC);

COMMENT ON TABLE guestbook_checkins IS 'Record check-in tamu untuk guestbook';

-- 4. CREATE GUESTBOOK_ENTITLEMENTS TABLE
-- Track entitlements per guest
CREATE TABLE IF NOT EXISTS guestbook_entitlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_id UUID NOT NULL REFERENCES invitation_guests(id) ON DELETE CASCADE,
  entitlement_type VARCHAR(20) NOT NULL CHECK (entitlement_type IN ('VIP_LOUNGE', 'SOUVENIR', 'SNACK')),
  is_entitled BOOLEAN NOT NULL DEFAULT false,
  max_quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate entitlements
  CONSTRAINT unique_guest_entitlement UNIQUE(guest_id, entitlement_type)
);

CREATE INDEX idx_guestbook_entitlements_guest ON guestbook_entitlements(guest_id);
CREATE INDEX idx_guestbook_entitlements_type ON guestbook_entitlements(entitlement_type);

COMMENT ON TABLE guestbook_entitlements IS 'Hak akses tamu berdasarkan kategori (VIP lounge, souvenir, snack)';

-- 6. CREATE GUESTBOOK_REDEMPTIONS TABLE
-- Track souvenir/snack redemptions
CREATE TABLE IF NOT EXISTS guestbook_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_id UUID NOT NULL REFERENCES invitation_guests(id) ON DELETE CASCADE,
  invitation_id VARCHAR(100) NOT NULL REFERENCES invitation_settings(invitation_id) ON DELETE CASCADE,
  staff_id UUID REFERENCES guestbook_staff(id) ON DELETE SET NULL,
  entitlement_type VARCHAR(20) NOT NULL CHECK (entitlement_type IN ('VIP_LOUNGE', 'SOUVENIR', 'SNACK')),
  quantity INTEGER DEFAULT 1,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX idx_guestbook_redemptions_guest ON guestbook_redemptions(guest_id);
CREATE INDEX idx_guestbook_redemptions_invitation ON guestbook_redemptions(invitation_id);
CREATE INDEX idx_guestbook_redemptions_staff ON guestbook_redemptions(staff_id);
CREATE INDEX idx_guestbook_redemptions_type ON guestbook_redemptions(entitlement_type);
CREATE INDEX idx_guestbook_redemptions_time ON guestbook_redemptions(redeemed_at DESC);

COMMENT ON TABLE guestbook_redemptions IS 'Record pengambilan souvenir/snack oleh tamu';

-- 7. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_invitation_guests_category ON invitation_guests(guest_category_id);
CREATE INDEX IF NOT EXISTS idx_invitation_guests_group ON invitation_guests(guest_group);
CREATE INDEX IF NOT EXISTS idx_invitation_guests_name_group ON invitation_guests(name, guest_group);
CREATE INDEX IF NOT EXISTS idx_invitation_guests_table ON invitation_guests(table_number);
CREATE INDEX IF NOT EXISTS idx_invitation_guests_seating_area ON invitation_guests(seating_area);
CREATE INDEX IF NOT EXISTS idx_invitation_guests_table_seat ON invitation_guests(table_number, seat_number);
CREATE INDEX IF NOT EXISTS idx_invitation_settings_guestbook_enabled ON invitation_settings(guestbook_enabled) WHERE guestbook_enabled = true;
-- Note: guest.id sudah memiliki PRIMARY KEY index yang optimal untuk QR lookup

-- 8. ROW LEVEL SECURITY (RLS)
ALTER TABLE guestbook_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE guestbook_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE guestbook_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Service role can access all data
CREATE POLICY "Service role can access all guestbook data" ON guestbook_checkins 
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role can access all guestbook data" ON guestbook_entitlements 
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role can access all guestbook data" ON guestbook_redemptions 
  FOR ALL TO service_role USING (true);


-- 9. DEFAULT CATEGORIES SETUP FUNCTION
-- Helper function to create default categories for new invitations
CREATE OR REPLACE FUNCTION create_default_guestbook_categories(p_invitation_id UUID)
RETURNS void AS $$
DECLARE
  regular_id UUID;
  vip_id UUID;
  vvip_id UUID;
BEGIN
  -- Create default categories
  INSERT INTO guestbook_categories (invitation_id, name, display_name, description, color) VALUES
    (p_invitation_id, 'REGULAR', 'Regular', 'Tamu reguler dengan akses standar', '#6B7280'),
    (p_invitation_id, 'VIP', 'VIP', 'Tamu VIP dengan akses premium', '#8B5CF6'),
    (p_invitation_id, 'VVIP', 'VVIP', 'Tamu VVIP dengan akses eksklusif', '#F59E0B')
  RETURNING id INTO regular_id, vip_id, vvip_id;

  -- Get the category IDs for entitlement setup
  SELECT id INTO regular_id FROM guestbook_categories WHERE invitation_id = p_invitation_id AND name = 'REGULAR';
  SELECT id INTO vip_id FROM guestbook_categories WHERE invitation_id = p_invitation_id AND name = 'VIP';
  SELECT id INTO vvip_id FROM guestbook_categories WHERE invitation_id = p_invitation_id AND name = 'VVIP';

  -- Create default entitlements for REGULAR
  INSERT INTO guestbook_category_entitlements (category_id, entitlement_type, is_entitled, max_quantity) VALUES
    (regular_id, 'SOUVENIR', true, 1),
    (regular_id, 'SNACK', false, 0),
    (regular_id, 'VIP_LOUNGE', false, 0);

  -- Create default entitlements for VIP
  INSERT INTO guestbook_category_entitlements (category_id, entitlement_type, is_entitled, max_quantity) VALUES
    (vip_id, 'SOUVENIR', true, 1),
    (vip_id, 'SNACK', true, 1),
    (vip_id, 'VIP_LOUNGE', true, 1);

  -- Create default entitlements for VVIP
  INSERT INTO guestbook_category_entitlements (category_id, entitlement_type, is_entitled, max_quantity) VALUES
    (vvip_id, 'SOUVENIR', true, 1),
    (vvip_id, 'SNACK', true, 2),
    (vvip_id, 'VIP_LOUNGE', true, 1);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_default_guestbook_categories IS 'Membuat kategori dan entitlements default untuk invitation baru';

-- 10. HELPER FUNCTION: Auto-create entitlements based on guest category
CREATE OR REPLACE FUNCTION create_guest_entitlements(p_guest_id UUID, p_category_id UUID)
RETURNS void AS $$
BEGIN
  -- Delete existing entitlements first
  DELETE FROM guestbook_entitlements WHERE guest_id = p_guest_id;
  
  -- Create entitlements based on category template
  INSERT INTO guestbook_entitlements (guest_id, entitlement_type, is_entitled, max_quantity)
  SELECT 
    p_guest_id,
    gce.entitlement_type,
    gce.is_entitled,
    gce.max_quantity
  FROM guestbook_category_entitlements gce
  WHERE gce.category_id = p_category_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_guest_entitlements IS 'Auto-create entitlements untuk tamu berdasarkan template kategori';

-- 11. TRIGGER: Auto-create entitlements when guest category is set/updated
CREATE OR REPLACE FUNCTION auto_create_guest_entitlements()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create entitlements if category is set and changed
  IF NEW.guest_category_id IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.guest_category_id IS DISTINCT FROM NEW.guest_category_id) THEN
    PERFORM create_guest_entitlements(NEW.id, NEW.guest_category_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_create_guest_entitlements
  AFTER INSERT OR UPDATE OF guest_category_id ON invitation_guests
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_guest_entitlements();
