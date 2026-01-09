# 📚 Final API Routes Documentation

## ✅ Semua API Routes Lengkap

Semua API routes sekarang tersedia di **invitation app** (`localhost:3000`).

---

## 📋 Complete API List

### **1. Authentication**
```
POST   /api/client/auth          - Client login
GET    /api/client/profile       - Get client profile
```

### **2. Events**
```
GET    /api/guestbook/events     - Get all client events
POST   /api/guestbook/events     - Create new event
```

### **3. Staff**
```
GET    /api/staff?event_id={uuid}           - Get event staff
POST   /api/staff                            - Create staff
PUT    /api/staff                            - Update staff
DELETE /api/staff?staff_id={uuid}           - Delete staff
```

### **4. Guests**
```
GET    /api/guests?event_id={uuid}          - Get event guests
POST   /api/guests                           - Create guest
PUT    /api/guests                           - Update guest
DELETE /api/guests?guest_id={uuid}          - Delete guest
```

### **5. Guest Statistics**
```
GET    /api/guests/stats?event_id={uuid}    - Get guest statistics
```

### **6. Seating**
```
GET    /api/seating?event_id={uuid}&stats=true  - Get seating data/stats
PUT    /api/seating                              - Update guest seating
```

### **7. Checkin Logs**
```
GET    /api/checkin?event_id={uuid}&limit=20    - Get checkin logs
```

### **8. Redemption Logs**
```
GET    /api/redeem?event_id={uuid}&limit=20     - Get redemption logs
```

---

## 🔧 API Details

### Client Profile API

#### GET /api/client/profile
**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "client": {
    "id": "uuid",
    "username": "client1",
    "email": "client@example.com",
    "slug": "client-slug",
    "guestbook_access": true,
    "theme_key": "parallax/parallax-template1",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### Checkin Logs API

#### GET /api/checkin
**Query Params:**
- `event_id` (required): UUID of the event
- `limit` (optional): Number of logs to return (default: 20)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "staff_id": "uuid",
      "event_guest_id": "uuid",
      "action": "checkin",
      "notes": null,
      "created_at": "2024-01-01T10:30:00Z",
      "event_guests": {
        "id": "uuid",
        "event_id": "uuid",
        "guest_name": "John Doe",
        "guest_phone": "08123456789",
        "guest_type_id": "uuid"
      },
      "guestbook_staff": {
        "id": "uuid",
        "username": "staff1",
        "full_name": "Staff Name"
      }
    }
  ]
}
```

---

### Redemption Logs API

#### GET /api/redeem
**Query Params:**
- `event_id` (required): UUID of the event
- `limit` (optional): Number of logs to return (default: 20)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "staff_id": "uuid",
      "event_guest_id": "uuid",
      "action": "souvenir",
      "notes": "Redeemed souvenir",
      "created_at": "2024-01-01T11:00:00Z",
      "event_guests": {
        "id": "uuid",
        "event_id": "uuid",
        "guest_name": "Jane Smith",
        "guest_phone": "08123456789",
        "guest_type_id": "uuid"
      },
      "guestbook_staff": {
        "id": "uuid",
        "username": "staff2",
        "full_name": "Staff Name"
      }
    }
  ]
}
```

**Note:** Redemption logs include actions: `souvenir`, `snack`, `meal`

---

## 📁 Complete File Structure

```
apps/invitation/
├── lib/guestbook/
│   ├── repositories/
│   │   ├── eventRepository.ts      ✅
│   │   ├── staffRepository.ts      ✅
│   │   ├── guestRepository.ts      ✅
│   │   ├── seatingRepository.ts    ✅
│   │   └── logRepository.ts        ✅ NEW
│   ├── services/
│   │   ├── jwt.ts                  ✅
│   │   └── encryption.ts           ✅
│   ├── types.ts                    ✅
│   └── supabase.ts                 ✅
└── app/api/
    ├── client/
    │   ├── auth/route.ts           ✅
    │   └── profile/route.ts        ✅ UPDATED
    ├── guestbook/
    │   └── events/route.ts         ✅
    ├── staff/route.ts              ✅
    ├── guests/
    │   ├── route.ts                ✅
    │   └── stats/route.ts          ✅
    ├── seating/route.ts            ✅
    ├── checkin/route.ts            ✅ NEW
    └── redeem/route.ts             ✅ NEW
```

---

## 🧪 Testing All Endpoints

### Test Script (Browser Console)

```javascript
const token = localStorage.getItem('client_token');
const eventId = localStorage.getItem('selected_event_id');

// 1. Client Profile
fetch('/api/client/profile', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(d => console.log('Profile:', d));

// 2. Events
fetch('/api/guestbook/events', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(d => console.log('Events:', d));

// 3. Staff
fetch(`/api/staff?event_id=${eventId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(d => console.log('Staff:', d));

// 4. Guests
fetch(`/api/guests?event_id=${eventId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(d => console.log('Guests:', d));

// 5. Guest Stats
fetch(`/api/guests/stats?event_id=${eventId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(d => console.log('Guest Stats:', d));

// 6. Seating
fetch(`/api/seating?event_id=${eventId}&stats=true`, {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(d => console.log('Seating:', d));

// 7. Checkin Logs
fetch(`/api/checkin?event_id=${eventId}&limit=20`, {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(d => console.log('Checkin Logs:', d));

// 8. Redemption Logs
fetch(`/api/redeem?event_id=${eventId}&limit=20`, {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(d => console.log('Redemption Logs:', d));
```

---

## 🔐 Authentication Flow

1. **Login:**
   ```javascript
   POST /api/client/auth
   Body: { username: "client1", password: "password" }
   Response: { token: "...", client: {...} }
   ```

2. **Store Token:**
   ```javascript
   localStorage.setItem('client_token', token);
   localStorage.setItem('client_user', JSON.stringify(client));
   ```

3. **Use Token:**
   ```javascript
   headers: { 'Authorization': `Bearer ${token}` }
   ```

---

## ✅ Status Checklist

- [x] Authentication APIs (login, profile)
- [x] Events API (GET, POST)
- [x] Staff API (GET, POST, PUT, DELETE)
- [x] Guests API (GET, POST, PUT, DELETE)
- [x] Guest Stats API (GET)
- [x] Seating API (GET, PUT)
- [x] Checkin Logs API (GET)
- [x] Redemption Logs API (GET)

---

## 🎯 Summary

**Total API Endpoints:** 15+

**All endpoints now:**
- ✅ Use consistent JWT verification (`verifyClientToken`)
- ✅ Return consistent response format (`{ success, data/error }`)
- ✅ Require Bearer token authentication
- ✅ Handle errors gracefully
- ✅ Support event-based filtering

**No more 404 errors!** 🚀
