-- =====================================================
-- SIMPLIFIED GUESTBOOK SEED DATA
-- Sample data untuk testing dengan integrasi sistem undangan
-- =====================================================

-- 1. ENABLE GUESTBOOK ACCESS FOR SAMPLE CLIENT
-- Asumsi: sudah ada client dengan username tertentu
-- Update client yang sudah ada untuk punya akses guestbook
UPDATE clients 
SET has_guestbook_access = true 
WHERE username IN ('testclient', 'admin');

-- Jika belum ada client, bisa insert sample client
-- Password hash untuk 'admin123': $2a$12$LQv3c1yqBWVHxkd0LQ4YCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm
INSERT INTO clients (username, password_encrypted, email, has_guestbook_access)
VALUES ('guestbook_demo', '$2a$12$LQv3c1yqBWVHxkd0LQ4YCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'demo@kirimkata.com', true)
ON CONFLICT (username) DO UPDATE SET has_guestbook_access = true;

-- 2. ADD SAMPLE GUESTS TO INVITATION_GUESTS
-- Menggunakan client_id dari client yang punya akses guestbook
DO $$
DECLARE
  v_client_id UUID;
  v_guest_id UUID;
BEGIN
  -- Get client ID
  SELECT id INTO v_client_id FROM clients WHERE username = 'guestbook_demo' LIMIT 1;
  
  IF v_client_id IS NOT NULL THEN
    -- Insert VVIP guests
    INSERT INTO invitation_guests (client_id, name, phone, guest_category, notes) VALUES
      (v_client_id, 'Budi Santoso', '081234567890', 'VVIP', 'Ayah pengantin pria'),
      (v_client_id, 'Siti Rahayu', '081234567891', 'VVIP', 'Ibu pengantin pria'),
      (v_client_id, 'Ahmad Wijaya', '081234567892', 'VVIP', 'Ayah pengantin wanita'),
      (v_client_id, 'Dewi Sartika', '081234567893', 'VVIP', 'Ibu pengantin wanita');
    
    -- Insert VIP guests
    INSERT INTO invitation_guests (client_id, name, phone, guest_category, notes) VALUES
      (v_client_id, 'Dr. Hendra Kusuma', '081234567894', 'VIP', 'Paman pengantin pria'),
      (v_client_id, 'Prof. Maria Indira', '081234567895', 'VIP', 'Bibi pengantin wanita'),
      (v_client_id, 'Ir. Bambang Sutrisno', '081234567896', 'VIP', 'Sahabat kuliah'),
      (v_client_id, 'Dra. Rina Kartika', '081234567897', 'VIP', 'Sahabat kerja'),
      (v_client_id, 'H. Abdul Rahman', '081234567898', 'VIP', 'Ketua RT'),
      (v_client_id, 'Hj. Fatimah Zahra', '081234567899', 'VIP', 'Ketua PKK');
    
    -- Insert REGULAR guests
    INSERT INTO invitation_guests (client_id, name, phone, guest_category, notes) VALUES
      (v_client_id, 'Andi Pratama', '081234567800', 'REGULAR', 'Rekan kerja'),
      (v_client_id, 'Lisa Permata', '081234567801', 'REGULAR', 'Rekan kerja'),
      (v_client_id, 'Rudi Hermawan', '081234567802', 'REGULAR', 'Teman sekolah'),
      (v_client_id, 'Maya Sari', '081234567803', 'REGULAR', 'Teman sekolah'),
      (v_client_id, 'Joko Widodo', '081234567804', 'REGULAR', 'Tetangga rumah'),
      (v_client_id, 'Sri Mulyani', '081234567805', 'REGULAR', 'Tetangga rumah'),
      (v_client_id, 'Agus Salim', '081234567806', 'REGULAR', 'Teman kampus'),
      (v_client_id, 'Indah Sari', '081234567807', 'REGULAR', 'Teman kampus'),
      (v_client_id, 'Dedi Kurniawan', '081234567808', 'REGULAR', 'Sepupu jauh'),
      (v_client_id, 'Ratna Dewi', '081234567809', 'REGULAR', 'Sepupu jauh');
    
    -- Entitlements akan otomatis dibuat oleh trigger
    
    -- 3. ADD SAMPLE CHECK-INS
    -- Simulate beberapa tamu yang sudah check-in
    INSERT INTO guestbook_checkins (guest_id, client_id, check_in_method, checked_in_at, notes)
    SELECT 
      ig.id,
      v_client_id,
      'QR_SCAN',
      NOW() - INTERVAL '30 minutes',
      'Check-in via QR code'
    FROM invitation_guests ig
    WHERE ig.client_id = v_client_id 
      AND ig.name IN ('Budi Santoso', 'Dr. Hendra Kusuma', 'Andi Pratama', 'Joko Widodo')
    LIMIT 4;
    
    -- 4. ADD SAMPLE REDEMPTIONS
    -- Simulate pengambilan souvenir
    INSERT INTO guestbook_redemptions (guest_id, client_id, entitlement_type, quantity, redeemed_at, notes)
    SELECT 
      gc.guest_id,
      v_client_id,
      'SOUVENIR',
      1,
      NOW() - INTERVAL '20 minutes',
      'Souvenir diambil'
    FROM guestbook_checkins gc
    WHERE gc.client_id = v_client_id
      AND EXISTS (
        SELECT 1 FROM guestbook_entitlements ge
        WHERE ge.guest_id = gc.guest_id 
          AND ge.entitlement_type = 'SOUVENIR'
          AND ge.is_entitled = true
      )
    LIMIT 2;
    
    -- Simulate pengambilan snack untuk VIP+
    INSERT INTO guestbook_redemptions (guest_id, client_id, entitlement_type, quantity, redeemed_at, notes)
    SELECT 
      gc.guest_id,
      v_client_id,
      'SNACK',
      1,
      NOW() - INTERVAL '15 minutes',
      'Snack diambil'
    FROM guestbook_checkins gc
    JOIN invitation_guests ig ON ig.id = gc.guest_id
    WHERE gc.client_id = v_client_id
      AND ig.guest_category IN ('VIP', 'VVIP')
      AND EXISTS (
        SELECT 1 FROM guestbook_entitlements ge
        WHERE ge.guest_id = gc.guest_id 
          AND ge.entitlement_type = 'SNACK'
          AND ge.is_entitled = true
      )
    LIMIT 1;
    
    RAISE NOTICE 'Sample guestbook data created successfully for client_id: %', v_client_id;
  ELSE
    RAISE NOTICE 'No client found with username guestbook_demo. Please create a client first.';
  END IF;
END $$;
