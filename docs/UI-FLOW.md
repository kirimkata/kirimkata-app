Berikut flow UI/UX dashboard client yang rapi, scalable, dan cocok untuk model 1 client → banyak event → tiap event punya modul (Invitation / Guestbook). Saya buatkan bertahap dari awal daftar akun sampai masuk dashboard event dengan side menu.

1. FLOW BESAR (HIGH LEVEL)
Landing
 → Register / Login
   → Client Dashboard (List Event)
     → Create Event
     → Select Event
       → Event Dashboard (Side Menu)


Prinsip penting:

Dashboard Client ≠ Dashboard Event

Event adalah context, semua menu di dalam dashboard event selalu terkait event terpilih.

2. SETELAH REGISTER / LOGIN
📍 Halaman: Client Dashboard (Event List)

Ini halaman pertama setelah login.

Tujuan halaman:

Client bisa:

Melihat semua event miliknya

Membuat event baru

Memilih event untuk dikelola

UI Structure (Client Dashboard)

Header

Logo

Nama Client / Company

Profile menu (Account, Billing, Logout)

Main Content

[ + Buat Event Baru ]

------------------------------------------------
| Wedding A | 12 Okt 2026 | Invitation + Guest |
| Seminar B | 05 Nov 2026 | Guestbook Only     |
| Launch C  | 01 Des 2026 | Invitation Only   |
------------------------------------------------

Card / Table Event:

Setiap event menampilkan:

Nama Event

Tanggal

Jenis Modul:

Invitation

Guestbook

Invitation + Guestbook

Status: Draft / Active / Archived

Tombol:

Kelola Event

Quick actions (Preview / Copy Link)

3. FLOW: BUAT EVENT BARU
📍 Halaman / Modal: Create Event

Disarankan wizard 3 step supaya jelas dan tidak membingungkan.

Step 1 — Informasi Event

Nama Event

Tanggal & waktu

Lokasi

Timezone

[ Next ]

Step 2 — Pilih Modul Event

☑ Invitation
☑ Guestbook

UX tip: gunakan checkbox + penjelasan singkat

Contoh:

Invitation → Kirim undangan, RSVP, QR Code

Guestbook → Check-in tamu, scan QR, manual input

[ Next ]

Step 3 — Konfigurasi Awal

Bergantung modul yg dipilih:

Jika Invitation

RSVP aktif / tidak

Max tamu

Generate QR otomatis

Jika Guestbook

Mode check-in (scan / manual)

Offline support (PWA)

Validasi QR (strict / longgar)

[ Buat Event ]

➡️ Setelah sukses → langsung redirect ke Event Dashboard

4. PILIH EVENT → MASUK EVENT DASHBOARD
📍 Halaman: Event Dashboard

Ini halaman inti, SELALU BERDASARKAN EVENT TERPILIH

5. STRUKTUR EVENT DASHBOARD (SIDEBAR)
Sidebar Kiri (Contextual per Event)
Event: Wedding A
------------------
🏠 Overview
📩 Invitation
   ├─ Design
   ├─ Guest List
   ├─ RSVP
   ├─ Broadcast
📖 Guestbook
   ├─ Check-in
   ├─ Scan QR
   ├─ Manual Entry
📊 Reports
⚙️ Settings
🔁 Ganti Event


Menu hanya muncul jika modulnya aktif

Jika Guestbook only → menu Invitation disembunyikan

Jika Invitation only → menu Guestbook disembunyikan

6. DETAIL HALAMAN EVENT DASHBOARD
🏠 Overview

Ringkasan:

Total undangan

RSVP hadir / tidak

Jumlah check-in

Status event

Quick links

📩 Invitation Module

Design → editor undangan

Guest List → import CSV, manual

RSVP → statistik

Broadcast → WA / Email (future)

📖 Guestbook Module

Check-in Live Dashboard

Total hadir realtime

Scan QR

Kamera

Manual Entry

Input nama / no HP

Offline status indicator

🟢 Online

🟡 Slow

🔴 Offline

⚙️ Settings

Edit nama event

Aktif / nonaktif modul

Reset QR

Export data

Archive event

🔁 Ganti Event

Shortcut kembali ke:

Client Dashboard (List Event)

7. POLA ROUTING (NEXT.JS FRIENDLY)

Agar clean & scalable:

/dashboard                 → Client Dashboard
/dashboard/events/new      → Create Event
/dashboard/events/[eventId]
  ├─ overview
  ├─ invitation/*
  ├─ guestbook/*
  ├─ reports
  └─ settings

8. UX PRINCIPLES PENTING (PENTING UNTUK SKALA BESAR)

Event Context Lock

Selalu tampilkan nama event di header

Module-based Menu

Jangan tampilkan fitur yang tidak dipakai

Fast Switch Event

Dropdown event di header

Role-ready

Admin event ≠ owner client (future-proof)

Offline Awareness

Indicator koneksi (penting untuk guestbook)



======


1. KONSEP INTI

Dalam 1 Event, kita pisahkan jadi 3 layer:

Guest Type (Role / Class)
        ↓
Benefit / Access
        ↓
Seat Assignment

Contoh:

Guest Type: Regular, VIP, VVIP

Benefit:

Akses Ruangan

Konsumsi

Souvenir

Priority Check-in

Seat:

Zone / Table / Seat Number

2. STRUKTUR MENU (EVENT DASHBOARD)

Tambahan di Guestbook Module:

📖 Guestbook
 ├─ Check-in
 ├─ Scan QR
 ├─ Manual Entry
 ├─ Guest List
 ├─ Seat & Guest Type   ⭐
 └─ Benefits & Access   ⭐

3. FLOW SETUP (ADMIN EVENT)
A. SETUP GUEST TYPE (ROLE)
📍 Halaman: Seat & Guest Type

UI:

[ + Tambah Guest Type ]

----------------------------------
| Regular | 350 guest |
| VIP     | 50 guest  |
| VVIP    | 10 guest  |
----------------------------------

Saat tambah / edit Guest Type:

Nama:

Regular

VIP

VVIP

Warna label (penting untuk scan cepat)

Prioritas (1–10)

Deskripsi (opsional)

💡 Warna penting untuk operator check-in

B. SETUP BENEFIT / HAK AKSES
📍 Halaman: Benefits & Access

Contoh UI:

[ + Tambah Benefit ]

☑ Konsumsi
☑ Souvenir
☑ Akses Ruang VIP
☑ Parkir Khusus
☑ Priority Check-in

Mapping Benefit ke Guest Type

Tampilan matrix (paling enak dipakai):

Benefit	Regular	VIP	VVIP
Konsumsi	✅	✅	✅
Souvenir	❌	✅	✅
Akses Ruang VIP	❌	✅	✅
Parkir Khusus	❌	❌	✅
Priority Check-in	❌	✅	✅

➡️ Admin tinggal centang

C. SETUP SEAT / TEMPAT DUDUK
Opsi Model Seat (pilih per event)

Saat setup awal Guestbook:

Pilih tipe seating:

❌ Tanpa seat

🪑 Table Based (Meja)

🎫 Numbered Seat (Kursi bernomor)

🧭 Zone Based (Zona)

Contoh: Table Based

Seat Setup UI

Table VIP A (10 seat)
Table VIP B (10 seat)
Table Regular 1 (8 seat)
Table Regular 2 (8 seat)


Setiap table punya:

Nama

Kapasitas

Guest Type allowed:

☑ VIP

☑ VVIP

4. ASSIGN SEAT KE GUEST
📍 Halaman: Guest List

Tiap guest:

Nama	Guest Type	Seat	Status
Andi	VIP	Table VIP A - 3	❌
Budi	Regular	Reg 2 - 5	❌
Cara assign:

Manual select (dropdown)

Auto-assign (rule-based)

Auto Assign Rule contoh:
VIP → Table VIP A dulu, lalu B
Regular → Reg 1 lalu Reg 2

5. FLOW CHECK-IN (OPERATOR)
Saat Scan QR / Search Guest

UI Check-in Screen:

Nama: Andi
Type: VIP (🟡)
Seat: Table VIP A - 3

Hak:
✅ Konsumsi
✅ Souvenir
✅ VIP Lounge

[ CHECK-IN ]


➡️ Operator langsung tahu:

Dia siapa

Duduk di mana

Dapat fasilitas apa

6. RULE VALIDASI (PENTING)
Saat Check-in:

❌ Guest Type tidak sesuai seat → warning

❌ Seat sudah terpakai → alert

❌ Benefit dipakai ulang (souvenir) → log

Ini penting untuk event besar

7. MODE OFFLINE (PWA READY)

Yang perlu di-cache:

Guest list

Guest type

Seat map

Benefit mapping

Saat offline:

Check-in tetap jalan

Conflict disimpan

Sync saat online

8. STRUKTUR DATA (SIMPEL TAPI KUAT)
GuestType {
  id
  name
  color
  priority
}

Benefit {
  id
  name
}

GuestTypeBenefit {
  guestTypeId
  benefitId
}

Seat {
  id
  name
  type // table, seat, zone
  capacity
  allowedGuestTypeIds[]
}

Guest {
  id
  name
  guestTypeId
  seatId
  checkinAt
}

9. SCALING KE DEPAN

Nanti gampang nambah:

Dress code per Guest Type

Gate masuk berbeda

Wristband warna

RFID / NFC

Multi-session event