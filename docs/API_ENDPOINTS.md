# KirimKata API - Complete Endpoint List

Base URL: `https://api.kirimkata.com`

---

## 🔐 Authentication

### 1. Client Login
```http
POST /v1/auth/client/login
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "your_username",
    "email": "email@example.com"
  }
}
```

### 2. Client Token Verify
```http
POST /v1/auth/client/verify
Authorization: Bearer {token}
```

### 3. Staff Login
```http
POST /v1/auth/staff/login
Content-Type: application/json

{
  "username": "staff_username",
  "password": "staff_password"
}
```

### 4. Admin Login
```http
POST /v1/auth/admin/login
Content-Type: application/json

{
  "username": "admin_username",
  "password": "admin_password"
}
```

---

## 👤 Client Features

**All endpoints require:** `Authorization: Bearer {client_token}`

### 5. Get Client Profile
```http
GET /v1/client/profile
Authorization: Bearer {client_token}
```

### 6. Update Client Settings
```http
PUT /v1/client/settings
Authorization: Bearer {client_token}
Content-Type: application/json

{
  "email": "newemail@example.com",
  "current_password": "current_pass",
  "new_password": "new_pass"
}
```

### 7. Get Message Template
```http
GET /v1/client/template
Authorization: Bearer {client_token}
```

### 8. Save Message Template
```http
POST /v1/client/template
Authorization: Bearer {client_token}
Content-Type: application/json

{
  "template": "Your custom message template"
}
```

### 9. Get Invitation Content
```http
GET /v1/client/invitation-content
Authorization: Bearer {client_token}
```

### 10. Update Invitation Content
```http
PUT /v1/client/invitation-content
Authorization: Bearer {client_token}
Content-Type: application/json

{
  "bride_name": "Ani",
  "groom_name": "Budi",
  "event_date": "2024-12-31",
  "venue": "Gedung Serbaguna"
}
```

### 11. Get Client Messages/Wishes
```http
GET /v1/client/messages
Authorization: Bearer {client_token}
```

---

## 📁 Media Management

**All endpoints require:** `Authorization: Bearer {client_token}`

### 12. Upload Media
```http
POST /v1/media/upload
Authorization: Bearer {client_token}
Content-Type: multipart/form-data

file: [binary file]
type: "photo" | "music" | "video"
```

### 13. List Media
```http
GET /v1/media/list?type=photo
Authorization: Bearer {client_token}
```

### 14. Delete Media
```http
DELETE /v1/media/delete
Authorization: Bearer {client_token}
Content-Type: application/json

{
  "file_id": "uuid"
}
```

### 15. Check Media Quota
```http
GET /v1/media/quota
Authorization: Bearer {client_token}
```

### 16. Get Custom Images
```http
GET /v1/media/custom-images
Authorization: Bearer {client_token}
```

### 17. Update Custom Images
```http
PUT /v1/media/custom-images
Authorization: Bearer {client_token}
Content-Type: application/json

{
  "custom_images": {
    "logo": "url",
    "background": "url"
  }
}
```

---

## 🎉 Guestbook - Events

**All endpoints require:** `Authorization: Bearer {client_token}`

### 18. List Events
```http
GET /v1/guestbook/events
Authorization: Bearer {client_token}
```

### 19. Create Event
```http
POST /v1/guestbook/events
Authorization: Bearer {client_token}
Content-Type: application/json

{
  "name": "Pernikahan Budi & Ani",
  "event_date": "2024-12-31",
  "event_time": "10:00",
  "location": "Gedung Serbaguna",
  "venue_address": "Jl. Sudirman No. 123",
  "timezone": "Asia/Jakarta",
  "has_invitation": true,
  "has_guestbook": true,
  "invitation_config": {
    "rsvp_enabled": true,
    "max_guests_per_invitation": 2
  },
  "guestbook_config": {
    "checkin_mode": "both",
    "offline_support": true
  },
  "seating_mode": "table_based"
}
```

### 20. Update Event
```http
PUT /v1/guestbook/events/{eventId}
Authorization: Bearer {client_token}
Content-Type: application/json

{
  "name": "Updated Event Name",
  "event_date": "2024-12-31"
}
```

### 21. Delete Event
```http
DELETE /v1/guestbook/events/{eventId}
Authorization: Bearer {client_token}
```

### 22. Get Event Statistics
```http
GET /v1/guestbook/events/{eventId}/stats
Authorization: Bearer {client_token}
```

---

## 👥 Guestbook - Guest Types

**All endpoints require:** `Authorization: Bearer {client_token}`

### 23. List Guest Types
```http
GET /v1/guestbook/guest-types?event_id={eventId}
Authorization: Bearer {client_token}
```

### 24. Create Guest Type
```http
POST /v1/guestbook/guest-types
Authorization: Bearer {client_token}
Content-Type: application/json

{
  "event_id": "uuid",
  "type_name": "vip",
  "display_name": "VIP Guest",
  "color_code": "#FF5733"
}
```

### 25. Update Guest Type
```http
PUT /v1/guestbook/guest-types/{typeId}
Authorization: Bearer {client_token}
Content-Type: application/json

{
  "display_name": "Updated VIP",
  "color_code": "#00FF00"
}
```

### 26. Delete Guest Type
```http
DELETE /v1/guestbook/guest-types/{typeId}
Authorization: Bearer {client_token}
```

### 27. Get Guest Type Statistics
```http
GET /v1/guestbook/guest-types/stats?event_id={eventId}
Authorization: Bearer {client_token}
```

---

## 🎫 Guestbook - Guests

**All endpoints require:** `Authorization: Bearer {client_token}`

### 28. List Guests
```http
GET /v1/guestbook/guests?event_id={eventId}
Authorization: Bearer {client_token}
```

### 29. Create Guest
```http
POST /v1/guestbook/guests
Authorization: Bearer {client_token}
Content-Type: application/json

{
  "event_id": "uuid",
  "guest_name": "John Doe",
  "guest_phone": "08123456789",
  "guest_email": "john@example.com",
  "guest_type_id": "uuid",
  "guest_group": "Family",
  "max_companions": 2,
  "seating_config_id": "uuid"
}
```

### 30. Update Guest
```http
PUT /v1/guestbook/guests/{guestId}
Authorization: Bearer {client_token}
Content-Type: application/json

{
  "guest_name": "John Doe Updated",
  "max_companions": 3
}
```

### 31. Delete Guest
```http
DELETE /v1/guestbook/guests/{guestId}
Authorization: Bearer {client_token}
```

### 32. Generate QR Code
```http
POST /v1/guestbook/guests/{guestId}/generate-qr
Authorization: Bearer {client_token}
```

### 33. Bulk Delete Guests
```http
POST /v1/guestbook/guests/bulk-delete
Authorization: Bearer {client_token}
Content-Type: application/json

{
  "guest_ids": ["uuid1", "uuid2", "uuid3"]
}
```

### 34. Export Guests (CSV)
```http
GET /v1/guestbook/guests/export?event_id={eventId}
Authorization: Bearer {client_token}
```

---

## 🎁 Guestbook - Benefits

**All endpoints require:** `Authorization: Bearer {client_token}`

### 35. List Benefits Catalog
```http
GET /v1/guestbook/benefits
Authorization: Bearer {client_token}
```

### 36. Create Benefit
```http
POST /v1/guestbook/benefits
Authorization: Bearer {client_token}
Content-Type: application/json

{
  "benefit_type": "meal",
  "display_name": "Lunch Box",
  "description": "Premium lunch box",
  "icon": "🍱"
}
```

### 37. Update Benefit
```http
PUT /v1/guestbook/benefits/{benefitId}
Authorization: Bearer {client_token}
Content-Type: application/json

{
  "display_name": "Updated Lunch Box",
  "description": "New description"
}
```

### 38. Delete Benefit
```http
DELETE /v1/guestbook/benefits/{benefitId}
Authorization: Bearer {client_token}
```

### 39. Assign Benefits to Guest Type
```http
POST /v1/guestbook/benefits/assign
Authorization: Bearer {client_token}
Content-Type: application/json

{
  "guest_type_id": "uuid",
  "benefit_ids": ["uuid1", "uuid2"]
}
```

### 40. Get Benefits Matrix
```http
GET /v1/guestbook/benefits/matrix?event_id={eventId}
Authorization: Bearer {client_token}
```

---

## 🪑 Guestbook - Seating

**All endpoints require:** `Authorization: Bearer {client_token}`

### 41. List Seating Configurations
```http
GET /v1/guestbook/seating?event_id={eventId}
Authorization: Bearer {client_token}
```

### 42. Create Seating Config
```http
POST /v1/guestbook/seating
Authorization: Bearer {client_token}
Content-Type: application/json

{
  "event_id": "uuid",
  "table_number": 1,
  "table_name": "Table 1",
  "max_capacity": 10
}
```

### 43. Update Seating Config
```http
PUT /v1/guestbook/seating/{configId}
Authorization: Bearer {client_token}
Content-Type: application/json

{
  "table_name": "VIP Table",
  "max_capacity": 8
}
```

### 44. Delete Seating Config
```http
DELETE /v1/guestbook/seating/{configId}
Authorization: Bearer {client_token}
```

### 45. Auto-Assign Seating
```http
POST /v1/guestbook/seating/auto-assign
Authorization: Bearer {client_token}
Content-Type: application/json

{
  "event_id": "uuid"
}
```

### 46. Bulk Assign Guests to Table
```http
POST /v1/guestbook/seating/bulk
Authorization: Bearer {client_token}
Content-Type: application/json

{
  "guest_ids": ["uuid1", "uuid2"],
  "seating_config_id": "uuid"
}
```

### 47. Get Seating Statistics
```http
GET /v1/guestbook/seating/stats?event_id={eventId}
Authorization: Bearer {client_token}
```

---

## ✅ Guestbook - Check-in

### 48. Check-in Guest
```http
POST /v1/guestbook/checkin
Content-Type: application/json

{
  "guest_id": "uuid",
  "actual_companions": 2
}
```

### 49. Check-in via QR Code
```http
POST /v1/guestbook/checkin/qr
Content-Type: application/json

{
  "qr_token": "QR-uuid-randomstring",
  "actual_companions": 2
}
```

### 50. Search Guests for Check-in
```http
GET /v1/guestbook/checkin/search?event_id={eventId}&query=John
```

### 51. Get Check-in Statistics
```http
GET /v1/guestbook/checkin/stats?event_id={eventId}
Authorization: Bearer {client_token}
```

### 52. Get Reports Statistics
```http
GET /v1/guestbook/checkin/reports/stats?event_id={eventId}
Authorization: Bearer {client_token}
```

### 53. Export Reports (CSV)
```http
GET /v1/guestbook/checkin/reports/export?event_id={eventId}
Authorization: Bearer {client_token}
```

---

## 🔧 Admin Features

**All endpoints require:** `Authorization: Bearer {admin_token}`

### 54. List All Clients
```http
GET /v1/admin/clients
Authorization: Bearer {admin_token}
```

### 55. Create Client
```http
POST /v1/admin/clients
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "username": "newclient",
  "password": "password123",
  "email": "client@example.com",
  "full_name": "New Client"
}
```

### 56. Update Client
```http
PUT /v1/admin/clients/{clientId}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "email": "updated@example.com",
  "full_name": "Updated Name"
}
```

### 57. Delete Client
```http
DELETE /v1/admin/clients/{clientId}
Authorization: Bearer {admin_token}
```

### 58. Get Client Quota
```http
GET /v1/admin/clients/{clientId}/quota
Authorization: Bearer {admin_token}
```

### 59. Update Client Quota
```http
PATCH /v1/admin/clients/{clientId}/quota
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "photo_quota": 50,
  "music_quota": 5,
  "video_quota": 3
}
```

### 60. Create Invitation
```http
POST /v1/admin/invitations
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "slug": "budi-ani-wedding",
  "theme": "simple2",
  "modules": {
    "event": true,
    "bride": true,
    "groom": true
  }
}
```

### 61. Get Available Slugs
```http
GET /v1/admin/slugs
Authorization: Bearer {admin_token}
```

### 62. Update Admin Settings
```http
PUT /v1/admin/settings
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "current_password": "current_pass",
  "new_password": "new_pass"
}
```

---

## 🔗 Shared Features

**All endpoints require:** `Authorization: Bearer {client_token}`

### 63. Get Redemption Logs
```http
GET /v1/shared/redeem?event_id={eventId}&limit=20
Authorization: Bearer {client_token}
```

### 64. Get Seating Info
```http
GET /v1/shared/seating?event_id={eventId}&stats=true
Authorization: Bearer {client_token}
```

### 65. Update Guest Seating
```http
PUT /v1/shared/seating
Authorization: Bearer {client_token}
Content-Type: application/json

{
  "guest_id": "uuid",
  "table_number": 5,
  "seating_area": "Main Hall"
}
```

### 66. List Event Staff
```http
GET /v1/shared/staff?event_id={eventId}
Authorization: Bearer {client_token}
```

### 67. Create Staff
```http
POST /v1/shared/staff
Authorization: Bearer {client_token}
Content-Type: application/json

{
  "event_id": "uuid",
  "username": "staff1",
  "password": "password123",
  "full_name": "Staff Member",
  "phone": "08123456789",
  "permissions": {
    "checkin": true,
    "view_guests": true
  }
}
```

### 68. Update Staff
```http
PUT /v1/shared/staff
Authorization: Bearer {client_token}
Content-Type: application/json

{
  "staff_id": "uuid",
  "full_name": "Updated Name",
  "password": "new_password"
}
```

### 69. Delete Staff
```http
DELETE /v1/shared/staff?staff_id={staffId}
Authorization: Bearer {client_token}
```

### 70. Get Guest Statistics
```http
GET /v1/shared/guests/stats?event_id={eventId}
Authorization: Bearer {client_token}
```

---

## 🏥 Health Check

### 71. Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-09T08:14:00.000Z",
  "version": "1.0.0"
}
```

---

## 📝 Notes

### Authentication Flow
1. Login via `/v1/auth/client/login` to get token
2. Use token in `Authorization: Bearer {token}` header for all protected endpoints
3. Token expires after configured time (default: 7 days)

### Error Responses
All endpoints return consistent error format:
```json
{
  "success": false,
  "error": "Error message here"
}
```

### Success Responses
All endpoints return consistent success format:
```json
{
  "success": true,
  "data": { ... }
}
```

---

## 🧪 Testing with Postman

1. Import this file as Postman Collection
2. Set environment variable `base_url` = `https://api.kirimkata.com`
3. Set environment variable `client_token` after login
4. Set environment variable `admin_token` after admin login

### Quick Test Sequence

1. **Health Check**: `GET /health`
2. **Login**: `POST /v1/auth/client/login`
3. **Get Profile**: `GET /v1/client/profile`
4. **List Events**: `GET /v1/guestbook/events`
5. **Create Event**: `POST /v1/guestbook/events`

---

**Total Endpoints**: 71 (including health check)
**Base URL**: `https://api.kirimkata.com`
**Documentation**: Complete ✅
