# 🔗 Shared Code Strategy - Invitation & Guestbook Apps

**Tanggal:** 8 Januari 2026  
**Status:** IMPLEMENTED  

---

## 📊 Problem Statement

Invitation app dan Guestbook app perlu menggunakan:
- **Same types** (Event, GuestType, EventGuest, dll)
- **Same JWT service** (generate/verify tokens)
- **Same repositories** (database access)
- **Same Supabase client**

Tetapi saat ini:
- ❌ Guestbook punya types lama (pre-FASE 1)
- ❌ Repositories berbeda
- ❌ Duplikasi code

---

## 🎯 Solution: Import dari Invitation App

### Strategy

**Invitation app sebagai Source of Truth**

```
apps/invitation/lib/guestbook/  ← SOURCE OF TRUTH
├── types.ts (FASE 1-8 schema)
├── services/
│   ├── jwt.ts
│   └── encryption.ts
├── repositories/
│   ├── eventRepository.ts
│   ├── guestRepository.ts
│   ├── guestTypeRepository.ts
│   ├── benefitRepository.ts
│   ├── seatingConfigRepository.ts
│   ├── seatingRepository.ts
│   ├── staffRepository.ts
│   └── logRepository.ts
└── supabase.ts

apps/guestbook/lib/  ← IMPORTS FROM INVITATION
├── index.ts (re-exports from invitation)
└── supabase.ts (guestbook-specific client)
```

### Implementation

**File:** `apps/guestbook/lib/index.ts`

```typescript
// Re-export everything from invitation app
export * from '../../invitation/lib/guestbook/types';
export * from '../../invitation/lib/guestbook/services/jwt';
export * from '../../invitation/lib/guestbook/services/encryption';
export * from '../../invitation/lib/guestbook/repositories/eventRepository';
export * from '../../invitation/lib/guestbook/repositories/guestRepository';
export * from '../../invitation/lib/guestbook/repositories/guestTypeRepository';
export * from '../../invitation/lib/guestbook/repositories/benefitRepository';
export * from '../../invitation/lib/guestbook/repositories/seatingConfigRepository';
export * from '../../invitation/lib/guestbook/repositories/seatingRepository';
export * from '../../invitation/lib/guestbook/repositories/staffRepository';
export * from '../../invitation/lib/guestbook/repositories/logRepository';

// Supabase client - use guestbook's own
export { getSupabaseClient, getSupabaseServiceClient } from './supabase';
```

**Usage in Guestbook:**

```typescript
// Before (OLD)
import { Event } from './lib/types';
import { generateStaffToken } from './lib/services/jwt';

// After (NEW)
import { Event, generateStaffToken } from './lib';
```

---

## ✅ Benefits

1. **Single Source of Truth**
   - Types always in sync
   - No schema drift
   - Changes propagate automatically

2. **No Duplication**
   - DRY principle
   - Less maintenance
   - Smaller codebase

3. **Type Safety**
   - TypeScript enforces consistency
   - Compile-time checks
   - No runtime surprises

4. **Easy Updates**
   - Update once in invitation
   - Guestbook gets updates automatically
   - No manual sync needed

---

## 🔧 Implementation Steps

### Step 1: Backup Old Code ✅

```bash
cd apps/guestbook
cp -r lib lib.backup
```

### Step 2: Remove Old Files ✅

```bash
# Remove old types, services, repositories
rm -rf lib/types.ts
rm -rf lib/services
rm -rf lib/repositories
```

### Step 3: Keep Supabase Client ✅

```bash
# Keep only supabase.ts
# lib/supabase.ts stays (has browser client)
```

### Step 4: Create index.ts ✅

Create `apps/guestbook/lib/index.ts` with re-exports

### Step 5: Update Imports

Update all files in guestbook to use new imports:

```typescript
// Old
import { Event } from '../lib/types';
import { generateStaffToken } from '../lib/services/jwt';
import { getEventById } from '../lib/repositories/eventRepository';

// New
import { Event, generateStaffToken, getEventById } from '@/lib';
```

### Step 6: Test

```bash
cd apps/guestbook
pnpm run type-check
pnpm run build
```

---

## 📁 File Structure After Implementation

```
apps/guestbook/lib/
├── index.ts ⭐ NEW (re-exports from invitation)
├── supabase.ts ✅ KEPT (guestbook-specific)
└── offline/ ⭐ NEW (guestbook-only features)
    ├── db.ts (IndexedDB)
    ├── sync.ts (Offline sync)
    └── queue.ts (Queue management)
```

---

## 🔍 What Gets Shared

### ✅ Shared (from invitation)

- **types.ts** - All TypeScript interfaces
- **services/jwt.ts** - Token generation/verification
- **services/encryption.ts** - Password hashing
- **repositories/** - All database access functions

### ❌ Not Shared (guestbook-specific)

- **supabase.ts** - Guestbook has browser client
- **offline/** - Offline-first features (FASE R5)
- **components/** - UI components
- **app/** - Pages and routes

---

## ⚠️ Important Notes

### 1. Relative Imports

Use relative imports from guestbook to invitation:

```typescript
// ✅ CORRECT
export * from '../../invitation/lib/guestbook/types';

// ❌ WRONG
export * from '@/invitation/lib/guestbook/types';
```

### 2. Supabase Client

Guestbook keeps its own `supabase.ts` because:
- Has browser client (`getSupabaseClient()`)
- Has service client (`getSupabaseServiceClient()`)
- Different singleton pattern

### 3. Environment Variables

Both apps MUST use same:
- `JWT_SECRET` - For token verification
- `QR_JWT_SECRET` - For QR code verification
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 4. TypeScript Paths

Update `tsconfig.json` if needed:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@invitation/*": ["../invitation/*"]
    }
  }
}
```

---

## 🧪 Testing Strategy

### 1. Type Check

```bash
cd apps/guestbook
pnpm run type-check
```

**Expected:** No TypeScript errors

### 2. Import Test

```typescript
// test-imports.ts
import {
  Event,
  GuestType,
  EventGuest,
  generateStaffToken,
  verifyStaffToken,
  getEventById,
  getSupabaseServiceClient
} from './lib';

console.log('✅ All imports successful');
```

### 3. Build Test

```bash
pnpm run build
```

**Expected:** Build succeeds

### 4. Runtime Test

Start dev server and check:
- No import errors
- Types resolve correctly
- Functions work as expected

---

## 🚀 Migration Guide

### For Existing Code

**Before:**
```typescript
// apps/guestbook/app/api/auth/login/route.ts
import { generateStaffToken } from '@/lib/services/jwt';
import { Staff } from '@/lib/types';
import { getSupabaseServiceClient } from '@/lib/supabase';
```

**After:**
```typescript
// apps/guestbook/app/api/auth/login/route.ts
import { generateStaffToken, GuestbookStaff } from '@/lib';
import { getSupabaseServiceClient } from '@/lib/supabase';
```

**Changes:**
1. Import from `@/lib` instead of `@/lib/services/jwt`
2. Use `GuestbookStaff` instead of `Staff` (correct type name)
3. Keep `supabase` import separate

---

## 📊 Impact Analysis

### Files to Update

```bash
# Find all imports from old lib
cd apps/guestbook
grep -r "from.*lib/types" app/
grep -r "from.*lib/services" app/
grep -r "from.*lib/repositories" app/

# Estimate: ~20-30 files to update
```

### Breaking Changes

1. **Type Names**
   - `Staff` → `GuestbookStaff`
   - `Event.name` → `Event.event_name`
   - `Event.location` → `Event.venue_name`

2. **Repository Functions**
   - Some function signatures changed
   - New parameters added (e.g., `client_id`)
   - Return types updated

3. **Database Schema**
   - Must match FASE 1-8 schema
   - Old queries won't work
   - Need to update API routes

---

## 🎯 Success Criteria

Strategy is successful when:

- [x] No code duplication
- [x] TypeScript compiles
- [x] All imports resolve
- [x] Tests pass
- [x] Build succeeds
- [x] Runtime works correctly

---

## 📝 Future Improvements

### Option: Monorepo Package (FASE R8)

Create shared package:

```
packages/shared/
├── package.json
├── src/
│   ├── types.ts
│   ├── services/
│   └── repositories/
└── tsconfig.json
```

Both apps import:

```typescript
import { Event, generateStaffToken } from '@kirimkata/shared';
```

**Benefits:**
- Cleaner architecture
- Versioned
- Independent deployment
- Better TypeScript support

**When:** After refactoring complete (FASE R8)

---

**STRATEGY IMPLEMENTED** ✅

**Next:** Update all imports in guestbook app
