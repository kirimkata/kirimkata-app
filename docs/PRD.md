# PRODUCT REQUIREMENT DOCUMENT (PRD)

## 1. Latar Belakang

Banyak event (wedding, seminar, corporate event) membutuhkan sistem digital untuk mengelola undangan, kehadiran, tempat duduk, dan hak tamu. Solusi yang ada sering tidak fleksibel untuk:

* Multi-event dalam satu akun client
* Pemisahan Invitation & Guestbook
* Pengaturan seat dan tipe tamu (Regular, VIP, VVIP)
* Operasional check-in cepat dan tetap berjalan saat offline

Aplikasi ini dirancang sebagai **Event Management App berbasis web/PWA** dengan fokus pada **Guestbook & Invitation** yang modular dan scalable.

---

## 2. Tujuan Produk

* Client dapat mengelola banyak event dalam satu akun
* Setiap event bisa memilih modul Invitation, Guestbook, atau keduanya
* Guestbook mendukung:

  * Guest Type (Regular, VIP, VVIP, dll)
  * Benefit & akses per Guest Type
  * Seat assignment fleksibel
* Sistem tetap berjalan saat koneksi lambat atau offline

---

## 3. Scope Produk

### In Scope

* Client dashboard (multi-event)
* Event dashboard (context-based)
* Guestbook dengan seat & guest type
* Invitation basic (RSVP, QR)
* PWA offline support (guestbook)

### Out of Scope (fase awal)

* Payment gateway
* Ticketing berbayar
* Integrasi WhatsApp API resmi
* RFID / NFC

---

## 4. Definisi User & Role

### 4.1 Client (Owner)

* Membuat & mengelola event
* Mengatur modul event
* Akses penuh ke data

### 4.2 Admin Event

* Mengatur guest, seat, guest type
* Melihat laporan

### 4.3 Operator Check-in

* Scan QR
* Manual check-in
* Tidak bisa ubah konfigurasi

---

## 5. User Journey (High Level)

1. Register / Login
2. Masuk Client Dashboard (List Event)
3. Buat Event
4. Pilih Modul Event
5. Masuk Event Dashboard
6. Setup Guestbook / Invitation
7. Operasional Hari-H
8. Laporan Pasca Event

---

## 6. Client Dashboard (Multi Event)

### Fitur

* List event
* Create event
* Select event
* Archive event

### Data Ditampilkan

* Nama event
* Tanggal
* Modul aktif
* Status

---

## 7. Create Event Flow

### Step 1 – Informasi Event

* Nama event
* Tanggal & waktu
* Lokasi
* Timezone

### Step 2 – Pilih Modul

* Invitation
* Guestbook

### Step 3 – Konfigurasi Awal

* Invitation: RSVP on/off
* Guestbook: mode check-in, offline support

---

## 8. Event Dashboard (Contextual)

### Sidebar Menu

* Overview
* Invitation (conditional)
* Guestbook (conditional)
* Reports
* Settings
* Switch Event

---

## 9. Guestbook Module – Detail Requirement

### 9.1 Guest Type Management

#### Fitur

* Create / edit / delete guest type
* Warna label
* Prioritas

#### Contoh

* Regular
* VIP
* VVIP

---

### 9.2 Benefit & Access Management

#### Fitur

* Create benefit
* Mapping benefit ke guest type

#### Contoh Benefit

* Konsumsi
* Souvenir
* VIP Lounge
* Priority Check-in

#### Matrix Mapping

Benefit vs Guest Type (checkbox)

---

### 9.3 Seat Management

#### Mode Seat

1. No seat
2. Table-based
3. Numbered seat
4. Zone-based

#### Data Seat

* Nama seat / table / zone
* Kapasitas
* Guest type allowed

---

### 9.4 Guest List

#### Data Guest

* Nama
* Kontak
* Guest type
* Seat
* QR code
* Status check-in

#### Fitur

* Import CSV
* Manual add
* Auto seat assign

---

### 9.5 Check-in System

#### Mode

* QR Scan
* Search manual

#### Validasi

* QR sudah digunakan
* Guest type vs seat
* Double check-in

#### Tampilan Operator

* Nama guest
* Guest type (warna)
* Seat
* Hak akses

---

## 10. Invitation Module (Ringkas)

### Fitur

* Guest list
* RSVP
* Generate QR
* Preview undangan

---

## 11. Offline & PWA Requirement

### Offline Support

* Cache guest list
* Cache seat & guest type
* Check-in tetap berjalan

### Sync Rule

* Queue local
* Sync saat online
* Conflict resolution (first check-in wins)

---

## 12. Reporting

### Laporan

* Total guest
* Hadir vs tidak
* Per guest type
* Per seat / zone

---

## 13. Non-Functional Requirement

### Performance

* Check-in < 1 detik
* 1 operator bisa handle 1000+ guest

### Security

* QR signed token
* Expired QR support

### Scalability

* Multi event
* Multi operator

---

## 14. Data Model (High Level)

* Client
* Event
* GuestType
* Benefit
* GuestTypeBenefit
* Seat
* Guest
* CheckInLog

---

## 15. Success Metric

* Check-in success rate > 99%
* Tidak ada double seat
* Offline sync success
* Setup event < 15 menit

---

## 16. Future Enhancement

* Multi gate
* Wristband color
* NFC / RFID
* Ticketing
* Payment

---

**Dokumen ini menjadi acuan utama desain UI, backend API, dan operasional aplikasi Event Management.**
