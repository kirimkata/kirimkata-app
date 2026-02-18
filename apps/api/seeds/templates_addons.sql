-- Seed data for templates and addons
-- Run this after the main schema is set up

-- Insert sample templates
INSERT INTO templates (name, slug, category, base_price, description, preview_image, is_active, created_at, updated_at)
VALUES
  ('Elegant Wedding', 'elegant-wedding', 'wedding', 500000, 'Template pernikahan elegan dengan desain modern dan minimalis', 'https://via.placeholder.com/400x300?text=Elegant+Wedding', true, NOW(), NOW()),
  ('Classic Wedding', 'classic-wedding', 'wedding', 450000, 'Template pernikahan klasik dengan sentuhan tradisional', 'https://via.placeholder.com/400x300?text=Classic+Wedding', true, NOW(), NOW()),
  ('Modern Wedding', 'modern-wedding', 'wedding', 600000, 'Template pernikahan modern dengan animasi interaktif', 'https://via.placeholder.com/400x300?text=Modern+Wedding', true, NOW(), NOW()),
  ('Simple Birthday', 'simple-birthday', 'birthday', 250000, 'Template ulang tahun sederhana dan ceria', 'https://via.placeholder.com/400x300?text=Simple+Birthday', true, NOW(), NOW()),
  ('Corporate Event', 'corporate-event', 'corporate', 750000, 'Template acara korporat profesional', 'https://via.placeholder.com/400x300?text=Corporate+Event', true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Insert sample addons
INSERT INTO addons (name, slug, category, price, description, is_active, created_at, updated_at)
VALUES
  ('Guestbook Digital', 'guestbook-digital', 'feature', 150000, 'Fitur buku tamu digital dengan QR code check-in', true, NOW(), NOW()),
  ('Live Streaming', 'live-streaming', 'feature', 300000, 'Integrasi live streaming untuk acara virtual', true, NOW(), NOW()),
  ('Photo Gallery', 'photo-gallery', 'feature', 100000, 'Galeri foto dengan slideshow otomatis', true, NOW(), NOW()),
  ('RSVP Management', 'rsvp-management', 'feature', 120000, 'Sistem RSVP dengan konfirmasi kehadiran', true, NOW(), NOW()),
  ('Custom Domain', 'custom-domain', 'premium', 200000, 'Gunakan domain sendiri untuk undangan', true, NOW(), NOW()),
  ('Music Background', 'music-background', 'feature', 50000, 'Tambahkan musik latar untuk undangan', true, NOW(), NOW()),
  ('Gift Registry', 'gift-registry', 'feature', 150000, 'Daftar hadiah dan transfer digital', true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Verify inserted data
SELECT 'Templates inserted:' as info, COUNT(*) as count FROM templates WHERE is_active = true;
SELECT 'Addons inserted:' as info, COUNT(*) as count FROM addons WHERE is_active = true;
