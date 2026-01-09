# Guestbook System - Flow & Edge Cases Documentation

## System Overview

Guestbook adalah sistem manajemen tamu digital untuk event pernikahan dengan fitur check-in, redemption (souvenir/snack), dan dashboard real-time. Sistem ini terintegrasi dengan invitation app untuk data tamu.

## Architecture Stack

- **Framework**: Next.js 16 + React 19
- **Styling**: Tailwind CSS v3
- **Database**: Supabase (PostgreSQL)
- **Auth**: JWT (jsonwebtoken)
- **Password**: AES-256-CBC encryption
- **Type Safety**: TypeScript

## Core Entities & Relationships

### 1. Client
- Owner/admin dari event
- Memiliki akses penuh ke guestbook
- Dapat membuat staff dengan permission terbatas
- Login: username/password → JWT dengan `guestbook_access: true`

### 2. Staff (guestbook_staff table)
- Dibuat oleh client untuk operasional
- Permission-based access (bukan role-based):
  - `can_checkin`: Akses check-in tamu
  - `can_redeem_souvenir`: Akses redeem souvenir
  - `can_redeem_snack`: Akses redeem snack
  - `can_access_vip_lounge`: Akses VIP lounge
- Login: event_id + PIN → JWT dengan permissions

### 3. Guest (invitation_guests table)
- Data tamu dari invitation system
- Source: `registered` (dari undangan) atau `walkin` (on-site)
- Memiliki QR code untuk check-in
- Status: `is_checked_in`, `checked_in_at`

### 4. Check-in (guestbook_checkins table)
- Record check-in tamu
- Method: `QR_SCAN` atau `MANUAL_SEARCH`
- Menyimpan staff_id (siapa yang check-in), device_info, notes

### 5. Redemption (guestbook_redemptions table)
- Record pengambilan souvenir/snack/VIP lounge access
- Type: `SOUVENIR`, `SNACK`, `VIP_LOUNGE`
- Quantity tracking
- Menyimpan staff_id yang melakukan redemption

## Authentication Flow

### Client Login
```
POST /api/auth/login
Body: { username, password }
→ verifyClientCredentials()
→ comparePassword() dengan AES decrypt
→ generateClientToken() dengan guestbook_access: true
→ Return JWT token
```

**JWT Payload (Client)**:
```typescript
{
  client_id: string,
  username: string,
  email: string | null,
  slug: string | null,
  guestbook_access: boolean,
  type: 'CLIENT',
  exp: number,
  iat: number
}
```

### Staff Login
```
POST /api/staff/auth
Body: { event_id, pin_code }
→ verifyStaffPin() dari staffs table (old schema)
→ generateStaffToken() dengan permissions
→ Return JWT token
```

**JWT Payload (Staff)**:
```typescript
{
  staff_id: string,
  event_id: string,
  client_id: string,
  name: string,
  staff_type: StaffType,
  can_checkin: boolean,
  can_redeem_souvenir: boolean,
  can_redeem_snack: boolean,
  can_access_vip_lounge: boolean,
  type: 'STAFF',
  exp: number,
  iat: number
}
```

## Check-in Flow

### QR Scan Check-in
```
1. Staff scan QR code tamu
2. POST /api/checkin
   Body: { qr_token, method: 'QR_SCAN', notes? }
   Header: Authorization Bearer <staff_jwt>

3. Verify staff JWT → extract clientId, staffId
4. getGuestByQRToken(qr_token) → lookup by guest ID
5. Check: isGuestCheckedIn(guest_id)
   - If already checked in → 409 Conflict
6. Insert to guestbook_checkins table
7. Return success
```

### Manual Search Check-in
```
1. Staff search tamu by name
2. POST /api/checkin
   Body: { guest_name, guest_group?, method: 'MANUAL_SEARCH' }

3. searchGuestsByNameWithGroup(clientId, name, group)
4. If multiple results → return list for staff to choose
5. If single result → proceed check-in
6. Check: isGuestCheckedIn(guest_id)
7. Insert to guestbook_checkins table
```

**Edge Cases**:
- **Duplicate names**: Return multiple results dengan guest_group untuk disambiguasi
- **Already checked in**: Return 409 dengan message "Tamu sudah melakukan check-in sebelumnya"
- **QR expired/invalid**: Return 404 "QR Code tidak valid"
- **Staff tidak punya permission**: Return 403 (checked via `can_checkin`)

## Redemption Flow

```
1. Staff verify tamu sudah check-in
2. POST /api/redeem
   Body: { guest_id, entitlement_type: 'SOUVENIR'|'SNACK'|'VIP_LOUNGE', quantity, notes? }
   Header: Authorization Bearer <staff_jwt>

3. Verify staff permissions:
   - SOUVENIR → need can_redeem_souvenir
   - SNACK → need can_redeem_snack
   - VIP_LOUNGE → need can_access_vip_lounge

4. getGuestById(guest_id)
5. Check: guest.is_checked_in
   - If not checked in → 400 "Tamu belum melakukan check-in"

6. Insert to guestbook_redemptions table
7. Return success
```

**Edge Cases**:
- **Tamu belum check-in**: Block redemption, return error
- **Staff tidak punya permission**: Return 403
- **Quantity tracking**: System mencatat quantity tapi tidak enforce limit (business logic)
- **Multiple redemption**: Allowed (tamu bisa redeem multiple times jika diizinkan)

## Staff Management Flow

### Create Staff (by Client)
```
POST /api/staff
Body: {
  username,
  password,
  full_name,
  phone?,
  permissions: {
    can_checkin: boolean,
    can_redeem_souvenir: boolean,
    can_redeem_snack: boolean,
    can_access_vip_lounge: boolean
  }
}
Header: Authorization Bearer <client_jwt>

→ Check client JWT has guestbook_access
→ Check staff quota (trigger di database)
→ Hash password dengan AES
→ Insert to guestbook_staff table
→ Return staff data (without password)
```

**Edge Cases**:
- **Quota exceeded**: Database trigger throws error "Staff quota exceeded"
- **Duplicate username**: Per client_id, return error
- **Permission combinations**: Any combination allowed (flexible)

### Update Staff
```
PUT /api/staff
Body: { staff_id, full_name?, phone?, permissions?, is_active? }

→ Update guestbook_staff table
→ Return updated staff data
```

### Delete Staff
```
DELETE /api/staff?id=<staff_id>

→ Hard delete from guestbook_staff table
→ Decrement client's staff_quota_used (via trigger)
```

## Dashboard & Stats

### Real-time Stats
```
GET /api/dashboard/stats
GET /api/guests/stats

Returns:
- total_guests
- checked_in_guests
- registered_guests (from invitation)
- walkin_guests (on-site registration)
- Recent check-ins
- Recent redemptions
```

### Seating Management
```
GET /api/seating?table=<number>
GET /api/seating?area=<area_name>
GET /api/seating?stats=true

POST /api/seating
Body: { guest_id, table_number, seat_number?, seating_area? }

→ Assign seating to guest
→ Check availability (optional)
```

## Repository Layer Functions

### guestRepository.ts
- `getGuestByQRToken(qrToken)`: Lookup guest by QR (uses guest ID)
- `getGuestById(id)`: Get single guest
- `searchGuests(clientId, query)`: Search by name/phone
- `searchGuestsByNameWithGroup(clientId, name, group?)`: Targeted search
- `isGuestCheckedIn(guestId)`: Check if already checked in
- `getGuestsByTable(clientId, tableNumber)`: Seating query
- `getGuestsBySeatingArea(clientId, area)`: Seating query
- `isSeatingAvailable(clientId, table, seat?)`: Check availability
- `assignSeating(guestId, table, seat?, area?)`: Assign seat
- `getSeatingStats(clientId)`: Aggregate by area/table
- `getGuestStats(clientId)`: Total & checked-in counts

### staffRepository.ts
- `getClientStaff(clientId)`: List all staff for client
- `createStaff(...)`: Create with permissions
- `updateStaff(staffId, updates)`: Update staff data/permissions
- `deleteStaff(staffId)`: Hard delete
- `verifyStaffPin(eventId, pinCode)`: For staff login (old schema)
- `getStaffById(staffId)`: Get single staff

### clientRepository.ts
- `findClientByUsername(username)`: Lookup client
- `verifyClientCredentials(username, password)`: Login verification
- `getClientById(id)`: Get single client
- `enableGuestbookAccess(clientId)`: Grant access
- `disableGuestbookAccess(clientId)`: Revoke access

## Edge Cases & Error Handling

### 1. Network/Database Errors
- All repository functions return `null` on error
- API routes catch errors → 500 Internal Server Error
- Supabase connection failures logged to console

### 2. Authentication Errors
- Invalid JWT → 401 Unauthorized
- Expired JWT → 401 Unauthorized
- Missing permissions → 403 Forbidden
- Wrong client/event → 403 Forbidden

### 3. Data Validation Errors
- Missing required fields → 400 Bad Request
- Invalid data format → 400 Bad Request
- Duplicate entries → 409 Conflict (check-in) atau 400 (username)

### 4. Business Logic Errors
- Tamu belum check-in (redemption) → 400
- Tamu sudah check-in (duplicate) → 409
- QR tidak valid → 404
- Staff quota exceeded → 400 dengan message dari trigger

### 5. Race Conditions
- **Double check-in**: Database constraint atau check `isGuestCheckedIn()` sebelum insert
- **Concurrent redemption**: Allowed, system tracks all redemptions
- **Staff creation concurrent**: Database unique constraint pada (client_id, username)

### 6. Data Consistency
- **Guest data sync**: invitation_guests table adalah single source of truth
- **Check-in status**: Derived dari existence of record di guestbook_checkins
- **Staff permissions**: Stored in JWT, perlu re-login jika diupdate

### 7. Schema Mismatches
- **Old vs New Staff schema**: 
  - Old: `staffs` table dengan `event_id`, `pin_code`, `staff_type`
  - New: `guestbook_staff` dengan `client_id`, `username`, `password_encrypted`, permissions
  - `verifyStaffPin()` masih query old schema
  - TODO: Migrate fully to new schema

- **EventGuest vs Guest**:
  - Type `EventGuest` tidak punya `client_id` (punya `event_id`)
  - Filtering by client dilakukan via event relationship
  - Beberapa API route masih assume `client_id` exists

### 8. Deployment Considerations
- **Environment Variables Required**:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `JWT_SECRET`
  - `QR_JWT_SECRET`
  - `ENCRYPTION_KEY` (64 hex chars untuk AES-256)

- **Vercel Deployment**:
  - Set Root Directory: `apps/guestbook`
  - Build command: `pnpm --filter ./apps/guestbook build`
  - Output: `.next`
  - Install command: `pnpm install` (workspace aware)

- **Next.js 16 Breaking Changes**:
  - Route params now `Promise<{ param: string }>` instead of `{ param: string }`
  - Must `await params` before accessing values
  - All dynamic routes updated to handle async params

## Performance Considerations

1. **Database Queries**:
   - Use `.single()` when expecting one result
   - Use `.limit()` for list queries
   - Index on: `client_id`, `guest_id`, `staff_id`, `is_checked_in`

2. **JWT Verification**:
   - Token verified on every API request
   - No caching (stateless)
   - Consider Redis cache for high traffic

3. **Real-time Updates**:
   - Currently polling-based
   - Consider Supabase Realtime subscriptions for live dashboard

4. **File Structure**:
   - Repository pattern: clean separation
   - Type safety: all entities typed
   - API routes: thin controllers, logic in repositories

## Testing Checklist

- [ ] Client login dengan valid/invalid credentials
- [ ] Staff login dengan valid/invalid PIN
- [ ] QR check-in dengan valid/expired/invalid QR
- [ ] Manual search check-in dengan single/multiple results
- [ ] Duplicate check-in attempt
- [ ] Redemption sebelum check-in (should fail)
- [ ] Redemption dengan wrong staff permission (should fail)
- [ ] Staff creation dengan/tanpa quota
- [ ] Staff creation dengan duplicate username
- [ ] Dashboard stats accuracy
- [ ] Seating assignment dan availability check

## Known Issues & TODOs

1. **Staff Auth Route**: Uses old `staffs` table schema, needs migration to `guestbook_staff`
2. **Client ID in JWT**: Some routes assume `client_id` on EventGuest (doesn't exist)
3. **Permission Updates**: Staff needs re-login after permission changes
4. **Quota Enforcement**: Client-side only, no hard block in UI
5. **Audit Logging**: Database triggers exist but not fully utilized in app layer
6. **Offline Support**: Not implemented (mentioned in original README but not in code)

## Summary

Guestbook system adalah permission-based access control system dengan JWT auth, Supabase backend, dan Next.js frontend. Core flows: login → check-in → redemption. Edge cases handled via database constraints, API validation, dan error responses. Build berhasil dengan Tailwind v3 + Next 16 + TypeScript.
