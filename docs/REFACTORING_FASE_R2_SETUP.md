# 🔧 FASE R2: Setup Guestbook App Structure - IMPLEMENTATION

**Tanggal:** 8 Januari 2026  
**Status:** 🚧 IN PROGRESS  
**Durasi Estimasi:** 1-2 hari  

---

## 📊 Overview

FASE R2 fokus pada setup struktur guestbook app yang benar, update dependencies, dan strategi shared code dengan invitation app.

### Temuan dari Audit (FASE R1)

✅ **Good News:**
- Guestbook app sudah ada (bukan dari nol)
- Struktur folder sudah ada
- Dependencies mostly ready
- Types dan services sudah ada (tapi berbeda dengan invitation)

⚠️ **Challenges:**
- Types di guestbook berbeda dengan invitation (schema lama)
- Repositories di guestbook berbeda struktur
- Perlu sinkronisasi dengan invitation app (source of truth)

---

## 🎯 Objectives FASE R2

1. ✅ Update dependencies (Supabase 2.38→2.48, tambah idb)
2. 🚧 Setup shared code strategy
3. ⏳ Verify environment variables
4. ⏳ Audit dan cleanup existing structure
5. ⏳ Create missing folders
6. ⏳ Test build

---

## 📦 PART 1: Dependencies Update

### A. Changes Made

**File:** `apps/guestbook/package.json`

```diff
"dependencies": {
-  "@supabase/supabase-js": "^2.38.0",
+  "@supabase/supabase-js": "^2.48.0",
   "jsonwebtoken": "^9.0.2",
   "bcryptjs": "^2.4.3",
   "qrcode": "^1.5.3",
   "html5-qrcode": "^2.3.8",
+  "idb": "^8.0.0",
   "lucide-react": "^0.294.0",
   ...
}
```

### B. New Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @supabase/supabase-js | 2.48.0 | Updated from 2.38.0 (match invitation) |
| idb | 8.0.0 | IndexedDB wrapper for offline storage |

### C. Installation Command

```bash
cd apps/guestbook
pnpm install
```

---

## 🔗 PART 2: Shared Code Strategy

### A. Current Situation Analysis

**Invitation App Structure:**
```
apps/invitation/lib/guestbook/
├── types.ts (283 lines) ⭐ COMPLETE
│   └── Event, GuestType, EventGuest, etc (FASE 1-8 schema)
├── services/
│   ├── jwt.ts (155 lines) ⭐ COMPLETE
│   └── encryption.ts
└── repositories/ (8 files) ⭐ COMPLETE
    ├── eventRepository.ts
    ├── guestRepository.ts
    ├── guestTypeRepository.ts
    ├── benefitRepository.ts
    ├── seatingConfigRepository.ts
    ├── seatingRepository.ts
    ├── staffRepository.ts
    └── logRepository.ts
```

**Guestbook App Structure (Current):**
```
apps/guestbook/lib/
├── types.ts (244 lines) ⚠️ OLD SCHEMA
│   └── Event, GuestType, etc (pre-FASE 1 schema)
├── services/
│   ├── jwt.ts (156 lines) ⚠️ SIMILAR but different imports
│   └── encryption.ts
└── repositories/ (6 files) ⚠️ OLD SCHEMA
    ├── clientRepository.ts
    ├── eventRepository.ts
    ├── eventGuestRepository.ts
    ├── guestRepository.ts
    ├── staffRepository.ts
    └── staffLogRepository.ts
```

### B. Key Differences

#### 1. Types Mismatch

**Invitation (CORRECT - FASE 1-8):**
```typescript
export interface Event {
  id: string;
  client_id: string;
  event_name: string;          // ✅
  event_date: string | null;
  event_time: string | null;   // ✅
  venue_name: string | null;   // ✅
  venue_address: string | null; // ✅
  has_invitation: boolean;      // ✅
  has_guestbook: boolean;       // ✅
  invitation_config: {...};     // ✅
  guestbook_config: {...};      // ✅
  seating_mode: string;         // ✅
  staff_quota: number;          // ✅
  ...
}
```

**Guestbook (OLD - Pre-FASE 1):**
```typescript
export interface Event {
  id: string;
  client_id: string;
  name: string;                 // ❌ Should be event_name
  event_date: string | null;
  location: string | null;      // ❌ Should be venue_name
  use_invitation: boolean;      // ❌ Should be has_invitation
  use_guestbook: boolean;       // ❌ Should be has_guestbook
  allow_walkin: boolean;        // ❌ Not in new schema
  require_invitation: boolean;  // ❌ Not in new schema
  auto_generate_qr: boolean;    // ❌ Moved to config
  ...
}
```

#### 2. Repository Functions Mismatch

**Invitation has:**
- `getEventByIdWithAccess()` - With client access check
- `createEventWithModules()` - With module flags
- Complete CRUD for guest types, benefits, seating

**Guestbook has:**
- Basic CRUD only
- No module-aware functions
- Old schema references

### C. Decision: Replace Guestbook lib with Invitation lib

**STRATEGY:** Use invitation/lib/guestbook as single source of truth

**Rationale:**
1. Invitation lib is up-to-date (FASE 1-8)
2. Complete with all repositories
3. Correct schema matching database
4. Already tested and working

**Implementation Options:**

#### Option 1: Symlink (Development) ⭐ RECOMMENDED
```bash
# Remove old lib
rm -rf apps/guestbook/lib

# Create symlink
cd apps/guestbook
ln -s ../invitation/lib/guestbook lib
```

**Pros:**
- Single source of truth
- Changes sync automatically
- No duplication

**Cons:**
- Symlinks can be tricky on Windows
- Deployment needs special handling

#### Option 2: Copy & Sync (Production)
```bash
# Copy invitation lib to guestbook
cp -r apps/invitation/lib/guestbook apps/guestbook/lib

# Add to build script
"prebuild": "cp -r ../invitation/lib/guestbook ./lib"
```

**Pros:**
- Works everywhere
- Independent builds

**Cons:**
- Manual sync needed
- Potential drift

#### Option 3: Monorepo Package (Best Long-term)
```
packages/
└── shared/
    ├── package.json
    ├── types.ts
    ├── services/
    └── repositories/

apps/invitation/package.json:
  "dependencies": {
    "@kirimkata/shared": "workspace:*"
  }

apps/guestbook/package.json:
  "dependencies": {
    "@kirimkata/shared": "workspace:*"
  }
```

**Pros:**
- Clean architecture
- Versioned
- TypeScript support

**Cons:**
- More setup work
- Need to configure monorepo

### D. Implementation Plan

**Phase 1 (Now - FASE R2):** Option 1 (Symlink)
- Quick setup
- Test integration
- Verify everything works

**Phase 2 (FASE R8):** Option 3 (Package)
- Refactor to monorepo package
- Production-ready
- Clean architecture

---

## 📁 PART 3: Folder Structure Setup

### A. Current Guestbook Structure

```
apps/guestbook/
├── app/
│   ├── api/ (13 items) ✅ EXISTS
│   ├── dashboard/ (1 item) ⚠️ OLD
│   ├── login/ (1 item) ⚠️ NEEDS REVIEW
│   ├── staff-dashboard/ (1 item) ⚠️ OLD
│   ├── layout.tsx ✅
│   ├── page.tsx ✅
│   └── globals.css ✅
│
├── lib/ ❌ WILL BE REPLACED
│   ├── repositories/ (6 files - old schema)
│   ├── services/ (2 files - similar)
│   ├── types.ts (old schema)
│   └── supabase.ts ✅ KEEP
│
├── components/ ❌ MISSING
├── public/ (1 item) ⚠️ NEEDS PWA FILES
├── middleware.ts ✅ EXISTS (CORS only)
├── package.json ✅ UPDATED
└── .env.example ✅ EXISTS
```

### B. Target Structure (After FASE R2)

```
apps/guestbook/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts ⭐ NEW (Operator login)
│   │   │   └── verify/route.ts ⭐ NEW
│   │   ├── events/
│   │   │   ├── route.ts (List events)
│   │   │   └── [eventId]/
│   │   │       ├── route.ts (Event detail)
│   │   │       └── download/route.ts ⭐ NEW (Offline data)
│   │   ├── checkin/
│   │   │   ├── qr/route.ts ⭐ REVIEW (STAFF auth)
│   │   │   ├── manual/route.ts ⭐ REVIEW
│   │   │   ├── search/route.ts ⭐ REVIEW
│   │   │   ├── stats/route.ts ⭐ REVIEW
│   │   │   └── sync/route.ts ⭐ NEW (Offline sync)
│   │   └── guests/
│   │       └── [eventId]/route.ts (Read-only list)
│   │
│   ├── events/
│   │   ├── page.tsx ⭐ NEW (Event selection)
│   │   └── [eventId]/
│   │       ├── layout.tsx ⭐ NEW (Event context)
│   │       ├── page.tsx ⭐ NEW (Dashboard operasional)
│   │       ├── scan/
│   │       │   └── page.tsx ⭐ NEW (QR Scanner)
│   │       ├── manual/
│   │       │   └── page.tsx ⭐ NEW (Manual entry)
│   │       └── guests/
│   │           └── page.tsx ⭐ NEW (Guest list)
│   │
│   ├── login/
│   │   └── page.tsx ⭐ REVIEW (Operator login)
│   │
│   ├── layout.tsx ✅
│   ├── page.tsx ✅ (Redirect to login)
│   └── globals.css ✅
│
├── components/ ⭐ NEW
│   ├── ui/ (Minimal UI components)
│   ├── scanner/ (QR scanner component)
│   ├── search/ (Search component)
│   └── offline/ (Offline indicator)
│
├── lib/ → symlink to ../invitation/lib/guestbook
│   ├── types.ts
│   ├── services/
│   │   ├── jwt.ts
│   │   └── encryption.ts
│   ├── repositories/
│   │   ├── eventRepository.ts
│   │   ├── guestRepository.ts
│   │   ├── staffRepository.ts
│   │   └── ...
│   └── supabase.ts (keep guestbook version)
│
├── public/
│   ├── manifest.json ⭐ NEW (PWA)
│   ├── sw.js ⭐ NEW (Service Worker)
│   └── icons/ ⭐ NEW (App icons)
│
├── middleware.ts ⭐ UPDATE (Auth + offline)
├── package.json ✅ UPDATED
├── .env.example ✅
└── next.config.mjs ✅
```

### C. Files to Create in FASE R2

1. **Components Structure**
   ```
   components/
   ├── ui/
   │   ├── Button.tsx
   │   ├── Card.tsx
   │   ├── Input.tsx
   │   └── Badge.tsx
   ├── scanner/
   │   └── QRScanner.tsx (placeholder)
   ├── search/
   │   └── GuestSearch.tsx (placeholder)
   └── offline/
       └── OfflineIndicator.tsx (placeholder)
   ```

2. **PWA Files** (Basic setup)
   ```
   public/
   ├── manifest.json
   └── icons/
       ├── icon-192.png (placeholder)
       └── icon-512.png (placeholder)
   ```

3. **Documentation**
   ```
   docs/
   ├── SHARED_CODE_STRATEGY.md
   └── GUESTBOOK_SETUP_GUIDE.md
   ```

---

## 🔐 PART 4: Environment Variables

### A. Required Variables

**File:** `apps/guestbook/.env.example`

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
QR_JWT_SECRET=your_qr_token_secret_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_INVITATION_URL=http://localhost:3000
NODE_ENV=development

# Optional: Analytics
NEXT_PUBLIC_GA_ID=your_google_analytics_id
```

### B. Verification Checklist

- [ ] NEXT_PUBLIC_SUPABASE_URL - Same as invitation
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY - Same as invitation
- [ ] SUPABASE_SERVICE_ROLE_KEY - Same as invitation
- [ ] JWT_SECRET - Same as invitation (CRITICAL!)
- [ ] QR_JWT_SECRET - Same as invitation (CRITICAL!)
- [ ] NEXT_PUBLIC_APP_URL - Different (port 3001)
- [ ] NEXT_PUBLIC_INVITATION_URL - Link to invitation app

**CRITICAL:** JWT_SECRET dan QR_JWT_SECRET HARUS SAMA dengan invitation app agar token bisa di-verify cross-app!

---

## 🧪 PART 5: Testing & Verification

### A. Build Test

```bash
cd apps/guestbook
pnpm install
pnpm run build
```

**Expected Output:**
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

### B. Dev Server Test

```bash
pnpm run dev
```

**Expected:**
- Server runs on http://localhost:3001
- No TypeScript errors
- No import errors
- Pages load correctly

### C. Import Test

Create test file to verify shared code:

```typescript
// apps/guestbook/test-imports.ts
import { Event, GuestType, EventGuest } from './lib/types';
import { generateStaffToken, verifyStaffToken } from './lib/services/jwt';
import { getEventByIdWithAccess } from './lib/repositories/eventRepository';

console.log('✅ All imports successful');
```

Run:
```bash
npx tsx test-imports.ts
```

---

## 📋 PART 6: Implementation Checklist

### Phase 1: Dependencies ✅
- [x] Update @supabase/supabase-js to 2.48.0
- [x] Add idb for IndexedDB
- [x] Document changes

### Phase 2: Shared Code 🚧
- [ ] Backup existing guestbook/lib
- [ ] Remove old guestbook/lib
- [ ] Create symlink to invitation/lib/guestbook
- [ ] Keep guestbook/lib/supabase.ts separate
- [ ] Test imports
- [ ] Verify TypeScript compilation

### Phase 3: Folder Structure ⏳
- [ ] Create components/ directory
- [ ] Create components/ui/ with base components
- [ ] Create components/scanner/ (placeholder)
- [ ] Create components/search/ (placeholder)
- [ ] Create components/offline/ (placeholder)
- [ ] Create public/icons/ directory
- [ ] Add placeholder icons

### Phase 4: PWA Setup ⏳
- [ ] Create public/manifest.json
- [ ] Add app icons (192x192, 512x512)
- [ ] Update next.config.mjs for PWA
- [ ] Test manifest loading

### Phase 5: Environment ⏳
- [ ] Verify .env.example is complete
- [ ] Document required variables
- [ ] Create setup guide
- [ ] Test with sample .env

### Phase 6: Testing ⏳
- [ ] Run pnpm install
- [ ] Test TypeScript compilation
- [ ] Test dev server
- [ ] Test build
- [ ] Verify imports work
- [ ] Check for errors

### Phase 7: Documentation ⏳
- [ ] Create SHARED_CODE_STRATEGY.md
- [ ] Create GUESTBOOK_SETUP_GUIDE.md
- [ ] Update main README
- [ ] Document known issues

---

## ⚠️ Known Issues & Considerations

### Issue 1: Symlink on Windows
**Problem:** Symlinks require admin rights on Windows
**Solution:** 
- Use Developer Mode in Windows 10/11
- Or use junction instead: `mklink /J lib ..\invitation\lib\guestbook`
- Or use copy strategy for now

### Issue 2: Supabase Client Duplication
**Problem:** Both apps have supabase.ts
**Solution:**
- Keep guestbook's supabase.ts (has browser client)
- Import only types/services/repositories from invitation

### Issue 3: Import Paths
**Problem:** Imports might break after symlink
**Solution:**
- Use relative imports: `import { ... } from './lib/types'`
- Update tsconfig.json if needed

### Issue 4: Build in Production
**Problem:** Symlinks might not work in Docker/Vercel
**Solution:**
- Use copy strategy in build script
- Or use monorepo package (FASE R8)

---

## 🎯 Success Criteria

FASE R2 is complete when:

- [x] Dependencies updated successfully
- [ ] Shared code strategy implemented
- [ ] TypeScript compiles without errors
- [ ] Dev server runs without errors
- [ ] Build succeeds
- [ ] All imports work correctly
- [ ] Documentation complete

---

## 📝 Next Steps (FASE R3)

After FASE R2 complete:

1. **Migrate Check-in UI** from invitation to guestbook
2. **Adapt for STAFF auth** instead of CLIENT auth
3. **Implement QR Scanner** using html5-qrcode
4. **Implement Manual Search** interface
5. **Test check-in functionality**

---

**FASE R2 IN PROGRESS** 🚧

**Current Task:** Setup shared code strategy with symlink
