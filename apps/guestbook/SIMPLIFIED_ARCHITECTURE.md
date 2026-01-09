# Digital Wedding Guestbook - Simplified Architecture

## 🎯 Konsep Integrasi dengan Sistem Undangan

Sistem guestbook ini **TIDAK menggunakan database terpisah**, melainkan **mengintegrasikan dengan database undangan yang sudah ada** untuk efisiensi dan kemudahan maintenance.

## 📊 Database Schema - Simplified

### Menggunakan Table yang Sudah Ada

#### 1. **`clients`** (sudah ada)
Ditambahkan field baru:
```sql
ALTER TABLE clients 
ADD COLUMN has_guestbook_access BOOLEAN DEFAULT false;
```

**Fungsi**: 
- Client yang **membeli fitur guestbook** akan memiliki `has_guestbook_access = true`
- Client ini menjadi **owner/admin** dengan akses penuh ke semua fitur guestbook
- Tidak perlu role terpisah (usher, souvenir, snack) - client sebagai super admin

#### 2. **`invitation_guests`** (sudah ada)
Ditambahkan field baru:
```sql
ALTER TABLE invitation_guests
ADD COLUMN guest_category VARCHAR(20) DEFAULT 'REGULAR',
ADD COLUMN qr_token_hash VARCHAR(255) UNIQUE,
ADD COLUMN notes TEXT;
```

**Fungsi**:
- Data tamu dari undangan **langsung digunakan** untuk guestbook
- `id` dari `invitation_guests` digunakan sebagai **QR scan identifier**
- Tidak perlu table `guests` terpisah

### Table Baru untuk Guestbook (Minimal)

#### 3. **`guestbook_checkins`**
```sql
CREATE TABLE guestbook_checkins (
  id UUID PRIMARY KEY,
  guest_id UUID REFERENCES invitation_guests(id),
  client_id UUID REFERENCES clients(id),
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  check_in_method VARCHAR(20), -- 'QR_SCAN' atau 'MANUAL_SEARCH'
  device_info JSONB,
  notes TEXT
);
```

#### 4. **`guestbook_entitlements`**
```sql
CREATE TABLE guestbook_entitlements (
  id UUID PRIMARY KEY,
  guest_id UUID REFERENCES invitation_guests(id),
  entitlement_type VARCHAR(20), -- 'VIP_LOUNGE', 'SOUVENIR', 'SNACK'
  is_entitled BOOLEAN,
  max_quantity INTEGER
);
```

#### 5. **`guestbook_redemptions`**
```sql
CREATE TABLE guestbook_redemptions (
  id UUID PRIMARY KEY,
  guest_id UUID REFERENCES invitation_guests(id),
  client_id UUID REFERENCES clients(id),
  entitlement_type VARCHAR(20),
  quantity INTEGER,
  redeemed_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 6. **`guestbook_audit_logs`**
```sql
CREATE TABLE guestbook_audit_logs (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  action VARCHAR(50),
  table_name VARCHAR(50),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔐 Authentication Flow

### Sebelum (Kompleks - dengan Staff)
```
Staff Login → Verify staff credentials → Check role → Generate token
```

### Sekarang (Sederhana - dengan Client)
```
Client Login → Verify client credentials → Check has_guestbook_access → Generate token
```

**Keuntungan**:
- Client yang beli guestbook = owner dengan akses penuh
- Tidak perlu manage multiple staff accounts
- Client bisa login dengan kredensial yang sama untuk undangan & guestbook
- Lebih mudah untuk billing (1 client = 1 subscription)

## 🎫 QR Token System

### QR Token Payload
```typescript
{
  guest_id: "uuid-dari-invitation_guests",
  name: "Nama Tamu",
  category: "VIP",
  client_id: "uuid-client-owner",
  exp: timestamp,
  iat: timestamp,
  nonce: "random-string"
}
```

**Penting**: 
- `guest_id` adalah **`invitation_guests.id`** (bukan guest_code)
- QR token valid selama **30 hari** (cukup untuk persiapan wedding)
- Token di-hash dan disimpan di `invitation_guests.qr_token_hash`

## 🔄 Data Flow

### 1. Client Membeli Fitur Guestbook
```sql
UPDATE clients 
SET has_guestbook_access = true 
WHERE id = 'client_id';
```

### 2. Client Menambah Tamu (dari sistem undangan)
```sql
INSERT INTO invitation_guests (client_id, name, phone, guest_category)
VALUES ('client_id', 'Budi', '08123456789', 'VIP');

-- Trigger otomatis membuat entitlements berdasarkan category
```

### 3. Generate QR Code untuk Tamu
```typescript
const qrToken = generateQRToken({
  guest_id: guest.id,
  name: guest.name,
  category: guest.guest_category,
  client_id: guest.client_id
});

const tokenHash = hashQRToken(qrToken);
await setGuestQRToken(guest.id, tokenHash);
```

### 4. Check-in Tamu (QR Scan)
```typescript
// Scan QR → Verify token → Check if already checked in → Create checkin record
POST /api/checkin
{
  qr_token: "jwt-token-from-qr",
  method: "QR_SCAN"
}
```

### 5. Redemption (Souvenir/Snack)
```typescript
// Check entitlement → Check quota → Create redemption record
POST /api/redeem
{
  guest_id: "uuid",
  entitlement_type: "SOUVENIR",
  quantity: 1
}
```

## 🎨 Guest Categories & Entitlements

### Auto-created by Trigger

**VVIP**:
- ✅ VIP Lounge Access (1x)
- ✅ Souvenir (1x)
- ✅ Snack (2x)

**VIP**:
- ✅ VIP Lounge Access (1x)
- ✅ Souvenir (1x)
- ✅ Snack (1x)

**REGULAR**:
- ✅ Souvenir (1x)

## 📱 API Endpoints

### Authentication
```
POST /api/auth/login
Body: { username, password }
Response: { token, client: { id, username, has_guestbook_access } }
```

### Check-in
```
POST /api/checkin
Headers: Authorization: Bearer <token>
Body: { qr_token?, guest_id?, method: 'QR_SCAN' | 'MANUAL_SEARCH' }
```

### Redemption
```
POST /api/redeem
Headers: Authorization: Bearer <token>
Body: { guest_id, entitlement_type, quantity }
```

### Dashboard Stats
```
GET /api/dashboard/stats
Headers: Authorization: Bearer <token>
Response: { total_guests, checked_in, vip, vvip, regular, ... }
```

## 🚀 Migration Steps

### 1. Run Migration SQL
```bash
psql -f database/migrations/001_simplified_guestbook_schema.sql
```

### 2. Enable Guestbook for Test Client
```sql
UPDATE clients 
SET has_guestbook_access = true 
WHERE username = 'your_client_username';
```

### 3. Seed Sample Data (Optional)
```bash
psql -f database/seeds/001_simplified_seed_data.sql
```

## ✅ Keuntungan Arsitektur Simplified

### 1. **Efisiensi Database**
- Tidak perlu table `guests` terpisah
- Tidak perlu table `staff` terpisah
- Menggunakan data yang sudah ada dari sistem undangan

### 2. **Kemudahan Maintenance**
- 1 source of truth untuk data tamu
- Update data tamu di undangan = otomatis update di guestbook
- Tidak perlu sinkronisasi data

### 3. **User Experience**
- Client login dengan kredensial yang sama
- Tidak perlu manage multiple accounts
- Akses penuh sebagai owner

### 4. **Billing & Business**
- Flag `has_guestbook_access` mudah di-manage
- Bisa disable akses jika subscription habis
- Clear separation: client dengan/tanpa guestbook

### 5. **Scalability**
- Lebih sedikit table = lebih cepat query
- Index yang lebih efisien
- Lebih mudah untuk backup/restore

## 🔒 Security

### Access Control
```typescript
// Middleware check
if (!clientPayload.has_guestbook_access) {
  return { error: 'Tidak memiliki akses guestbook' };
}

// Data isolation
// Client hanya bisa akses data tamu mereka sendiri
WHERE client_id = clientPayload.client_id
```

### QR Token Security
- Signed JWT dengan secret key terpisah
- Token expiry 30 hari
- Anti-replay dengan nonce
- Token hash disimpan, bukan plain token

## 📊 Comparison: Before vs After

| Aspect | Before (Complex) | After (Simplified) |
|--------|------------------|-------------------|
| Auth | Staff with roles | Client as owner |
| Guest Data | Separate `guests` table | Use `invitation_guests` |
| Tables | 6 new tables | 4 new tables |
| User Management | Multiple staff accounts | Single client account |
| Data Sync | Need sync mechanism | No sync needed |
| Complexity | High | Low |
| Maintenance | Complex | Simple |

## 🎯 Summary

Sistem guestbook yang disederhanakan ini:
- ✅ Menggunakan `clients` table untuk auth (dengan flag `has_guestbook_access`)
- ✅ Menggunakan `invitation_guests` untuk data tamu
- ✅ Client yang beli guestbook = owner dengan akses penuh
- ✅ QR scan menggunakan `invitation_guests.id` sebagai identifier
- ✅ Hanya 4 table baru (checkins, entitlements, redemptions, audit_logs)
- ✅ Lebih mudah maintenance dan lebih efisien
