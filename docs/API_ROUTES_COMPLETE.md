# 📚 Complete API Routes Documentation

## ✅ API Routes yang Sudah Dibuat

Semua API routes sekarang tersedia di **invitation app** (`localhost:3000`).

### 1. **Events API** ✅
```
GET    /api/guestbook/events
POST   /api/guestbook/events
```

### 2. **Staff API** ✅
```
GET    /api/staff?event_id={uuid}
POST   /api/staff
PUT    /api/staff
DELETE /api/staff?staff_id={uuid}
```

### 3. **Guests API** ✅
```
GET    /api/guests?event_id={uuid}
POST   /api/guests
PUT    /api/guests
DELETE /api/guests?guest_id={uuid}
```

### 4. **Guest Stats API** ✅
```
GET    /api/guests/stats?event_id={uuid}
```

### 5. **Seating API** ✅
```
GET    /api/seating?event_id={uuid}&stats=true
PUT    /api/seating
```

---

## 📋 API Details

### Staff API

#### GET /api/staff
**Query Params:**
- `event_id` (required): UUID of the event

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "event_id": "uuid",
      "username": "staff1",
      "full_name": "John Doe",
      "phone": "08123456789",
      "can_checkin": true,
      "can_redeem_souvenir": false,
      "can_redeem_snack": false,
      "can_access_vip_lounge": false,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/staff
**Body:**
```json
{
  "event_id": "uuid",
  "username": "staff1",
  "password": "password123",
  "full_name": "John Doe",
  "phone": "08123456789",
  "permissions": {
    "can_checkin": true,
    "can_redeem_souvenir": false,
    "can_redeem_snack": false,
    "can_access_vip_lounge": false
  }
}
```

---

### Guests API

#### GET /api/guests
**Query Params:**
- `event_id` (required): UUID of the event

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "event_id": "uuid",
      "guest_name": "Jane Smith",
      "guest_phone": "08123456789",
      "guest_email": "jane@example.com",
      "guest_type_id": "uuid",
      "source": "registered",
      "is_checked_in": false,
      "checked_in_at": null,
      "max_companions": 2,
      "table_number": "A1",
      "seating_area": "Main Hall",
      "notes": null,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/guests
**Body:**
```json
{
  "event_id": "uuid",
  "guest_name": "Jane Smith",
  "guest_phone": "08123456789",
  "guest_email": "jane@example.com",
  "guest_type_id": "uuid",
  "source": "registered",
  "max_companions": 2,
  "notes": "VIP guest"
}
```

---

### Guest Stats API

#### GET /api/guests/stats
**Query Params:**
- `event_id` (required): UUID of the event

**Response:**
```json
{
  "success": true,
  "data": {
    "total_guests": 150,
    "checked_in": 75,
    "not_checked_in": 75,
    "registered": 140,
    "walkin": 10
  }
}
```

---

### Seating API

#### GET /api/seating
**Query Params:**
- `event_id` (required): UUID of the event
- `stats` (optional): Set to "true" for statistics only

**Response (with stats=true):**
```json
{
  "success": true,
  "data": {
    "total_assigned": 120,
    "total_unassigned": 30,
    "tables": {
      "A1": 8,
      "A2": 10,
      "B1": 8
    },
    "areas": {
      "Main Hall": 50,
      "VIP Area": 30,
      "Garden": 40
    }
  }
}
```

**Response (without stats):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "guest_name": "Jane Smith",
      "table_number": "A1",
      "seating_area": "Main Hall"
    }
  ]
}
```

#### PUT /api/seating
**Body:**
```json
{
  "guest_id": "uuid",
  "table_number": "A1",
  "seating_area": "Main Hall"
}
```

---

## 🔐 Authentication

Semua endpoint memerlukan JWT token di header:

```
Authorization: Bearer <token>
```

Token didapat dari login client di `/api/client/auth`.

---

## 📁 File Structure

```
apps/invitation/
├── lib/guestbook/
│   ├── repositories/
│   │   ├── eventRepository.ts      ✅
│   │   ├── staffRepository.ts      ✅
│   │   ├── guestRepository.ts      ✅
│   │   └── seatingRepository.ts    ✅
│   ├── services/
│   │   ├── jwt.ts                  ✅
│   │   └── encryption.ts           ✅
│   ├── types.ts                    ✅
│   └── supabase.ts                 ✅
└── app/api/
    ├── guestbook/
    │   └── events/route.ts         ✅
    ├── staff/route.ts              ✅
    ├── guests/
    │   ├── route.ts                ✅
    │   └── stats/route.ts          ✅
    └── seating/route.ts            ✅
```

---

## 🧪 Testing

### Test dengan cURL (PowerShell)

```powershell
# 1. Login dulu
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/client/auth" -Method POST -Body (@{username="client1";password="password"} | ConvertTo-Json) -ContentType "application/json"
$token = $response.token

# 2. Test Staff API
Invoke-RestMethod -Uri "http://localhost:3000/api/staff?event_id=YOUR_EVENT_ID" -Headers @{Authorization="Bearer $token"}

# 3. Test Guests API
Invoke-RestMethod -Uri "http://localhost:3000/api/guests?event_id=YOUR_EVENT_ID" -Headers @{Authorization="Bearer $token"}

# 4. Test Guest Stats
Invoke-RestMethod -Uri "http://localhost:3000/api/guests/stats?event_id=YOUR_EVENT_ID" -Headers @{Authorization="Bearer $token"}

# 5. Test Seating
Invoke-RestMethod -Uri "http://localhost:3000/api/seating?event_id=YOUR_EVENT_ID&stats=true" -Headers @{Authorization="Bearer $token"}
```

### Test di Browser Console

```javascript
const token = localStorage.getItem('client_token');
const eventId = localStorage.getItem('selected_event_id');

// Test Staff
fetch(`/api/staff?event_id=${eventId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(console.log);

// Test Guests
fetch(`/api/guests?event_id=${eventId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(console.log);

// Test Guest Stats
fetch(`/api/guests/stats?event_id=${eventId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(console.log);

// Test Seating
fetch(`/api/seating?event_id=${eventId}&stats=true`, {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(console.log);
```

---

## ✅ Status

- [x] Events API
- [x] Staff API (GET, POST, PUT, DELETE)
- [x] Guests API (GET, POST, PUT, DELETE)
- [x] Guest Stats API (GET)
- [x] Seating API (GET, PUT)
- [ ] Checkin API (Coming soon)
- [ ] Redemption API (Coming soon)
- [ ] Staff Logs API (Coming soon)

---

## 🎯 Next Steps

1. Test semua endpoints dengan event_id yang valid
2. Verify response data sesuai dengan database
3. Update guestbook page untuk menggunakan API paths yang benar
4. Implement checkin dan redemption APIs
