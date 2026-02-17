-- ============================================
-- KIRIMKATA REFACTORING: DATABASE MIGRATION
-- Phase 1: Schema Changes
-- ============================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CREATE: templates (Master Data)
-- ============================================
CREATE TABLE IF NOT EXISTS templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50) NOT NULL, -- premium_3d, regular, basic, free
  base_price INTEGER NOT NULL,
  description TEXT,
  features JSONB DEFAULT '{}',
  thumbnail_url TEXT,
  preview_url TEXT,
  demo_slug VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_templates_category ON templates(category, is_active);
CREATE INDEX idx_templates_active ON templates(is_active, sort_order);

-- Sample data
INSERT INTO templates (id, name, slug, category, base_price, features) VALUES
  (1, 'Gratis Basic', 'free-basic', 'free', 0, '{"max_photos": 5, "watermark": true}'),
  (21, 'Sunny', 'sunny', 'premium_3d', 325000, '{"max_photos": 10, "video_bg": false}'),
  (22, 'Paradise', 'paradise', 'premium_3d', 325000, '{"max_photos": 15, "video_bg": true}'),
  (23, 'Harmony', 'harmony', 'regular', 175000, '{"max_photos": 10}')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. CREATE: addon_catalog (Master Data)
-- ============================================
CREATE TABLE IF NOT EXISTS addon_catalog (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  price INTEGER NOT NULL,
  unit VARCHAR(50) NOT NULL, -- per_item, one_time
  category VARCHAR(50),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_addons_category ON addon_catalog(category, is_active);

-- Sample data
INSERT INTO addon_catalog (id, name, slug, price, unit, category) VALUES
  (1, 'Tambah Foto', 'extra-photo', 2000, 'per_item', 'photo'),
  (2, 'Edit Foto Custom', 'custom-photo-edit', 75000, 'per_item', 'photo'),
  (3, 'Terima Beres', 'full-service', 50000, 'one_time', 'service'),
  (4, 'WA Blast', 'wa-blast', 200000, 'one_time', 'service'),
  (5, 'IG Story Template', 'ig-story-template', 75000, 'one_time', 'service'),
  (6, 'Guestbook', 'guestbook', 500000, 'one_time', 'guestbook')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. CREATE: orders (Checkout Data)
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- User
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Order Details
  type VARCHAR(50) DEFAULT 'wedding',
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  main_date DATE NOT NULL,
  
  -- Inviter Info
  inviter_type VARCHAR(50) DEFAULT 'couple',
  inviter_data JSONB NOT NULL,
  
  -- Template Selection
  template_id INTEGER NOT NULL REFERENCES templates(id),
  template_price INTEGER NOT NULL,
  
  -- Add-ons
  addons JSONB DEFAULT '[]',
  
  -- Pricing
  subtotal INTEGER NOT NULL,
  discount INTEGER DEFAULT 0,
  voucher_code VARCHAR(50),
  total INTEGER NOT NULL,
  
  -- Payment
  payment_status VARCHAR(20) DEFAULT 'pending',
  payment_proof_url TEXT,
  payment_method VARCHAR(50),
  payment_bank VARCHAR(100),
  payment_account_name VARCHAR(255),
  payment_verified_at TIMESTAMP,
  payment_verified_by UUID REFERENCES admins(id),
  payment_rejection_reason TEXT,
  
  -- Order Status
  status VARCHAR(20) DEFAULT 'draft',
  
  -- Expiration
  expires_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orders_client ON orders(client_id);
CREATE INDEX idx_orders_slug ON orders(slug);
CREATE INDEX idx_orders_status ON orders(payment_status, status);
CREATE INDEX idx_orders_expires ON orders(expires_at) WHERE payment_status = 'pending';
CREATE INDEX idx_orders_number ON orders(order_number);

-- ============================================
-- 4. CREATE: invoices
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Invoice Details
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  
  -- Amounts
  subtotal INTEGER NOT NULL,
  discount INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  
  -- Payment Info
  payment_status VARCHAR(20) DEFAULT 'unpaid',
  paid_at TIMESTAMP,
  
  -- PDF Generation
  pdf_url TEXT,
  pdf_generated_at TIMESTAMP,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invoices_order ON invoices(order_id);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(payment_status);
CREATE INDEX idx_invoices_date ON invoices(invoice_date DESC);

-- ============================================
-- 5. MODIFY: invitations table
-- Add expiration and verification fields
-- ============================================
DO $$ 
BEGIN
  -- Add verification_status if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invitation_pages' AND column_name = 'verification_status'
  ) THEN
    ALTER TABLE invitation_pages ADD COLUMN verification_status VARCHAR(20) DEFAULT 'pending';
    ALTER TABLE invitation_pages ADD COLUMN verified_at TIMESTAMP;
    ALTER TABLE invitation_pages ADD COLUMN verified_by UUID REFERENCES admins(id);
  END IF;

  -- Add active period fields if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invitation_pages' AND column_name = 'active_until'
  ) THEN
    ALTER TABLE invitation_pages ADD COLUMN active_until DATE;
    ALTER TABLE invitation_pages ADD COLUMN is_active BOOLEAN DEFAULT true;
    ALTER TABLE invitation_pages ADD COLUMN archived_at TIMESTAMP;
  END IF;

  -- Add order_id reference if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invitation_pages' AND column_name = 'order_id'
  ) THEN
    ALTER TABLE invitation_pages ADD COLUMN order_id UUID REFERENCES orders(id);
  END IF;
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_invitations_active ON invitation_pages(is_active, active_until);
CREATE INDEX IF NOT EXISTS idx_invitations_order ON invitation_pages(order_id);
CREATE INDEX IF NOT EXISTS idx_invitations_verification ON invitation_pages(verification_status);

-- ============================================
-- 6. CREATE: guestbook_addons
-- ============================================
CREATE TABLE IF NOT EXISTS guestbook_addons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invitation_id UUID UNIQUE NOT NULL REFERENCES invitation_pages(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  
  -- Status
  is_enabled BOOLEAN DEFAULT false,
  enabled_at TIMESTAMP,
  disabled_at TIMESTAMP,
  
  -- Payment (if activated later)
  payment_verified BOOLEAN DEFAULT false,
  payment_verified_at TIMESTAMP,
  payment_verified_by UUID REFERENCES admins(id),
  payment_amount INTEGER,
  payment_proof_url TEXT,
  
  -- Configuration
  seating_mode VARCHAR(20) DEFAULT 'no_seat',
  staff_quota INTEGER DEFAULT 2,
  staff_quota_used INTEGER DEFAULT 0,
  config JSONB DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_guestbook_addons_invitation ON guestbook_addons(invitation_id);
CREATE INDEX idx_guestbook_addons_enabled ON guestbook_addons(is_enabled);
CREATE INDEX idx_guestbook_addons_order ON guestbook_addons(order_id);

-- ============================================
-- 7. MODIFY: guests table
-- Add invitation_id reference
-- ============================================
DO $$ 
BEGIN
  -- Add invitation_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guests' AND column_name = 'invitation_id'
  ) THEN
    ALTER TABLE guests ADD COLUMN invitation_id UUID REFERENCES invitation_pages(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_guests_invitation ON guests(invitation_id);

-- ============================================
-- 8. DATA MIGRATION (Optional - if needed)
-- Migrate existing guestbook_events to guestbook_addons
-- ============================================
-- Uncomment when ready to migrate
/*
INSERT INTO guestbook_addons (invitation_id, is_enabled, enabled_at)
SELECT 
  invitation_id,
  has_guestbook,
  CASE WHEN has_guestbook THEN NOW() ELSE NULL END
FROM guestbook_events
WHERE invitation_id IS NOT NULL AND has_guestbook = true
ON CONFLICT (invitation_id) DO NOTHING;

-- Update guests table with invitation_id from events
UPDATE guests g
SET invitation_id = e.invitation_id
FROM guestbook_events e
WHERE g.event_id = e.id AND g.invitation_id IS NULL;
*/

-- ============================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================
-- Uncomment to rollback changes
/*
DROP TABLE IF EXISTS guestbook_addons CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS addon_catalog CASCADE;
DROP TABLE IF EXISTS templates CASCADE;

ALTER TABLE invitation_pages 
  DROP COLUMN IF EXISTS verification_status,
  DROP COLUMN IF EXISTS verified_at,
  DROP COLUMN IF EXISTS verified_by,
  DROP COLUMN IF EXISTS active_until,
  DROP COLUMN IF EXISTS is_active,
  DROP COLUMN IF EXISTS archived_at,
  DROP COLUMN IF EXISTS order_id;

ALTER TABLE guests DROP COLUMN IF EXISTS invitation_id;
*/
