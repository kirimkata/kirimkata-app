-- Initial seed data for Digital Wedding Guestbook
-- This creates sample staff accounts and guest data for testing

-- Insert default admin staff
INSERT INTO staff (username, password_hash, full_name, role) VALUES 
('admin', '$2a$12$LQv3c1yqBWVHxkd0LQ4YCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'Administrator', 'ADMIN'), -- password: admin123
('usher1', '$2a$12$LQv3c1yqBWVHxkd0LQ4YCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'Usher Pertama', 'USHER'), -- password: admin123
('souvenir1', '$2a$12$LQv3c1yqBWVHxkd0LQ4YCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'Staff Souvenir', 'SOUVENIR'), -- password: admin123
('snack1', '$2a$12$LQv3c1yqBWVHxkd0LQ4YCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'Staff Snack', 'SNACK'); -- password: admin123

-- Insert sample guests with different categories
INSERT INTO guests (guest_code, name, category, group_name, phone, notes) VALUES 
-- VVIP Guests
('GB001', 'Budi Santoso', 'VVIP', 'Keluarga Pengantin Pria', '081234567890', 'Ayah pengantin pria'),
('GB002', 'Siti Rahayu', 'VVIP', 'Keluarga Pengantin Pria', '081234567891', 'Ibu pengantin pria'),
('GB003', 'Ahmad Wijaya', 'VVIP', 'Keluarga Pengantin Wanita', '081234567892', 'Ayah pengantin wanita'),
('GB004', 'Dewi Sartika', 'VVIP', 'Keluarga Pengantin Wanita', '081234567893', 'Ibu pengantin wanita'),

-- VIP Guests
('GB005', 'Dr. Hendra Kusuma', 'VIP', 'Keluarga Besar', '081234567894', 'Paman pengantin pria'),
('GB006', 'Prof. Maria Indira', 'VIP', 'Keluarga Besar', '081234567895', 'Bibi pengantin wanita'),
('GB007', 'Ir. Bambang Sutrisno', 'VIP', 'Teman Dekat', '081234567896', 'Sahabat kuliah'),
('GB008', 'Dra. Rina Kartika', 'VIP', 'Teman Dekat', '081234567897', 'Sahabat kerja'),
('GB009', 'H. Abdul Rahman', 'VIP', 'Tokoh Masyarakat', '081234567898', 'Ketua RT'),
('GB010', 'Hj. Fatimah Zahra', 'VIP', 'Tokoh Masyarakat', '081234567899', 'Ketua PKK'),

-- Regular Guests
('GB011', 'Andi Pratama', 'REGULAR', 'Teman Kantor', '081234567800', 'Rekan kerja'),
('GB012', 'Lisa Permata', 'REGULAR', 'Teman Kantor', '081234567801', 'Rekan kerja'),
('GB013', 'Rudi Hermawan', 'REGULAR', 'Teman SMA', '081234567802', 'Teman sekolah'),
('GB014', 'Maya Sari', 'REGULAR', 'Teman SMA', '081234567803', 'Teman sekolah'),
('GB015', 'Joko Widodo', 'REGULAR', 'Tetangga', '081234567804', 'Tetangga rumah'),
('GB016', 'Sri Mulyani', 'REGULAR', 'Tetangga', '081234567805', 'Tetangga rumah'),
('GB017', 'Agus Salim', 'REGULAR', 'Teman Kuliah', '081234567806', 'Teman kampus'),
('GB018', 'Indah Sari', 'REGULAR', 'Teman Kuliah', '081234567807', 'Teman kampus'),
('GB019', 'Dedi Kurniawan', 'REGULAR', 'Keluarga Jauh', '081234567808', 'Sepupu jauh'),
('GB020', 'Ratna Dewi', 'REGULAR', 'Keluarga Jauh', '081234567809', 'Sepupu jauh');

-- Set up entitlements based on guest categories
-- VVIP: All entitlements
INSERT INTO entitlements (guest_id, entitlement_type, is_entitled, max_quantity)
SELECT 
    g.id, 
    et.type,
    true,
    CASE 
        WHEN et.type = 'SNACK' THEN 2
        ELSE 1
    END
FROM guests g
CROSS JOIN (
    VALUES ('VIP_LOUNGE'), ('SOUVENIR'), ('SNACK')
) AS et(type)
WHERE g.category = 'VVIP';

-- VIP: VIP Lounge + Souvenir + Limited Snack
INSERT INTO entitlements (guest_id, entitlement_type, is_entitled, max_quantity)
SELECT 
    g.id, 
    et.type,
    true,
    CASE 
        WHEN et.type = 'SNACK' THEN 1
        ELSE 1
    END
FROM guests g
CROSS JOIN (
    VALUES ('VIP_LOUNGE'), ('SOUVENIR'), ('SNACK')
) AS et(type)
WHERE g.category = 'VIP';

-- REGULAR: Only Souvenir
INSERT INTO entitlements (guest_id, entitlement_type, is_entitled, max_quantity)
SELECT 
    g.id, 
    'SOUVENIR',
    true,
    1
FROM guests g
WHERE g.category = 'REGULAR';

-- Add some sample check-ins (for testing dashboard)
WITH sample_staff AS (
    SELECT id FROM staff WHERE role = 'USHER' LIMIT 1
),
sample_guests AS (
    SELECT id FROM guests WHERE guest_code IN ('GB001', 'GB005', 'GB011', 'GB015') 
)
INSERT INTO checkins (guest_id, staff_id, method, checked_in_at)
SELECT 
    sg.id,
    ss.id,
    'QR_SCAN',
    NOW() - INTERVAL '30 minutes'
FROM sample_guests sg, sample_staff ss;

-- Add some sample redemptions
WITH sample_staff_souvenir AS (
    SELECT id FROM staff WHERE role = 'SOUVENIR' LIMIT 1
),
sample_staff_snack AS (
    SELECT id FROM staff WHERE role = 'SNACK' LIMIT 1
),
checked_in_guests AS (
    SELECT DISTINCT guest_id FROM checkins
)
INSERT INTO redemptions (guest_id, staff_id, entitlement_type, quantity, redeemed_at)
SELECT 
    cig.guest_id,
    sss.id,
    'SOUVENIR',
    1,
    NOW() - INTERVAL '20 minutes'
FROM checked_in_guests cig, sample_staff_souvenir sss
WHERE EXISTS (
    SELECT 1 FROM entitlements e 
    WHERE e.guest_id = cig.guest_id 
    AND e.entitlement_type = 'SOUVENIR' 
    AND e.is_entitled = true
)
LIMIT 2;

-- Insert snack redemptions for VIP+ guests
INSERT INTO redemptions (guest_id, staff_id, entitlement_type, quantity, redeemed_at)
SELECT 
    cig.guest_id,
    ssn.id,
    'SNACK',
    1,
    NOW() - INTERVAL '15 minutes'
FROM checked_in_guests cig, sample_staff_snack ssn
WHERE EXISTS (
    SELECT 1 FROM entitlements e 
    JOIN guests g ON g.id = e.guest_id
    WHERE e.guest_id = cig.guest_id 
    AND e.entitlement_type = 'SNACK' 
    AND e.is_entitled = true
    AND g.category IN ('VIP', 'VVIP')
)
LIMIT 1;
