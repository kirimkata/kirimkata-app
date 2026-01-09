# Cara Kerja Swipe: Section 0 → Section 1 → Section 2

## 📊 Konsep Dasar: `dragProgress`

Sistem menggunakan **single progress value** (`dragProgress`) yang mengontrol semua animasi:
- `dragProgress = 0` → Section 0 (Cover) penuh
- `dragProgress = 1` → Section 1 penuh
- `dragProgress = 2` → Section 2 penuh
- `0 < dragProgress < 1` → Transisi antara Section 0 dan 1
- `1 < dragProgress < 2` → Transisi antara Section 1 dan 2

---

## 🎯 Fase Swipe

### 1. **DRAG PHASE** (Saat User Menarik)
- User mulai drag (touch/mouse down)
- Setiap pergerakan mouse/jari → `dragProgress` diupdate secara real-time
- Animasi langsung mengikuti progress (tanpa delay)

### 2. **MOMENTUM PHASE** (Setelah Lepas dengan Velocity)
- Jika ada velocity cukup besar → momentum animation dimulai
- Velocity dikurangi oleh friction setiap frame
- Progress terus berubah sampai velocity < minVelocity

### 3. **SNAP PHASE** (Setelah Momentum atau Lepas Tanpa Velocity)
- Snap ke section terdekat berdasarkan progress saat ini
- Menggunakan easing function dari config
- Animasi smooth ke target section

---

## 🔄 Transisi Section 0 → Section 1

### Progress Range: `0 ≤ dragProgress ≤ 1`

#### **A. Drag Real-Time (Saat User Menarik)**

```typescript
// Setiap frame saat drag:
progress01 = dragProgress (0-1)

// Parallax values (fade dari posisi awal ke 0)
bgTranslateY = -30 + (0 - (-30)) * progress01      // -30 → 0
coupleTranslateY = 20 + (0 - 20) * progress01       // 20 → 0
grassTranslateY = -40 + (0 - (-40)) * progress01    // -40 → 0
cloudTranslateY = 15 + (0 - 15) * progress01        // 15 → 0

// Section 1 scale (zoom in)
section1Scale = 0.8 + (1 - 0.8) * progress01        // 0.8 → 1.0

// Opacity (sinkron sempurna)
Section 0 opacity = 1 - progress01                  // 1 → 0 (fade out)
Section 1 opacity = progress01                       // 0 → 1 (fade in)
```

**Karakteristik:**
- ✅ **Sinkron sempurna**: Section 0 fade out = Section 1 fade in (waktu & easing sama)
- ✅ **Real-time**: Setiap pixel drag langsung update animasi
- ✅ **Smooth**: Menggunakan CSS transition `fade-sync-transition` (5000ms, cubic-bezier)

#### **B. Section Detection**
- `progress01 < 0.5` → `currentSection = 0`
- `progress01 ≥ 0.5` → `currentSection = 1`

#### **C. Swipe Direction Logic**

**Di Section 0:**
- **Swipe UP** (jari/mouse ke atas) → Valid → Snap ke Section 1
- **Swipe DOWN** (jari/mouse ke bawah) → Invalid → Snap kembali ke Section 0

**Di Section 1:**
- **Swipe DOWN** (jari/mouse ke bawah) → Valid → Snap ke Section 0
- **Swipe UP** (jari/mouse ke atas) → Invalid → Snap kembali ke Section 1

#### **D. Snap Animation (Setelah Lepas)**

```typescript
// Config dari animationConfig.ts
duration: 4000ms (4 detik)
easing: 'ease-out'
snapEasing: (t) => 1 - Math.pow(1 - t, 3)  // Cubic ease-out

// Animasi dari startProgress ke targetProgress (0 atau 1)
currentProgress = startProgress + (targetProgress - startProgress) * eased
```

---

## 🔄 Transisi Section 1 → Section 2

### Progress Range: `1 ≤ dragProgress ≤ 2`

#### **A. Drag Real-Time (Saat User Menarik)**

```typescript
// Setiap frame saat drag:
progress12 = dragProgress - 1  // Normalize ke 0-1

// Background zoom & pan
section2BgScale = interpolate(1.4, 1.5, eased)      // 1.4 → 1.5
section2BgX = interpolate(10, 50, eased)           // 10 → 50
section2BgY = interpolate(5, 15, eased)             // 5 → 15

// Couple zoom & pan (smooth dengan ease-in-out quintic)
section2CoupleScale = interpolate(0.16, 0.60, eased) // 0.16 → 0.60
section2CoupleY = interpolate(12.5, 350, eased)      // 12.5 → 350

// Horizontal pan (DELAYED dari 60%)
if (progress12 >= 0.6) {
  xProgress = (progress12 - 0.6) / 0.4
  section2CoupleX = interpolate(0, -150, xEased)     // 0 → -150 (delayed)
}

// Grass fade out (dari 70%)
if (progress12 >= 0.7) {
  grassFadeProgress = (progress12 - 0.7) / 0.3
  section2GrassOpacity = interpolate(1, 0, grassFadeEased)  // 1 → 0
}
section2GrassScale = interpolate(1.4, 2.2, eased)    // 1.4 → 2.2
section2GrassY = interpolate(0, 380, eased)          // 0 → 380

// Cloud (langsung hilang, tidak fade)
if (progress12 <= 0) {
  section2CloudOpacity = 1
} else {
  section2CloudOpacity = 0  // Langsung hilang
}

// Text fade in (70% → 90%)
if (progress12 <= 0.7) {
  section2TextOpacity = 0
} else if (progress12 < 0.9) {
  section2TextOpacity = interpolate(0, 1, textEased)  // 0 → 1
} else {
  section2TextOpacity = 1
}
```

**Karakteristik:**
- ✅ **Tidak ada fade opacity** untuk Section 1 & 2 wrapper (langsung visible)
- ✅ **Hanya x, y, scale** yang berubah (smooth parallax zoom)
- ✅ **Cloud langsung hilang** tanpa fade
- ✅ **Text fade in** dengan bg hitam di akhir (70-90%)

#### **B. Section Detection**
- `progress12 < 0.5` → `currentSection = 1`
- `progress12 ≥ 0.5` → `currentSection = 2`

#### **C. Swipe Direction Logic**

**Di Section 1:**
- **Swipe UP** (jari/mouse ke atas) → Valid → Snap ke Section 2
- **Swipe DOWN** (jari/mouse ke bawah) → Valid → Snap ke Section 0

**Di Section 2:**
- **Swipe DOWN** (jari/mouse ke bawah) → Valid → Snap ke Section 1
- **Swipe UP** (jari/mouse ke atas) → Invalid → Snap kembali ke Section 2

#### **D. Snap Animation (Setelah Lepas)**

```typescript
// Config dari animationConfig.ts
duration: 400ms
easing: 'ease-out'
snapEasing: (t) => 1 - Math.pow(1 - t, 3)  // Cubic ease-out

// Animasi dari startProgress ke targetProgress (1 atau 2)
currentProgress = startProgress + (targetProgress - startProgress) * eased
```

---

## 🎮 Alur Lengkap Swipe

### **Contoh: Swipe dari Section 0 ke Section 1**

1. **User mulai drag** (touch/mouse down)
   - `isDragging = true`
   - `touchStartY` / `mouseStartY` disimpan
   - Momentum animation dibatalkan jika sedang berjalan

2. **User drag** (touch/mouse move)
   - Setiap frame:
     - Hitung `deltaY = lastY - currentY` (positive = up)
     - Hitung `progressDelta = (deltaY / viewportHeight) * dragSensitivity`
     - Update `dragProgress += progressDelta` (clamped 0-2)
     - Hitung `velocity = deltaY / deltaTime`
     - Panggil `updateAnimationFromProgress(dragProgress)`

3. **User lepas** (touch/mouse up)
   - `isDragging = false`
   - Hitung `swipeDistance = startY - endY` (positive = swipe up)
   - Deteksi arah: `isSwipeUp` atau `isSwipeDown`
   
4. **Decision Logic:**
   ```typescript
   if (currentSection === 0 && isSwipeUp) {
     // Valid: Swipe up dari cover → snap ke Section 1
     snapToNearest(dragProgress, 1);
   } else if (currentSection === 0 && isSwipeDown) {
     // Invalid: Swipe down di cover → snap kembali ke 0
     snapToNearest(dragProgress, 0);
   } else if (Math.abs(velocity) > 0.001) {
     // Ada velocity → gunakan momentum
     startMomentum(velocityPerFrame);
   } else {
     // Tidak ada velocity → snap berdasarkan progress
     snapToNearest(dragProgress);
   }
   ```

5. **Snap Animation:**
   - Dari `startProgress` (progress saat lepas) ke `targetProgress` (0 atau 1)
   - Durasi: 4000ms (4 detik)
   - Easing: cubic ease-out
   - Setiap frame: update `dragProgress` → `updateAnimationFromProgress()`

---

## 🔧 Konfigurasi

### **Section 0 → 1:**
```typescript
duration: 4000ms  // 4 detik (sangat smooth)
easing: 'ease-out'
snapEasing: (t) => 1 - Math.pow(1 - t, 3)
fadeEasing: 'cubic-bezier(0.23, 0.32, 0.32, 0.95)'
```

### **Section 1 → 2:**
```typescript
duration: 400ms  // Cepat (hanya x, y, scale)
easing: 'ease-out'
snapEasing: (t) => 1 - Math.pow(1 - t, 3)
```

### **Momentum:**
```typescript
friction: 0.92  // Velocity dikurangi 8% setiap frame
minVelocity: 0.001  // Stop momentum jika velocity < 0.001
```

### **Drag Sensitivity:**
```typescript
dragSensitivity: 1.0  // 1:1 ratio (1px drag = 1px progress)
```

---

## 📝 Perbedaan Utama S0→S1 vs S1→S2

| Aspek | S0 → S1 | S1 → S2 |
|-------|---------|---------|
| **Fade Opacity** | ✅ Ada (Section 0 fade out, Section 1 fade in) | ❌ Tidak ada (langsung visible) |
| **Animasi** | Fade + Scale + Parallax | Hanya x, y, scale (parallax zoom) |
| **Duration** | 4000ms (4 detik) | 400ms (cepat) |
| **Cloud** | Fade out dengan parallax | Langsung hilang (opacity 0) |
| **Text** | Tidak ada | Fade in 70-90% dengan bg hitam |
| **Swipe Direction** | Hanya UP valid di S0 | UP (ke S2) & DOWN (ke S0) valid di S1 | Hanya DOWN valid di S2 |

---

## 🎯 Key Points

1. **Single Progress Value**: Semua animasi dikontrol oleh `dragProgress` (0-2)
2. **Real-Time Updates**: Setiap drag langsung update animasi (tidak ada delay)
3. **Smooth Transitions**: CSS transitions untuk fade, JS untuk transform
4. **Direction-Aware**: Hanya arah swipe yang valid yang trigger transisi
5. **Momentum Support**: Velocity-based momentum setelah lepas
6. **Snap to Nearest**: Setelah momentum atau lepas, snap ke section terdekat

