-- Migration script to transform existing data to new schema
-- This script migrates from the old invitation_guests based system to the new events-centered schema

BEGIN;

-- Step 1: Create a default event for each client based on their existing data
INSERT INTO events (id, client_id, name, event_date, location, use_invitation, use_guestbook, allow_walkin, require_invitation, auto_generate_qr, is_active)
SELECT 
    gen_random_uuid(),
    c.id,
    COALESCE(ic.groom_name || ' & ' || ic.bride_name, c.username || ' Wedding') as name,
    ic.wedding_date,
    ic.venue_name,
    true, -- use_invitation
    c.guestbook_access, -- use_guestbook (from old client.guestbook_access)
    false, -- allow_walkin
    true, -- require_invitation
    true, -- auto_generate_qr
    true -- is_active
FROM clients c
LEFT JOIN invitation_contents ic ON c.slug = ic.slug
WHERE NOT EXISTS (
    SELECT 1 FROM events e WHERE e.client_id = c.id
);

-- Step 2: Create default guest types for each event
-- VIP guest type
INSERT INTO guest_types (id, event_id, name, description, sort_order)
SELECT 
    gen_random_uuid(),
    e.id,
    'VIP',
    'Tamu VIP dengan fasilitas khusus',
    1
FROM events e
WHERE NOT EXISTS (
    SELECT 1 FROM guest_types gt WHERE gt.event_id = e.id AND gt.name = 'VIP'
);

-- VVIP guest type
INSERT INTO guest_types (id, event_id, name, description, sort_order)
SELECT 
    gen_random_uuid(),
    e.id,
    'VVIP',
    'Tamu VVIP dengan fasilitas premium',
    2
FROM events e
WHERE NOT EXISTS (
    SELECT 1 FROM guest_types gt WHERE gt.event_id = e.id AND gt.name = 'VVIP'
);

-- Regular guest type
INSERT INTO guest_types (id, event_id, name, description, sort_order)
SELECT 
    gen_random_uuid(),
    e.id,
    'Regular',
    'Tamu reguler',
    3
FROM events e
WHERE NOT EXISTS (
    SELECT 1 FROM guest_types gt WHERE gt.event_id = e.id AND gt.name = 'Regular'
);

-- Step 3: Add benefits for guest types
-- VIP benefits
INSERT INTO guest_type_benefits (id, guest_type_id, benefit_key, benefit_value)
SELECT 
    gen_random_uuid(),
    gt.id,
    'souvenir',
    '1'
FROM guest_types gt
WHERE gt.name = 'VIP'
AND NOT EXISTS (
    SELECT 1 FROM guest_type_benefits gtb 
    WHERE gtb.guest_type_id = gt.id AND gtb.benefit_key = 'souvenir'
);

INSERT INTO guest_type_benefits (id, guest_type_id, benefit_key, benefit_value)
SELECT 
    gen_random_uuid(),
    gt.id,
    'snack',
    '1'
FROM guest_types gt
WHERE gt.name = 'VIP'
AND NOT EXISTS (
    SELECT 1 FROM guest_type_benefits gtb 
    WHERE gtb.guest_type_id = gt.id AND gtb.benefit_key = 'snack'
);

-- VVIP benefits
INSERT INTO guest_type_benefits (id, guest_type_id, benefit_key, benefit_value)
SELECT 
    gen_random_uuid(),
    gt.id,
    'souvenir',
    '1'
FROM guest_types gt
WHERE gt.name = 'VVIP'
AND NOT EXISTS (
    SELECT 1 FROM guest_type_benefits gtb 
    WHERE gtb.guest_type_id = gt.id AND gtb.benefit_key = 'souvenir'
);

INSERT INTO guest_type_benefits (id, guest_type_id, benefit_key, benefit_value)
SELECT 
    gen_random_uuid(),
    gt.id,
    'snack',
    '1'
FROM guest_types gt
WHERE gt.name = 'VVIP'
AND NOT EXISTS (
    SELECT 1 FROM guest_type_benefits gtb 
    WHERE gtb.guest_type_id = gt.id AND gtb.benefit_key = 'snack'
);

INSERT INTO guest_type_benefits (id, guest_type_id, benefit_key, benefit_value)
SELECT 
    gen_random_uuid(),
    gt.id,
    'vip_lounge',
    '1'
FROM guest_types gt
WHERE gt.name = 'VVIP'
AND NOT EXISTS (
    SELECT 1 FROM guest_type_benefits gtb 
    WHERE gtb.guest_type_id = gt.id AND gtb.benefit_key = 'vip_lounge'
);

-- Step 4: Migrate invitation_guests to event_guests
INSERT INTO event_guests (
    id, 
    event_id, 
    source, 
    guest_name, 
    guest_phone, 
    guest_email, 
    guest_type_id, 
    should_send_invitation, 
    invitation_sent, 
    invitation_sent_at, 
    qr_code, 
    is_checked_in, 
    checked_in_at, 
    checked_in_by, 
    max_companions, 
    notes, 
    created_at, 
    updated_at, 
    created_by
)
SELECT 
    ig.id,
    e.id as event_id,
    'registered' as source,
    ig.name as guest_name,
    ig.phone as guest_phone,
    NULL as guest_email, -- old schema didn't have email
    gt.id as guest_type_id,
    ig.sent as should_send_invitation,
    ig.sent as invitation_sent,
    CASE WHEN ig.sent THEN ig.updated_at ELSE NULL END as invitation_sent_at,
    ig.id as qr_code, -- Use guest ID as QR code for simplicity
    COALESCE(gc.checked_in_at IS NOT NULL, false) as is_checked_in,
    gc.checked_in_at,
    gs.id as checked_in_by, -- Map to staff if exists
    0 as max_companions,
    COALESCE(ig.notes, '') as notes,
    ig.created_at,
    ig.updated_at,
    ig.client_id as created_by
FROM invitation_guests ig
JOIN clients c ON ig.client_id = c.id
JOIN events e ON e.client_id = c.id
LEFT JOIN guest_types gt ON gt.event_id = e.id AND (
    (ig.guest_category = 'VIP' AND gt.name = 'VIP') OR
    (ig.guest_category = 'VVIP' AND gt.name = 'VVIP') OR
    (ig.guest_category = 'REGULAR' AND gt.name = 'Regular')
)
LEFT JOIN guestbook_checkins gc ON gc.guest_id = ig.id
LEFT JOIN guestbook_staff gs ON gs.id = gc.staff_id
WHERE NOT EXISTS (
    SELECT 1 FROM event_guests eg WHERE eg.id = ig.id
);

-- Step 5: Migrate guestbook_staff to staffs (event-based)
INSERT INTO staffs (id, event_id, name, staff_type, pin_code, is_active, created_at)
SELECT 
    gen_random_uuid(),
    e.id as event_id,
    gs.full_name as name,
    CASE 
        WHEN gs.can_checkin THEN 'usher'
        WHEN gs.can_redeem_souvenir THEN 'souvenir'
        WHEN gs.can_redeem_snack THEN 'snack'
        ELSE 'admin'
    END as staff_type,
    LPAD((RANDOM() * 9999)::INT::TEXT, 4, '0') as pin_code, -- Generate random 4-digit PIN
    gs.is_active,
    gs.created_at
FROM guestbook_staff gs
JOIN clients c ON gs.client_id = c.id
JOIN events e ON e.client_id = c.id
WHERE NOT EXISTS (
    SELECT 1 FROM staffs s WHERE s.name = gs.full_name AND s.event_id = e.id
);

-- Step 6: Create staff logs from existing checkin data
INSERT INTO staff_logs (id, staff_id, event_guest_id, action, notes, created_at)
SELECT 
    gen_random_uuid(),
    s.id as staff_id,
    eg.id as event_guest_id,
    'checkin' as action,
    gc.notes,
    gc.checked_in_at as created_at
FROM guestbook_checkins gc
JOIN event_guests eg ON eg.id = gc.guest_id
JOIN events e ON e.id = eg.event_id
JOIN guestbook_staff gs ON gs.id = gc.staff_id
JOIN staffs s ON s.event_id = e.id AND s.name = gs.full_name
WHERE NOT EXISTS (
    SELECT 1 FROM staff_logs sl 
    WHERE sl.staff_id = s.id AND sl.event_guest_id = eg.id AND sl.action = 'checkin'
);

-- Step 7: Create invitation history from existing sent invitations
INSERT INTO invitation_history (id, event_guest_id, sent_at, sent_via, status, error_message)
SELECT 
    gen_random_uuid(),
    eg.id as event_guest_id,
    eg.invitation_sent_at as sent_at,
    'whatsapp' as sent_via, -- Assume WhatsApp as default
    'sent' as status,
    NULL as error_message
FROM event_guests eg
WHERE eg.invitation_sent = true
AND eg.invitation_sent_at IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM invitation_history ih WHERE ih.event_guest_id = eg.id
);

-- Step 8: Update clients table to remove guestbook_access and add new quotas
ALTER TABLE clients DROP COLUMN IF EXISTS guestbook_access;
ALTER TABLE clients DROP COLUMN IF EXISTS staff_quota;
ALTER TABLE clients DROP COLUMN IF EXISTS staff_quota_used;

-- Add new quota columns if they don't exist
ALTER TABLE clients ADD COLUMN IF NOT EXISTS quota_photos INTEGER DEFAULT 100;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS quota_music INTEGER DEFAULT 10;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS quota_videos INTEGER DEFAULT 5;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS message_template TEXT;

-- Step 9: Update message template with default
UPDATE clients 
SET message_template = 'Assalamualaikum Wr. Wb.

Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara pernikahan kami.

Atas kehadiran dan doa restunya, kami ucapkan terima kasih.

Wassalamualaikum Wr. Wb.'
WHERE message_template IS NULL;

COMMIT;

-- Note: After running this migration, you may want to:
-- 1. Verify the data migration was successful
-- 2. Drop the old tables (invitation_guests, guestbook_staff, guestbook_checkins, etc.) if no longer needed
-- 3. Update any remaining application code that references the old tables
