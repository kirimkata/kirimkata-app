# 🔄 FASE R3: Migrate Check-in Functionality - IMPLEMENTATION PLAN

**Tanggal:** 8 Januari 2026  
**Status:** 🚧 IN PROGRESS  
**Durasi Estimasi:** 2-3 hari  

---

## 📊 Audit Results - Existing Check-in Code

### Source Files (Invitation App)

#### UI Component
**File:** `apps/invitation/app/dashboard/events/[eventId]/guestbook/checkin/page.tsx`
- **Size:** 525 lines
- **Features:**
  - Dual mode: QR scan vs Manual search
  - Real-time statistics
  - Guest search with autocomplete
  - Companion count management
  - Check-in confirmation modal
  - Success/error messaging
- **Auth:** Uses `client_token` from localStorage
- **API Calls:**
  - `/api/guestbook/guest-types` - Get guest types
  - `/api/guestbook/checkin/stats` - Get statistics
  - `/api/guestbook/checkin/search` - Search guests
  - `/api/guestbook/checkin` - Manual check-in
  - `/api/guestbook/checkin/qr` - QR check-in

#### API Routes

**1. Manual Check-in:** `apps/invitation/app/api/guestbook/checkin/route.ts`
- **Method:** POST
- **Auth:** `verifyClientToken()`
- **Logic:**
  - Verify client access to event
  - Get guest from `invitation_guests` table
  - Check if already checked in
  - Validate companion count
  - Update `is_checked_in`, `checked_in_at`, `actual_companions`
- **Response:** Updated guest data

**2. QR Check-in:** `apps/invitation/app/api/guestbook/checkin/qr/route.ts`
- **Method:** POST
- **Auth:** `verifyClientToken()` + `verifyQRToken()`
- **Logic:**
  - Verify client access
  - Verify QR token validity
  - Verify event_id matches
  - Get guest and check-in
- **Response:** Guest name and check-in time

**3. Search:** `apps/invitation/app/api/guestbook/checkin/search/route.ts`
- **Method:** GET
- **Auth:** `verifyClientToken()`
- **Logic:**
  - Search by name, phone, or email (ILIKE)
  - Order by check-in status, then name
  - Limit 20 results
- **Response:** Array of guests

**4. Stats:** `apps/invitation/app/api/guestbook/checkin/stats/route.ts`
- **Method:** GET
- **Auth:** `verifyClientToken()`
- **Logic:**
  - Count total, checked-in, not checked-in
  - Calculate check-in rate
- **Response:** Statistics object

---

## 🎯 Migration Strategy

### Key Changes Required

#### 1. Authentication Change
```diff
- CLIENT token (client_id)
+ STAFF token (staff_id, event_id)

- verifyClientToken()
+ verifyStaffToken()

- localStorage.getItem('client_token')
+ localStorage.getItem('staff_token')
```

#### 2. Database Table Change
```diff
- invitation_guests (old invitation-only table)
+ event_guests (new unified table from FASE 1)
```

#### 3. Access Control
```diff
- Client can access all their events
+ Staff can only access assigned event (from token)

- getEventByIdWithAccess(event_id, client_id)
+ Verify event_id matches token.event_id
```

#### 4. Logging
```diff
- No logging
+ Log all check-in actions to guestbook_staff_logs
  - staff_id
  - event_guest_id
  - action: 'checkin'
  - notes
```

#### 5. UI Simplification
```diff
- Full dashboard with navigation
+ Standalone operator interface

- Multiple event selection
+ Single event (from staff token)

- Complex statistics
+ Essential stats only
```

---

## 📁 Target Structure (Guestbook App)

```
apps/guestbook/
├── app/
│   ├── events/
│   │   ├── page.tsx ⭐ NEW (Event selection - if staff has multiple)
│   │   └── [eventId]/
│   │       ├── layout.tsx ⭐ NEW (Event context provider)
│   │       ├── page.tsx ⭐ NEW (Dashboard/redirect)
│   │       ├── checkin/
│   │       │   └── page.tsx ⭐ NEW (Main check-in interface)
│   │       └── guests/
│   │           └── page.tsx ⭐ NEW (Guest list - read only)
│   │
│   ├── api/
│   │   ├── checkin/
│   │   │   ├── route.ts ⭐ NEW (Manual check-in with STAFF auth)
│   │   │   ├── qr/
│   │   │   │   └── route.ts ⭐ NEW (QR check-in with STAFF auth)
│   │   │   ├── search/
│   │   │   │   └── route.ts ⭐ NEW (Search with STAFF auth)
│   │   │   └── stats/
│   │   │       └── route.ts ⭐ NEW (Stats with STAFF auth)
│   │   │
│   │   └── auth/
│   │       └── login/
│   │           └── route.ts ⚠️ UPDATE (Staff login)
│   │
│   └── login/
│       └── page.tsx ⚠️ UPDATE (Staff-only login)
│
└── components/
    ├── checkin/
    │   ├── QRScannerModal.tsx ⭐ NEW
    │   ├── ManualSearchForm.tsx ⭐ NEW
    │   ├── GuestCard.tsx ⭐ NEW
    │   ├── CheckinConfirmModal.tsx ⭐ NEW
    │   └── StatsCards.tsx ⭐ NEW
    └── ...
```

---

## 🔨 Implementation Steps

### Step 1: Update Login (Staff-Only) ✅ REVIEW

**File:** `apps/guestbook/app/login/page.tsx`

**Current:** Dual login (client/staff)  
**Target:** Staff-only login

**Changes:**
- Remove client login option
- Update to staff-only
- Store `staff_token` in localStorage
- Redirect to `/events` after login

---

### Step 2: Create Staff Auth API ⭐ NEW

**File:** `apps/guestbook/app/api/auth/login/route.ts`

**Logic:**
```typescript
POST /api/auth/login
{
  username: string,
  password: string,
  event_id?: string  // Optional: staff might work multiple events
}

Response:
{
  success: true,
  token: string,  // STAFF JWT token
  staff: {
    id: string,
    username: string,
    full_name: string,
    event_id: string,
    staff_type: string,
    permissions: {...}
  }
}
```

**Implementation:**
1. Verify username/password with `guestbook_staff` table
2. Generate STAFF token with `generateStaffToken()`
3. Include event_id, staff_id, permissions in token
4. Return token + staff data

---

### Step 3: Create Event Selection Page ⭐ NEW

**File:** `apps/guestbook/app/events/page.tsx`

**Purpose:** 
- If staff assigned to single event → auto-redirect
- If staff assigned to multiple events → show selection

**UI:**
- List of events staff can access
- Event name, date, location
- Quick stats (total guests, checked-in)
- Click to enter event

**Logic:**
```typescript
1. Get staff token from localStorage
2. Decode to get staff_id
3. Fetch events for staff
4. If 1 event → redirect to /events/[eventId]/checkin
5. If multiple → show selection
```

---

### Step 4: Create Check-in Page ⭐ NEW

**File:** `apps/guestbook/app/events/[eventId]/checkin/page.tsx`

**Source:** Copy from invitation check-in page  
**Changes:**
1. **Auth:**
   - Use `staff_token` instead of `client_token`
   - Verify event_id matches token

2. **API Endpoints:**
   - `/api/checkin` (not `/api/guestbook/checkin`)
   - `/api/checkin/qr`
   - `/api/checkin/search`
   - `/api/checkin/stats`

3. **UI Simplifications:**
   - Remove navigation (standalone)
   - Focus on mobile-first
   - Larger touch targets
   - Simpler layout

4. **QR Scanner:**
   - Implement with html5-qrcode
   - Full-screen modal
   - Camera selection
   - Error handling

5. **Features:**
   - ✅ Dual mode (QR/Manual)
   - ✅ Real-time stats
   - ✅ Guest search
   - ✅ Companion count
   - ✅ Success/error feedback
   - ⭐ Offline queue (FASE R5)

---

### Step 5: Create Check-in API Routes ⭐ NEW

#### A. Manual Check-in API

**File:** `apps/guestbook/app/api/checkin/route.ts`

**Changes from invitation:**
```diff
- verifyClientToken()
+ verifyStaffToken()

- getEventByIdWithAccess(event_id, client_id)
+ Verify event_id === payload.event_id

- invitation_guests table
+ event_guests table

+ Log to guestbook_staff_logs:
  - staff_id: payload.staff_id
  - event_guest_id: guest.id
  - action: 'checkin'
  - notes: `Checked in ${guest.guest_name}`
```

**Logic:**
1. Verify STAFF token
2. Verify event_id matches token.event_id
3. Get guest from `event_guests`
4. Validate not already checked in
5. Validate companion count
6. Update guest check-in status
7. **Create staff log entry**
8. Return success

#### B. QR Check-in API

**File:** `apps/guestbook/app/api/checkin/qr/route.ts`

**Changes:**
```diff
- verifyClientToken()
+ verifyStaffToken()

- invitation_guests
+ event_guests

+ Create staff log
```

**Logic:**
1. Verify STAFF token
2. Verify QR token
3. Verify event_id matches
4. Check-in guest
5. **Log action**
6. Return success

#### C. Search API

**File:** `apps/guestbook/app/api/checkin/search/route.ts`

**Changes:**
```diff
- verifyClientToken()
+ verifyStaffToken()

- invitation_guests
+ event_guests
```

**Logic:**
1. Verify STAFF token
2. Verify event_id matches token
3. Search by name/phone/email
4. Return results

#### D. Stats API

**File:** `apps/guestbook/app/api/checkin/stats/route.ts`

**Changes:**
```diff
- verifyClientToken()
+ verifyStaffToken()

- invitation_guests
+ event_guests
```

**Logic:**
1. Verify STAFF token
2. Count guests (total, checked-in, not checked-in)
3. Calculate rate
4. Return stats

---

### Step 6: Implement QR Scanner Component ⭐ NEW

**File:** `apps/guestbook/components/checkin/QRScannerModal.tsx`

**Library:** html5-qrcode (already installed)

**Features:**
- Full-screen modal
- Camera selection (front/back)
- Real-time scanning
- Success feedback
- Error handling
- Close button

**Implementation:**
```typescript
import { Html5QrcodeScanner } from 'html5-qrcode';

const QRScannerModal = ({ isOpen, onScan, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: 250 },
        false
      );
      
      scanner.render(onScanSuccess, onScanError);
      
      return () => scanner.clear();
    }
  }, [isOpen]);
  
  const onScanSuccess = (decodedText) => {
    onScan(decodedText);
    onClose();
  };
  
  // ... render modal
};
```

---

### Step 7: Create Supporting Components ⭐ NEW

#### A. ManualSearchForm.tsx
- Search input
- Loading state
- Results list
- Guest cards

#### B. GuestCard.tsx
- Guest info display
- Check-in status badge
- Guest type badge
- Companion count
- Action button

#### C. CheckinConfirmModal.tsx
- Guest details
- Companion count selector
- Confirm/Cancel buttons
- Loading state

#### D. StatsCards.tsx
- Total guests
- Checked in
- Not checked in
- Check-in rate
- Real-time updates

---

### Step 8: Update Login Page ⚠️ UPDATE

**File:** `apps/guestbook/app/login/page.tsx`

**Changes:**
```diff
- Dual login (client/staff)
+ Staff-only login

- loginType state
+ Remove (always staff)

- Redirect to /dashboard or /staff-dashboard
+ Redirect to /events

- Store guestbook_token, guestbook_user_type
+ Store staff_token only
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] STAFF token generation
- [ ] STAFF token verification
- [ ] Event access validation
- [ ] Guest search logic
- [ ] Check-in validation
- [ ] Companion count validation
- [ ] Staff log creation

### Integration Tests
- [ ] Staff login flow
- [ ] Event selection
- [ ] QR scanner initialization
- [ ] QR check-in flow
- [ ] Manual search flow
- [ ] Manual check-in flow
- [ ] Stats refresh
- [ ] Error handling

### E2E Tests
- [ ] Complete check-in flow (QR)
- [ ] Complete check-in flow (Manual)
- [ ] Duplicate check-in prevention
- [ ] Invalid QR code handling
- [ ] Network error handling
- [ ] Offline behavior (basic)

---

## 📊 Success Criteria

FASE R3 complete when:

- [ ] Staff can login to guestbook app
- [ ] Staff can select event (if multiple)
- [ ] Staff can scan QR code to check-in
- [ ] Staff can search and manually check-in
- [ ] All check-ins logged to staff_logs
- [ ] Real-time stats working
- [ ] Error handling robust
- [ ] UI mobile-optimized
- [ ] Documentation complete

---

## ⚠️ Known Challenges

### 1. Table Name Mismatch

**Problem:** Invitation uses `invitation_guests`, new schema uses `event_guests`

**Solution:** 
- Check which table actually exists in database
- Use correct table name in guestbook APIs
- Document the difference

### 2. QR Scanner on Mobile

**Problem:** Camera permissions, different browsers

**Solution:**
- Request permissions properly
- Handle permission denied
- Fallback to manual entry
- Test on multiple devices

### 3. Token Expiry

**Problem:** Staff might work long shifts

**Solution:**
- Set longer expiry (8-12 hours)
- Implement token refresh
- Handle expiry gracefully

### 4. Offline Support

**Problem:** Event venues might have poor connectivity

**Solution:**
- Basic offline detection (this fase)
- Full offline queue (FASE R5)
- Show offline indicator

---

## 📝 Next Steps After R3

**FASE R4: Operator Authentication & Permissions**
- Fine-grained permissions
- Staff management
- Role-based access
- Audit logs

**FASE R5: Offline-First Implementation**
- IndexedDB integration
- Sync queue
- Conflict resolution
- Background sync

---

**FASE R3 READY TO START** 🚀

**First Task:** Update login page to staff-only
