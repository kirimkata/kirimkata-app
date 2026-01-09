-- Digital Wedding Guestbook Database Schema
-- Initial migration for core tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Staff table
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('USHER', 'SOUVENIR', 'SNACK', 'ADMIN')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guests table
CREATE TABLE guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('REGULAR', 'VIP', 'VVIP')),
    group_name VARCHAR(255),
    phone VARCHAR(20),
    notes TEXT,
    qr_token_hash VARCHAR(255) UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Check-ins table
CREATE TABLE checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
    checked_in_at TIMESTAMPTZ DEFAULT NOW(),
    method VARCHAR(20) NOT NULL CHECK (method IN ('QR_SCAN', 'MANUAL_SEARCH')),
    device_info JSONB,
    location_info JSONB,
    notes TEXT
);

-- Entitlements table
CREATE TABLE entitlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    entitlement_type VARCHAR(20) NOT NULL CHECK (entitlement_type IN ('VIP_LOUNGE', 'SOUVENIR', 'SNACK')),
    is_entitled BOOLEAN NOT NULL DEFAULT false,
    max_quantity INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Redemptions table
CREATE TABLE redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
    entitlement_type VARCHAR(20) NOT NULL CHECK (entitlement_type IN ('VIP_LOUNGE', 'SOUVENIR', 'SNACK')),
    quantity INTEGER DEFAULT 1,
    redeemed_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_guests_category ON guests(category);
CREATE INDEX idx_guests_qr_token ON guests(qr_token_hash);
CREATE INDEX idx_guests_guest_code ON guests(guest_code);
CREATE INDEX idx_guests_name ON guests USING gin(to_tsvector('indonesian', name));

CREATE INDEX idx_checkins_guest ON checkins(guest_id);
CREATE INDEX idx_checkins_staff ON checkins(staff_id);
CREATE INDEX idx_checkins_time ON checkins(checked_in_at DESC);
CREATE INDEX idx_checkins_method ON checkins(method);

CREATE INDEX idx_entitlements_guest ON entitlements(guest_id);
CREATE INDEX idx_entitlements_type ON entitlements(entitlement_type);

CREATE INDEX idx_redemptions_guest ON redemptions(guest_id);
CREATE INDEX idx_redemptions_staff ON redemptions(staff_id);
CREATE INDEX idx_redemptions_type ON redemptions(entitlement_type);
CREATE INDEX idx_redemptions_time ON redemptions(redeemed_at DESC);

CREATE INDEX idx_audit_logs_time ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_staff ON audit_logs(staff_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Unique constraints to prevent duplicates
CREATE UNIQUE INDEX idx_checkins_guest_unique ON checkins(guest_id);
CREATE UNIQUE INDEX idx_entitlements_guest_type ON entitlements(guest_id, entitlement_type);

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON guests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (action, table_name, record_id, old_values, staff_id, ip_address)
        VALUES (TG_OP, TG_TABLE_NAME, OLD.id, row_to_json(OLD), 
                COALESCE(current_setting('app.current_staff_id', true)::UUID, NULL),
                COALESCE(current_setting('app.client_ip', true)::INET, NULL));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (action, table_name, record_id, old_values, new_values, staff_id, ip_address)
        VALUES (TG_OP, TG_TABLE_NAME, NEW.id, row_to_json(OLD), row_to_json(NEW),
                COALESCE(current_setting('app.current_staff_id', true)::UUID, NULL),
                COALESCE(current_setting('app.client_ip', true)::INET, NULL));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (action, table_name, record_id, new_values, staff_id, ip_address)
        VALUES (TG_OP, TG_TABLE_NAME, NEW.id, row_to_json(NEW),
                COALESCE(current_setting('app.current_staff_id', true)::UUID, NULL),
                COALESCE(current_setting('app.client_ip', true)::INET, NULL));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to important tables
CREATE TRIGGER audit_guests AFTER INSERT OR UPDATE OR DELETE ON guests
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_checkins AFTER INSERT OR UPDATE OR DELETE ON checkins
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_redemptions AFTER INSERT OR UPDATE OR DELETE ON redemptions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Row Level Security (RLS) policies
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role to bypass RLS
CREATE POLICY "Service role can access all data" ON guests FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can access all data" ON checkins FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can access all data" ON entitlements FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can access all data" ON redemptions FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can access all data" ON audit_logs FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can access all data" ON staff FOR ALL TO service_role USING (true);
