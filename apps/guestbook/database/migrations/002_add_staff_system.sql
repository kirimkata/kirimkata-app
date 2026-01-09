-- =====================================================
-- ADD STAFF SYSTEM WITH FLEXIBLE PERMISSIONS
-- Client dapat membuat staff dengan kombinasi akses
-- Admin kirimkata dapat mengatur quota staff per client
-- =====================================================

-- 1. ADD STAFF QUOTA TO CLIENTS TABLE
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS staff_quota INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS staff_quota_used INTEGER DEFAULT 0;

COMMENT ON COLUMN clients.staff_quota IS 'Jumlah maksimal staff yang bisa dibuat oleh client (diatur oleh admin kirimkata)';
COMMENT ON COLUMN clients.staff_quota_used IS 'Jumlah staff yang sudah dibuat oleh client';

-- 2. CREATE GUESTBOOK_STAFF TABLE
-- Staff dengan permission flags yang fleksibel
CREATE TABLE IF NOT EXISTS guestbook_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  username VARCHAR(100) NOT NULL,
  password_encrypted TEXT NOT NULL,
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
COMMENT ON COLUMN guestbook_staff.can_checkin IS 'Akses untuk check-in tamu (usher)';
COMMENT ON COLUMN guestbook_staff.can_redeem_souvenir IS 'Akses untuk redeem souvenir';
COMMENT ON COLUMN guestbook_staff.can_redeem_snack IS 'Akses untuk redeem snack';
COMMENT ON COLUMN guestbook_staff.can_access_vip_lounge IS 'Akses untuk manage VIP lounge';

-- 3. UPDATE CHECKINS TABLE - add staff_id
ALTER TABLE guestbook_checkins
ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES guestbook_staff(id) ON DELETE SET NULL;

CREATE INDEX idx_guestbook_checkins_staff ON guestbook_checkins(staff_id);

COMMENT ON COLUMN guestbook_checkins.staff_id IS 'Staff yang melakukan check-in (NULL jika dilakukan oleh client owner)';

-- 4. UPDATE REDEMPTIONS TABLE - add staff_id
ALTER TABLE guestbook_redemptions
ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES guestbook_staff(id) ON DELETE SET NULL;

CREATE INDEX idx_guestbook_redemptions_staff ON guestbook_redemptions(staff_id);

COMMENT ON COLUMN guestbook_redemptions.staff_id IS 'Staff yang melakukan redemption (NULL jika dilakukan oleh client owner)';

-- 5. TRIGGER: Update staff_quota_used when staff created/deleted
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

CREATE TRIGGER trigger_update_client_staff_quota
  AFTER INSERT OR DELETE ON guestbook_staff
  FOR EACH ROW
  EXECUTE FUNCTION update_client_staff_quota();

-- 6. TRIGGER: Prevent creating staff if quota exceeded
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

CREATE TRIGGER trigger_check_staff_quota
  BEFORE INSERT ON guestbook_staff
  FOR EACH ROW
  EXECUTE FUNCTION check_staff_quota();

-- 7. TRIGGER: Update updated_at timestamp
CREATE TRIGGER trigger_update_guestbook_staff_updated_at
  BEFORE UPDATE ON guestbook_staff
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. AUDIT TRIGGER for staff table
CREATE TRIGGER audit_guestbook_staff 
  AFTER INSERT OR UPDATE OR DELETE ON guestbook_staff
  FOR EACH ROW EXECUTE FUNCTION guestbook_audit_trigger_function();

-- 9. ROW LEVEL SECURITY
ALTER TABLE guestbook_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can access all staff data" ON guestbook_staff 
  FOR ALL TO service_role USING (true);

-- 10. HELPER FUNCTION: Get staff permissions summary
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

-- 11. VIEW: Staff with permissions summary
CREATE OR REPLACE VIEW guestbook_staff_with_permissions AS
SELECT 
  s.*,
  get_staff_permissions(s.id) as permissions,
  c.username as client_username,
  c.email as client_email
FROM guestbook_staff s
JOIN clients c ON c.id = s.client_id;

COMMENT ON VIEW guestbook_staff_with_permissions IS 'View staff dengan summary permissions untuk dashboard';
