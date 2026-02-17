-- ============================================
-- KIRIMKATA REFACTORING: Phase 1 Migration
-- Run this in Supabase SQL Editor
-- ============================================
-- Version: 1.0
-- Date: 2026-02-17
-- Purpose: Add e-commerce order flow + expiration tracking
-- ============================================

BEGIN;

-- ============================================
-- STEP 1: CREATE NEW TABLES
-- ============================================

-- 1.1 Templates (Master Data)
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_templates_category ON templates(category, is_active);
CREATE INDEX idx_templates_active ON templates(is_active, sort_order);

-- 1.2 Add-on Catalog (Master Data)
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_addons_category ON addon_catalog(category, is_active);

-- 1.3 Orders (Checkout Data)
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
  
  -- Add-ons (Array of objects)
  addons JSONB DEFAULT '[]',
  
  -- Pricing
  subtotal INTEGER NOT NULL,
  discount INTEGER DEFAULT 0,
  voucher_code VARCHAR(50),
  total INTEGER NOT NULL,
  
  -- Payment
  payment_status VARCHAR(20) DEFAULT 'pending',
    -- pending, waiting_verification, verified, rejected, expired
  payment_proof_url TEXT,
  payment_method VARCHAR(50),
  payment_bank VARCHAR(100),
  payment_account_name VARCHAR(255),
  payment_verified_at TIMESTAMPTZ,
  payment_verified_by UUID REFERENCES admins(id),
  payment_rejection_reason TEXT,
  
  -- Order Status
  status VARCHAR(20) DEFAULT 'draft',
    -- draft, submitted, processing, completed, cancelled
  
  -- Expiration (24 hours)
  expires_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_client ON orders(client_id);
CREATE INDEX idx_orders_slug ON orders(slug);
CREATE INDEX idx_orders_status ON orders(payment_status, status);
CREATE INDEX idx_orders_expires ON orders(expires_at) WHERE payment_status = 'pending';
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_pending ON orders(payment_status, created_at DESC) 
  WHERE payment_status IN ('pending', 'waiting_verification');

-- 1.4 Invoices
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
  paid_at TIMESTAMPTZ,
  
  -- PDF Generation
  pdf_url TEXT,
  pdf_generated_at TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_order ON invoices(order_id);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(payment_status);
CREATE INDEX idx_invoices_date ON invoices(invoice_date DESC);

-- 1.5 Guestbook Add-ons
CREATE TABLE IF NOT EXISTS guestbook_addons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invitation_id UUID UNIQUE NOT NULL REFERENCES invitation_pages(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  
  -- Status
  is_enabled BOOLEAN DEFAULT false,
  enabled_at TIMESTAMPTZ,
  disabled_at TIMESTAMPTZ,
  
  -- Payment (if activated later)
  payment_verified BOOLEAN DEFAULT false,
  payment_verified_at TIMESTAMPTZ,
  payment_verified_by UUID REFERENCES admins(id),
  payment_amount INTEGER,
  payment_proof_url TEXT,
  
  -- Configuration
  seating_mode VARCHAR(20) DEFAULT 'no_seat',
  staff_quota INTEGER DEFAULT 2,
  staff_quota_used INTEGER DEFAULT 0,
  config JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_guestbook_addons_invitation ON guestbook_addons(invitation_id);
CREATE INDEX idx_guestbook_addons_enabled ON guestbook_addons(is_enabled);
CREATE INDEX idx_guestbook_addons_order ON guestbook_addons(order_id);

-- ============================================
-- STEP 2: MODIFY EXISTING TABLES
-- ============================================

-- 2.1 invitation_pages: Add verification & expiration fields
ALTER TABLE invitation_pages 
  ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES admins(id),
  ADD COLUMN IF NOT EXISTS active_until DATE,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id);

CREATE INDEX IF NOT EXISTS idx_invitation_pages_active 
  ON invitation_pages(is_active, active_until);
CREATE INDEX IF NOT EXISTS idx_invitation_pages_verification 
  ON invitation_pages(verification_status);
CREATE INDEX IF NOT EXISTS idx_invitation_pages_order 
  ON invitation_pages(order_id);
CREATE INDEX IF NOT EXISTS idx_invitation_pages_expiring 
  ON invitation_pages(active_until) 
  WHERE is_active = true AND active_until IS NOT NULL;

-- 2.2 guests: Add invitation_id reference
ALTER TABLE guests 
  ADD COLUMN IF NOT EXISTS invitation_id UUID REFERENCES invitation_pages(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_guests_invitation ON guests(invitation_id);
CREATE INDEX IF NOT EXISTS idx_guests_checkin 
  ON guests(invitation_id, is_checked_in) 
  WHERE is_checked_in = false;

-- ============================================
-- STEP 3: INSERT SAMPLE DATA
-- ============================================

-- 3.1 Templates
INSERT INTO templates (id, name, slug, category, base_price, features) VALUES
  (1, 'Gratis Basic', 'free-basic', 'free', 0, '{"max_photos": 5, "watermark": true, "video_bg": false}'),
  (21, 'Sunny', 'sunny', 'premium_3d', 325000, '{"max_photos": 10, "video_bg": false, "parallax": true}'),
  (22, 'Paradise', 'paradise', 'premium_3d', 325000, '{"max_photos": 15, "video_bg": true, "parallax": true}'),
  (23, 'Harmony', 'harmony', 'regular', 175000, '{"max_photos": 10, "video_bg": false}'),
  (24, 'Classic White', 'classic-white', 'basic', 100000, '{"max_photos": 8, "video_bg": false}'),
  (25, 'Modern Minimalist', 'modern-minimalist', 'regular', 150000, '{"max_photos": 10, "video_bg": false}')
ON CONFLICT (id) DO NOTHING;

-- Reset sequence
SELECT setval('templates_id_seq', (SELECT MAX(id) FROM templates));

-- 3.2 Add-on Catalog
INSERT INTO addon_catalog (id, name, slug, price, unit, category, description) VALUES
  (1, 'Tambah Foto', 'extra-photo', 2000, 'per_item', 'photo', 'Tambah slot foto tambahan (per foto)'),
  (2, 'Edit Foto Custom', 'custom-photo-edit', 75000, 'per_item', 'photo', 'Edit foto profesional oleh designer kami'),
  (3, 'Terima Beres', 'full-service', 50000, 'one_time', 'service', 'Kami yang isi semua konten undangan Anda'),
  (4, 'WA Blast', 'wa-blast', 200000, 'one_time', 'service', 'Kirim undangan ke 500 kontak via WhatsApp'),
  (5, 'IG Story Template', 'ig-story-template', 75000, 'one_time', 'service', 'Template cerita Instagram untuk promosi acara'),
  (6, 'Guestbook Premium', 'guestbook', 500000, 'one_time', 'guestbook', 'Fitur buku tamu dengan QR Code & seating arrangement')
ON CONFLICT (id) DO NOTHING;

-- Reset sequence
SELECT setval('addon_catalog_id_seq', (SELECT MAX(id) FROM addon_catalog));

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check new tables
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('templates', 'addon_catalog', 'orders', 'invoices', 'guestbook_addons')
ORDER BY table_name;

-- Check new columns in invitation_pages
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'invitation_pages'
  AND column_name IN ('verification_status', 'verified_at', 'verified_by', 'active_until', 'is_active', 'archived_at', 'order_id')
ORDER BY ordinal_position;

-- Check new column in guests
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'guests' AND column_name = 'invitation_id';

-- Check sample data
SELECT 'Templates' as table_name, COUNT(*) as count FROM templates
UNION ALL
SELECT 'Add-ons', COUNT(*) FROM addon_catalog
UNION ALL
SELECT 'Orders', COUNT(*) FROM orders
UNION ALL
SELECT 'Invoices', COUNT(*) FROM invoices
UNION ALL
SELECT 'Guestbook Addons', COUNT(*) FROM guestbook_addons;

-- ============================================
-- MIGRATION COMPLETE! ✅
-- Next: Run `npx drizzle-kit introspect` to update schema.ts
-- ============================================
