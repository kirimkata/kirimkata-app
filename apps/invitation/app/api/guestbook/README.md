# Guestbook API Routes

API endpoints untuk fitur guestbook di invitation app.

## 📁 Struktur API

```
api/guestbook/
├── events/
│   └── route.ts       # GET, POST /api/guestbook/events
├── staff/
│   └── route.ts       # GET, POST, PUT, DELETE /api/guestbook/staff
├── guests/
│   └── route.ts       # GET, POST /api/guestbook/guests
├── checkin/
│   └── route.ts       # GET, POST /api/guestbook/checkin
├── redeem/
│   └── route.ts       # GET, POST /api/guestbook/redeem
├── seating/
│   └── route.ts       # GET, PUT /api/guestbook/seating
└── README.md          # Dokumentasi ini
```

## 🔐 Authentication

Semua endpoint memerlukan JWT token di header:

```
Authorization: Bearer <token>
```

Token didapat dari login client di `/api/auth/login`.

## 📋 API Endpoints

### Events API

#### GET /api/guestbook/events
Get semua events milik client yang sedang login.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "client_id": "uuid",
      "event_name": "Pernikahan Budi & Ani",
      "event_date": "2024-12-31",
      "event_time": "19:00",
      "venue_name": "Gedung Serbaguna",
      "venue_address": "Jl. Raya No. 123",
      "is_active": true,
      "staff_quota": 2,
      "staff_quota_used": 0,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/guestbook/events
Create event baru.

**Request Body:**
```json
{
  "name": "Pernikahan Budi & Ani",
  "event_date": "2024-12-31",
  "location": "Gedung Serbaguna",
  "options": {
    "event_time": "19:00",
    "venue_address": "Jl. Raya No. 123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "event_name": "Pernikahan Budi & Ani",
    ...
  }
}
```

### Staff API (Coming Soon)

#### GET /api/guestbook/staff?event_id=uuid
Get semua staff untuk event tertentu.

#### POST /api/guestbook/staff
Create staff baru untuk event.

#### PUT /api/guestbook/staff/:id
Update staff.

#### DELETE /api/guestbook/staff/:id
Delete staff.

### Guests API (Coming Soon)

#### GET /api/guestbook/guests?event_id=uuid
Get semua guests untuk event tertentu.

#### POST /api/guestbook/guests
Create guest baru.

### Check-in API (Coming Soon)

#### GET /api/guestbook/checkin?event_id=uuid&limit=20
Get check-in logs.

#### POST /api/guestbook/checkin
Check-in guest.

### Redemption API (Coming Soon)

#### GET /api/guestbook/redeem?event_id=uuid&limit=20
Get redemption logs.

#### POST /api/guestbook/redeem
Redeem benefit untuk guest.

### Seating API (Coming Soon)

#### GET /api/guestbook/seating?event_id=uuid&stats=true
Get seating data dengan statistik.

#### PUT /api/guestbook/seating
Update seating arrangement.

## 🎯 Design Principles

1. **RESTful** - Mengikuti REST API best practices
2. **Consistent Response** - Semua response format `{ success, data, error }`
3. **Error Handling** - Proper HTTP status codes (401, 400, 500)
4. **Type Safe** - Menggunakan TypeScript types dari `lib/guestbook/types.ts`
5. **Secure** - JWT authentication untuk semua endpoints

## 📝 Usage Example

```typescript
// Fetch events
const response = await fetch('/api/guestbook/events', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();

// Create event
const response = await fetch('/api/guestbook/events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'My Event',
    event_date: '2024-12-31',
    location: 'Venue Name'
  })
});
```

## 🔄 Migration dari Guestbook App

Semua API yang sebelumnya di `http://localhost:3001/api/*` sekarang ada di `http://localhost:3000/api/guestbook/*`.

**Before:**
```
http://localhost:3001/api/events
http://localhost:3001/api/staff
```

**After:**
```
http://localhost:3000/api/guestbook/events
http://localhost:3000/api/guestbook/staff
```

Client code tidak perlu hardcode URL lagi, cukup gunakan relative path:
```typescript
fetch('/api/guestbook/events')  // ✅ Otomatis menggunakan origin yang sama
```
