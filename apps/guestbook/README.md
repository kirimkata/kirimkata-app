# Digital Wedding Guestbook System

Sistem buku tamu digital untuk acara pernikahan dengan fitur QR check-in, kontrol VIP, dan dashboard real-time.

## 🎯 Fitur Utama

### Core Features
- **Guest Management**: Database tamu dengan kategori REGULAR, VIP, VVIP
- **QR Check-in**: Sistem check-in menggunakan QR code dengan JWT token
- **Role-based Access**: 4 role staff (Usher, Souvenir, Snack, Admin)
- **Entitlement System**: Kontrol akses VIP lounge, souvenir, dan konsumsi
- **Real-time Dashboard**: Statistik dan monitoring live
- **Offline-first**: Sinkronisasi otomatis saat koneksi pulih

### Security Features
- JWT authentication untuk staff
- Signed QR tokens dengan expiry
- Anti-replay protection
- Role-based API access control
- Audit logging untuk semua aktivitas

## 🏗️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────┐
│                    DIGITAL WEDDING GUESTBOOK                   │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (Next.js PWA)                                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │   Usher     │ │  Souvenir   │ │    Snack    │ │    Admin    ││
│  │    App      │ │    Staff    │ │    Staff    │ │ Dashboard   ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
├─────────────────────────────────────────────────────────────────┤
│  API Layer (Next.js API Routes)                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │    Auth     │ │   Check-in  │ │  Redemption │ │  Dashboard  ││
│  │  Endpoints  │ │  Endpoints  │ │  Endpoints  │ │  Endpoints  ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
├─────────────────────────────────────────────────────────────────┤
│  Business Logic                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │ QR Token    │ │  Anti-fraud │ │   Offline   │ │  Real-time  ││
│  │  Service    │ │   Service   │ │   Sync      │ │   Events    ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
├─────────────────────────────────────────────────────────────────┤
│  Data Layer                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │  Supabase   │ │  IndexedDB  │ │  WebSocket  │ │    Audit    ││
│  │ PostgreSQL  │ │  (Offline)  │ │ (Real-time) │ │    Logs     ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Database Schema

### Core Tables
- **guests**: Data tamu dengan kategori dan QR token
- **staff**: Akun staff dengan role-based access
- **checkins**: Record check-in tamu
- **entitlements**: Hak akses berdasarkan kategori tamu
- **redemptions**: Record pengambilan souvenir/konsumsi
- **audit_logs**: Log audit untuk tracking aktivitas

## 🔐 QR Token Design

```typescript
interface QRTokenPayload {
  guest_id: string;
  guest_code: string;
  name: string;
  category: 'REGULAR' | 'VIP' | 'VVIP';
  exp: number; // Expiration timestamp
  iat: number; // Issued at
  nonce: string; // Anti-replay protection
}
```

## 🚀 Setup & Installation

### Prerequisites
- Node.js 18+
- PostgreSQL database (Supabase)
- Environment variables

### Installation Steps

1. **Clone & Install Dependencies**
```bash
cd guestbook
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env.local
# Edit .env.local dengan konfigurasi Supabase dan JWT secrets
```

3. **Database Migration**
```bash
# Jalankan migration SQL di Supabase
psql -f database/migrations/001_initial_schema.sql

# Seed data untuk testing
psql -f database/seeds/001_initial_data.sql
```

4. **Development Server**
```bash
npm run dev
```

Server akan berjalan di `http://localhost:3001`

## 📱 Staff Roles & Access

### 👤 Usher
- Check-in tamu via QR scan atau manual search
- Lihat status check-in
- Akses: `/checkin`

### 🎁 Souvenir Staff
- Kelola redemption souvenir
- Lihat riwayat pengambilan souvenir
- Akses: `/souvenir`

### 🍽️ Snack Staff
- Kelola redemption konsumsi
- Kelola akses VIP lounge
- Akses: `/snack`

### ⚙️ Admin
- Dashboard lengkap dengan statistik
- Kelola semua staff dan tamu
- Export laporan
- Akses: `/admin`

## 🔌 API Endpoints

### Authentication
```
POST /api/auth/login
```

### Check-in
```
POST /api/checkin          # Check-in tamu
GET  /api/checkin          # List check-ins
```

### Redemption
```
POST /api/redeem           # Redeem entitlement
GET  /api/redeem           # List redemptions
```

### Dashboard
```
GET  /api/dashboard/stats  # Real-time statistics
```

## 🎨 UX Design Guidelines

### Color Coding
- **REGULAR**: 🟢 Green (`success-*` classes)
- **VIP**: 🟡 Gold (`vip-*` classes)  
- **VVIP**: 🟣 Purple (`vvip-*` classes)

### Responsive Design
- Mobile-first approach
- Large touch targets untuk elderly guests
- High contrast untuk visibility
- Indonesian language interface

## 🛡️ Security Features

### Anti-fraud Measures
1. **QR Token Expiry**: Token berlaku 24 jam
2. **One-time Check-in**: Prevent duplicate check-in
3. **Role-based Access**: Staff hanya akses fitur sesuai role
4. **Audit Logging**: Track semua aktivitas
5. **IP & Device Tracking**: Monitor akses

### Error Handling
- Graceful degradation saat offline
- Clear error messages dalam Bahasa Indonesia
- Fallback manual search jika QR gagal

## 📈 Dashboard Metrics

### Real-time Stats
- Total tamu vs yang sudah check-in
- Breakdown per kategori (Regular/VIP/VVIP)
- Souvenir & snack yang sudah diambil
- Akses VIP lounge
- Trend check-in per jam
- Recent activity feed

## 🔄 Offline Capability

### IndexedDB Storage
- Cache guest data untuk offline search
- Queue pending actions saat offline
- Auto-sync saat koneksi kembali

### Service Worker
- Cache static assets
- Background sync
- Push notifications

## 🚨 Edge Cases Handling

1. **Duplicate Names**: Guest ID unik mencegah konflik
2. **Lost QR**: Manual search fallback
3. **Plus One**: Admin dapat adjust entitlement
4. **Network Loss**: Offline queue dengan auto-sync
5. **Staff Error**: Audit log untuk tracking & rollback

## 📋 Default Login Credentials

```
Admin:     admin / admin123
Usher:     usher1 / admin123  
Souvenir:  souvenir1 / admin123
Snack:     snack1 / admin123
```

## 🎯 Production Deployment

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
QR_JWT_SECRET=your_qr_secret
```

### Performance Optimization
- Database indexing untuk fast queries
- Connection pooling
- CDN untuk static assets
- Gzip compression

## 📞 Support & Maintenance

### Monitoring
- Real-time error tracking
- Performance metrics
- Database query optimization
- Automated backups

### Troubleshooting
- Check database connections
- Verify JWT secrets
- Monitor API rate limits
- Review audit logs

## 📄 License

Private project untuk KirimKata.com

---

**Sistem ini dirancang khusus untuk menangani 1,500+ tamu dengan performa tinggi dan anti-fraud protection.**
