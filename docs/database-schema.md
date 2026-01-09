## Database Schema Overview

Ringkasan ini merangkum struktur tabel yang saat ini ada di database produksi berdasarkan schema yang kamu bagikan. Setiap bagian mencakup kolom, indeks, relasi, dan trigger yang relevan sehingga tim dev maupun ops bisa memahami konteks data dengan cepat.

### Daftar Tabel

| Tabel | Tujuan Utama |
| --- | --- |
| `admins` | Menyimpan kredensial admin internal. |
| `client_media` | Metadata file (foto/video/audio) yang diunggah oleh tiap client. |
| `clients` | Data akun client serta kuota akses fitur. |
| `invitation_contents` | Konfigurasi konten undangan (profil, event, galeri, dsb). |
| `invitation_guests` | Daftar tamu yang dimiliki client untuk pengiriman undangan/guestbook. |

---

### `admins`

| Kolom | Tipe | Default | Keterangan |
| --- | --- | --- | --- |
| `id` | `uuid` | `gen_random_uuid()` | Primary key. |
| `username` | `varchar(255)` | – | Unique, dipakai login admin panel. |
| `password_encrypted` | `text` | – | Password terenkripsi (AES/Bcrypt sesuai service). |
| `email` | `varchar(255)` | `NULL` | Opsional untuk notifikasi/pemulihan. |
| `created_at` | `timestamp` | `now()` | Timestamp pembuatan. |
| `updated_at` | `timestamp` | `now()` | Di-update via trigger setiap record diubah. |

**Constraint & Index**
- PK: `admins_pkey` pada `id`.
- Unique: `admins_username_key`.
- Index tambahan: `idx_admins_username`.

**Trigger**
- `trigger_update_admins_updated_at` menjalankan fungsi `update_admins_updated_at()` sebelum setiap `UPDATE` untuk menjaga nilai `updated_at`.

---

### `client_media`

| Kolom | Tipe | Default | Keterangan |
| --- | --- | --- | --- |
| `id` | `serial` | auto increment | Primary key. |
| `client_id` | `uuid` | – | FK ke `clients.id`, cascade delete. |
| `file_name` | `varchar(255)` | – | Nama file original. |
| `file_url` | `text` | – | Lokasi file (R2/S3, dsb). |
| `file_type` | `varchar(50)` | – | Kategori file (music, photo, video). |
| `file_size` | `integer` | – | Dalam byte. |
| `mime_type` | `varchar(100)` | – | MIME resmi. |
| `uploaded_at` | `timestamptz` | `CURRENT_TIMESTAMP` | Waktu unggah. |

**Constraint & Index**
- PK: `client_media_pkey`.
- FK: `client_media_client_id_fkey` → `clients(id)` (cascade on delete).
- Index: `idx_client_media_client_type` (`client_id`, `file_type`) dan `idx_client_media_uploaded_at` (sort by `uploaded_at DESC`).

---

### `clients`

| Kolom | Tipe | Default | Keterangan |
| --- | --- | --- | --- |
| `id` | `uuid` | `gen_random_uuid()` | Primary key. |
| `username` | `varchar(255)` | – | Unique username client. |
| `password_encrypted` | `text` | – | Password terenkripsi. |
| `email` | `varchar(255)` | `NULL` | Opsional. |
| `slug` | `varchar(255)` | `NULL` | Unique slug untuk undangan. |
| `created_at` | `timestamp` | `now()` | Timestamp pembuatan. |
| `updated_at` | `timestamp` | `now()` | Di-update via trigger. |
| `quota_photos` | `integer` | `10` | Kuota upload foto. |
| `quota_music` | `integer` | `1` | Kuota musik. |
| `quota_videos` | `integer` | `1` | Kuota video. |
| `message_template` | `text` | `NULL` | Template pesan broadcast. |
| `guestbook_access` | `boolean` | `false` | Menentukan akses fitur guestbook. |

**Constraint & Index**
- PK: `clients_pkey`.
- Unique: `clients_username_key`, `clients_slug_key`.
- FK: `fk_clients_slug` → `invitation_contents(slug)` (ON DELETE SET NULL) untuk menjaga hubungan slug ↔ konten.
- Index tambahan: `idx_clients_username`, `idx_clients_slug`.

**Trigger**
- `trigger_update_clients_updated_at` menjalankan `update_clients_updated_at()` sebelum `UPDATE`.

---

### `invitation_contents`

| Kolom | Tipe | Default | Keterangan |
| --- | --- | --- | --- |
| `id` | `uuid` | `uuid_generate_v4()` | Primary key. |
| `slug` | `text` | – | Unique slug yang dirujuk client. |
| JSON Fields | `jsonb` | – | `client_profile`, `bride`, `groom`, `event`, `clouds`, `event_cloud`, `love_story`, `gallery`, `wedding_gift`, `closing`. |
| `background_music` | `jsonb` | `NULL` | Info musik latar. |
| `custom_images` | `jsonb` | `NULL` | Override aset default. |
| `created_at` | `timestamptz` | `now()` | Timestamp pembuatan. |
| `updated_at` | `timestamptz` | `now()` | Timestamp update. |
| `theme_key` | `text` | `'parallax/parallax-custom1'` | Kunci tema yang dipakai. |

**Constraint & Index**
- PK: `invitation_contents_pkey`.
- Unique: `invitation_contents_slug_key`.
- Index: `idx_invitation_contents_slug`.

---

### `invitation_guests`

| Kolom | Tipe | Default | Keterangan |
| --- | --- | --- | --- |
| `id` | `uuid` | `uuid_generate_v4()` | Primary key. |
| `client_id` | `uuid` | – | FK ke `clients(id)` dengan cascade delete. |
| `name` | `varchar(255)` | – | Nama tamu. |
| `phone` | `varchar(50)` | – | Nomor WhatsApp/telepon. |
| `created_at` | `timestamptz` | `now()` | Timestamp input. |
| `updated_at` | `timestamptz` | `now()` | Dijaga trigger. |
| `sent` | `boolean` | `false` | Penanda apakah undangan sudah dikirim. |

**Constraint & Index**
- PK: `invitation_guests_pkey`.
- FK: `fk_client_id` → `clients(id)` (cascade on delete).
- Index: `idx_invitation_guests_client_id`.

**Trigger**
- `update_invitation_guests_updated_at` menjalankan `update_updated_at_column()` sebelum setiap `UPDATE`.

> Catatan: definisi `invitation_guests` muncul dua kali pada schema yang dibagikan, namun isinya identik. Dokumentasi ini menganggap hanya ada satu tabel `invitation_guests`.

---

### Catatan Tambahan

- Semua fungsi trigger (`update_admins_updated_at`, `update_clients_updated_at`, `update_updated_at_column`) diasumsikan sudah tersedia di schema `public`. Jika belum, pastikan fungsi tersebut ikut dimigrasikan ketika setup database baru.
- Akses guestbook dikendalikan oleh kolom boolean `clients.guestbook_access`. Nilai ini perlu sinkron dengan aplikasi guestbook untuk menentukan apakah menu/endpoint tertentu bisa digunakan.
- Index yang menggunakan `IF NOT EXISTS` berarti aman untuk dijalankan berulang saat migrasi idempotent.

---

## Diagram Relasi (Teks)

```
┌───────────┐
│  admins   │
└───────────┘
      │ (admin panel hanya mengelola data client & konten)
      │
┌───────────┐        ┌──────────────────────┐
│  clients  │<──────>│ invitation_contents  │
└───────────┘  slug  └──────────────────────┘
      │ 1..*                 ▲
      │                      │
      │1..*                  │0..1 (slug optional)
┌───────────────┐            │
│ client_media  │            │
└───────────────┘            │
      │                      │
      │1..*                  │
┌────────────────┐           │
│ invitation_    │───────────┘
│    guests      │   FK client_id
└────────────────┘
```

### Penjelasan Hubungan dengan Invitation

1. **clients → invitation_contents**  
   Setiap client memiliki slug unik yang menunjuk ke satu record `invitation_contents`. Data inilah yang dipakai aplikasi Next.js untuk merender halaman undangan (profil pasangan, jadwal acara, galeri, gift). Jika slug dihapus pada `clients`, relasi otomatis bernilai `NULL`, sehingga undangan tidak lagi terhubung.

2. **clients → client_media**  
   Semua asset (foto galeri, musik latar, video) yang diunggah user dicatat di `client_media`. Field `client_id` memastikan media hanya muncul di undangan milik client tersebut. Saat halaman undangan di-render, loader akan membaca daftar media ini dan menyesuaikan kuota (`quota_photos`, `quota_videos`, dll.).

3. **clients → invitation_guests**  
   Daftar tamu yang menerima undangan (atau QR guestbook) disimpan di `invitation_guests`. Setiap tamu memiliki atribut `sent` untuk menandai apakah pesan WhatsApp/Email sudah dikirim. Saat user membuka dashboard kirim undangan, aplikasi membaca tabel ini untuk menampilkan statistik dan fitur ekspor.

4. **admins**  
   Admin tidak memiliki FK langsung ke tabel lain, tapi melalui aplikasi internal mereka mengelola data `clients`, konten template, dan memastikan proses onboarding berjalan. Relasi logis: admin login → CRUD client → client mengisi konten → undangan tayang.

Dengan struktur ini, alur undangan adalah:
1. Admin membuat/mengelola record `clients`.
2. Client login, mengisi `invitation_contents` (konten undangan) dan mengunggah asset ke `client_media`.
3. Client mengimpor atau menambah tamu ke `invitation_guests`.
4. Aplikasi Next.js menampilkan halaman undangan berdasarkan `slug` tertentu, mengambil data dari `invitation_contents`, `client_media`, dan daftar tamu sesuai kebutuhan (misal men-generate QR khusus tamu).
