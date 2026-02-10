# Database Column Naming Analysis - invitation_contents

## 📋 Current Schema Analysis (Hybrid Architecture)

Based on code analysis (`invitationContentRepository.ts` & `invitationCompilerService.ts`) and database inspection:

**The system currently uses a HYBRID approach:**
1.  **Normalized Data (Source of Truth)**: 
    -   Tables: `wedding_registrations`, `greeting_sections`, `love_story_settings`, `gallery_settings`, etc.
    -   These tables store the authoritative data, edited via the dashboard.
2.  **Denormalized Cache (Read Model)**:
    -   Table: `invitation_contents`
    -   This table acts as a **CACHE** for the invitation frontend.
    -   It is populated by the `InvitationCompilerService`, which reads from the normalized tables and constructs the JSON blobs.

**Implication for Refactoring:**
-   Old column names (`clouds`, `event_cloud`) in `invitation_contents` are now "Cache Fields".
-   **Good News**: We can rename these columns with minimal risk of data loss, because the data can always be re-generated from the normalized tables using the Compiler Service.
-   **Challenge**: We must update the `InvitationCompilerService` (writer), `InvitationContentRepository` (reader), and the Frontend Types to match the new names.

### Confirmed Table Structure
The `invitation_contents` table likely still has the old structure, acting as the cache:
```sql
CREATE TABLE invitation_contents (
  id UUID PRIMARY KEY,
  slug TEXT,
  client_profile JSONB,
  bride JSONB,
  groom JSONB,
  event JSONB,
  clouds JSONB,          -- ❌ To be renamed: greetings
  event_cloud JSONB,     -- ❌ To be renamed: event_details
  -- ... other columns
);
```


### 1. **`clouds`** - Very Confusing!
```sql
clouds JSONB  -- ❌ BAD NAME
```

**What it actually stores**: Greeting text sections (opening, verse, quotes)
```json
{
  "section0": { "title": "...", "subtitle": "..." },
  "section4": { "title": "Verse/Quote", "subtitle": "..." }
}
```

**Why confusing**:
- ❌ "clouds" tidak relate sama sekali dengan greeting text
- ❌ Developer baru akan bingung: "Apa hubungannya clouds dengan text?"
- ❌ Di migration 017, bahkan disebutkan: "Extract greeting sections from **clouds** JSONB" → proves it's wrong name!

---

### 2. **`event_cloud`** - Masih Confusing
```sql
event_cloud JSONB  -- ⚠️ SEDIKIT BINGUNG
```

**What it actually stores**: Event details (holy matrimony, reception, streaming)
```json
{
  "holyMatrimony": { "title": "...", "venueName": "...", "mapsUrl": "..." },
  "reception": { "title": "...", "venueName": "...", "mapsUrl": "..." },
  "streaming": { "url": "...", "description": "..." }
}
```

**Why confusing**:
- ⚠️ Kenapa "cloud"? Relationship dengan "clouds" column tidak clear
- ⚠️ Lebih tepat: event **details** atau event **venues**

---

## ✅ Recommended Column Renamings

### Priority 1: MUST RENAME

| Current Name | Recommended Name | Reason |
|-------------|------------------|--------|
| **`clouds`** | **[greetings](file:///d:/Project/kirimkata/kirimkata-app/apps/invitation/lib/api-config.ts#83-84)** atau **`greeting_sections`** | Actual content: Opening text, verses, quotes |
| **`event_cloud`** | **`event_details`** | Actual content: Venue details, reception, streaming |

### Priority 2: Consistency Improvement (Optional)

| Current Name | Better Alternative | Reason |
|-------------|-------------------|--------|
| `background_music` | `music_settings` | Shorter, consistent dengan `*_settings` pattern |
| `client_profile` | `profile` | Redundant - sudah jelas ini client profile |

---

## 🎯 Recommended Schema (Clean Version)

```sql
CREATE TABLE invitation_contents (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  
  -- Profile & Couple Info
  profile JSONB,              -- ✅ Renamed from client_profile
  bride JSONB,
  groom JSONB,
  
  -- Event Information
  event JSONB,                -- Basic event (date, countdown)
  event_details JSONB,        -- ✅ Renamed from event_cloud (venues, streaming)
  
  -- Content Sections
  greetings JSONB,            -- ✅ Renamed from clouds
  love_story JSONB,
  gallery JSONB,
  wedding_gift JSONB,
  closing JSONB,
  
  -- Theme & Media
  theme_key TEXT,
  custom_images JSONB,
  music_settings JSONB,       -- ✅ Renamed from background_music
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📝 Migration Script

### Option A: Rename Columns (Recommended)

```sql
-- Migration: 018_rename_confusing_columns.sql
-- Description: Rename columns untuk semantic clarity

BEGIN;

-- 1. Rename 'clouds' to 'greetings'
ALTER TABLE invitation_contents 
  RENAME COLUMN clouds TO greetings;

COMMENT ON COLUMN invitation_contents.greetings IS 
  'Greeting text sections (opening, verses, quotes) displayed across invitation';

-- 2. Rename 'event_cloud' to 'event_details'
ALTER TABLE invitation_contents 
  RENAME COLUMN event_cloud TO event_details;

COMMENT ON COLUMN invitation_contents.event_details IS 
  'Detailed event information (venues, streaming, ceremony details)';

-- 3. (Optional) Rename 'background_music' to 'music_settings'
ALTER TABLE invitation_contents 
  RENAME COLUMN background_music TO music_settings;

COMMENT ON COLUMN invitation_contents.music_settings IS 
  'Background music configuration (URL, title, artist, loop)';

-- 4. (Optional) Rename 'client_profile' to 'profile'
ALTER TABLE invitation_contents 
  RENAME COLUMN client_profile TO profile;

COMMENT ON COLUMN invitation_contents.profile IS 
  'Client profile metadata (couple names, slug, theme)';

COMMIT;
```

---

### Option B: Gradual Migration (Safer for Production)

1. **Create new columns**
2. **Copy data**
3. **Update code**
4. **Drop old columns**

```sql
-- Step 1: Add new columns
ALTER TABLE invitation_contents
  ADD COLUMN greetings JSONB,
  ADD COLUMN event_details JSONB,
  ADD COLUMN music_settings JSONB,
  ADD COLUMN profile JSONB;

-- Step 2: Copy data
UPDATE invitation_contents SET
  greetings = clouds,
  event_details = event_cloud,
  music_settings = background_music,
  profile = client_profile;

-- Step 3: Update code to use new columns (manual)
-- ...

-- Step 4: Drop old columns (after code updated)
ALTER TABLE invitation_contents
  DROP COLUMN clouds,
  DROP COLUMN event_cloud,
  DROP COLUMN background_music,
  DROP COLUMN client_profile;
```

---

## 🔧 Code Changes Required

### 1. Repository ([invitationContentRepository.ts](file:///D:/Project/kirimkata/kirimkata-app/apps/invitation/lib/repositories/invitationContentRepository.ts))

**Before**:
```typescript
interface FullInvitationContent {
  clouds: CloudsContent;
  event_cloud: EventCloudContent;
  background_music: MusicContent;
  client_profile: ClientProfile;
}
```

**After**:
```typescript
interface FullInvitationContent {
  greetings: GreetingContent;      // ✅ Renamed
  eventDetails: EventDetailsContent; // ✅ Renamed + camelCase
  musicSettings: MusicContent;      // ✅ Renamed
  profile: ClientProfile;           // ✅ Renamed
}
```

---

### 2. Compiler Service ([invitationCompilerService.ts](file:///d:/Project/kirimkata/kirimkata-app/apps/invitation/lib/services/invitationCompilerService.ts))

**Before**:
```typescript
const compiled = {
  clouds: this.buildCloudsContent(greetings),
  event_cloud: this.buildEventCloud(events),
  background_music: this.buildMusicConfig(music),
};
```

**After**:
```typescript
const compiled = {
  greetings: this.buildGreetingContent(greetings),     // ✅
  eventDetails: this.buildEventDetails(events),        // ✅
  musicSettings: this.buildMusicSettings(music),       // ✅
};
```

---

### 3. Mock Data ([masterMockGeneral.ts](file:///d:/Project/kirimkata/kirimkata-app/apps/invitation/clients/masterMockGeneral.ts), etc.)

**Before**:
```typescript
const mockData = {
  clouds: {
    section0: { title: "...", subtitle: "..." },
    section4: { title: "...", subtitle: "..." }
  },
  event_cloud: { ... },
  background_music: { src: "..." }
};
```

**After**:
```typescript
const mockData = {
  greetings: {
    section0: { title: "...", subtitle: "..." },
    section4: { title: "...", subtitle: "..." }
  },
  eventDetails: { ... },
  musicSettings: { src: "..." }
};
```

---

## 📦 Impact Analysis

### Files to Update (Estimated ~20 files):

**Database**:
- ✅ Migration script (new file)
- ✅ Type definitions ([types.ts](file:///d:/Project/kirimkata/kirimkata-app/apps/invitation/themes/types.ts))

**Repositories**:
- `lib/repositories/invitationContentRepository.ts`

**Services**:
- [lib/services/invitationCompilerService.ts](file:///d:/Project/kirimkata/kirimkata-app/apps/invitation/lib/services/invitationCompilerService.ts)

**Mocks**:
- [clients/masterMockGeneral.ts](file:///d:/Project/kirimkata/kirimkata-app/apps/invitation/clients/masterMockGeneral.ts)
- [clients/masterMockPoppyFadli.ts](file:///d:/Project/kirimkata/kirimkata-app/apps/invitation/clients/masterMockPoppyFadli.ts)
- `clients/mocks/masterMockTest2.ts`
- `clients/mocks/masterMockTestSimple.ts`

**API**:
- `app/api/admin/invitations/route.ts`
- Any other API routes accessing these columns

---

## 🚀 Rollout Plan

### Phase 1: Database Migration
1. Run migration in **staging** first
2. Verify data integrity
3. Run in **production**

### Phase 2: Code Update
4. Update type definitions
5. Update repositories & services
6. Update mock data
7. Update API endpoints

### Phase 3: Testing
8. Test all invitation rendering
9. Test admin panel (if any)
10. Test compile service

### Phase 4: Cleanup
11. Remove any old references
12. Update documentation

---

## 💡 Additional Recommendations

### 1. Add Column Comments

```sql
COMMENT ON COLUMN invitation_contents.slug IS 
  'Unique slug identifier for the invitation';

COMMENT ON COLUMN invitation_contents.greetings IS 
  'Greeting text sections (opening messages, verses, quotes)';

COMMENT ON COLUMN invitation_contents.event_details IS 
  'Detailed event information (venues, streaming configuration)';
```

### 2. Consider Future Normalization

Since ada migration 017 yang extract `clouds` → `greeting_sections` table, mungkin **`clouds` should be deprecated completely** dan just use normalized tables?

**Current Flow**:
```
greeting_sections table (normalized)
     ↓
invitation_contents.clouds (JSON cache)
     ↓
Theme rendering
```

**Future Flow** (cleaner):
```
greeting_sections table
     ↓
API /v1/invitations/:slug/greetings
     ↓
Theme rendering
```

---

## 📊 Summary

### Must Rename (Confusing):
- ✅ **`clouds`** → **[greetings](file:///d:/Project/kirimkata/kirimkata-app/apps/invitation/lib/api-config.ts#83-84)** 
- ✅ **`event_cloud`** → **`event_details`**

### Nice to Rename (Consistency):
- ⚪ `background_music` → `music_settings`
- ⚪ `client_profile` → `profile`

### Estimated Effort:
- **Database**: 30 minutes
- **Code Changes**: 2-3 hours
- **Testing**: 1-2 hours
- **Total**: ~4-6 hours

### Risk Level: **Low-Medium**
- Column renameは non-breaking (if done via migration)
- Main risk: Missing references in code

### Recommendation:
**DO IT!** The naming improvement is worth the effort. Start with `clouds` → [greetings](file:///d:/Project/kirimkata/kirimkata-app/apps/invitation/lib/api-config.ts#83-84) as priority #1.
