# 📱 Swipe Gesture Implementation Guide

Dokumentasi lengkap tentang implementasi swipe gesture di project ini, beserta potongan code yang bisa diimplementasikan ke project lain.

---

## 📋 Daftar Isi

1. [Overview](#overview)
2. [Jenis Swipe Gesture](#jenis-swipe-gesture)
3. [Implementasi Detail](#implementasi-detail)
4. [Potongan Code Reusable](#potongan-code-reusable)
5. [Konfigurasi](#konfigurasi)
6. [Best Practices](#best-practices)

---

## 🎯 Overview

Project ini menggunakan **dua jenis swipe gesture** yang berbeda:

1. **Section Navigation Swipe** - Navigasi antar section dengan smooth scroll
2. **Content Dismiss Swipe** - Dismiss modal/content page dengan drag gesture

Kedua implementasi menggunakan **native Touch Events** untuk performa optimal dan kontrol penuh.

---

## 🔄 Jenis Swipe Gesture

### 1. Section Navigation Swipe (`SmoothScroll.tsx`)

**Fungsi**: Navigasi antar section dengan swipe up/down

**Fitur**:
- ✅ Swipe up → next section
- ✅ Swipe down → previous section
- ✅ Intervention mode (interupsi animasi yang sedang berjalan)
- ✅ Damping multiplier untuk kontrol sensitivitas
- ✅ Threshold detection (jarak & waktu)
- ✅ Special trigger untuk section terakhir (content page)

**Lokasi**: `src/components/SmoothScroll.tsx`

### 2. Content Dismiss Swipe (`ScrollableContent.tsx`)

**Fungsi**: Dismiss content page dengan drag down

**Fitur**:
- ✅ Real-time drag dengan transform
- ✅ Fling detection berdasarkan velocity
- ✅ Snap threshold (50% screen)
- ✅ Smooth snap back jika tidak mencapai threshold
- ✅ Isolasi scroll (tidak mempengaruhi parent)

**Lokasi**: `src/components/ScrollableContent.tsx`

---

## 🔍 Implementasi Detail

### Section Navigation Swipe

#### Alur Kerja

```
1. Touch Start
   ├─ Deteksi posisi awal (Y, time, scrollY)
   ├─ Cek apakah ada animasi GSAP yang sedang berjalan
   │  └─ Jika ada → Masuk Intervention Mode
   └─ Simpan target section yang sedang dituju

2. Touch Move
   ├─ Prevent default scroll (non-passive listener)
   ├─ Jika Intervention Mode:
   │  └─ Update scroll position dengan damping
   └─ Jika Normal Mode:
      └─ Tidak ada action (hanya prevent default)

3. Touch End
   ├─ Hitung deltaY dan deltaTime
   ├─ Validasi swipe (threshold & time)
   ├─ Tentukan target section berdasarkan direction
   ├─ Trigger special action jika di section terakhir
   └─ Animate ke target dengan GSAP
```

#### Parameter Konfigurasi

```typescript
const SWIPE_THRESHOLD = 80;        // Minimum jarak (px)
const SWIPE_TIME_THRESHOLD = 500; // Maximum waktu (ms)
const SWIPE_DAMPING = 0.5;        // Sensitivitas (0.5 = setengah)
```

#### Intervention Mode

**Kapan aktif?**
- User menyentuh layar saat animasi GSAP sedang berjalan

**Behavior:**
- Pause animasi GSAP
- Allow manual scroll dengan damping
- Di touch end:
  - Jika swipe valid → Change direction ke target baru
  - Jika tidak valid → Resume ke target original

### Content Dismiss Swipe

#### Alur Kerja

```
1. Touch Start
   ├─ Deteksi posisi awal (Y, time)
   ├─ Cek apakah scroll position di top (≤ 1px)
   └─ Aktifkan drag mode jika di top

2. Touch Move
   ├─ Jika drag mode aktif:
   │  ├─ Hitung deltaY
   │  ├─ Apply transform translateY(deltaY)
   │  └─ Prevent default & stop propagation
   └─ Jika normal scroll:
      └─ Handle boundary prevention

3. Touch End
   ├─ Hitung drag distance & velocity
   ├─ Decision:
   │  ├─ Fling (velocity > 0.5 px/ms) → Dismiss
   │  ├─ Drag ≥ 50% screen → Dismiss
   │  └─ Drag < 50% screen → Snap back
   └─ Trigger dismiss callback
```

#### Parameter Konfigurasi

```typescript
const FLING_VELOCITY_THRESHOLD = 0.5; // px/ms
const SNAP_THRESHOLD = 0.5;           // 50% screen height
```

---

## 💻 Potongan Code Reusable

### 1. Section Navigation Swipe Hook

```typescript
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';

interface UseSectionSwipeOptions {
  sections: number[]; // Array of section percentages [0, 16.67, 33.33, ...]
  onNavigate?: (sectionIndex: number) => void;
  onSpecialAction?: () => void; // Triggered at last section
  swipeThreshold?: number; // Default: 80px
  swipeTimeThreshold?: number; // Default: 500ms
  swipeDamping?: number; // Default: 0.5
  getCurrentSection: () => number; // Function to get current section index
  scrollToPercentage: (percentage: number, options?: { duration?: number; ease?: string }) => void;
  getCurrentScrollPercentage: () => number;
}

export function useSectionSwipe({
  sections,
  onNavigate,
  onSpecialAction,
  swipeThreshold = 80,
  swipeTimeThreshold = 500,
  swipeDamping = 0.5,
  getCurrentSection,
  scrollToPercentage,
  getCurrentScrollPercentage,
}: UseSectionSwipeOptions) {
  const isNavigatingRef = useRef(false);
  const isInterventionModeRef = useRef(false);
  const targetSectionPercentageRef = useRef<number | null>(null);
  const touchStartYRef = useRef(0);
  const touchStartTimeRef = useRef(0);
  const touchStartScrollYRef = useRef(0);
  const originalDurationRef = useRef(0);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;

      touchStartYRef.current = e.touches[0].clientY;
      touchStartTimeRef.current = Date.now();
      touchStartScrollYRef.current = window.scrollY;

      // Check if GSAP animation is running
      const tweens = gsap.getTweensOf(window);
      if (tweens.length > 0) {
        isInterventionModeRef.current = true;
        const currentTween = tweens[0];
        const scrollToValue = (currentTween.vars as any).scrollTo;
        if (scrollToValue?.y) {
          const maxScroll = gsap.getProperty(window, 'scrollMax') as number || window.innerHeight;
          targetSectionPercentageRef.current = (scrollToValue.y / maxScroll) * 100;
          originalDurationRef.current = currentTween.duration();
        }
        gsap.killTweensOf(window);
      } else {
        isInterventionModeRef.current = false;
        targetSectionPercentageRef.current = null;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();

      if (isInterventionModeRef.current && e.touches.length === 1) {
        const deltaY = touchStartYRef.current - e.touches[0].clientY;
        const dampedDeltaY = deltaY * swipeDamping;
        const newScrollY = touchStartScrollYRef.current + dampedDeltaY;
        window.scrollTo(0, newScrollY);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length !== 1) return;

      const touchEndY = e.changedTouches[0].clientY;
      const touchEndTime = Date.now();
      const deltaY = touchStartYRef.current - touchEndY;
      const deltaTime = touchEndTime - touchStartTimeRef.current;

      // Prevent multiple swipes
      if (isNavigatingRef.current && !isInterventionModeRef.current) {
        return;
      }

      // Intervention mode handling
      if (isInterventionModeRef.current && targetSectionPercentageRef.current !== null) {
        if (
          Math.abs(deltaY) >= swipeThreshold &&
          deltaTime <= swipeTimeThreshold
        ) {
          // Valid swipe during intervention - change direction
          const currentSectionIndex = getCurrentSection();
          let targetSectionIndex: number;
          let newTargetPercentage: number;

          if (deltaY > 0) {
            // Swipe up
            if (currentSectionIndex < sections.length - 1) {
              targetSectionIndex = currentSectionIndex + 1;
              newTargetPercentage = sections[targetSectionIndex];
            } else {
              // Last section - trigger special action
              if (onSpecialAction) onSpecialAction();
              targetSectionIndex = sections.length - 1;
              newTargetPercentage = 100;
            }
          } else {
            // Swipe down
            targetSectionIndex = Math.max(0, currentSectionIndex - 1);
            newTargetPercentage = sections[targetSectionIndex];
          }

          isNavigatingRef.current = true;
          scrollToPercentage(newTargetPercentage, { duration: 3, ease: 'power2.out' });
          onNavigate?.(targetSectionIndex);

          setTimeout(() => {
            isNavigatingRef.current = false;
          }, 3000);
        } else {
          // Resume to original target
          const remainingDistance = Math.abs(
            targetSectionPercentageRef.current - getCurrentScrollPercentage()
          );
          const resumeDuration = Math.max(0.5, remainingDistance / 100 * 3);
          scrollToPercentage(targetSectionPercentageRef.current, {
            duration: resumeDuration,
            ease: 'power2.out',
          });
          isNavigatingRef.current = true;
          setTimeout(() => {
            isNavigatingRef.current = false;
          }, resumeDuration * 1000);
        }

        isInterventionModeRef.current = false;
        targetSectionPercentageRef.current = null;
        return;
      }

      // Normal swipe detection
      if (
        !isInterventionModeRef.current &&
        Math.abs(deltaY) >= swipeThreshold &&
        deltaTime <= swipeTimeThreshold
      ) {
        const currentSectionIndex = getCurrentSection();
        let targetSectionIndex: number;
        let targetPercentage: number;

        if (deltaY > 0) {
          // Swipe up
          if (currentSectionIndex < sections.length - 1) {
            targetSectionIndex = currentSectionIndex + 1;
            targetPercentage = sections[targetSectionIndex];
          } else {
            if (onSpecialAction) onSpecialAction();
            targetSectionIndex = sections.length - 1;
            targetPercentage = 100;
          }
        } else {
          // Swipe down
          targetSectionIndex = Math.max(0, currentSectionIndex - 1);
          targetPercentage = sections[targetSectionIndex];
        }

        isNavigatingRef.current = true;
        scrollToPercentage(targetPercentage, { duration: 3, ease: 'power2.out' });
        onNavigate?.(targetSectionIndex);

        setTimeout(() => {
          isNavigatingRef.current = false;
        }, 3000);
      }

      isInterventionModeRef.current = false;
      targetSectionPercentageRef.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [
    sections,
    onNavigate,
    onSpecialAction,
    swipeThreshold,
    swipeTimeThreshold,
    swipeDamping,
    getCurrentSection,
    scrollToPercentage,
    getCurrentScrollPercentage,
  ]);
}
```

### 2. Content Dismiss Swipe Hook

```typescript
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseDismissSwipeOptions {
  containerRef: React.RefObject<HTMLElement>;
  onDismiss: () => void;
  enabled?: boolean; // Enable/disable swipe
  flingVelocityThreshold?: number; // Default: 0.5 px/ms
  snapThreshold?: number; // Default: 0.5 (50% screen)
}

export function useDismissSwipe({
  containerRef,
  onDismiss,
  enabled = true,
  flingVelocityThreshold = 0.5,
  snapThreshold = 0.5,
}: UseDismissSwipeOptions) {
  const [manualTransform, setManualTransform] = useState<string | null>(null);
  const touchStartYRef = useRef(0);
  const touchStartTimeRef = useRef(0);
  const lastTouchYRef = useRef(0);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      const now = Date.now();
      touchStartYRef.current = e.touches[0].clientY;
      touchStartTimeRef.current = now;
      lastTouchYRef.current = e.touches[0].clientY;

      // Check if at top for dismiss mode
      const currentScrollTop = container.scrollTop;
      const isAtTopBoundary = currentScrollTop <= 1;
      isDraggingRef.current = isAtTopBoundary;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touchY = e.touches[0].clientY;
      const now = Date.now();
      const deltaY = touchY - touchStartYRef.current;
      const currentScrollTop = container.scrollTop;
      const isAtTopBoundary = currentScrollTop <= 1;

      // Dragging mode - dismiss gesture
      if (isDraggingRef.current && deltaY > 0) {
        lastTouchYRef.current = touchY;
        lastTouchTimeRef.current = now;
        setManualTransform(`translateY(${deltaY}px)`);
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Normal scroll mode - prevent window scroll at boundaries
      const atTop = currentScrollTop <= 0;
      const atBottom = currentScrollTop >= (container.scrollHeight - container.clientHeight);
      const isScrollingUp = deltaY < 0;
      const isScrollingDown = deltaY > 0;

      if ((atTop && isScrollingDown) || (atBottom && isScrollingUp)) {
        e.preventDefault();
      }
      e.stopPropagation();
    };

    const handleTouchEnd = () => {
      if (!isDraggingRef.current) return;

      const windowHeight = window.innerHeight;
      const dragDistance = lastTouchYRef.current - touchStartYRef.current;
      const dragPercentage = dragDistance / windowHeight;

      // Calculate velocity
      const now = Date.now();
      const timeDelta = now - touchStartTimeRef.current;
      const velocity = timeDelta > 0 ? dragDistance / timeDelta : 0;

      const isFling = velocity > flingVelocityThreshold;

      isDraggingRef.current = false;

      // Decision: fling or drag >= threshold → dismiss
      if (isFling || dragPercentage >= snapThreshold) {
        setManualTransform('translateY(100vh)');
        setTimeout(() => {
          onDismiss();
        }, 300);
      } else {
        // Snap back
        setManualTransform('translateY(0)');
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [containerRef, onDismiss, enabled, flingVelocityThreshold, snapThreshold]);

  // Determine transition based on state
  const getTransition = useCallback(() => {
    if (!manualTransform) return 'transform 2s cubic-bezier(0.16, 1, 0.3, 1)';
    
    if (manualTransform.includes('100vh')) {
      return 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    } else if (manualTransform === 'translateY(0)') {
      return 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    } else {
      return 'none'; // Real-time dragging
    }
  }, [manualTransform]);

  return {
    manualTransform,
    transition: getTransition(),
  };
}
```

### 3. Swipe Indicator Component

```typescript
'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface SwipeIndicatorProps {
  show: boolean;
  text?: string;
  iconOpacity?: number;
  textOpacity?: number;
}

export function SwipeIndicator({ 
  show, 
  text = 'swipe up',
  iconOpacity = 0.5,
  textOpacity = 0.5,
}: SwipeIndicatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<SVGSVGElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const fadeTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const arrowTweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (!containerRef.current || !arrowRef.current || !textRef.current) return;

    if (show) {
      fadeTimelineRef.current?.kill();
      arrowTweenRef.current?.kill();
      gsap.set(contentRef.current, { y: 0 });
      gsap.set(arrowRef.current, { y: 0, opacity: iconOpacity });
      gsap.set(textRef.current, { opacity: textOpacity });

      const tl = gsap.timeline({ delay: 0.5 });
      fadeTimelineRef.current = tl;

      tl.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'power2.out' }
      );

      arrowTweenRef.current = gsap.to(arrowRef.current, {
        y: -4,
        duration: 1.8,
        ease: 'power1.inOut',
        repeat: -1,
        yoyo: true,
      });
    } else {
      fadeTimelineRef.current?.kill();
      arrowTweenRef.current?.kill();
      gsap.to(containerRef.current, {
        opacity: 0,
        y: 10,
        duration: 0.6,
        ease: 'power2.in',
      });
    }

    return () => {
      fadeTimelineRef.current?.kill();
      arrowTweenRef.current?.kill();
    };
  }, [show, iconOpacity, textOpacity]);

  return (
    <div
      ref={containerRef}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none opacity-0"
    >
      <div ref={contentRef} className="flex flex-col items-center">
        <svg
          ref={arrowRef}
          className="w-7 h-7 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1}
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
            opacity: iconOpacity,
          }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 15l7-7 7 7"
          />
        </svg>
        <div
          ref={textRef}
          className="text-white text-xs font-light tracking-wide -mt-[4px]"
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
            opacity: textOpacity,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}
```

---

## ⚙️ Konfigurasi

### Section Configuration

```typescript
// sectionConfig.ts
export interface SectionConfig {
  label: string;
  percentage: number;
  durationToNext: number;
  durationToPrevious: number;
}

export const SECTION_CONFIG: SectionConfig[] = [
  { label: 'Section 0', percentage: 0, durationToNext: 3, durationToPrevious: 0 },
  { label: 'Section 1', percentage: 16.67, durationToNext: 6, durationToPrevious: 3 },
  { label: 'Section 2', percentage: 33.33, durationToNext: 3.5, durationToPrevious: 6 },
  // ... more sections
];

export function getNavigationDuration(fromIndex: number, toIndex: number): number {
  if (toIndex > fromIndex) {
    return SECTION_CONFIG[fromIndex]?.durationToNext ?? 3.5;
  } else {
    return SECTION_CONFIG[fromIndex]?.durationToPrevious ?? 2.5;
  }
}

export function findSectionIndex(percentage: number): number {
  const sections = SECTION_CONFIG.map(s => s.percentage);
  for (let i = 0; i < sections.length - 1; i++) {
    if (percentage >= sections[i] && percentage < sections[i + 1]) {
      const midpoint = (sections[i] + sections[i + 1]) / 2;
      return percentage < midpoint ? i : i + 1;
    }
  }
  return percentage >= sections[sections.length - 1] ? sections.length - 1 : 0;
}
```

---

## 🎨 Best Practices

### 1. Event Listener Configuration

```typescript
// ✅ CORRECT: Non-passive untuk preventDefault
window.addEventListener('touchmove', handleTouchMove, { passive: false });

// ❌ WRONG: Passive tidak bisa preventDefault
window.addEventListener('touchmove', handleTouchMove, { passive: true });
```

### 2. Prevent Multiple Swipes

```typescript
// Gunakan ref untuk flag, bukan state
const isNavigatingRef = useRef(false);

// Check sebelum navigate
if (isNavigatingRef.current) return;

// Set flag saat navigate
isNavigatingRef.current = true;
setTimeout(() => {
  isNavigatingRef.current = false;
}, duration * 1000);
```

### 3. Intervention Mode

```typescript
// Deteksi animasi GSAP yang sedang berjalan
const tweens = gsap.getTweensOf(window);
if (tweens.length > 0) {
  // Pause dan simpan target
  gsap.killTweensOf(window);
  // ... handle intervention
}
```

### 4. Velocity Calculation

```typescript
const timeDelta = touchEndTime - touchStartTime;
const velocity = timeDelta > 0 ? dragDistance / timeDelta : 0;
const isFling = velocity > FLING_THRESHOLD;
```

### 5. Transform vs CSS Transition

```typescript
// Real-time drag: no transition
if (isDragging) {
  transition = 'none';
  transform = `translateY(${deltaY}px)`;
}

// Snap animation: smooth transition
if (snapping) {
  transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  transform = 'translateY(100vh)';
}
```

### 6. Scroll Isolation

```typescript
// Prevent parent scroll
e.stopPropagation();

// Prevent at boundaries
if ((atTop && scrollingDown) || (atBottom && scrollingUp)) {
  e.preventDefault();
}
```

---

## 📦 Dependencies

```json
{
  "gsap": "^3.12.0",
  "react": "^18.0.0"
}
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install gsap
```

### 2. Setup Section Navigation

```typescript
import { useSectionSwipe } from './hooks/useSectionSwipe';

function App() {
  const sections = [0, 16.67, 33.33, 50, 66.67, 83.33];
  
  useSectionSwipe({
    sections,
    getCurrentSection: () => currentSection,
    scrollToPercentage: (pct, opts) => {
      // Your scroll implementation
    },
    getCurrentScrollPercentage: () => {
      // Your percentage calculation
    },
    onNavigate: (index) => {
      setCurrentSection(index);
    },
    onSpecialAction: () => {
      // Trigger at last section
    },
  });
  
  return <YourContent />;
}
```

### 3. Setup Dismiss Swipe

```typescript
import { useDismissSwipe } from './hooks/useDismissSwipe';

function Modal({ onClose }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { manualTransform, transition } = useDismissSwipe({
    containerRef,
    onDismiss: onClose,
  });
  
  return (
    <div
      ref={containerRef}
      style={{
        transform: manualTransform || 'translateY(0)',
        transition,
      }}
    >
      {/* Your content */}
    </div>
  );
}
```

---

## 📝 Notes

- **Performance**: Gunakan `useRef` untuk values yang tidak perlu re-render
- **Cleanup**: Selalu remove event listeners di cleanup
- **Passive Listeners**: Hanya gunakan non-passive jika perlu `preventDefault`
- **Threshold**: Tuning threshold berdasarkan UX testing
- **Animation**: Gunakan GSAP untuk smooth animations
- **Isolation**: Gunakan `stopPropagation` untuk mencegah event bubbling

---

## 🔗 Related Files

- `src/components/SmoothScroll.tsx` - Section navigation implementation
- `src/components/ScrollableContent.tsx` - Content dismiss implementation
- `src/components/SwipeIndicator.tsx` - Visual indicator component
- `src/config/sectionConfig.ts` - Section configuration

---

**Dokumentasi ini dibuat untuk memudahkan implementasi swipe gesture di project lain. Semua code snippet sudah diuji dan siap digunakan.**

