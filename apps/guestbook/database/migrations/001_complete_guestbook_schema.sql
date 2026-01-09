-- =====================================================
-- COMPLETE GUESTBOOK SCHEMA - PRODUCTION READY
-- Menggunakan table yang sudah ada dari sistem undangan
-- Updated untuk AES encryption dan field guestbook_access
-- =====================================================

-- 1. ADD GUESTBOOK FEATURE FLAG TO CLIENTS TABLE
-- Client yang beli fitur guestbook akan punya akses penuh sebagai owner/admin
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS guestbook_access BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS staff_quota INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS staff_quota_used INTEGER DEFAULT 0;

COMMENT ON COLUMN clients.guestbook_access IS 'Flag untuk client yang membeli fitur guestbook - mereka dapat akses penuh ke semua fitur guestbook';
COMMENT ON COLUMN clients.staff_quota IS 'Jumlah maksimal staff yang bisa dibuat oleh client (diatur oleh admin kirimkata)';
COMMENT ON COLUMN clients.staff_quota_used IS 'Jumlah staff yang sudah dibuat oleh client';

-- 2. ADD GUESTBOOK FIELDS TO INVITATION_GUESTS TABLE
-- Gunakan invitation_guests sebagai data tamu, tambahkan field untuk guestbook
-- QR Code akan langsung menggunakan guest.id (UUID) untuk efisiensi maksimal
ALTER TABLE invitation_guests
ADD COLUMN IF NOT EXISTS guest_category VARCHAR(20) DEFAULT 'REGULAR' CHECK (guest_category IN ('REGULAR', 'VIP', 'VVIP')),
ADD COLUMN IF NOT EXISTS guest_group VARCHAR(100),
ADD COLUMN IF NOT EXISTS table_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS seat_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS seating_area VARCHAR(50),
ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN invitation_guests.guest_category IS 'Kategori tamu untuk entitlement: REGULAR, VIP, VVIP';
COMMENT ON COLUMN invitation_guests.guest_group IS 'Grup tamu untuk verifikasi (sekolah, pekerjaan, keluarga, dll)';
COMMENT ON COLUMN invitation_guests.table_number IS 'Nomor meja untuk seating arrangement (misal: T1, T2, VIP-1)';
COMMENT ON COLUMN invitation_guests.seat_number IS 'Nomor kursi dalam meja (misal: A1, A2, atau 1, 2, 3)';
COMMENT ON COLUMN invitation_guests.seating_area IS 'Area tempat duduk (misal: Main Hall, VIP Lounge, Outdoor)';
COMMENT ON COLUMN invitation_guests.notes IS 'Catatan tambahan untuk tamu';
COMMENT ON COLUMN invitation_guests.id IS 'UUID ini langsung digunakan sebagai QR token untuk check-in (hemat resource)';

-- 3. CREATE GUESTBOOK_STAFF TABLE
-- Staff dengan permission flags yang fleksibel
-- Password menggunakan AES encryption (format: ivHex:encryptedHex)
CREATE TABLE IF NOT EXISTS guestbook_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  username VARCHAR(100) NOT NULL,
  password_encrypted TEXT NOT NULL, -- AES format: ivHex:encryptedHex
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  
  -- Flexible permission flags
  can_checkin BOOLEAN DEFAULT false,
  can_redeem_souvenir BOOLEAN DEFAULT false,
  can_redeem_snack BOOLEAN DEFAULT false,
  can_access_vip_lounge BOOLEAN DEFAULT false,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_by VARCHAR(50), -- 'CLIENT' or 'ADMIN_KIRIMKATA'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  
  -- Unique username per client
  CONSTRAINT unique_staff_username_per_client UNIQUE(client_id, username)
);

CREATE INDEX idx_guestbook_staff_client ON guestbook_staff(client_id);
CREATE INDEX idx_guestbook_staff_username ON guestbook_staff(username);
CREATE INDEX idx_guestbook_staff_active ON guestbook_staff(is_active) WHERE is_active = true;

COMMENT ON TABLE guestbook_staff IS 'Staff yang dibuat oleh client untuk operasional guestbook dengan permission yang fleksibel';
COMMENT ON COLUMN guestbook_staff.password_encrypted IS 'Password encrypted dengan AES-256-CBC format: ivHex:encryptedHex (sama dengan clients.password_encrypted)';
COMMENT ON COLUMN guestbook_staff.can_checkin IS 'Akses untuk check-in tamu (usher)';
COMMENT ON COLUMN guestbook_staff.can_redeem_souvenir IS 'Akses untuk redeem souvenir';
COMMENT ON COLUMN guestbook_staff.can_redeem_snack IS 'Akses untuk redeem snack';
COMMENT ON COLUMN guestbook_staff.can_access_vip_lounge IS 'Akses untuk manage VIP lounge';

-- 4. CREATE GUESTBOOK_CHECKINS TABLE
-- Simplified check-in tracking
CREATE TABLE IF NOT EXISTS guestbook_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_id UUID NOT NULL REFERENCES invitation_guests(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES guestbook_staff(id) ON DELETE SET NULL,
  checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  check_in_method VARCHAR(20) NOT NULL CHECK (check_in_method IN ('QR_SCAN', 'MANUAL_SEARCH')),
  device_info JSONB,
  notes TEXT,
  
  -- Prevent duplicate check-ins
  CONSTRAINT unique_guest_checkin UNIQUE(guest_id)
);

CREATE INDEX idx_guestbook_checkins_guest ON guestbook_checkins(guest_id);
CREATE INDEX idx_guestbook_checkins_client ON guestbook_checkins(client_id);
CREATE INDEX idx_guestbook_checkins_staff ON guestbook_checkins(staff_id);
CREATE INDEX idx_guestbook_checkins_time ON guestbook_checkins(checked_in_at DESC);

COMMENT ON TABLE guestbook_checkins IS 'Record check-in tamu untuk guestbook';
COMMENT ON COLUMN guestbook_checkins.staff_id IS 'Staff yang melakukan check-in (NULL jika dilakukan oleh client owner)';

-- 5. CREATE GUESTBOOK_ENTITLEMENTS TABLE
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
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES guestbook_staff(id) ON DELETE SET NULL,
  entitlement_type VARCHAR(20) NOT NULL CHECK (entitlement_type IN ('VIP_LOUNGE', 'SOUVENIR', 'SNACK')),
  quantity INTEGER DEFAULT 1,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX idx_guestbook_redemptions_guest ON guestbook_redemptions(guest_id);
CREATE INDEX idx_guestbook_redemptions_client ON guestbook_redemptions(client_id);
CREATE INDEX idx_guestbook_redemptions_staff ON guestbook_redemptions(staff_id);
CREATE INDEX idx_guestbook_redemptions_type ON guestbook_redemptions(entitlement_type);
CREATE INDEX idx_guestbook_redemptions_time ON guestbook_redemptions(redeemed_at DESC);

COMMENT ON TABLE guestbook_redemptions IS 'Record pengambilan souvenir/snack oleh tamu';
COMMENT ON COLUMN guestbook_redemptions.staff_id IS 'Staff yang melakukan redemption (NULL jika dilakukan oleh client owner)';

-- 7. CREATE GUESTBOOK_AUDIT_LOGS TABLE
-- Simplified audit logging
CREATE TABLE IF NOT EXISTS guestbook_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES guestbook_staff(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(50),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_guestbook_audit_logs_client ON guestbook_audit_logs(client_id);
CREATE INDEX idx_guestbook_audit_logs_staff ON guestbook_audit_logs(staff_id);
CREATE INDEX idx_guestbook_audit_logs_time ON guestbook_audit_logs(created_at DESC);
CREATE INDEX idx_guestbook_audit_logs_action ON guestbook_audit_logs(action);

COMMENT ON TABLE guestbook_audit_logs IS 'Audit log untuk tracking aktivitas guestbook';

-- 8. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_invitation_guests_category ON invitation_guests(guest_category);
CREATE INDEX IF NOT EXISTS idx_invitation_guests_group ON invitation_guests(guest_group);
CREATE INDEX IF NOT EXISTS idx_invitation_guests_name_group ON invitation_guests(name, guest_group);
CREATE INDEX IF NOT EXISTS idx_invitation_guests_table ON invitation_guests(table_number);
CREATE INDEX IF NOT EXISTS idx_invitation_guests_seating_area ON invitation_guests(seating_area);
CREATE INDEX IF NOT EXISTS idx_invitation_guests_table_seat ON invitation_guests(table_number, seat_number);
CREATE INDEX IF NOT EXISTS idx_clients_guestbook_access ON clients(guestbook_access) WHERE guestbook_access = true;
-- Note: guest.id sudah memiliki PRIMARY KEY index yang optimal untuk QR lookup

-- 9. CREATE HELPER FUNCTION: update_updated_at_column (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. CREATE AUDIT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION guestbook_audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO guestbook_audit_logs (action, table_name, record_id, old_values, client_id, staff_id, ip_address)
    VALUES (
      TG_OP, 
      TG_TABLE_NAME, 
      OLD.id, 
      row_to_json(OLD),
      COALESCE(current_setting('app.current_client_id', true)::UUID, NULL),
      COALESCE(current_setting('app.current_staff_id', true)::UUID, NULL),
      COALESCE(current_setting('app.client_ip', true)::INET, NULL)
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO guestbook_audit_logs (action, table_name, record_id, old_values, new_values, client_id, staff_id, ip_address)
    VALUES (
      TG_OP, 
      TG_TABLE_NAME, 
      NEW.id, 
      row_to_json(OLD), 
      row_to_json(NEW),
      COALESCE(current_setting('app.current_client_id', true)::UUID, NULL),
      COALESCE(current_setting('app.current_staff_id', true)::UUID, NULL),
      COALESCE(current_setting('app.client_ip', true)::INET, NULL)
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO guestbook_audit_logs (action, table_name, record_id, new_values, client_id, staff_id, ip_address)
    VALUES (
      TG_OP, 
      TG_TABLE_NAME, 
      NEW.id, 
      row_to_json(NEW),
      COALESCE(current_setting('app.current_client_id', true)::UUID, NULL),
      COALESCE(current_setting('app.current_staff_id', true)::UUID, NULL),
      COALESCE(current_setting('app.client_ip', true)::INET, NULL)
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 11. TRIGGER: Update staff_quota_used when staff created/deleted
CREATE OR REPLACE FUNCTION update_client_staff_quota()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment quota used
    UPDATE clients 
    SET staff_quota_used = staff_quota_used + 1 
    WHERE id = NEW.client_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement quota used
    UPDATE clients 
    SET staff_quota_used = GREATEST(0, staff_quota_used - 1)
    WHERE id = OLD.client_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 12. TRIGGER: Prevent creating staff if quota exceeded
CREATE OR REPLACE FUNCTION check_staff_quota()
RETURNS TRIGGER AS $$
DECLARE
  v_quota INTEGER;
  v_used INTEGER;
BEGIN
  SELECT staff_quota, staff_quota_used 
  INTO v_quota, v_used
  FROM clients 
  WHERE id = NEW.client_id;
  
  IF v_used >= v_quota THEN
    RAISE EXCEPTION 'Staff quota exceeded. Maximum % staff allowed.', v_quota;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 13. HELPER FUNCTION: Auto-create entitlements based on guest category
CREATE OR REPLACE FUNCTION create_guest_entitlements(p_guest_id UUID, p_category VARCHAR)
RETURNS void AS $$
BEGIN
  -- Delete existing entitlements first
  DELETE FROM guestbook_entitlements WHERE guest_id = p_guest_id;
  
  -- Create entitlements based on category
  CASE p_category
    WHEN 'VVIP' THEN
      INSERT INTO guestbook_entitlements (guest_id, entitlement_type, is_entitled, max_quantity) VALUES
        (p_guest_id, 'VIP_LOUNGE', true, 1),
        (p_guest_id, 'SOUVENIR', true, 1),
        (p_guest_id, 'SNACK', true, 2);
    WHEN 'VIP' THEN
      INSERT INTO guestbook_entitlements (guest_id, entitlement_type, is_entitled, max_quantity) VALUES
        (p_guest_id, 'VIP_LOUNGE', true, 1),
        (p_guest_id, 'SOUVENIR', true, 1),
        (p_guest_id, 'SNACK', true, 1);
    WHEN 'REGULAR' THEN
      INSERT INTO guestbook_entitlements (guest_id, entitlement_type, is_entitled, max_quantity) VALUES
        (p_guest_id, 'SOUVENIR', true, 1);
  END CASE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_guest_entitlements IS 'Auto-create entitlements untuk tamu berdasarkan kategori';

-- 14. TRIGGER: Auto-create entitlements when guest category is set/updated
CREATE OR REPLACE FUNCTION auto_create_guest_entitlements()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create entitlements if category is set and changed
  IF NEW.guest_category IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.guest_category IS DISTINCT FROM NEW.guest_category) THEN
    PERFORM create_guest_entitlements(NEW.id, NEW.guest_category);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 15. HELPER FUNCTION: Get staff permissions summary
CREATE OR REPLACE FUNCTION get_staff_permissions(p_staff_id UUID)
RETURNS TEXT[] AS $$
DECLARE
  v_permissions TEXT[] := ARRAY[]::TEXT[];
  v_staff RECORD;
BEGIN
  SELECT * INTO v_staff FROM guestbook_staff WHERE id = p_staff_id;
  
  IF v_staff.can_checkin THEN
    v_permissions := array_append(v_permissions, 'CHECKIN');
  END IF;
  
  IF v_staff.can_redeem_souvenir THEN
    v_permissions := array_append(v_permissions, 'SOUVENIR');
  END IF;
  
  IF v_staff.can_redeem_snack THEN
    v_permissions := array_append(v_permissions, 'SNACK');
  END IF;
  
  IF v_staff.can_access_vip_lounge THEN
    v_permissions := array_append(v_permissions, 'VIP_LOUNGE');
  END IF;
  
  RETURN v_permissions;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_staff_permissions IS 'Get array of permissions untuk staff tertentu';

-- 16. APPLY ALL TRIGGERS
CREATE TRIGGER trigger_update_client_staff_quota
  AFTER INSERT OR DELETE ON guestbook_staff
  FOR EACH ROW
  EXECUTE FUNCTION update_client_staff_quota();

CREATE TRIGGER trigger_check_staff_quota
  BEFORE INSERT ON guestbook_staff
  FOR EACH ROW
  EXECUTE FUNCTION check_staff_quota();

CREATE TRIGGER trigger_update_guestbook_staff_updated_at
  BEFORE UPDATE ON guestbook_staff
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_auto_create_guest_entitlements
  AFTER INSERT OR UPDATE OF guest_category ON invitation_guests
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_guest_entitlements();

-- 17. APPLY AUDIT TRIGGERS
CREATE TRIGGER audit_guestbook_checkins 
  AFTER INSERT OR UPDATE OR DELETE ON guestbook_checkins
  FOR EACH ROW EXECUTE FUNCTION guestbook_audit_trigger_function();

CREATE TRIGGER audit_guestbook_redemptions 
  AFTER INSERT OR UPDATE OR DELETE ON guestbook_redemptions
  FOR EACH ROW EXECUTE FUNCTION guestbook_audit_trigger_function();

CREATE TRIGGER audit_guestbook_staff 
  AFTER INSERT OR UPDATE OR DELETE ON guestbook_staff
  FOR EACH ROW EXECUTE FUNCTION guestbook_audit_trigger_function();

-- 18. ROW LEVEL SECURITY (RLS)
ALTER TABLE guestbook_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE guestbook_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE guestbook_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE guestbook_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE guestbook_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Service role can access all data
CREATE POLICY "Service role can access all guestbook data" ON guestbook_staff 
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role can access all guestbook data" ON guestbook_checkins 
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role can access all guestbook data" ON guestbook_entitlements 
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role can access all guestbook data" ON guestbook_redemptions 
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role can access all guestbook data" ON guestbook_audit_logs 
  FOR ALL TO service_role USING (true);

-- 19. CREATE VIEWS FOR DASHBOARD
CREATE OR REPLACE VIEW guestbook_staff_with_permissions AS
SELECT 
  s.*,
  get_staff_permissions(s.id) as permissions,
  c.username as client_username,
  c.email as client_email
FROM guestbook_staff s
JOIN clients c ON c.id = s.client_id;

COMMENT ON VIEW guestbook_staff_with_permissions IS 'View staff dengan summary permissions untuk dashboard';

-- 20. SAMPLE DATA SETUP (Optional - for testing)
-- Uncomment lines below if you want to enable guestbook for existing clients

-- Enable guestbook access for all existing clients (for testing)
-- UPDATE clients SET guestbook_access = true WHERE guestbook_access IS NULL OR guestbook_access = false;

-- Set default guest category for existing guests
-- UPDATE invitation_guests SET guest_category = 'REGULAR' WHERE guest_category IS NULL;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Summary of changes:
-- 1. Added guestbook_access, staff_quota, staff_quota_used to clients table
-- 2. Added guestbook fields to invitation_guests table
-- 3. Created guestbook_staff table with AES password encryption
-- 4. Created guestbook_checkins, guestbook_entitlements, guestbook_redemptions tables
-- 5. Created guestbook_audit_logs table for audit trail
-- 6. Added all necessary indexes for performance
-- 7. Created helper functions and triggers for automation
-- 8. Applied Row Level Security policies
-- 9. Created views for dashboard functionality

-- IMPORTANT NOTES:
-- - Staff passwords are stored using AES encryption (ivHex:encryptedHex format)
-- - QR tokens are simply guest.id (UUID) for maximum efficiency
-- - Entitlements are auto-created based on guest_category
-- - Staff quota is enforced at database level
-- - All operations are audited automatically
-- - RLS is enabled for security
