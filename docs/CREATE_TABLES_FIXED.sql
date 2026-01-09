-- ============================================================================
-- DATABASE SCHEMA: Invitation & Guestbook System (PRODUCTION VERSION)
-- ============================================================================
-- Description: Complete database schema untuk sistem undangan digital dan 
--              guestbook management dengan multi-event support
-- Version: 2.0 (Updated with actual production schema)
-- Created: 2026-01-07
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SECTION 1: TRIGGER FUNCTIONS
-- ============================================================================

-- Generic function untuk update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function untuk update admins.updated_at
CREATE OR REPLACE FUNCTION update_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function untuk update clients.updated_at
CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function untuk enforce staff quota
CREATE OR REPLACE FUNCTION enforce_staff_quota()
RETURNS TRIGGER AS $$
DECLARE
    v_max_staff INTEGER;
    v_staff_used INTEGER;
BEGIN
    -- Get quota info
    SELECT max_staff, staff_used 
    INTO v_max_staff, v_staff_used
    FROM client_staff_quota
    WHERE client_id = NEW.client_id;
    
    -- Check if quota exists
    IF NOT FOUND THEN
        -- Create default quota if not exists
        INSERT INTO client_staff_quota (client_id, max_staff, staff_used)
        VALUES (NEW.client_id, 10, 0);
        v_max_staff := 10;
        v_staff_used := 0;
    END IF;
    
    -- Check if quota exceeded
    IF v_staff_used >= v_max_staff THEN
        RAISE EXCEPTION 'Staff quota exceeded for client_id: %. Max: %, Used: %', 
            NEW.client_id, v_max_staff, v_staff_used;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function untuk increment staff quota
CREATE OR REPLACE FUNCTION increment_staff_quota()
RETURNS TRIGGER AS $$
BEGIN
    -- Increment staff_used
    INSERT INTO client_staff_quota (client_id, staff_used)
    VALUES (NEW.client_id, 1)
    ON CONFLICT (client_id) 
    DO UPDATE SET 
        staff_used = client_staff_quota.staff_used + 1,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function untuk decrement staff quota
CREATE OR REPLACE FUNCTION decrement_staff_quota()
RETURNS TRIGGER AS $$
BEGIN
    -- Decrement staff_used
    UPDATE client_staff_quota
    SET 
        staff_used = GREATEST(staff_used - 1, 0),
        updated_at = NOW()
    WHERE client_id = OLD.client_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function untuk update guest check-in status
CREATE OR REPLACE FUNCTION update_guest_checkin_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update is_checked_in and checked_in_at in invitation_guests
    UPDATE invitation_guests
    SET 
        is_checked_in = TRUE,
        checked_in_at = NEW.checked_in_at,
        updated_at = NOW()
    WHERE id = NEW.guest_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 2: CORE TABLES (EXISTING - PRODUCTION SCHEMA)
-- ============================================================================

-- Table: admins
-- Purpose: Internal admin credentials untuk mengelola sistem
CREATE TABLE IF NOT EXISTS admins (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    username VARCHAR(255) NOT NULL,
    password_encrypted TEXT NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    CONSTRAINT admins_pkey PRIMARY KEY (id),
    CONSTRAINT admins_username_key UNIQUE (username)
) TABLESPACE pg_default;

-- Table: invitation_contents (MUST BE CREATED BEFORE clients due to FK)
-- Purpose: Konten undangan digital (profil, event, galeri, dll)
CREATE TABLE IF NOT EXISTS invitation_contents (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    slug TEXT NOT NULL,
    client_profile JSONB NOT NULL,
    bride JSONB NOT NULL,
    groom JSONB NOT NULL,
    event JSONB NOT NULL,
    clouds JSONB NOT NULL,
    event_cloud JSONB NOT NULL,
    love_story JSONB NOT NULL,
    gallery JSONB NOT NULL,
    wedding_gift JSONB NOT NULL,
    closing JSONB NOT NULL,
    background_music JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    theme_key TEXT DEFAULT 'parallax/parallax-custom1',
    custom_images JSONB,
    CONSTRAINT invitation_contents_pkey PRIMARY KEY (id),
    CONSTRAINT invitation_contents_slug_key UNIQUE (slug)
) TABLESPACE pg_default;

-- Table: clients
-- Purpose: Data akun client/pengguna yang membuat undangan dan guestbook
CREATE TABLE IF NOT EXISTS clients (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    username VARCHAR(255) NOT NULL,
    password_encrypted TEXT NOT NULL,
    email VARCHAR(255),
    slug VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    quota_photos INTEGER DEFAULT 10,
    quota_music INTEGER DEFAULT 1,
    quota_videos INTEGER DEFAULT 1,
    message_template TEXT,
    guestbook_access BOOLEAN DEFAULT FALSE,
    CONSTRAINT clients_pkey PRIMARY KEY (id),
    CONSTRAINT clients_slug_key UNIQUE (slug),
    CONSTRAINT clients_username_key UNIQUE (username),
    CONSTRAINT fk_clients_slug 
        FOREIGN KEY (slug) 
        REFERENCES invitation_contents(slug) 
        ON DELETE SET NULL
) TABLESPACE pg_default;

-- Table: client_media
-- Purpose: Metadata file yang diunggah client (foto, musik, video)
CREATE TABLE IF NOT EXISTS client_media (
    id SERIAL NOT NULL,
    client_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT client_media_pkey PRIMARY KEY (id),
    CONSTRAINT client_media_client_id_fkey 
        FOREIGN KEY (client_id) 
        REFERENCES clients(id) 
        ON DELETE CASCADE
) TABLESPACE pg_default;

-- Table: invitation_guests (BASE VERSION - will be extended)
-- Purpose: Daftar tamu untuk undangan dan guestbook
CREATE TABLE IF NOT EXISTS invitation_guests (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sent BOOLEAN DEFAULT FALSE,
    CONSTRAINT invitation_guests_pkey PRIMARY KEY (id),
    CONSTRAINT fk_client_id 
        FOREIGN KEY (client_id) 
        REFERENCES clients(id) 
        ON DELETE CASCADE
) TABLESPACE pg_default;

-- Table: wishes
-- Purpose: Ucapan dan konfirmasi kehadiran dari tamu
CREATE TABLE IF NOT EXISTS wishes (
    id BIGSERIAL NOT NULL,
    invitation_slug TEXT NOT NULL,
    name TEXT NOT NULL,
    message TEXT NOT NULL,
    attendance TEXT NOT NULL,
    guest_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT wishes_pkey PRIMARY KEY (id),
    CONSTRAINT wishes_attendance_check 
        CHECK (attendance = ANY (ARRAY['hadir'::text, 'tidak-hadir'::text, 'masih-ragu'::text]))
) TABLESPACE pg_default;

-- ============================================================================
-- SECTION 3: EXTEND INVITATION_GUESTS FOR GUESTBOOK
-- ============================================================================

-- Add guestbook columns to invitation_guests if not exists
DO $$ 
BEGIN
    -- event_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invitation_guests' AND column_name = 'event_id'
    ) THEN
        ALTER TABLE invitation_guests ADD COLUMN event_id UUID;
    END IF;

    -- guest_code
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invitation_guests' AND column_name = 'guest_code'
    ) THEN
        ALTER TABLE invitation_guests ADD COLUMN guest_code VARCHAR(50) UNIQUE;
    END IF;

    -- qr_code
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invitation_guests' AND column_name = 'qr_code'
    ) THEN
        ALTER TABLE invitation_guests ADD COLUMN qr_code TEXT;
    END IF;

    -- guest_type_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invitation_guests' AND column_name = 'guest_type_id'
    ) THEN
        ALTER TABLE invitation_guests ADD COLUMN guest_type_id UUID;
    END IF;

    -- source
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invitation_guests' AND column_name = 'source'
    ) THEN
        ALTER TABLE invitation_guests ADD COLUMN source VARCHAR(20) DEFAULT 'registered';
        ALTER TABLE invitation_guests ADD CONSTRAINT check_source 
            CHECK (source IN ('registered', 'walkin'));
    END IF;

    -- max_companions
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invitation_guests' AND column_name = 'max_companions'
    ) THEN
        ALTER TABLE invitation_guests ADD COLUMN max_companions INTEGER DEFAULT 0;
    END IF;

    -- actual_companions
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invitation_guests' AND column_name = 'actual_companions'
    ) THEN
        ALTER TABLE invitation_guests ADD COLUMN actual_companions INTEGER DEFAULT 0;
    END IF;

    -- table_number
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invitation_guests' AND column_name = 'table_number'
    ) THEN
        ALTER TABLE invitation_guests ADD COLUMN table_number INTEGER;
    END IF;

    -- seat_number
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invitation_guests' AND column_name = 'seat_number'
    ) THEN
        ALTER TABLE invitation_guests ADD COLUMN seat_number VARCHAR(20);
    END IF;

    -- seating_area
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invitation_guests' AND column_name = 'seating_area'
    ) THEN
        ALTER TABLE invitation_guests ADD COLUMN seating_area VARCHAR(100);
    END IF;

    -- is_checked_in
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invitation_guests' AND column_name = 'is_checked_in'
    ) THEN
        ALTER TABLE invitation_guests ADD COLUMN is_checked_in BOOLEAN DEFAULT FALSE;
    END IF;

    -- checked_in_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invitation_guests' AND column_name = 'checked_in_at'
    ) THEN
        ALTER TABLE invitation_guests ADD COLUMN checked_in_at TIMESTAMPTZ;
    END IF;

    -- notes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invitation_guests' AND column_name = 'notes'
    ) THEN
        ALTER TABLE invitation_guests ADD COLUMN notes TEXT;
    END IF;
END $$;

-- ============================================================================
-- SECTION 4: GUESTBOOK TABLES (NEW)
-- ============================================================================

-- Table: events
-- Purpose: Multiple events per client (wedding, reception, etc)
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME,
    venue_name VARCHAR(255),
    venue_address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    staff_quota INTEGER DEFAULT 5,
    staff_quota_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_events_client
        FOREIGN KEY (client_id)
        REFERENCES clients(id)
        ON DELETE CASCADE
);

-- Idempotent patch: ensure event-level staff quota columns exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events' AND column_name = 'staff_quota'
    ) THEN
        ALTER TABLE events ADD COLUMN staff_quota INTEGER DEFAULT 5;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events' AND column_name = 'staff_quota_used'
    ) THEN
        ALTER TABLE events ADD COLUMN staff_quota_used INTEGER DEFAULT 0;
    END IF;
END $$;

-- Index to speed up queries by event
CREATE INDEX IF NOT EXISTS idx_events_client_id ON events(client_id);

-- Table: guest_types
-- Purpose: Kategori tamu (REGULAR, VIP, VVIP) dengan benefit berbeda
CREATE TABLE IF NOT EXISTS guest_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL,
    type_name VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    color_code VARCHAR(20),
    priority_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_guest_types_client
        FOREIGN KEY (client_id)
        REFERENCES clients(id)
        ON DELETE CASCADE,
    CONSTRAINT unique_guest_type_per_client
        UNIQUE (client_id, type_name)
);

-- Table: guest_type_benefits
-- Purpose: Benefits yang dimiliki setiap guest type
CREATE TABLE IF NOT EXISTS guest_type_benefits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_type_id UUID NOT NULL,
    benefit_type VARCHAR(50) NOT NULL,
    quantity INTEGER DEFAULT 1,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_benefits_guest_type
        FOREIGN KEY (guest_type_id)
        REFERENCES guest_types(id)
        ON DELETE CASCADE
);

-- Table: guestbook_staff
-- Purpose: Staff yang mengelola operasional guestbook
CREATE TABLE IF NOT EXISTS guestbook_staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL,
    event_id UUID,
    username VARCHAR(100) NOT NULL,
    password_encrypted TEXT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    can_checkin BOOLEAN DEFAULT FALSE,
    can_redeem_souvenir BOOLEAN DEFAULT FALSE,
    can_redeem_snack BOOLEAN DEFAULT FALSE,
    can_access_vip_lounge BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_guestbook_staff_client
        FOREIGN KEY (client_id)
        REFERENCES clients(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_guestbook_staff_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE,
    CONSTRAINT unique_staff_username_per_client
        UNIQUE (client_id, username)
);

-- Table: guestbook_checkins
-- Purpose: Record check-in tamu di event
CREATE TABLE IF NOT EXISTS guestbook_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_id UUID NOT NULL,
    staff_id UUID,
    checked_in_at TIMESTAMPTZ DEFAULT NOW(),
    checkin_method VARCHAR(20) NOT NULL,
    device_info JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_checkins_guest
        FOREIGN KEY (guest_id)
        REFERENCES invitation_guests(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_checkins_staff
        FOREIGN KEY (staff_id)
        REFERENCES guestbook_staff(id)
        ON DELETE SET NULL,
    CONSTRAINT unique_guest_checkin
        UNIQUE (guest_id),
    CONSTRAINT check_checkin_method
        CHECK (checkin_method IN ('QR_SCAN', 'MANUAL_SEARCH'))
);

-- Table: guestbook_redemptions
-- Purpose: Record pengambilan souvenir/snack/VIP lounge
CREATE TABLE IF NOT EXISTS guestbook_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_id UUID NOT NULL,
    staff_id UUID,
    entitlement_type VARCHAR(50) NOT NULL,
    quantity INTEGER DEFAULT 1,
    redeemed_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_redemptions_guest
        FOREIGN KEY (guest_id)
        REFERENCES invitation_guests(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_redemptions_staff
        FOREIGN KEY (staff_id)
        REFERENCES guestbook_staff(id)
        ON DELETE SET NULL,
    CONSTRAINT check_entitlement_type
        CHECK (entitlement_type IN ('SOUVENIR', 'SNACK', 'VIP_LOUNGE'))
);

-- Table: staff_logs
-- Purpose: Audit log untuk semua aksi staff
CREATE TABLE IF NOT EXISTS staff_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL,
    guest_id UUID,
    action_type VARCHAR(50) NOT NULL,
    action_details JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_staff_logs_staff
        FOREIGN KEY (staff_id)
        REFERENCES guestbook_staff(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_staff_logs_guest
        FOREIGN KEY (guest_id)
        REFERENCES invitation_guests(id)
        ON DELETE CASCADE
);

-- Table: client_staff_quota
-- Purpose: Mengelola kuota staff per client
CREATE TABLE IF NOT EXISTS client_staff_quota (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL UNIQUE,
    max_staff INTEGER DEFAULT 10,
    staff_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_staff_quota_client
        FOREIGN KEY (client_id)
        REFERENCES clients(id)
        ON DELETE CASCADE,
    CONSTRAINT check_staff_used_positive
        CHECK (staff_used >= 0)
);

-- ============================================================================
-- SECTION 5: ADD FOREIGN KEYS TO EXTENDED COLUMNS
-- ============================================================================

-- Add FK from invitation_guests.event_id to events.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_invitation_guests_event'
    ) THEN
        ALTER TABLE invitation_guests
        ADD CONSTRAINT fk_invitation_guests_event
            FOREIGN KEY (event_id)
            REFERENCES events(id)
            ON DELETE CASCADE;
    END IF;
END $$;

-- Add FK from invitation_guests.guest_type_id to guest_types.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_invitation_guests_guest_type'
    ) THEN
        ALTER TABLE invitation_guests
        ADD CONSTRAINT fk_invitation_guests_guest_type
            FOREIGN KEY (guest_type_id)
            REFERENCES guest_types(id)
            ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================================
-- SECTION 6: INDEXES
-- ============================================================================

-- Admins indexes
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username) TABLESPACE pg_default;

-- Clients indexes
CREATE INDEX IF NOT EXISTS idx_clients_username ON clients(username) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_clients_slug ON clients(slug) TABLESPACE pg_default;

-- Invitation contents indexes
CREATE INDEX IF NOT EXISTS idx_invitation_contents_slug ON invitation_contents(slug) TABLESPACE pg_default;

-- Client media indexes
CREATE INDEX IF NOT EXISTS idx_client_media_client_type ON client_media(client_id, file_type) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_client_media_uploaded_at ON client_media(uploaded_at DESC) TABLESPACE pg_default;

-- Invitation guests indexes
CREATE INDEX IF NOT EXISTS idx_invitation_guests_client_id ON invitation_guests(client_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_invitation_guests_event_id ON invitation_guests(event_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_invitation_guests_guest_code ON invitation_guests(guest_code) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_invitation_guests_is_checked_in ON invitation_guests(is_checked_in) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_invitation_guests_guest_type ON invitation_guests(guest_type_id) TABLESPACE pg_default;

-- Wishes indexes
CREATE INDEX IF NOT EXISTS idx_wishes_invitation_slug ON wishes(invitation_slug) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_wishes_created_at ON wishes(created_at DESC) TABLESPACE pg_default;

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_client_id ON events(client_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date) TABLESPACE pg_default;

-- Guest types indexes
CREATE INDEX IF NOT EXISTS idx_guest_types_client_id ON guest_types(client_id) TABLESPACE pg_default;

-- Guestbook staff indexes
CREATE INDEX IF NOT EXISTS idx_guestbook_staff_client_id ON guestbook_staff(client_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_guestbook_staff_event_id ON guestbook_staff(event_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_guestbook_staff_client_username ON guestbook_staff(client_id, username) TABLESPACE pg_default;

-- Guestbook checkins indexes
CREATE INDEX IF NOT EXISTS idx_guestbook_checkins_guest_id ON guestbook_checkins(guest_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_guestbook_checkins_staff_id ON guestbook_checkins(staff_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_guestbook_checkins_checked_in_at ON guestbook_checkins(checked_in_at DESC) TABLESPACE pg_default;

-- Guestbook redemptions indexes
CREATE INDEX IF NOT EXISTS idx_guestbook_redemptions_guest_id ON guestbook_redemptions(guest_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_guestbook_redemptions_staff_id ON guestbook_redemptions(staff_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_guestbook_redemptions_type ON guestbook_redemptions(entitlement_type) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_guestbook_redemptions_redeemed_at ON guestbook_redemptions(redeemed_at DESC) TABLESPACE pg_default;

-- Staff logs indexes
CREATE INDEX IF NOT EXISTS idx_staff_logs_staff_id ON staff_logs(staff_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_staff_logs_guest_id ON staff_logs(guest_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_staff_logs_created_at ON staff_logs(created_at DESC) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_staff_logs_action_type ON staff_logs(action_type) TABLESPACE pg_default;

-- ============================================================================
-- SECTION 7: TRIGGERS
-- ============================================================================

-- Trigger: Update admins.updated_at
DROP TRIGGER IF EXISTS trigger_update_admins_updated_at ON admins;
CREATE TRIGGER trigger_update_admins_updated_at
    BEFORE UPDATE ON admins
    FOR EACH ROW
    EXECUTE FUNCTION update_admins_updated_at();

-- Trigger: Update clients.updated_at
DROP TRIGGER IF EXISTS trigger_update_clients_updated_at ON clients;
CREATE TRIGGER trigger_update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_clients_updated_at();

-- Trigger: Update invitation_guests.updated_at
DROP TRIGGER IF EXISTS update_invitation_guests_updated_at ON invitation_guests;
CREATE TRIGGER update_invitation_guests_updated_at
    BEFORE UPDATE ON invitation_guests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update events.updated_at
DROP TRIGGER IF EXISTS trigger_update_events_updated_at ON events;
CREATE TRIGGER trigger_update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update guestbook_staff.updated_at
DROP TRIGGER IF EXISTS trigger_update_guestbook_staff_updated_at ON guestbook_staff;
CREATE TRIGGER trigger_update_guestbook_staff_updated_at
    BEFORE UPDATE ON guestbook_staff
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update client_staff_quota.updated_at
DROP TRIGGER IF EXISTS trigger_update_staff_quota_updated_at ON client_staff_quota;
CREATE TRIGGER trigger_update_staff_quota_updated_at
    BEFORE UPDATE ON client_staff_quota
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Enforce staff quota before insert
DROP TRIGGER IF EXISTS trigger_enforce_staff_quota ON guestbook_staff;
CREATE TRIGGER trigger_enforce_staff_quota
    BEFORE INSERT ON guestbook_staff
    FOR EACH ROW
    EXECUTE FUNCTION enforce_staff_quota();

-- Trigger: Increment staff quota after insert
DROP TRIGGER IF EXISTS trigger_increment_staff_quota ON guestbook_staff;
CREATE TRIGGER trigger_increment_staff_quota
    AFTER INSERT ON guestbook_staff
    FOR EACH ROW
    EXECUTE FUNCTION increment_staff_quota();

-- Trigger: Decrement staff quota after delete
DROP TRIGGER IF EXISTS trigger_decrement_staff_quota ON guestbook_staff;
CREATE TRIGGER trigger_decrement_staff_quota
    AFTER DELETE ON guestbook_staff
    FOR EACH ROW
    EXECUTE FUNCTION decrement_staff_quota();

-- Trigger: Update guest check-in status
DROP TRIGGER IF EXISTS trigger_update_guest_checkin_status ON guestbook_checkins;
CREATE TRIGGER trigger_update_guest_checkin_status
    AFTER INSERT ON guestbook_checkins
    FOR EACH ROW
    EXECUTE FUNCTION update_guest_checkin_status();

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

-- Success message
SELECT 'Database schema created/updated successfully!' AS status;
SELECT 'Total tables: 14 (6 existing + 8 new guestbook tables)' AS info;
