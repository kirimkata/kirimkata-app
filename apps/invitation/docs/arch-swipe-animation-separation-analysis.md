# Analisis Pemisahan Swipe Logic vs Animation Logic

## 🎯 Konsep: Apakah Mereka Terpisah?

**JA, mereka terpisah secara konseptual**, tapi **terintegrasi** dalam implementasi saat ini.

---

## 📊 Arsitektur Saat Ini

### **Interface: `dragProgress` (0-2)**

Semua fungsi swipe/momentum/snap **hanya mengupdate `dragProgress`**, kemudian memanggil `updateAnimationFromProgress(dragProgress)`.

```
┌─────────────────────────────────────────────────────────┐
│                    SWIPE LOGIC                           │
│  (Gesture Detection, Velocity, Momentum, Snap)         │
│                                                          │
│  Input:  Touch/Mouse Events                            │
│  Output: dragProgress (0-2)                             │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ dragProgress
                       ▼
┌─────────────────────────────────────────────────────────┐
│                 ANIMATION LOGIC                          │
│  (updateAnimationFromProgress)                          │
│                                                          │
│  Input:  dragProgress (0-2)                            │
│  Output: Visual State (opacity, scale, x, y, etc.)    │
└─────────────────────────────────────────────────────────┘
```

---

## 🔍 Detail Pemisahan

### **1. SWIPE LOGIC** (Gesture Handling)

**Fungsi:**
- Deteksi gesture (touch/mouse)
- Hitung velocity
- Hitung swipe distance
- Update `dragProgress` berdasarkan gesture

**File:** `components/invitation-parallax.tsx`

**Fungsi-fungsi:**
```typescript
// Touch handlers
onTouchStart()  // Mulai drag
onTouchMove()   // Update dragProgress real-time
onTouchEnd()    // Deteksi swipe direction, trigger momentum/snap

// Mouse handlers (desktop)
onMouseDown()   // Mulai drag
onMouseMove()   // Update dragProgress real-time
onMouseUp()     // Deteksi swipe direction, trigger momentum/snap

// Momentum
startMomentum(velocity)  // Update dragProgress berdasarkan velocity + friction

// Snap
snapToNearest(startProgress, targetSection)  // Animasi dragProgress ke target
```

**Output:** `dragProgress` (0-2)

---

### **2. ANIMATION LOGIC** (Visual Updates)

**Fungsi:**
- Terima `progress` (0-2)
- Hitung semua nilai animasi berdasarkan progress
- Update state visual (opacity, scale, x, y, etc.)

**File:** `components/invitation-parallax.tsx`

**Fungsi utama:**
```typescript
updateAnimationFromProgress(progress: number) {
  // Progress 0-1: Section 0 → 1
  if (progress <= 1) {
    const progress01 = progress;
    // Update parallax values
    // Update section1Scale
    // Update opacity (Section 0 & 1)
  }
  
  // Progress 1-2: Section 1 → 2
  if (progress >= 1) {
    const progress12 = progress - 1;
    // Update section2BgScale, section2BgX, section2BgY
    // Update section2CoupleScale, section2CoupleX, section2CoupleY
    // Update section2GrassScale, section2GrassY, section2GrassOpacity
    // Update section2CloudOpacity
    // Update section2TextOpacity
  }
}
```

**Input:** `progress` (0-2)  
**Output:** Visual state (semua state animasi)

---

## 🔄 Alur Data

### **Contoh: User Swipe dari Section 0 ke Section 1**

```
1. USER SWIPE
   └─> onTouchMove()
       └─> Hitung deltaY, velocity
       └─> newProgress = dragProgress + progressDelta
       └─> setDragProgress(newProgress)
       └─> updateAnimationFromProgress(newProgress)  ← SWIPE → ANIMATION
           └─> progress01 = newProgress
           └─> Update parallax values
           └─> Update section1Scale
           └─> Update opacity

2. USER LEPAS (dengan velocity)
   └─> onTouchEnd()
       └─> Deteksi swipe direction
       └─> startMomentum(velocityPerFrame)
           └─> Loop: currentProgress += currentVelocity
           └─> setDragProgress(currentProgress)
           └─> updateAnimationFromProgress(currentProgress)  ← MOMENTUM → ANIMATION

3. MOMENTUM BERAKHIR
   └─> snapToNearest(currentProgress, targetSection)
       └─> Loop: currentProgress = start + (target - start) * eased
       └─> setDragProgress(currentProgress)
       └─> updateAnimationFromProgress(currentProgress)  ← SNAP → ANIMATION
```

---

## ✅ Keuntungan Pemisahan

### **1. Separation of Concerns**
- **Swipe Logic**: Hanya peduli gesture, velocity, direction
- **Animation Logic**: Hanya peduli visual state berdasarkan progress

### **2. Reusability**
- `updateAnimationFromProgress()` bisa dipanggil dari mana saja:
  - Drag real-time
  - Momentum animation
  - Snap animation
  - Programmatic (button click, etc.)

### **3. Testability**
- Bisa test swipe logic terpisah (mock `updateAnimationFromProgress`)
- Bisa test animation logic terpisah (pass progress langsung)

### **4. Maintainability**
- Ubah swipe behavior → tidak perlu ubah animation logic
- Ubah animation behavior → tidak perlu ubah swipe logic

---

## 🔧 Implementasi Saat Ini

### **Status: TERINTEGRASI tapi TERPISAH secara konseptual**

**Kelebihan:**
- ✅ Interface jelas: `dragProgress` sebagai contract
- ✅ Fungsi `updateAnimationFromProgress()` terpisah
- ✅ Swipe logic tidak tahu detail animasi

**Kekurangan:**
- ❌ Semua dalam satu file (`invitation-parallax.tsx`)
- ❌ Tidak ada abstraksi lebih lanjut
- ❌ Swipe logic masih memanggil `updateAnimationFromProgress()` langsung

---

## 💡 Rekomendasi: Pemisahan Lebih Jelas

### **Opsi 1: Custom Hook untuk Swipe Logic**

```typescript
// hooks/useSwipeGesture.ts
export function useSwipeGesture({
  onProgressChange,
  dragSensitivity,
  animationConfig,
}) {
  const [dragProgress, setDragProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [velocity, setVelocity] = useState(0);
  
  // Swipe handlers
  const onTouchStart = (e) => { /* ... */ };
  const onTouchMove = (e) => {
    const newProgress = /* calculate */;
    setDragProgress(newProgress);
    onProgressChange(newProgress);  // Callback ke parent
  };
  const onTouchEnd = () => { /* momentum/snap logic */ };
  
  return {
    dragProgress,
    isDragging,
    velocity,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    // ... mouse handlers
  };
}

// components/invitation-parallax.tsx
export default function InvitationParallax() {
  const {
    dragProgress,
    isDragging,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  } = useSwipeGesture({
    onProgressChange: updateAnimationFromProgress,  // ← Interface
    dragSensitivity: 1,
    animationConfig,
  });
  
  // Animation logic tetap di sini
  const updateAnimationFromProgress = (progress) => {
    // ... animation updates
  };
}
```

### **Opsi 2: Custom Hook untuk Animation Logic**

```typescript
// hooks/useSectionAnimation.ts
export function useSectionAnimation(dragProgress: number) {
  // Calculate semua animasi values
  const parallaxValues = useMemo(() => {
    if (dragProgress <= 1) {
      const progress01 = dragProgress;
      return {
        bgTranslateY: -30 + (0 - (-30)) * progress01,
        // ...
      };
    }
    // ...
  }, [dragProgress]);
  
  const section1Scale = useMemo(() => {
    if (dragProgress <= 1) {
      return 0.8 + (1 - 0.8) * dragProgress;
    }
    return 1.0;
  }, [dragProgress]);
  
  return {
    parallaxValues,
    section1Scale,
    section2BgScale,
    // ... semua animation values
  };
}

// components/invitation-parallax.tsx
export default function InvitationParallax() {
  const { dragProgress } = useSwipeGesture({ /* ... */ });
  const animationValues = useSectionAnimation(dragProgress);
  
  // Render dengan animationValues
}
```

---

## 📝 Kesimpulan

### **Apakah mereka terpisah?**

**YA, secara konseptual:**
- ✅ Swipe logic: gesture → `dragProgress`
- ✅ Animation logic: `dragProgress` → visual state
- ✅ Interface jelas: `dragProgress` dan `updateAnimationFromProgress()`

**TIDAK, secara implementasi:**
- ❌ Masih dalam satu file
- ❌ Belum ada abstraksi lebih lanjut
- ❌ Bisa dipisah lebih jelas dengan custom hooks

### **Rekomendasi:**

1. **Tetap seperti sekarang** jika codebase masih kecil dan mudah di-maintain
2. **Pisah dengan custom hooks** jika ingin:
   - Reusability lebih tinggi
   - Testability lebih baik
   - Separation of concerns lebih jelas

---

## 🎯 Key Points

1. **Interface**: `dragProgress` (0-2) adalah contract antara swipe dan animation
2. **Swipe Logic**: Hanya mengupdate `dragProgress`, tidak tahu detail animasi
3. **Animation Logic**: Hanya menerima `progress`, tidak tahu dari mana datangnya
4. **Pemisahan**: Sudah terpisah secara konseptual, bisa dipisah lebih jelas jika diperlukan

