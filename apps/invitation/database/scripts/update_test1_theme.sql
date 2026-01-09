-- SQL Script: Update Theme untuk test-1
-- Jalankan script ini di Supabase SQL Editor atau database client Anda

-- Option 1: Update theme jika test-1 sudah ada di database
UPDATE invitation_contents
SET theme_key = 'premium/simple2'
WHERE slug = 'test-1';

-- Option 2: Cek apakah test-1 ada di database
SELECT slug, theme_key, client_profile->>'coupleNames' as couple_names
FROM invitation_contents
WHERE slug = 'test-1';

-- Option 3: Hapus test-1 dari database (untuk development/testing)
-- Setelah dihapus, akan otomatis menggunakan file registry
-- DELETE FROM invitation_contents WHERE slug = 'test-1';
