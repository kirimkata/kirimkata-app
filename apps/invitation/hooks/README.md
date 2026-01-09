# Custom Hooks untuk Swipe & Animation

Hooks ini memisahkan logic swipe gesture dan animation agar mudah digunakan di section lain.

## 📦 Hooks

### 1. `useSwipeGesture` - Swipe Logic

Hook untuk menangani semua gesture, momentum, dan snap logic.

**File:** `hooks/useSwipeGesture.ts`

**Usage:**
```typescript
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { animationConfig } from '@/config/animationConfig';

const {
  dragProgress,      // 0-2: progress value
  isDragging,        // boolean: apakah sedang drag
  velocity,          // number: velocity saat drag
  onTouchStart,      // handler untuk touch start
  onTouchMove,       // handler untuk touch move
  onTouchEnd,        // handler untuk touch end
  onMouseDown,       // handler untuk mouse down
  onMouseMove,       // handler untuk mouse move
  onMouseUp,         // handler untuk mouse up
  snapToSection,     // function: snap ke section tertentu
  setDragProgress,   // function: set progress secara manual
} = useSwipeGesture({
  animationConfig,
  dragSensitivity: 1,
  currentSection,
  hasOpenedOnce,
  onProgressChange: (progress) => {
    // Callback saat progress berubah
    updateAnimationFromProgress(progress);
  },
  onSectionChange: setCurrentSection,
  onTransitionChange: setIsTransitioning,
  onHasOpenedOnceChange: setHasOpenedOnce,
});
```

**Features:**
- ✅ Touch & Mouse support
- ✅ Momentum animation dengan friction
- ✅ Snap to nearest section
- ✅ Swipe direction detection
- ✅ Velocity calculation

---

### 2. `useSectionAnimation` - Animation Logic

Hook untuk menghitung dan mengupdate semua nilai animasi berdasarkan progress.

**File:** `hooks/useSectionAnimation.ts`

**Usage:**
```typescript
import { useSectionAnimation } from '@/hooks/useSectionAnimation';

const {
  animationValues,      // Object: semua nilai animasi
  updateFromProgress,   // Function: update animasi dari progress
  getSectionFromProgress, // Function: get section dari progress
} = useSectionAnimation({
  onSectionChange: (section) => {
    // Callback saat section berubah
    setCurrentSection(section);
  },
  onOpeningChange: (isOpening) => {
    // Callback saat opening state berubah
    setIsOpening(isOpening);
  },
});

// Destructure animation values
const {
  parallaxValues,      // Section 0→1 parallax
  section1Scale,       // Section 1 scale
  section2BgScale,     // Section 2 background scale
  section2CoupleScale, // Section 2 couple scale
  // ... semua nilai animasi
} = animationValues;
```

**Animation Values:**
```typescript
interface SectionAnimationValues {
  // Section 0 → 1
  parallaxValues: {
    bgTranslateY: number;
    coupleTranslateY: number;
    grassTranslateY: number;
    cloudTranslateY: number;
  };
  section1Scale: number;
  
  // Section 1 → 2
  section2WrapperScale: number;
  section2BgScale: number;
  section2BgX: number;
  section2BgY: number;
  section2CoupleScale: number;
  section2CoupleX: number;
  section2CoupleY: number;
  section2GrassScale: number;
  section2GrassY: number;
  section2GrassOpacity: number;
  section2CloudOpacity: number;
  section2CloudScale: number;
  section2CloudTop: number;
  section2TextOpacity: number;
}
```

**Features:**
- ✅ Progress-based animation calculation
- ✅ Automatic section detection
- ✅ Optimized dengan useRef untuk performa
- ✅ Batch state updates

---

## 🔄 Integration Example

```typescript
'use client';

import { useState } from 'react';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useSectionAnimation } from '@/hooks/useSectionAnimation';
import { animationConfig } from '@/config/animationConfig';

export default function MySection() {
  const [currentSection, setCurrentSection] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);
  
  // Animation hook
  const { animationValues, updateFromProgress } = useSectionAnimation({
    onSectionChange: setCurrentSection,
    onOpeningChange: setIsOpening,
  });
  
  // Swipe hook
  const {
    dragProgress,
    isDragging,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    snapToSection,
  } = useSwipeGesture({
    animationConfig,
    dragSensitivity: 1,
    currentSection,
    hasOpenedOnce,
    onProgressChange: updateFromProgress,
    onSectionChange: setCurrentSection,
    onTransitionChange: setIsTransitioning,
    onHasOpenedOnceChange: setHasOpenedOnce,
  });
  
  return (
    <div
      data-drag-container
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      {/* Render sections dengan animationValues */}
    </div>
  );
}
```

---

## 🎯 Benefits

1. **Reusability**: Bisa digunakan di section lain dengan mudah
2. **Separation of Concerns**: Swipe logic terpisah dari animation logic
3. **Testability**: Bisa test hooks secara terpisah
4. **Maintainability**: Perubahan logic tidak mempengaruhi component lain
5. **Type Safety**: Full TypeScript support dengan interfaces

---

## 📝 Notes

- `dragProgress` range: `0-2` (0 = Section 0, 1 = Section 1, 2 = Section 2)
- `updateFromProgress` harus dipanggil setiap kali `dragProgress` berubah
- Hooks menggunakan `useCallback` dan `useRef` untuk optimasi performa
- Semua state updates di-batch untuk menghindari re-render berlebihan

