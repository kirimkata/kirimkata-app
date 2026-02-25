-- Jalankan ini di Supabase SQL Editor untuk mengubah foreign key

-- 1. Hapus constraint foreign key yang lama
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_template_id_templates_id_fk";

-- 2. Buat kembali constraint dengan aturan ON DELETE SET NULL
ALTER TABLE "orders"
  ADD CONSTRAINT "orders_template_id_templates_id_fk"
  FOREIGN KEY ("template_id")
  REFERENCES "templates" ("id")
  ON DELETE SET NULL;

-- 3. (Opsional) Sekarang Anda bisa menghapus template ID 1 dengan aman
-- DELETE FROM "templates" WHERE id = 1;
