-- ============================================================
-- TEMPLATE SEED SCRIPT
-- KirimKata - 4 tema nyata sesuai themes/registry.ts
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Hapus data lama (placeholder yang belum sesuai kode)
DELETE FROM templates WHERE id IN (1, 21, 22, 23, 24, 25);

-- 2. Insert 4 tema nyata
-- Catatan:
--   slug        = THEME_REGISTRY key (harus cocok persis)
--   category    = 'parallax' atau 'premium' (2 kategori saja)
--   base_price  = dalam rupiah (integer)
--   features    = JSON, termasuk theme_key untuk resolusi renderer

INSERT INTO templates (id, name, slug, category, base_price, description, features, thumbnail_url, preview_url, demo_slug, is_active, sort_order)
VALUES

  -- ── PARALLAX ──────────────────────────────────────────────
  (
    1,
    'Parallax Custom',
    'parallax/parallax-custom1',
    'parallax',
    325000,
    'Tema parallax 3D dengan efek layer berganda dan animasi pembuka spektakuler. Cocok untuk pernikahan adat dan modern.',
    '{"theme_key": "parallax/parallax-custom1", "parallax": true, "opening": "parallax-animation", "max_photos": 10, "video_bg": false, "watermark": false}',
    '/previews/parallax-custom1.jpg',
    NULL,
    'poppy-fadli',
    true,
    1
  ),

  (
    2,
    'Parallax Template',
    'parallax/parallax-template1',
    'parallax',
    325000,
    'Varian parallax dengan layout alternatif. Elegan, modern, dan mendukung banyak foto galeri.',
    '{"theme_key": "parallax/parallax-template1", "parallax": true, "opening": "parallax-animation", "max_photos": 10, "video_bg": false, "watermark": false}',
    '/previews/parallax-template1.jpg',
    NULL,
    NULL,
    true,
    2
  ),

  -- ── PREMIUM ───────────────────────────────────────────────
  (
    3,
    'Simple Scroll',
    'premium/simple1',
    'premium',
    175000,
    'Undangan bersih dan ringan tanpa animasi pembuka. Loading cepat, dioptimalkan untuk semua perangkat.',
    '{"theme_key": "premium/simple1", "parallax": false, "opening": "none", "max_photos": 10, "video_bg": false, "watermark": false}',
    '/previews/premium-simple1.jpg',
    NULL,
    NULL,
    true,
    3
  ),

  (
    4,
    'Simple Premium',
    'premium/simple2',
    'premium',
    175000,
    'Tema premium dengan cover statis elegan, 15 section layout, dan dukungan video intro.',
    '{"theme_key": "premium/simple2", "parallax": false, "opening": "static-cover", "max_photos": 10, "video_bg": false, "watermark": false}',
    '/previews/premium-simple2.jpg',
    NULL,
    NULL,
    true,
    4
  );

-- 3. (Opsional) Reset sequence jika diperlukan
-- SELECT setval('templates_id_seq', 10);

-- 4. Verifikasi hasil
SELECT id, name, slug, category, base_price, is_active, sort_order
FROM templates
ORDER BY sort_order;
