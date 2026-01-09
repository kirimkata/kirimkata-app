# 🔧 REFACTORING MASTER PLAN
## Pemisahan Invitation App & Guestbook App

**Tujuan:** Memisahkan arsitektur sesuai PRD untuk memenuhi requirement:
- `kirimkata.com` → Setup & Configuration (Invitation App)
- `guestbook.kirimkata.com` → Operasional Hari-H (Guestbook App)

**Status Saat Ini:** 44% compliance (31/70 score)
**Target:** 100% compliance dengan offline-first PWA

---

## 📊 Gap Analysis Summary

### ❌ Yang Salah
1. Check-in interface ada di invitation app (harusnya di guestbook)
2. Guestbook app masih kosong (hanya CORS middleware)
3. Tidak ada offline-first functionality
4. Tidak ada separation antara setup vs operasional
5. Tidak ada operator authentication system

### ✅ Yang Sudah Benar
1. Database schema sudah mendukung multi-event
2. Guest type & benefit management
3. Seating configuration
4. Guest list CRUD
5. Event-contextual routing (tapi di app yang salah)

---

## 🎯 Refactoring Phases (8 Fase)

### **FASE R1: Audit & Planning** (1-2 hari)
**Tujuan:** Analisis mendalam code existing dan buat migration plan

#### Deliverables:
- [ ] Inventory semua files yang perlu dipindah
- [ ] Mapping API endpoints (mana yang perlu duplikasi)
- [ ] Identifikasi shared code (types, utils, lib)
- [ ] Database migration plan (jika ada perubahan)
- [ ] Dependency analysis (packages yang dibutuhkan guestbook app)
- [ ] Risk assessment & rollback strategy

#### Files to Analyze:
```
apps/invitation/
├── app/dashboard/events/[eventId]/guestbook/checkin/page.tsx  ❌ PINDAH
├── app/api/guestbook/checkin/                                 ❌ PINDAH/DUPLIKASI
├── lib/guestbook/                                             ✅ SHARED
└── components/                                                ⚠️  SELECTIVE
```

#### Output:
- `docs/REFACTORING_FASE_R1_AUDIT.md`
- `docs/FILES_TO_MIGRATE.md`
- `docs/API_MAPPING.md`

---

### **FASE R2: Setup Guestbook App Structure** (2-3 hari)
**Tujuan:** Buat struktur lengkap guestbook app dari nol

#### Deliverables:
- [ ] Next.js app configuration
- [ ] TypeScript configuration
- [ ] Tailwind CSS setup
- [ ] Folder structure lengkap
- [ ] Shared library setup (monorepo linking)
- [ ] Environment variables
- [ ] Package.json dengan dependencies minimal

#### Folder Structure:
```
apps/guestbook/
├── app/
│   ├── layout.tsx                    → Root layout (minimal, fast)
│   ├── page.tsx                      → Redirect to /login
│   ├── login/
│   │   └── page.tsx                  → Operator/Admin login
│   ├── events/
│   │   ├── page.tsx                  → Event selection (if >1 event)
│   │   └── [eventId]/
│   │       ├── layout.tsx            → Event context layout
│   │       ├── page.tsx              → Dashboard operasional
│   │       ├── scan/
│   │       │   └── page.tsx          → QR Scanner interface
│   │       ├── manual/
│   │       │   └── page.tsx          → Manual entry interface
│   │       └── guests/
│   │           └── page.tsx          → Guest list (read-only)
│   └── api/
│       ├── auth/
│       │   └── login/route.ts        → Operator login API
│       └── checkin/
│           ├── qr/route.ts           → QR check-in
│           ├── manual/route.ts       → Manual check-in
│           ├── search/route.ts       → Search guests
│           └── sync/route.ts         → Offline sync
│
├── components/
│   ├── ui/                           → Minimal UI components
│   ├── scanner/                      → QR scanner component
│   ├── search/                       → Search component
│   └── offline/                      → Offline indicator
│
├── lib/
│   ├── auth/                         → Operator auth logic
│   ├── offline/
│   │   ├── db.ts                     → IndexedDB wrapper
│   │   ├── sync.ts                   → Sync logic
│   │   └── queue.ts                  → Queue management
│   ├── api/                          → API client
│   └── utils/                        → Utilities
│
├── public/
│   ├── manifest.json                 → PWA manifest (guestbook-specific)
│   ├── sw.js                         → Service worker
│   └── icons/                        → App icons
│
├── middleware.ts                     → Auth + offline handling
├── next.config.mjs                   → Next.js config
├── tailwind.config.ts                → Tailwind config
├── tsconfig.json                     → TypeScript config
└── package.json                      → Dependencies
```

#### Key Files to Create:
1. **next.config.mjs**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // PWA configuration
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' }
        ]
      }
    ]
  }
}
export default nextConfig
```

2. **package.json** (minimal dependencies)
```json
{
  "name": "@kirimkata/guestbook",
  "dependencies": {
    "next": "^14.x",
    "react": "^18.x",
    "react-dom": "^18.x",
    "html5-qrcode": "^2.x",
    "idb": "^8.x",
    "jose": "^5.x"
  }
}
```

#### Output:
- `docs/REFACTORING_FASE_R2_SETUP.md`
- Guestbook app structure lengkap (skeleton)

---

### **FASE R3: Migrate Check-in Logic** (3-4 hari)
**Tujuan:** Pindahkan semua check-in functionality dari invitation ke guestbook

#### Deliverables:
- [ ] Copy & adapt check-in page
- [ ] Copy & adapt API routes
- [ ] Implement QR scanner (html5-qrcode)
- [ ] Implement manual search
- [ ] Real-time statistics
- [ ] Guest detail modal
- [ ] Success/error feedback

#### Files to Migrate:

**From Invitation:**
```
apps/invitation/app/dashboard/events/[eventId]/guestbook/checkin/page.tsx
  → apps/guestbook/app/events/[eventId]/page.tsx (dashboard)
  → apps/guestbook/app/events/[eventId]/scan/page.tsx (QR mode)
  → apps/guestbook/app/events/[eventId]/manual/page.tsx (Manual mode)

apps/invitation/app/api/guestbook/checkin/
  → apps/guestbook/app/api/checkin/ (adapt for guestbook context)
```

#### Key Changes:
1. **Split UI:** Pisahkan QR scanner dan manual search ke halaman terpisah
2. **Lightweight:** Hapus dependencies yang tidak perlu
3. **Fast:** Optimize untuk kecepatan (operator butuh cepat)
4. **Mobile-First:** Prioritas mobile/tablet layout

#### New Components:
```typescript
// components/scanner/QRScanner.tsx
- Camera integration dengan html5-qrcode
- Auto-focus dan vibrate feedback
- Error handling untuk invalid QR

// components/search/GuestSearch.tsx
- Real-time search dengan debounce
- Display hasil dengan guest type badge
- Quick check-in button

// components/offline/OfflineIndicator.tsx
- Status online/offline
- Pending sync count
- Manual sync trigger
```

#### Output:
- `docs/REFACTORING_FASE_R3_CHECKIN.md`
- Check-in functionality fully working di guestbook app

---

### **FASE R4: Operator Authentication** (2-3 hari)
**Tujuan:** Implement authentication system untuk operator/staff

#### Deliverables:
- [ ] Login page untuk operator
- [ ] JWT token generation (operator-specific)
- [ ] Token verification middleware
- [ ] Role/permission checking
- [ ] Session management
- [ ] Logout functionality

#### Authentication Flow:
```
1. Operator buka guestbook.kirimkata.com
2. Redirect ke /login
3. Login dengan username/password (dari guestbook_staff table)
4. Generate JWT token dengan:
   - staff_id
   - client_id
   - event_id (optional, jika staff assigned ke 1 event)
   - permissions (can_checkin, can_redeem_*)
5. Store token di localStorage
6. Middleware verify token di setiap request
7. Jika invalid/expired → redirect ke /login
```

#### Database Integration:
```sql
-- Use existing table: guestbook_staff
SELECT id, username, password_encrypted, client_id, event_id,
       can_checkin, can_redeem_souvenir, can_redeem_snack
FROM guestbook_staff
WHERE username = ? AND is_active = true
```

#### Files to Create:
```
app/login/page.tsx                    → Login UI
app/api/auth/login/route.ts           → Login API
app/api/auth/verify/route.ts          → Token verification
lib/auth/operator.ts                  → Auth utilities
middleware.ts                         → Auth middleware
```

#### Security Considerations:
- ✅ Password hashing (bcrypt)
- ✅ JWT with expiration (24 hours)
- ✅ HTTPS only in production
- ✅ Rate limiting untuk login attempts
- ✅ Audit log untuk login/logout

#### Output:
- `docs/REFACTORING_FASE_R4_AUTH.md`
- Operator authentication fully working

---

### **FASE R5: Offline-First PWA** (4-5 hari)
**Tujuan:** Implement offline functionality untuk check-in tanpa internet

#### Deliverables:
- [ ] Service Worker dengan cache strategy
- [ ] IndexedDB untuk local storage
- [ ] Offline queue untuk check-ins
- [ ] Background sync
- [ ] Conflict resolution
- [ ] PWA manifest
- [ ] Install prompt

#### Architecture:

**1. Service Worker Strategy:**
```javascript
// public/sw.js
- Cache-First: Static assets (JS, CSS, images)
- Network-First: API calls (dengan fallback ke cache)
- Queue: Failed check-ins (retry saat online)
```

**2. IndexedDB Schema:**
```typescript
// lib/offline/db.ts
Database: guestbook_offline
Stores:
  - events: { id, name, date, synced_at }
  - guests: { id, event_id, name, type, qr_token, ... }
  - checkins_queue: { id, guest_id, timestamp, synced }
  - seating: { id, event_id, name, capacity }
```

**3. Sync Logic:**
```typescript
// lib/offline/sync.ts
1. Download event data saat online:
   - Guest list (all guests untuk event)
   - Guest types
   - Seating config
   - Store di IndexedDB

2. Check-in offline:
   - Validate dari IndexedDB
   - Save ke checkins_queue dengan synced=false
   - Update local guest status

3. Sync saat online:
   - Upload queued check-ins
   - Handle conflicts (first check-in wins)
   - Update local data
   - Mark as synced
```

**4. Conflict Resolution:**
```
Scenario: Guest check-in offline di 2 device berbeda

Resolution Strategy:
1. First check-in wins (berdasarkan checked_in_at timestamp)
2. Device kedua dapat error "Already checked in"
3. Sync status di-update di semua devices
4. UI shows conflict notification
```

#### Files to Create:
```
public/sw.js                          → Service worker
public/manifest.json                  → PWA manifest
lib/offline/db.ts                     → IndexedDB wrapper
lib/offline/sync.ts                   → Sync logic
lib/offline/queue.ts                  → Queue management
components/offline/SyncStatus.tsx     → Sync indicator
components/offline/DownloadData.tsx   → Download event data
```

#### PWA Manifest:
```json
{
  "name": "KirimKata Guestbook",
  "short_name": "Guestbook",
  "start_url": "/events",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

#### Testing Scenarios:
- [ ] Check-in saat online → Success
- [ ] Check-in saat offline → Queue
- [ ] Kembali online → Auto sync
- [ ] Conflict handling → First wins
- [ ] Download event data → Store locally
- [ ] PWA install → Works on mobile

#### Output:
- `docs/REFACTORING_FASE_R5_OFFLINE.md`
- Offline-first PWA fully functional

---

### **FASE R6: API Separation** (2-3 hari)
**Tujuan:** Pisahkan dan optimize API untuk guestbook app

#### Deliverables:
- [ ] Dedicated API routes untuk guestbook
- [ ] Optimize untuk speed (minimal data transfer)
- [ ] CORS configuration
- [ ] Rate limiting
- [ ] Error handling
- [ ] API documentation

#### API Structure:

**Guestbook App APIs:**
```
apps/guestbook/app/api/
├── auth/
│   ├── login/route.ts                → POST: Operator login
│   └── verify/route.ts               → GET: Verify token
│
├── events/
│   ├── route.ts                      → GET: List events untuk operator
│   └── [eventId]/
│       ├── route.ts                  → GET: Event detail
│       └── download/route.ts         → GET: Download event data (offline)
│
├── checkin/
│   ├── qr/route.ts                   → POST: QR check-in
│   ├── manual/route.ts               → POST: Manual check-in
│   ├── search/route.ts               → GET: Search guests
│   ├── stats/route.ts                → GET: Check-in statistics
│   └── sync/route.ts                 → POST: Sync offline check-ins
│
└── guests/
    └── [eventId]/route.ts            → GET: Guest list (read-only)
```

**Invitation App APIs (Tetap):**
```
apps/invitation/app/api/guestbook/
├── events/                           → Event CRUD (setup)
├── guest-types/                      → Guest type management
├── benefits/                         → Benefit management
├── seating/                          → Seating configuration
├── guests/                           → Guest list CRUD
└── reports/                          → Reports & export
```

#### Key Optimizations:
1. **Minimal Data Transfer:**
```typescript
// Hanya kirim field yang dibutuhkan
GET /api/events/[eventId]/download
Response: {
  event: { id, name, date },
  guests: [{ id, name, type_id, qr_token }], // minimal fields
  types: [{ id, name, color }],
  seating: [{ id, name, capacity }]
}
```

2. **Caching Headers:**
```typescript
// Cache event data (jarang berubah)
headers: {
  'Cache-Control': 'public, max-age=300' // 5 minutes
}
```

3. **Compression:**
```typescript
// Enable gzip/brotli compression
middleware: compression()
```

#### Output:
- `docs/REFACTORING_FASE_R6_API.md`
- `docs/API_DOCUMENTATION_GUESTBOOK.md`

---

### **FASE R7: Testing & Integration** (3-4 hari)
**Tujuan:** Test menyeluruh semua fitur dan integrasi

#### Deliverables:
- [ ] Unit tests untuk critical functions
- [ ] Integration tests untuk API
- [ ] E2E tests untuk user flows
- [ ] Performance testing
- [ ] Offline scenario testing
- [ ] Cross-browser testing
- [ ] Mobile device testing

#### Test Scenarios:

**1. Authentication:**
- [ ] Login dengan credentials valid
- [ ] Login dengan credentials invalid
- [ ] Token expiration handling
- [ ] Logout functionality
- [ ] Permission checking

**2. Check-in (Online):**
- [ ] QR scan check-in success
- [ ] Manual search check-in success
- [ ] Already checked-in error
- [ ] Invalid QR error
- [ ] Guest not found error
- [ ] Statistics update

**3. Check-in (Offline):**
- [ ] Download event data
- [ ] Check-in saat offline
- [ ] Queue management
- [ ] Sync saat kembali online
- [ ] Conflict resolution
- [ ] Multiple devices sync

**4. PWA:**
- [ ] Install prompt
- [ ] Offline mode works
- [ ] Service worker caching
- [ ] Background sync
- [ ] Update notification

**5. Performance:**
- [ ] Page load < 2 seconds
- [ ] Check-in processing < 1 second
- [ ] Search response < 500ms
- [ ] Offline check-in instant
- [ ] Sync batch < 3 seconds

**6. Integration:**
- [ ] Data sync antara invitation & guestbook
- [ ] Guest list changes reflected
- [ ] Statistics accurate
- [ ] Reports include check-ins

#### Testing Tools:
```json
{
  "devDependencies": {
    "@testing-library/react": "^14.x",
    "@testing-library/jest-dom": "^6.x",
    "vitest": "^1.x",
    "playwright": "^1.x"
  }
}
```

#### Output:
- `docs/REFACTORING_FASE_R7_TESTING.md`
- Test reports dan coverage
- Bug list (jika ada)

---

### **FASE R8: Cleanup & Documentation** (2-3 hari)
**Tujuan:** Cleanup code lama dan update dokumentasi lengkap

#### Deliverables:
- [ ] Hapus check-in code dari invitation app
- [ ] Update routing di invitation app
- [ ] Update dokumentasi lengkap
- [ ] Deployment guide
- [ ] User manual (operator)
- [ ] Admin manual (client)
- [ ] API documentation
- [ ] Troubleshooting guide

#### Cleanup Tasks:

**1. Remove dari Invitation App:**
```
❌ DELETE: apps/invitation/app/dashboard/events/[eventId]/guestbook/checkin/
❌ DELETE: apps/invitation/app/api/guestbook/checkin/ (jika tidak dipakai)
✅ KEEP: Setup & configuration pages
```

**2. Update Sidebar Navigation:**
```typescript
// Remove "Check-in" dari invitation sidebar
// Add link ke guestbook app untuk operator
{event.has_guestbook && (
  <a href={`https://guestbook.kirimkata.com/events/${eventId}`}>
    Open Guestbook (Operator)
  </a>
)}
```

**3. Update Environment Variables:**
```env
# Invitation App
NEXT_PUBLIC_GUESTBOOK_URL=https://guestbook.kirimkata.com

# Guestbook App
NEXT_PUBLIC_API_URL=https://api.kirimkata.com
NEXT_PUBLIC_INVITATION_URL=https://kirimkata.com
```

#### Documentation to Create:

**1. Deployment Guide:**
```markdown
docs/DEPLOYMENT_GUIDE.md
- Setup subdomain (guestbook.kirimkata.com)
- Deploy guestbook app
- Configure CORS
- SSL certificates
- Environment variables
- Database migrations (jika ada)
```

**2. User Manuals:**
```markdown
docs/OPERATOR_MANUAL.md
- Login ke guestbook app
- Download event data
- QR scan check-in
- Manual check-in
- Offline mode
- Troubleshooting

docs/CLIENT_MANUAL.md
- Setup event
- Configure guest types
- Setup seating
- Manage guest list
- Generate QR codes
- View reports
- Give access to operators
```

**3. API Documentation:**
```markdown
docs/API_DOCUMENTATION.md
- Authentication
- Endpoints list
- Request/response examples
- Error codes
- Rate limits
```

#### Final Checklist:
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Deployment guide ready
- [ ] User manuals ready
- [ ] No breaking changes
- [ ] Backward compatible
- [ ] Performance optimized
- [ ] Security reviewed

#### Output:
- `docs/REFACTORING_FASE_R8_CLEANUP.md`
- `docs/DEPLOYMENT_GUIDE.md`
- `docs/OPERATOR_MANUAL.md`
- `docs/CLIENT_MANUAL.md`
- `docs/API_DOCUMENTATION.md`

---

## 📊 Timeline & Resources

### Estimated Timeline:
- **FASE R1:** 1-2 hari
- **FASE R2:** 2-3 hari
- **FASE R3:** 3-4 hari
- **FASE R4:** 2-3 hari
- **FASE R5:** 4-5 hari
- **FASE R6:** 2-3 hari
- **FASE R7:** 3-4 hari
- **FASE R8:** 2-3 hari

**Total: 19-27 hari kerja (~4-5 minggu)**

### Resources Needed:
- 1 Full-stack Developer (lead)
- 1 Frontend Developer (PWA specialist)
- 1 QA Engineer (testing)
- Access to staging environment
- Test devices (mobile/tablet)

---

## 🎯 Success Criteria

### Must Have:
- ✅ Guestbook app terpisah dan functional
- ✅ Check-in works (QR + Manual)
- ✅ Offline mode works
- ✅ Operator authentication works
- ✅ Data sync accurate
- ✅ No data loss
- ✅ Performance acceptable

### Should Have:
- ✅ PWA installable
- ✅ Background sync
- ✅ Conflict resolution
- ✅ Complete documentation
- ✅ User manuals

### Nice to Have:
- ✅ Push notifications
- ✅ Analytics dashboard
- ✅ Multi-language support

---

## ⚠️ Risks & Mitigation

### Risk 1: Data Sync Issues
**Mitigation:**
- Extensive testing offline scenarios
- Implement conflict resolution
- Audit logs untuk tracking

### Risk 2: Performance Degradation
**Mitigation:**
- Load testing sebelum deployment
- Optimize queries
- Implement caching

### Risk 3: User Adoption
**Mitigation:**
- Clear user manuals
- Training untuk operators
- Support channel

### Risk 4: Offline Sync Conflicts
**Mitigation:**
- First-check-in-wins strategy
- Clear conflict notifications
- Manual resolution option

---

## 📞 Support & Rollback

### Rollback Strategy:
1. Keep old code di branch terpisah
2. Feature flags untuk gradual rollout
3. Database backup sebelum deployment
4. Quick rollback procedure documented

### Support Plan:
- Dedicated support channel
- Bug tracking system
- Regular monitoring
- Performance metrics

---

## 🎊 Conclusion

Refactoring ini akan mengubah arsitektur dari:
- ❌ **Monolithic** (semua di invitation app)

Menjadi:
- ✅ **Separated** (invitation untuk setup, guestbook untuk operasional)
- ✅ **Offline-First** (PWA dengan sync)
- ✅ **Scalable** (independent deployment)
- ✅ **Secure** (operator authentication)
- ✅ **Fast** (optimized untuk hari-H)

**Target Compliance: 100% (70/70 score)**

---

**Ready to start FASE R1! 🚀**
