-- ============================================================
-- TEMPLATE SEED SCRIPT
-- Insert 4 tema yang tersedia di kode aplikasi
-- Menghasilkan ID 1, 2, 3, 4 jika tabel kosong
-- ============================================================

INSERT INTO templates (name, slug, category, base_price, description, features, thumbnail_url, preview_url, demo_slug, is_active, sort_order, created_at, updated_at)
VALUES

  -- 1. Parallax Custom
  (
    'Parallax Custom',
    'parallax/parallax-custom1',
    'parallax',
    325000,
    'Tema parallax 3D dengan efek layer berganda dan animasi pembuka spektakuler. Cocok untuk pernikahan adat dan modern.',
    '{"theme_key": "parallax/parallax-custom1", "parallax": true, "opening": "parallax-animation", "max_photos": 10, "video_bg": false, "watermark": false}'::jsonb,
    '/previews/parallax-custom1.jpg',
    NULL,
    'poppy-fadli',
    true,
    1,
    NOW(),
    NOW()
  ),

  -- 2. Parallax Template
  (
    'Parallax Template',
    'parallax/parallax-template1',
    'parallax',
    325000,
    'Varian parallax elegan dengan layout alternatif. Elegan, modern, dan mendukung banyak foto galeri.',
    '{"theme_key": "parallax/parallax-template1", "parallax": true, "opening": "parallax-animation", "max_photos": 10, "video_bg": false, "watermark": false}'::jsonb,
    '/previews/parallax-template1.jpg',
    NULL,
    NULL,
    true,
    2,
    NOW(),
    NOW()
  ),

  -- 3. Simple Scroll
  (
    'Simple Scroll',
    'premium/simple1',
    'premium',
    175000,
    'Undangan bersih dan ringan tanpa animasi pembuka. Loading cepat, dioptimalkan untuk semua perangkat.',
    '{"theme_key": "premium/simple1", "parallax": false, "opening": "none", "max_photos": 10, "video_bg": false, "watermark": false}'::jsonb,
    '/previews/premium-simple1.jpg',
    NULL,
    NULL,
    true,
    3,
    NOW(),
    NOW()
  ),

  -- 4. Simple Premium
  (
    'Simple Premium',
    'premium/simple2',
    'premium',
    175000,
    'Tema premium dengan cover statis elegan, 15 section layout, dan dukungan video intro.',
    '{"theme_key": "premium/simple2", "parallax": false, "opening": "static-cover", "max_photos": 10, "video_bg": false, "watermark": false}'::jsonb,
    '/previews/premium-simple2.jpg',
    NULL,
    NULL,
    true,
    4,
    NOW(),
    NOW()
  );

-- Verifikasi hasilnya
SELECT id, name, slug, category, base_price, is_active 
FROM templates 
ORDER BY id;
