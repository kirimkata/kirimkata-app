# 🎬 Section Animation Architecture

Dokumentasi lengkap tentang susunan section animasi, content page, dan logika hubungan antar section di project ini.

---

## 📋 Daftar Isi

1. [Overview](#overview)
2. [Section Structure](#section-structure)
3. [Content Page](#content-page)
4. [Progress Tracking System](#progress-tracking-system)
5. [Section Transitions](#section-transitions)
6. [State Management](#state-management)
7. [Scroll Control Logic](#scroll-control-logic)
8. [Flow Diagrams](#flow-diagrams)
9. [Code Examples](#code-examples)

---

## 🎯 Overview

Project ini menggunakan **6 sections animasi** (0-5) dengan sistem scroll-based parallax menggunakan **GSAP ScrollTrigger**. Setiap section memiliki progress state (0-1) yang di-update berdasarkan total scroll progress.

### Key Features:
- ✅ **6 Sections** dengan animasi parallax terpisah
- ✅ **Content Page** yang muncul dari Section 5
- ✅ **Swipe Navigation** untuk navigasi antar section
- ✅ **Scroll Lock** saat content page aktif
- ✅ **Smooth Transitions** antar section
- ✅ **Progress-based Animations** (0-1 untuk setiap section)

---

## 📐 Section Structure

### Section 0: Cover + Scene Transition (0% - 16.67%)

**Components:**
- `CoverSection0` (foreground - fades out)
- `WeddingSceneSection0` (background - fades in)

**Progress State:** `section0Progress` (0-1)

**Scroll Range:** 0% - 16.67%

**Behavior:**
- Cover image fades out (opacity: 1 → 0)
- Wedding scene fades in (opacity: 0 → 1)
- Smooth crossfade transition
- Background color: White → Black

**Duration:**
- Forward to Section 1: **3s**
- Backward: N/A (first section)

**Visual Flow:**
```
Cover (opacity: 1) → Fade Out → Wedding Scene (opacity: 0 → 1)
```

---

### Section 1: Bride Detail (16.67% - 33.33%)

**Component:** `BrideDetailSection1`

**Progress State:** `section1Progress` (0-1)

**Scroll Range:** 16.67% - 33.33%

**Behavior:**
- Zoom & pan ke bride (pengantin wanita)
- Background parallax continues
- Grass & chairs fade out
- Text fades in at 75%

**Duration:**
- Forward to Section 2: **6s**
- Backward to Section 0: **3s**

**Animation Values:**
```typescript
// Start (scrollProgress: 0)
bgScale: 1.2
bgX: 10px
bgY: 5px
coupleScale: 0.16
coupleX: 0px
coupleY: 12.5px

// End (scrollProgress: 1)
bgScale: 1.5
bgX: 50px
bgY: 15px
coupleScale: 0.73
coupleX: -150px  // Pan to bride (right side)
coupleY: 600px
```

---

### Section 2: Groom Detail (33.33% - 50%)

**Component:** `GroomDetailSection2`

**Progress State:** `section2Progress` (0-1)

**Scroll Range:** 33.33% - 50%

**Behavior:**
- Zoom & pan ke groom (pengantin pria)
- Background parallax continues
- Text fades in at 50%

**Duration:**
- Forward to Section 3: **3.5s**
- Backward to Section 1: **6s**

**Animation Values:**
```typescript
// Start (scrollProgress: 0) - matches Section 1 end
bgScale: 1.5
bgX: 50px
bgY: 15px
coupleScale: 0.73
coupleX: -150px
coupleY: 600px

// End (scrollProgress: 1)
bgScale: 1.8
bgX: 20px
bgY: 20px
coupleScale: 0.85
coupleX: 300px  // Pan to groom (left side)
coupleY: 650px
```

---

### Section 3: Couple Full (50% - 66.67%)

**Component:** `CoupleFullSection3`

**Progress State:** `section3Progress` (0-1)

**Scroll Range:** 50% - 66.67%

**Behavior:**
- Show full couple view
- Background parallax continues
- Smooth zoom out

**Duration:**
- Forward to Section 4: **6s**
- Backward to Section 2: **3.5s**

---

### Section 4: Couple Zoom Out (66.67% - 83.33%)

**Component:** `CoupleFullSection4`

**Progress State:** `section4Progress` (0-1)

**Scroll Range:** 66.67% - 83.33%

**Behavior:**
- Continue zoom out
- Background parallax continues

**Duration:**
- Forward to Section 5: **2s**
- Backward to Section 3: **5s**

---

### Section 5: Couple Zoom Out Further (83.33% - 100%)

**Component:** `CoupleFullSection5`

**Progress State:** `section5Progress` (0-1)

**Scroll Range:** 83.33% - 100%

**Behavior:**
- Final zoom out
- **Special:** Triggers Content Page saat swipe up
- Progress bisa di-control manual saat content page aktif

**Duration:**
- Backward to Section 4: **2s**

**Special Logic:**
- Saat swipe up di Section 5 → Trigger `handleContentShow()`
- Content page muncul → Section 5 progress di-reset ke 0%
- Section 5 di-animate manual dari 0% → 100% (2s)
- Saat content dismiss → Section 5 reverse ke 0% (1s)

---

## 📄 Content Page

### Overview

Content page adalah **scrollable page** yang muncul dari Section 5. Menggunakan **portal rendering** untuk isolasi penuh dari animation page.

### Component: `ScrollableContent`

**Visibility State:** `scrollablePageProgress` (0-1)

**Behavior:**
- Muncul saat swipe up di Section 5
- Slide up animation (translateY: 100vh → 0)
- Native scroll untuk content
- Swipe down untuk dismiss
- **Window scroll locked** saat visible

### Content Sections:

1. **Save The Date Section**
   - Bride & Groom names
   - Wedding date
   - Decorative elements

2. **RSVP Section**
   - Form untuk konfirmasi kehadiran
   - Input fields

3. **Ucapan & Doa Section**
   - Form untuk ucapan
   - Sample messages

4. **Wedding Gift Section**
   - Bank account information
   - Copy buttons

### Dismiss Logic:

```typescript
// Fling detection
velocity > 0.5 px/ms → Dismiss

// Snap threshold
dragPercentage >= 50% → Dismiss
dragPercentage < 50% → Snap back
```

---

## 📊 Progress Tracking System

### Total Scroll Progress

```typescript
// ScrollTrigger tracks total progress (0-1)
totalProgress = window.scrollY / maxScroll
```

### Section Progress Calculation

Setiap section memiliki progress 0-1 yang dihitung dari total progress:

```typescript
// Section 0: 0% - 16.67%
if (totalProgress <= 0.1667) {
  section0Progress = totalProgress / 0.1667;
}

// Section 1: 16.67% - 33.33%
if (totalProgress > 0.1667 && totalProgress <= 0.3333) {
  section1Progress = (totalProgress - 0.1667) / (0.3333 - 0.1667);
}

// Section 2: 33.33% - 50%
if (totalProgress > 0.3333 && totalProgress <= 0.5) {
  section2Progress = (totalProgress - 0.3333) / (0.5 - 0.3333);
}

// Section 3: 50% - 66.67%
if (totalProgress > 0.5 && totalProgress <= 0.6667) {
  section3Progress = (totalProgress - 0.5) / (0.6667 - 0.5);
}

// Section 4: 66.67% - 83.33%
if (totalProgress >= 0.6667 && totalProgress < 0.8333) {
  section4Progress = (totalProgress - 0.6667) / (0.8333 - 0.6667);
}

// Section 5: 83.33% - 100%
if (totalProgress >= 0.8333 && !isContentPageActive) {
  section5Progress = (totalProgress - 0.8333) / (1.0 - 0.8333);
}
```

### Progress Locking

Saat section sudah lewat, progress di-lock:

```typescript
// Section sudah lewat → lock at 100%
if (totalProgress > sectionEnd) {
  sectionProgress = 1; // Locked
}

// Section belum dimulai → lock at 0%
if (totalProgress < sectionStart) {
  sectionProgress = 0; // Locked
}
```

---

## 🔄 Section Transitions

### Transition Rules

1. **Seamless Visual Continuity**
   - Setiap section **starts** dari **previous section's end state**
   - Tidak ada visual jump
   - Smooth interpolation

2. **Z-Index Management**
   ```typescript
   // Active section: high z-index (20-60)
   // Inactive sections: low z-index (5)
   zIndex: currentSection === X ? 20 + X * 10 : 5
   ```

3. **Opacity & Visibility**
   ```typescript
   // Active section: visible
   opacity: currentSection === X ? 1 : 0
   visibility: currentSection === X ? 'visible' : 'hidden'
   pointerEvents: currentSection === X ? 'auto' : 'none'
   ```

### Section 0 → Section 1 Transition

**Cover Fade Out:**
```typescript
coverOpacity = 1 - fadeCurve
// fadeCurve uses smooth easing: 1 - (1 - progress)^5
```

**Scene Fade In:**
```typescript
sceneOpacity = fadeCurve
```

**Z-Index Swap:**
```typescript
// Cover: z-index 20 → 10 (as progress increases)
// Scene: z-index 10 → 20 (as progress increases)
zIndex: section0Progress < 0.5 ? 20 : 10
```

### Section 1 → Section 2 Transition

**State Continuity:**
```typescript
// Section 1 end = Section 2 start
bgScale: 1.5 → 1.8
coupleScale: 0.73 → 0.85
coupleX: -150px → 300px  // Pan from bride to groom
```

---

## 🎛️ State Management

### State Variables

```typescript
// Section Progress States (0-1)
const [section0Progress, setSection0Progress] = useState(0);
const [section1Progress, setSection1Progress] = useState(0);
const [section2Progress, setSection2Progress] = useState(0);
const [section3Progress, setSection3Progress] = useState(0);
const [section4Progress, setSection4Progress] = useState(0);
const [section5Progress, setSection5Progress] = useState(0);

// Current Section Index (0-5)
const [currentSection, setCurrentSection] = useState(0);

// Content Page State
const [scrollablePageProgress, setScrollablePageProgress] = useState(0);

// Cover & Invitation States
const [invitationOpened, setInvitationOpened] = useState(false);
const [coverReady, setCoverReady] = useState(false);
```

### Refs for Animation Control

```typescript
// Section 5 animation control
const section5AnimationRef = useRef<gsap.core.Tween | null>(null);

// Content page active flag
const isContentPageActiveRef = useRef(false);

// Content page key for remounting
const contentPageKeyRef = useRef(0);
```

### State Updates

**ScrollTrigger onUpdate:**
```typescript
ScrollTrigger.create({
  onUpdate: (self) => {
    // Skip if content page active
    if (isContentPageActiveRef.current) return;
    
    const totalProgress = self.progress;
    
    // Calculate each section progress
    // Update currentSection
    // Lock past sections at 100%
  }
});
```

---

## 🎮 Scroll Control Logic

### Scroll Locking

#### 1. Initial Lock (Before Invitation Opened)

```typescript
// Lock scroll at top (0, 0)
// Prevent: wheel, touch, keyboard, scroll events
// Allow: button clicks
```

#### 2. Content Page Lock

```typescript
// Lock window scroll when content page visible (≥90%)
// Allow: content page internal scroll
// Prevent: window scroll, wheel, touch (outside content)
```

### Scroll Navigation

#### Swipe Navigation

```typescript
// Swipe up → Next section
if (deltaY > 0 && currentSection < 5) {
  targetSection = currentSection + 1;
  scrollToPercentage(sections[targetSection], { duration });
}

// Swipe down → Previous section
if (deltaY < 0 && currentSection > 0) {
  targetSection = currentSection - 1;
  scrollToPercentage(sections[targetSection], { duration });
}

// Swipe up at Section 5 → Trigger content page
if (deltaY > 0 && currentSection === 5) {
  handleContentShow();
}
```

#### Button Navigation

```typescript
// "Buka Undangan" button
handleOpenInvitation() {
  setInvitationOpened(true);
  scrollToPercentage(SECTION_CONFIG[1].percentage, 3);
}
```

---

## 🔀 Flow Diagrams

### Main Flow

```
┌─────────────────────────────────────────────────────────┐
│                    LOADING SCREEN                       │
│              (LoadingOverlay Component)                 │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    COVER SECTION                        │
│              (Section 0: 0% - 16.67%)                   │
│  ┌──────────────┐         ┌──────────────┐            │
│  │ Cover Image  │  Fade   │ Wedding Scene│            │
│  │ (fade out)   │ ──────► │ (fade in)    │            │
│  └──────────────┘         └──────────────┘            │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    BRIDE SECTION                        │
│              (Section 1: 16.67% - 33.33%)               │
│         Zoom & Pan to Bride (Pengantin Wanita)          │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    GROOM SECTION                        │
│              (Section 2: 33.33% - 50%)                  │
│         Zoom & Pan to Groom (Pengantin Pria)            │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   COUPLE FULL SECTION                   │
│              (Section 3: 50% - 66.67%)                  │
│              Show Full Couple View                      │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                COUPLE ZOOM OUT SECTION                  │
│              (Section 4: 66.67% - 83.33%)               │
│              Continue Zoom Out                          │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│            COUPLE ZOOM OUT FURTHER SECTION              │
│              (Section 5: 83.33% - 100%)                  │
│                                                          │
│  ┌──────────────────────────────────────────┐          │
│  │  Swipe Up → Trigger Content Page          │          │
│  └──────────────────────────────────────────┘          │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    CONTENT PAGE                         │
│              (ScrollableContent Component)               │
│  ┌──────────────────────────────────────────┐          │
│  │  • Save The Date                          │          │
│  │  • RSVP Form                              │          │
│  │  • Ucapan & Doa                           │          │
│  │  • Wedding Gift                           │          │
│  │                                            │          │
│  │  Swipe Down → Dismiss                     │          │
│  └──────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────┘
```

### Content Page Flow

```
Section 5 (83.33%)
    │
    │ Swipe Up
    ▼
┌─────────────────────────┐
│ handleContentShow()     │
│  • Kill Section 5 anim  │
│  • Set content active    │
│  • Reset S5 to 0%        │
│  • Scroll to 83.33%      │
│  • Show content page     │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Content Page Visible     │
│  • Window scroll locked │
│  • S5 anim: 0% → 100%    │
│  • Content scrollable    │
└──────────┬──────────────┘
           │
           │ Swipe Down
           ▼
┌─────────────────────────┐
│ handleContentDismiss()  │
│  • Kill Section 5 anim   │
│  • Set content inactive  │
│  • S5 anim: 100% → 0%    │
│  • Hide content page     │
│  • Scroll back to 83.33% │
└─────────────────────────┘
```

### Progress Flow

```
Total Scroll Progress (0-1)
    │
    ├─► Section 0 Progress (0-1)
    │   └─► Cover Opacity (1 → 0)
    │   └─► Scene Opacity (0 → 1)
    │
    ├─► Section 1 Progress (0-1)
    │   └─► Background Parallax
    │   └─► Couple Zoom & Pan
    │
    ├─► Section 2 Progress (0-1)
    │   └─► Background Parallax
    │   └─► Couple Zoom & Pan
    │
    ├─► Section 3 Progress (0-1)
    │   └─► Full Couple View
    │
    ├─► Section 4 Progress (0-1)
    │   └─► Zoom Out Animation
    │
    └─► Section 5 Progress (0-1)
        └─► Final Zoom Out
        └─► Content Page Trigger
```

---

## 💻 Code Examples

### Section Configuration

```typescript
// src/config/sectionConfig.ts
export const SECTION_CONFIG: SectionConfig[] = [
  {
    label: 'Cover+Scene',
    percentage: 0,
    durationToNext: 3,
    durationToPrevious: 3,
  },
  {
    label: 'Bride',
    percentage: 16.67,
    durationToNext: 6,
    durationToPrevious: 3,
  },
  {
    label: 'Groom',
    percentage: 33.33,
    durationToNext: 3.5,
    durationToPrevious: 6,
  },
  {
    label: 'Couple',
    percentage: 50,
    durationToNext: 6,
    durationToPrevious: 3.5,
  },
  {
    label: 'CoupleZoomOut',
    percentage: 66.67,
    durationToNext: 2,
    durationToPrevious: 5,
  },
  {
    label: 'CoupleZoomOut2',
    percentage: 83.33,
    durationToNext: 6,
    durationToPrevious: 2,
  },
];
```

### ScrollTrigger Setup

```typescript
// src/app/page.tsx
ScrollTrigger.create({
  trigger: scrollContainerRef.current,
  start: 'top top',
  end: () => ScrollTrigger.maxScroll(window),
  onUpdate: (self) => {
    if (isContentPageActiveRef.current) return;
    
    const totalProgress = self.progress;
    
    // Calculate section progress
    if (totalProgress <= sections[1]) {
      const sectionProgress = totalProgress / sections[1];
      setSection0Progress(sectionProgress);
      setCurrentSection(0);
    } else {
      setSection0Progress(1);
    }
    
    // ... other sections
  },
  scrub: 1,
});
```

### Section Rendering

```typescript
// Section 0: Cover + Scene
<div style={{
  opacity: currentSection === 0 ? coverOpacity : 0,
  zIndex: currentSection === 0 ? (section0Progress < 0.5 ? 20 : 10) : 5,
}}>
  <CoverSection0 />
</div>

<div style={{
  opacity: currentSection === 0 ? sceneOpacity : 0,
  zIndex: currentSection === 0 ? (section0Progress >= 0.5 ? 20 : 10) : 5,
}}>
  <WeddingSceneSection0 scrollProgress={section0Progress} />
</div>

// Section 1: Bride
<div style={{
  opacity: currentSection === 1 ? 1 : 0,
  zIndex: currentSection === 1 ? 20 : 5,
  visibility: currentSection === 1 ? 'visible' : 'hidden',
}}>
  <BrideDetailSection1 scrollProgress={section1Progress} />
</div>

// ... other sections
```

### Content Page Show/Dismiss

```typescript
// Show Content Page
const handleContentShow = () => {
  isContentPageActiveRef.current = true;
  setCurrentSection(5);
  setSection5Progress(0);
  
  // Scroll to Section 5 position
  scrollToPercentage(83.33, 0.3);
  
  // Animate Section 5 from 0% to 100%
  section5AnimationRef.current = gsap.to({}, {
    duration: 2,
    onUpdate: function() {
      setSection5Progress(this.progress());
    },
  });
  
  // Show content page
  setScrollablePageProgress(1);
};

// Dismiss Content Page
const handleContentDismiss = () => {
  isContentPageActiveRef.current = false;
  
  // Reverse Section 5 animation
  section5AnimationRef.current = gsap.to({}, {
    duration: 1,
    onUpdate: function() {
      setSection5Progress(1 - this.progress());
    },
    onComplete: () => {
      setSection5Progress(0);
      setScrollablePageProgress(0);
      scrollToPercentage(83.33, 0.8);
    },
  });
};
```

---

## 📝 Key Concepts

### 1. Section Isolation

Setiap section di-render sebagai **absolute positioned layer** dengan:
- `opacity: 0/1` berdasarkan `currentSection`
- `visibility: hidden/visible` untuk performance
- `pointerEvents: none/auto` untuk interaction
- `zIndex` untuk layering

### 2. Progress Normalization

Setiap section menerima `scrollProgress: 0-1` yang dihitung dari:
```typescript
sectionProgress = (totalProgress - sectionStart) / (sectionEnd - sectionStart)
```

### 3. State Continuity

Setiap section **starts** dari **previous section's end state** untuk seamless transition.

### 4. Content Page Independence

Content page menggunakan:
- **Portal rendering** (document.body)
- **Separate scroll container**
- **Window scroll lock** saat visible
- **Manual Section 5 animation** control

### 5. Scroll Locking Strategy

- **Initial lock**: Prevent semua scroll sampai button clicked
- **Content lock**: Lock window scroll, allow content scroll
- **Isolation**: Content page events tidak bubble ke animation page

---

## 🔗 Related Files

- `src/app/page.tsx` - Main page dengan ScrollTrigger setup
- `src/config/sectionConfig.ts` - Section configuration
- `src/components/SmoothScroll.tsx` - Swipe navigation
- `src/components/ScrollableContent.tsx` - Content page
- `src/components/animation-page/*.tsx` - Section components

---

**Dokumentasi ini menjelaskan arsitektur lengkap section animation system. Semua konsep dan code examples siap digunakan untuk implementasi di project lain.**

