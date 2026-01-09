-- Migration: Enhance Benefits Management
-- Description: Add metadata to guest_type_benefits and create benefit catalog
-- Date: 2025-01-07

-- Add columns to guest_type_benefits for better management
ALTER TABLE guest_type_benefits ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE guest_type_benefits ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS trigger_update_benefits_updated_at ON guest_type_benefits;
CREATE TRIGGER trigger_update_benefits_updated_at
    BEFORE UPDATE ON guest_type_benefits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create benefit_catalog table for predefined benefits
CREATE TABLE IF NOT EXISTS benefit_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    benefit_type VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default benefits
INSERT INTO benefit_catalog (benefit_type, display_name, description, icon, sort_order) VALUES
('souvenir', 'Souvenir', 'Hak mengambil souvenir', '🎁', 1),
('snack', 'Konsumsi/Snack', 'Hak mendapat konsumsi', '🍽️', 2),
('vip_lounge', 'VIP Lounge', 'Akses ke ruang VIP', '👑', 3),
('parking', 'Parkir Khusus', 'Akses parkir khusus', '🅿️', 4),
('priority_checkin', 'Priority Check-in', 'Check-in prioritas', '⚡', 5),
('welcome_drink', 'Welcome Drink', 'Minuman selamat datang', '🥤', 6),
('photo_booth', 'Photo Booth', 'Akses photo booth', '📸', 7),
('gift_bag', 'Gift Bag', 'Tas hadiah khusus', '🎒', 8)
ON CONFLICT (benefit_type) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_benefit_catalog_sort_order ON benefit_catalog(sort_order);
CREATE INDEX IF NOT EXISTS idx_guest_type_benefits_active ON guest_type_benefits(is_active);
CREATE INDEX IF NOT EXISTS idx_guest_type_benefits_guest_type ON guest_type_benefits(guest_type_id, is_active);

-- Add comments
COMMENT ON TABLE benefit_catalog IS 'Catalog of predefined benefits that can be assigned to guest types';
COMMENT ON COLUMN benefit_catalog.benefit_type IS 'Unique type identifier for the benefit';
COMMENT ON COLUMN benefit_catalog.icon IS 'Emoji or icon name for visual representation';
COMMENT ON COLUMN guest_type_benefits.is_active IS 'Whether this benefit assignment is currently active';
