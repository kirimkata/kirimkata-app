# Quick API Testing Guide

## 🚀 Quick Start

### Option 1: Using Postman (Recommended)

1. **Import Collection**:
   - Open Postman
   - Click "Import"
   - Select `docs/KirimKata_API.postman_collection.json`

2. **Set Environment Variables**:
   - `base_url`: `https://api.kirimkata.com`
   - `client_token`: (will be auto-filled after login)
   - `admin_token`: (will be auto-filled after admin login)
   - `event_id`: (will be auto-filled after listing events)

3. **Test Sequence**:
   ```
   1. Health Check → Should return status: ok
   2. Client Login → Auto-saves token
   3. Get Profile → Uses saved token
   4. List Events → Auto-saves first event ID
   5. Get Event Stats → Uses saved event ID
   ```

### Option 2: Using cURL (PowerShell)

**Health Check**:
```powershell
Invoke-WebRequest -Uri "https://api.kirimkata.com/health" -Method GET -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Client Login**:
```powershell
$body = @{
    username = "your_username"
    password = "your_password"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "https://api.kirimkata.com/v1/auth/client/login" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing

$token = ($response.Content | ConvertFrom-Json).token
```

**Get Profile** (using token):
```powershell
Invoke-WebRequest -Uri "https://api.kirimkata.com/v1/client/profile" -Method GET -Headers @{Authorization="Bearer $token"} -UseBasicParsing | Select-Object -ExpandProperty Content
```

**List Events**:
```powershell
Invoke-WebRequest -Uri "https://api.kirimkata.com/v1/guestbook/events" -Method GET -Headers @{Authorization="Bearer $token"} -UseBasicParsing | Select-Object -ExpandProperty Content
```

### Option 3: Using Browser DevTools

1. Open browser console (F12)
2. Run this script:

```javascript
// Login
const login = async () => {
  const response = await fetch('https://api.kirimkata.com/v1/auth/client/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'your_username',
      password: 'your_password'
    })
  });
  const data = await response.json();
  console.log('Login response:', data);
  return data.token;
};

// Get Profile
const getProfile = async (token) => {
  const response = await fetch('https://api.kirimkata.com/v1/client/profile', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  console.log('Profile:', data);
};

// Test
const token = await login();
await getProfile(token);
```

---

## 📋 Essential Endpoints to Test

### 1. Authentication Flow
```
✓ POST /v1/auth/client/login
✓ POST /v1/auth/client/verify
✓ POST /v1/auth/admin/login
```

### 2. Client Features
```
✓ GET  /v1/client/profile
✓ PUT  /v1/client/settings
✓ GET  /v1/client/messages
```

### 3. Events Management
```
✓ GET    /v1/guestbook/events
✓ POST   /v1/guestbook/events
✓ PUT    /v1/guestbook/events/{id}
✓ DELETE /v1/guestbook/events/{id}
✓ GET    /v1/guestbook/events/{id}/stats
```

### 4. Guests Management
```
✓ GET    /v1/guestbook/guests?event_id={id}
✓ POST   /v1/guestbook/guests
✓ PUT    /v1/guestbook/guests/{id}
✓ DELETE /v1/guestbook/guests/{id}
✓ POST   /v1/guestbook/guests/{id}/generate-qr
✓ GET    /v1/guestbook/guests/export?event_id={id}
```

### 5. Check-in Operations
```
✓ POST /v1/guestbook/checkin
✓ POST /v1/guestbook/checkin/qr
✓ GET  /v1/guestbook/checkin/search
✓ GET  /v1/guestbook/checkin/stats?event_id={id}
```

---

## 🧪 Test Scenarios

### Scenario 1: Complete Event Setup
```
1. Login as client
2. Create new event
3. Create guest types (VIP, Regular)
4. Add guests
5. Generate QR codes
6. Create seating configurations
7. Auto-assign seating
8. View statistics
```

### Scenario 2: Check-in Flow
```
1. Search for guest by name
2. Check-in guest manually
3. Scan QR code for check-in
4. View check-in statistics
5. Export report
```

### Scenario 3: Admin Management
```
1. Login as admin
2. List all clients
3. Create new client
4. Update client quota
5. Create invitation
6. Assign slug to client
```

---

## 📊 Expected Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

### List Response
```json
{
  "success": true,
  "data": [
    { "id": "uuid", ... },
    { "id": "uuid", ... }
  ]
}
```

---

## 🔍 Debugging Tips

1. **Check Response Status**:
   - 200: Success
   - 400: Bad Request (check request body)
   - 401: Unauthorized (check token)
   - 404: Not Found (check URL/ID)
   - 500: Server Error (check logs)

2. **Common Issues**:
   - **401 Unauthorized**: Token expired or invalid
   - **404 Not Found**: Wrong endpoint or ID
   - **400 Bad Request**: Missing required fields

3. **View Logs**:
   ```bash
   cd apps/api
   pnpm run tail
   ```

---

## 📝 Testing Checklist

- [ ] Health check works
- [ ] Client login successful
- [ ] Token saved and works
- [ ] Can create event
- [ ] Can list events
- [ ] Can add guests
- [ ] Can generate QR codes
- [ ] Can check-in guests
- [ ] Can export data
- [ ] Admin login works
- [ ] Admin can manage clients

---

## 🎯 Next Steps After Testing

1. **If all tests pass**:
   - Update remaining frontend pages
   - Deploy to production
   - Monitor logs

2. **If tests fail**:
   - Check error messages
   - Verify credentials
   - Check database data
   - Review API logs

---

**Documentation**: [`API_ENDPOINTS.md`](./API_ENDPOINTS.md)
**Postman Collection**: [`KirimKata_API.postman_collection.json`](./KirimKata_API.postman_collection.json)
**Base URL**: `https://api.kirimkata.com`
