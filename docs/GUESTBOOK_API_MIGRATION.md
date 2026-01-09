# 📚 Dokumentasi Migrasi Guestbook API

## 🎯 Tujuan Migrasi

Sebelumnya, guestbook API berjalan di app terpisah (`localhost:3001`). Sekarang semua API guestbook sudah dipindahkan ke dalam **invitation app** (`localhost:3000`) agar lebih sederhana dan terstruktur.

## 🔄 Perubahan Utama

### Sebelum (Old Approach)
```
Invitation App (localhost:3000)
  └─ Client Code → fetch('http://localhost:3001/api/events')
                    ↓
Guestbook App (localhost:3001)
  └─ API Routes → /api/events, /api/staff, dll
```

**Masalah:**
- Harus hardcode URL `http://localhost:3001`
- CORS issues
- Dua app harus running bersamaan
- Kompleks untuk deployment

### Sesudah (New Approach)
```
Invitation App (localhost:3000)
  ├─ Client Code → fetch('/api/guestbook/events')
  │                 ↓
  └─ API Routes → /api/guestbook/events, /api/guestbook/staff, dll
       ↓
  └─ Lib/Guestbook → Services, Repositories, Types
```

**Keuntungan:**
- ✅ Tidak perlu hardcode URL (gunakan relative path)
- ✅ Tidak ada CORS issues
- ✅ Hanya satu app yang perlu running
- ✅ Lebih mudah di-deploy
- ✅ Kode lebih terorganisir

## 📁 Struktur Baru

### 1. Library (`apps/invitation/lib/guestbook/`)

```
lib/guestbook/
├── services/
│   ├── jwt.ts              # JWT token management
│   └── encryption.ts       # Password encryption
├── repositories/
│   └── eventRepository.ts  # Database operations untuk events
├── types.ts                # TypeScript type definitions
├── supabase.ts            # Supabase client config
└── README.md              # Dokumentasi library
```

**Fungsi:** Berisi semua business logic dan database operations yang bisa digunakan ulang di berbagai API routes.

### 2. API Routes (`apps/invitation/app/api/guestbook/`)

```
api/guestbook/
├── events/
│   └── route.ts           # GET, POST /api/guestbook/events
├── staff/                 # (Coming soon)
├── guests/                # (Coming soon)
├── checkin/               # (Coming soon)
├── redeem/                # (Coming soon)
├── seating/               # (Coming soon)
└── README.md             # Dokumentasi API
```

**Fungsi:** API endpoints yang bisa diakses dari client (browser).

## 🔧 Cara Menggunakan

### Di Client Code (React/Next.js)

**Sebelum:**
```typescript
// ❌ Old way - hardcode URL
const res = await fetch('http://localhost:3001/api/events', {
  headers: { Authorization: `Bearer ${token}` }
});
```

**Sesudah:**
```typescript
// ✅ New way - relative path
const res = await fetch('/api/guestbook/events', {
  headers: { Authorization: `Bearer ${token}` }
});
```

### Membuat API Route Baru

1. **Buat file route** di `apps/invitation/app/api/guestbook/[nama]/route.ts`

2. **Import dari library:**
```typescript
import { verifyClientToken } from '@/lib/guestbook/services/jwt';
import { getClientEvents } from '@/lib/guestbook/repositories/eventRepository';
```

3. **Implement handler:**
```typescript
export async function GET(request: NextRequest) {
  // 1. Verify token
  const token = request.headers.get('authorization')?.substring(7);
  const payload = verifyClientToken(token);
  
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // 2. Get data dari repository
  const data = await getClientEvents(payload.client_id);
  
  // 3. Return response
  return NextResponse.json({ success: true, data });
}
```

## 📝 Checklist Migrasi

### ✅ Sudah Selesai
- [x] Setup struktur folder `lib/guestbook/`
- [x] Copy types, services (JWT, encryption)
- [x] Setup Supabase client
- [x] Create event repository
- [x] Create `/api/guestbook/events` endpoint
- [x] Update client code di dashboard page
- [x] Update client code di guestbook page
- [x] Buat dokumentasi lengkap

### 🔄 Dalam Progress
- [ ] Create staff repository & API
- [ ] Create guests repository & API
- [ ] Create checkin repository & API
- [ ] Create redeem repository & API
- [ ] Create seating repository & API

### 📋 Next Steps
1. Test `/api/guestbook/events` endpoint
2. Lanjutkan membuat API routes lainnya
3. Update semua client code untuk menggunakan path baru
4. Hapus dependency ke guestbook app (localhost:3001)

## 🧪 Testing

### Test API Endpoint
```bash
# Login dulu untuk dapat token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"your-username","password":"your-password"}'

# Test get events
curl http://localhost:3000/api/guestbook/events \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test create event
curl -X POST http://localhost:3000/api/guestbook/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Event",
    "event_date": "2024-12-31",
    "location": "Test Venue"
  }'
```

### Test di Browser
1. Login ke dashboard: `http://localhost:3000/client-dashboard/login`
2. Setelah login, buka: `http://localhost:3000/client-dashboard`
3. Klik "Buat Event Baru" dan isi form
4. Event baru harus muncul di list

## 🎓 Konsep Penting

### 1. Relative Path vs Absolute Path
```typescript
// ❌ Absolute path - hardcode domain
fetch('http://localhost:3001/api/events')

// ✅ Relative path - otomatis pakai domain yang sama
fetch('/api/guestbook/events')
```

### 2. Separation of Concerns
```
API Route (route.ts)
  ↓ menggunakan
Repository (eventRepository.ts)
  ↓ menggunakan
Supabase Client (supabase.ts)
  ↓ query ke
Database (PostgreSQL)
```

### 3. Type Safety
Semua types didefinisikan di `lib/guestbook/types.ts` dan digunakan di:
- API routes
- Repositories
- Client code

## 🚀 Deployment

Dengan struktur baru ini, deployment jadi lebih mudah:

**Sebelum:** Deploy 2 apps (invitation + guestbook)
**Sesudah:** Deploy 1 app (invitation saja)

Environment variables yang diperlukan:
```env
# JWT
JWT_SECRET=your-secret
QR_JWT_SECRET=your-qr-secret

# Encryption
ENCRYPTION_KEY=your-64-char-hex-key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-url
SUPABASE_SERVICE_ROLE_KEY=your-key
```

## 📞 Support

Jika ada pertanyaan atau masalah:
1. Cek dokumentasi di `lib/guestbook/README.md`
2. Cek API docs di `app/api/guestbook/README.md`
3. Review code examples di file-file yang sudah dibuat
