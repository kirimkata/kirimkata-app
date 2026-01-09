# FASE 2: Testing Guide

## Pre-requisites

### 1. Database Setup
Pastikan FASE 1 migrations sudah dijalankan:
```sql
-- Run migrations 003-007
\i database/migrations/003_add_event_modules.sql
\i database/migrations/004_create_seating_config.sql
\i database/migrations/005_update_guest_types_event_scope.sql
\i database/migrations/006_update_invitation_guests.sql
\i database/migrations/007_enhance_benefits.sql
```

### 2. Environment Variables
Pastikan `.env.local` sudah diset:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
JWT_SECRET_CLIENT=your_jwt_secret
```

### 3. Test Data
Pastikan ada:
- Minimal 1 client account
- Minimal 1 event dengan `has_invitation=true` dan `has_guestbook=true`

---

## Testing Steps

### Step 1: Start Dev Server
```bash
cd apps/invitation
npm run dev
```

Expected: Server running at `http://localhost:3000`

### Step 2: Test Login
1. Navigate to: `http://localhost:3000/dashboard/login`
2. Login dengan credentials client
3. Expected: Redirect ke `/dashboard`

**Checklist**:
- [ ] Login page tampil dengan UI modern
- [ ] Form validation working
- [ ] Login berhasil redirect ke dashboard
- [ ] Token tersimpan di localStorage

### Step 3: Test Dashboard (Event List)
URL: `http://localhost:3000/dashboard`

**Checklist**:
- [ ] Event cards tampil dengan benar
- [ ] Event name, date, venue tampil
- [ ] Module badges tampil (Invitation/Guestbook)
- [ ] "Create New Event" button visible
- [ ] Click event card redirect ke overview

### Step 4: Test Event Overview
URL: `http://localhost:3000/dashboard/events/[eventId]/overview`

**Checklist**:
- [ ] Event header tampil (name, date, venue)
- [ ] Statistics cards tampil:
  - [ ] Total Guests
  - [ ] Checked In (dengan percentage)
  - [ ] Invitations Sent
  - [ ] Seats Assigned
- [ ] Quick action buttons tampil
- [ ] Guest type breakdown chart tampil (jika ada data)

### Step 5: Test Sidebar Navigation
**Checklist**:
- [ ] Sidebar tampil di kiri
- [ ] Event name tampil di header sidebar
- [ ] Event switcher dropdown berfungsi
- [ ] Collapsible sidebar berfungsi (toggle button)
- [ ] Menu items sesuai dengan modules:
  - [ ] Overview selalu tampil
  - [ ] Invitation menu hanya tampil jika `has_invitation=true`
  - [ ] Guestbook menu hanya tampil jika `has_guestbook=true`
- [ ] Active state highlighting benar
- [ ] Click menu item navigate ke page yang benar

### Step 6: Test Event Switcher
**Checklist**:
- [ ] Click event switcher dropdown
- [ ] Dropdown menampilkan semua events
- [ ] Current event ter-highlight
- [ ] Click event lain redirect ke overview event tersebut
- [ ] "View All Events" link ke `/dashboard`

### Step 7: Test Access Control
**Test 1: Unauthorized Access**
1. Logout atau clear localStorage
2. Navigate to `/dashboard/events/[eventId]/overview`
3. Expected: Redirect ke `/dashboard/login`

**Test 2: Wrong Event Access**
1. Login sebagai client A
2. Try access event milik client B
3. Expected: 404 atau redirect ke dashboard

**Checklist**:
- [ ] No token → redirect to login
- [ ] Invalid token → redirect to login
- [ ] Wrong event → 404 or redirect

### Step 8: Test Legacy URL Redirects
**Checklist**:
- [ ] `/client-dashboard` → redirect ke `/dashboard`
- [ ] `/client-dashboard/login` → redirect ke `/dashboard/login`
- [ ] `/client-dashboard/guestbook` → redirect ke `/dashboard`

### Step 9: Test API Endpoints
**Test GET Event**:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/guestbook/events/EVENT_ID
```
Expected: Event data returned

**Test GET Stats**:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/guestbook/events/EVENT_ID/stats
```
Expected: Statistics data returned

**Checklist**:
- [ ] GET event returns correct data
- [ ] GET stats returns statistics
- [ ] Unauthorized request returns 401
- [ ] Wrong event returns 404

### Step 10: Test Responsive Design
**Checklist**:
- [ ] Mobile view (< 768px): Sidebar collapsible
- [ ] Tablet view (768px - 1024px): Layout responsive
- [ ] Desktop view (> 1024px): Full layout tampil

---

## Common Issues & Solutions

### Issue 1: "Event not found"
**Cause**: Event tidak ada atau tidak punya access
**Solution**: 
- Verify event ID correct
- Verify client_id match dengan logged in user

### Issue 2: Sidebar menu tidak tampil
**Cause**: Event config `has_invitation` atau `has_guestbook` false
**Solution**: 
- Check event config di database
- Update event config jika perlu

### Issue 3: Stats tidak tampil
**Cause**: Belum ada data guests
**Solution**: 
- Add test guests via old interface
- Or wait until FASE 6 implemented

### Issue 4: Redirect loop
**Cause**: Token invalid atau expired
**Solution**: 
- Clear localStorage
- Login ulang

---

## Success Criteria

### Must Pass (Critical)
- ✅ Login flow working
- ✅ Dashboard displays events
- ✅ Event overview displays stats
- ✅ Sidebar navigation working
- ✅ Event switcher functional
- ✅ Access control enforced

### Should Pass (Important)
- ✅ Module-based menu display
- ✅ Legacy redirects working
- ✅ API endpoints working
- ✅ Responsive design

### Nice to Have
- ✅ Smooth animations
- ✅ Loading states
- ✅ Error messages

---

## Test Results Template

```
FASE 2 Testing Results
Date: ___________
Tester: ___________

✅ = Pass | ❌ = Fail | ⚠️ = Partial

[ ] Step 1: Dev Server
[ ] Step 2: Login
[ ] Step 3: Dashboard
[ ] Step 4: Event Overview
[ ] Step 5: Sidebar Navigation
[ ] Step 6: Event Switcher
[ ] Step 7: Access Control
[ ] Step 8: Legacy Redirects
[ ] Step 9: API Endpoints
[ ] Step 10: Responsive Design

Issues Found:
1. ___________
2. ___________

Overall Status: [ ] PASS | [ ] FAIL
```

---

## Next Steps After Testing

### If All Tests Pass ✅
Proceed to **FASE 3: Event Creation Wizard**

### If Tests Fail ❌
1. Document issues
2. Fix critical issues
3. Re-test
4. Proceed when stable

---

## Browser Testing

Test on multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

---

## Performance Testing

Check:
- [ ] Page load time < 2s
- [ ] Navigation smooth
- [ ] No console errors
- [ ] No memory leaks

---

**Ready for FASE 3 when all critical tests pass!** ✅
