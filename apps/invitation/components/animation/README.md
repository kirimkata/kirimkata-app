# Animation Page Components - Framer Motion Adaptation

Komponen-komponen section animation yang sudah diadaptasi dari GSAP ke Framer Motion.

## Status Konversi

### ✅ Sudah Dikonversi (Framer Motion)
- `WeddingSceneSection0.framer.tsx` - Section 1: Wedding Scene (0-2 progress range)
- `BrideDetailSection1.framer.tsx` - Section 2: Bride Detail (Zoom & Pan to Bride)
- `GroomDetailSection2.framer.tsx` - Section 3: Groom Detail (Zoom & Pan to Groom)
- `CoupleFullSection3.framer.tsx` - Section 4: Couple Full (3-phase zoom out)
- `CoupleFullSection4.framer.tsx` - Section 5: Couple Zoom Out (2.5D parallax)
- `CoupleFullSection5.framer.tsx` - Section 6: Couple Zoom Out Further

### 📝 Catatan
- `CoverSection0.tsx` - Section 0: Cover (sudah menggunakan React state, tidak perlu GSAP)
- File GSAP original tetap ada untuk referensi

## Pattern Konversi

### Dari GSAP ke Framer Motion

**GSAP Pattern:**
```typescript
useEffect(() => {
  const interpolate = (start, end, progress) => start + (end - start) * progress;
  const eased = easeInOutCubic(progress);
  const value = interpolate(startValue, endValue, eased);
  
  gsap.set(ref.current, { scale: value, x: xValue, y: yValue });
}, [scrollProgress]);
```

**Framer Motion Pattern:**
```typescript
import { useTransform, MotionValue } from 'motion/react';
import { interpolate, easeInOutCubic } from './animation-helpers';

const scale = useTransform(progress, (p) => {
  const eased = easeInOutCubic(p);
  return interpolate(startValue, endValue, eased);
});

<motion.div style={{ scale, x, y }} />
```

## Helper Functions

File `animation-helpers.ts` menyediakan:
- `interpolate()` - Linear interpolation
- `easeInOutQuint()` - Smooth quintic easing
- `easeInOutCubic()` - Smooth cubic easing
- `easeOutCubic()` - Ease out cubic
- `easeSmoothBelok()` - Smootherstep easing
- `easeOutQuart()` - Ease out quartic

## Interface

Semua komponen menggunakan interface yang sama:

```typescript
interface SectionProps {
  progress: MotionValue<number>; // 0 to 1
}
```

## Usage

```typescript
import { useMotionValue } from 'motion/react';
import BrideDetailSection1 from '@/components/animation-page/BrideDetailSection1.framer';

const progress = useMotionValue(0);

<BrideDetailSection1 progress={progress} />
```

## Next Steps

1. ✅ Konversi semua komponen dari GSAP ke Framer Motion - **SELESAI**
2. 🔄 Update `invitation-fadli.tsx` untuk menggunakan komponen Framer Motion baru
3. Test semua animasi untuk memastikan smoothness
4. Optimize performance jika diperlukan

## Usage Example

```typescript
import { useMotionValue } from 'motion/react';
import { 
  WeddingSceneSection0Framer,
  BrideDetailSection1Framer,
  GroomDetailSection2Framer,
  CoupleFullSection3Framer,
  CoupleFullSection4Framer,
  CoupleFullSection5Framer
} from '@/components/animation-page';

const progress = useMotionValue(0);

// Section 1: Wedding Scene
<WeddingSceneSection0Framer progress={progress} />

// Section 2: Bride Detail
<BrideDetailSection1Framer progress={progress} />

// Section 3: Groom Detail
<GroomDetailSection2Framer progress={progress} />

// Section 4: Couple Full
<CoupleFullSection3Framer progress={progress} />

// Section 5: Couple Zoom Out
<CoupleFullSection4Framer progress={progress} />

// Section 6: Couple Zoom Out Further
<CoupleFullSection5Framer progress={progress} />
```

