"use client";

import { useState, useRef, useCallback } from 'react';
import { interpolate, easeInOutQuint, easeInOutCubic, easeSmoothBelok, easeOutQuart, easeOutCubic } from '@/components/animation/animation-helpers';
import { SECTION_LAYOUTS } from '@/config/sectionLayoutConfig';

type CoupleKeyframe = {
  scale: number;
  x: number;
  y: number;
};

// Keyframe posisi akhir couple (gate + pengantin + grass_pengantin) per section
// Supaya awal section berikutnya bisa otomatis mengikuti akhir section sebelumnya
const COUPLE_KEYFRAMES: Record<number, CoupleKeyframe> = {
  1: SECTION_LAYOUTS[1].couple,
  2: SECTION_LAYOUTS[2].couple,
  3: SECTION_LAYOUTS[3].couple,
  4: SECTION_LAYOUTS[4].couple,
  5: SECTION_LAYOUTS[5].couple,
  6: SECTION_LAYOUTS[6].couple,
};

const getProgress12Zoom = (t: number): number => {
  const accelPortionTime = 0.1;
  const decelPortionTime = 0.1;
  const linearStartTime = accelPortionTime;
  const linearEndTime = 1 - decelPortionTime;

  const startDistancePortion = 0.2;
  const linearDistancePortion = 0.77;
  const endDistancePortion = 1 - (startDistancePortion + linearDistancePortion);

  if (t <= linearStartTime) {
    const u = t / linearStartTime;
    const eased = easeOutCubic(u);
    return eased * startDistancePortion;
  }

  if (t < linearEndTime) {
    const u = (t - linearStartTime) / (linearEndTime - linearStartTime);
    return startDistancePortion + u * linearDistancePortion;
  }

  const u = (t - linearEndTime) / (1 - linearEndTime);
  const eased = easeOutCubic(u);
  return startDistancePortion + linearDistancePortion + eased * endDistancePortion;
};

export interface SectionAnimationValues {
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
  
  // Section 2 → 3
  section3WrapperScale: number;
  section3BgScale: number;
  section3BgX: number;
  section3BgY: number;
  section3CoupleScale: number;
  section3CoupleX: number;
  section3CoupleY: number;
  section3GradientOpacity: number;
  section3BrideTextOpacity: number;
  section3GroomTextOpacity: number;
  
  // Section 3 → 4
  section4WrapperScale: number;
  section4BgScale: number;
  section4BgX: number;
  section4BgY: number;
  section4CoupleScale: number;
  section4CoupleX: number;
  section4CoupleY: number;
  section4GrassScale: number;
  section4GrassY: number;
  section4GrassOpacity: number;
  section4CloudOpacity: number;
  section4CloudScale: number;
  section4CloudTop: number;
  section4GradientOpacity: number;
  section4GroomTextOpacity: number;
  
  // Section 4 → 5
  section5WrapperScale: number;
  section5BgScale: number;
  section5BgX: number;
  section5BgY: number;
  section5CoupleScale: number;
  section5CoupleX: number;
  section5CoupleY: number;
  section5GrassScale: number;
  section5GrassY: number;
  section5GrassOpacity: number;
  section5OldCloudOpacity: number;
  section5OldCloudScale: number;
  section5OldCloudY: number;
  section5NewCloudOpacity: number;
  section5NewCloudTop: number;
  
  // Section 5 → 6
  section6WrapperScale: number;
  section6BgScale: number;
  section6BgX: number;
  section6BgY: number;
  section6CoupleScale: number;
  section6CoupleX: number;
  section6CoupleY: number;
  section6GrassScale: number;
  section6GrassY: number;
  section6GrassOpacity: number;
  section6NewCloudOpacity: number;
  section6NewCloudTop: number;
}

export interface UseSectionAnimationOptions {
  // Callbacks untuk section change
  onSectionChange?: (section: number) => void;
  onOpeningChange?: (isOpening: boolean) => void;
}

export interface UseSectionAnimationReturn {
  // Animation values
  animationValues: SectionAnimationValues;
  
  // Update function
  updateFromProgress: (progress: number) => void;
  
  // Get current section based on progress
  getSectionFromProgress: (progress: number) => number;
}

export function useSectionAnimation({
  onSectionChange,
  onOpeningChange,
}: UseSectionAnimationOptions = {}): UseSectionAnimationReturn {
  // State untuk Section 0 → 1
  const [section1Scale, setSection1Scale] = useState(1 / SECTION_LAYOUTS[1].background.scale);
  const coupleStartYOffset = 300;
  
  // Refs untuk performa optimal (tidak trigger re-render)
  const bgTranslateYRef = useRef(0);
  const coupleTranslateYRef = useRef(coupleStartYOffset);
  const grassTranslateYRef = useRef(-40);
  const cloudTranslateYRef = useRef(0);
  
  // State untuk UI updates (hanya diperlukan untuk re-render)
  const [parallaxValues, setParallaxValues] = useState({
    bgTranslateY: 0,
    coupleTranslateY: coupleStartYOffset,
    grassTranslateY: -40,
    cloudTranslateY: 0,
  });
  
  // State untuk Section 2
  const [section2WrapperScale, setSection2WrapperScale] = useState(1.0);
  const [section2BgScale, setSection2BgScale] = useState(1.4);
  const [section2BgX, setSection2BgX] = useState(10);
  const [section2BgY, setSection2BgY] = useState(5);
  const [section2CoupleScale, setSection2CoupleScale] = useState(0.16);
  const [section2CoupleX, setSection2CoupleX] = useState(0);
  const [section2CoupleY, setSection2CoupleY] = useState(12.5);
  const [section2GrassScale, setSection2GrassScale] = useState(1.4);
  const [section2GrassY, setSection2GrassY] = useState(0);
  const [section2GrassOpacity, setSection2GrassOpacity] = useState(1);
  const [section2CloudOpacity, setSection2CloudOpacity] = useState(1);
  const [section2CloudScale, setSection2CloudScale] = useState(0.6);
  const [section2CloudTop, setSection2CloudTop] = useState(0);
  const [section2TextOpacity, setSection2TextOpacity] = useState(0);
  
  // State untuk Section 3 - AWAL SAMA PERSIS DENGAN AKHIR SECTION 2
  // Section 2 akhir (progress12 = 1):
  // - Background: scale(1.5) translate(50px, 15px)
  // - Couple: scale(0.60) translate(-150px, 350px)
  // - Bride text opacity: 1
  const [section3WrapperScale, setSection3WrapperScale] = useState(1.0);
  const [section3BgScale, setSection3BgScale] = useState(1.5); // Background scale: 1.5 (sama Section 2 akhir) -> 1.5
  const [section3BgX, setSection3BgX] = useState(50); // Background X: 50 (sama Section 2 akhir) -> 30
  const [section3BgY, setSection3BgY] = useState(15); // Background Y: 15 (sama Section 2 akhir) -> 15
  const [section3CoupleScale, setSection3CoupleScale] = useState(0.60); // Couple scale: 0.60 (sama Section 2 akhir) -> 0.60
  const [section3CoupleX, setSection3CoupleX] = useState(-150); // Couple X: -150 (sama Section 2 akhir) -> 150
  const [section3CoupleY, setSection3CoupleY] = useState(350); // Couple Y: 350 (sama Section 2 akhir) -> 350
  const [section3GradientOpacity, setSection3GradientOpacity] = useState(1); // Gradient opacity: 1 (selalu visible)
  const [section3BrideTextOpacity, setSection3BrideTextOpacity] = useState(1); // Bride text opacity: 1 -> 0 (fade out 0-30%)
  const [section3GroomTextOpacity, setSection3GroomTextOpacity] = useState(0); // Groom text opacity: 0 -> 1 (fade in 50-100%)
  
  // State untuk Section 4 - AWAL SAMA PERSIS DENGAN AKHIR SECTION 3
  // Section 3 akhir (progress23 = 1):
  // - Background: scale(1.5) translate(30px, 15px)
  // - Couple: scale(0.60) translate(150px, 350px)
  // - Gradient opacity: 0
  // - Groom text opacity: 1
  const [section4WrapperScale, setSection4WrapperScale] = useState(1.0);
  const [section4BgScale, setSection4BgScale] = useState(1.5); // Background scale: 1.5 (sama Section 3 akhir) -> zoom out
  const [section4BgX, setSection4BgX] = useState(30); // Background X: 30 (sama Section 3 akhir) -> 10 (at 60%)
  const [section4BgY, setSection4BgY] = useState(15); // Background Y: 15 (sama Section 3 akhir) -> 5 (at 60%)
  const [section4CoupleScale, setSection4CoupleScale] = useState(() => COUPLE_KEYFRAMES[3].scale); // Couple scale: mengikuti akhir Section 3
  const [section4CoupleX, setSection4CoupleX] = useState(() => COUPLE_KEYFRAMES[3].x); // Couple X: mengikuti akhir Section 3
  const [section4CoupleY, setSection4CoupleY] = useState(() => COUPLE_KEYFRAMES[3].y); // Couple Y: mengikuti akhir Section 3
  const [section4GrassScale, setSection4GrassScale] = useState(2.2); // Grass scale: 2.2 (start) -> 1.4 (at 60%) -> 1.54 (at 100%)
  const [section4GrassY, setSection4GrassY] = useState(380); // Grass Y: 380 (start) -> 20 (at 60%) -> 270 (at 100%)
  const [section4GrassOpacity, setSection4GrassOpacity] = useState(0); // Grass opacity: 0 -> 1 (at 60%)
  const [section4CloudOpacity, setSection4CloudOpacity] = useState(0); // Cloud opacity: 0 -> 1 (80-100%)
  const [section4CloudScale, setSection4CloudScale] = useState(0.5); // Cloud scale: 0.5 -> 0.12 (at 80%) -> 0.504 (at 100%)
  const [section4CloudTop, setSection4CloudTop] = useState(10); // Cloud top: 10%
  const [section4GradientOpacity, setSection4GradientOpacity] = useState(0); // Gradient opacity: 0 (fade out 0-30%)
  const [section4GroomTextOpacity, setSection4GroomTextOpacity] = useState(1); // Groom text opacity: 1 -> 0 (fade out 0-30%)
  
  // State untuk Section 5 - AWAL SAMA PERSIS DENGAN AKHIR SECTION 4
  // Section 4 akhir (progress34 = 1):
  // - Background: scale(1.452) translate(18px, 9px)
  // - Couple: scale(0.582) translate(0px, 1247.5px)
  // - Grass: scale(1.54) translateY(270px), opacity(1)
  // - Old Cloud: opacity(1), scale(0.504), top(10%)
  const [section5WrapperScale, setSection5WrapperScale] = useState(1.0);
  const [section5BgScale, setSection5BgScale] = useState(1.452); // Background scale: 1.452 (sama Section 4 akhir) -> 1.1
  const [section5BgX, setSection5BgX] = useState(18); // Background X: 18 (sama Section 4 akhir) -> 0
  const [section5BgY, setSection5BgY] = useState(9); // Background Y: 9 (sama Section 4 akhir) -> -10
  const [section5CoupleScale, setSection5CoupleScale] = useState(() => COUPLE_KEYFRAMES[4].scale); // Couple scale: mengikuti akhir Section 4 -> 0.18
  const [section5CoupleX, setSection5CoupleX] = useState(() => COUPLE_KEYFRAMES[4].x); // Couple X: mengikuti akhir Section 4 -> 0 (stay centered)
  const [section5CoupleY, setSection5CoupleY] = useState(() => COUPLE_KEYFRAMES[4].y); // Couple Y: mengikuti akhir Section 4 -> 220
  const [section5GrassScale, setSection5GrassScale] = useState(1.54); // Grass scale: 1.54 (sama Section 4 akhir) -> 1.1
  const [section5GrassY, setSection5GrassY] = useState(270); // Grass Y: 270 (sama Section 4 akhir) -> 200
  const [section5GrassOpacity, setSection5GrassOpacity] = useState(1); // Grass opacity: 1 (selalu visible)
  const [section5OldCloudOpacity, setSection5OldCloudOpacity] = useState(1); // Old Cloud opacity: 1 -> 0 (fade out 0-30%)
  const [section5OldCloudScale, setSection5OldCloudScale] = useState(1.008); // Old Cloud scale: 1.008 -> 0.3 (at 30%)
  const [section5OldCloudY, setSection5OldCloudY] = useState(0); // Old Cloud Y: 0 -> 800 (after 30%)
  const [section5NewCloudOpacity, setSection5NewCloudOpacity] = useState(0); // New Cloud opacity: 0 -> 1 (fade in 40-80%)
  const [section5NewCloudTop, setSection5NewCloudTop] = useState(-200); // New Cloud top: -200 -> 80 (40-80%)
  
  // State untuk Section 6 - AWAL SAMA PERSIS DENGAN AKHIR SECTION 5
  // Section 5 akhir (progress45 = 1):
  // - Background: scale(1.1) translate(0px, -10px)
  // - Couple: scale(0.18) translate(0px, 220px)
  // - Grass: scale(1.1) translateY(200px), opacity(1)
  // - New Cloud: opacity(1), top(80px)
  const [section6WrapperScale, setSection6WrapperScale] = useState(1.0);
  const [section6BgScale, setSection6BgScale] = useState(1.1); // Background scale: 1.1 (sama Section 5 akhir) -> 1.1 (no change)
  const [section6BgX, setSection6BgX] = useState(0); // Background X: 0 (sama Section 5 akhir) -> 0 (stay centered)
  const [section6BgY, setSection6BgY] = useState(-10); // Background Y: -10 (sama Section 5 akhir) -> -30
  const [section6CoupleScale, setSection6CoupleScale] = useState(() => COUPLE_KEYFRAMES[5].scale); // Couple scale: mengikuti akhir Section 5 -> 0.14
  const [section6CoupleX, setSection6CoupleX] = useState(() => COUPLE_KEYFRAMES[5].x); // Couple X: mengikuti akhir Section 5 -> 0 (stay centered)
  const [section6CoupleY, setSection6CoupleY] = useState(() => COUPLE_KEYFRAMES[5].y); // Couple Y: mengikuti akhir Section 5 -> 100
  const [section6GrassScale, setSection6GrassScale] = useState(1.1); // Grass scale: 1.1 (sama Section 5 akhir) -> 1.1 (no change)
  const [section6GrassY, setSection6GrassY] = useState(200); // Grass Y: 200 (sama Section 5 akhir) -> 100
  const [section6GrassOpacity, setSection6GrassOpacity] = useState(1); // Grass opacity: 1 (selalu visible)
  const [section6NewCloudOpacity, setSection6NewCloudOpacity] = useState(1); // New Cloud opacity: 1 -> 0 (fade out 0-50%)
  const [section6NewCloudTop, setSection6NewCloudTop] = useState(80); // New Cloud top: 80 -> -20 (0-50%)
  
  // Track current section untuk detect changes
  const currentSectionRef = useRef(0);
  
  // Update animasi berdasarkan progress
  const updateFromProgress = useCallback((progress: number) => {
    const clampedProgress = Math.max(0, Math.min(6, progress)); // Update max progress ke 6 untuk Section 6
    
    // Layout poses per section dari centralized config
    const bg1 = SECTION_LAYOUTS[1].background;
    const bg2 = SECTION_LAYOUTS[2].background;
    const bg3 = SECTION_LAYOUTS[3].background;
    const bg4 = SECTION_LAYOUTS[4].background;
    const bg5 = SECTION_LAYOUTS[5].background;
    const bg6 = SECTION_LAYOUTS[6].background;

    const grass1 = SECTION_LAYOUTS[1].grass;
    const grass2 = SECTION_LAYOUTS[2].grass;
    const grass3 = SECTION_LAYOUTS[3].grass;
    const grass4 = SECTION_LAYOUTS[4].grass;
    const grass5 = SECTION_LAYOUTS[5].grass;
    const grass6 = SECTION_LAYOUTS[6].grass;

    // Calculate progress12 untuk Section 2 (selalu dihitung, bahkan saat progress < 1)
    const progress12 = Math.max(0, Math.min(1, clampedProgress - 1));
    const progress12Zoom = getProgress12Zoom(progress12);
    
    // Calculate progress23 untuk Section 3 (selalu dihitung, bahkan saat progress < 2)
    const progress23 = Math.max(0, Math.min(1, clampedProgress - 2));
    
    // Calculate progress34 untuk Section 4 (selalu dihitung, bahkan saat progress < 3)
    const progress34 = Math.max(0, Math.min(1, clampedProgress - 3));
    
    // Calculate progress45 untuk Section 5 (selalu dihitung, bahkan saat progress < 4)
    const progress45 = Math.max(0, Math.min(1, clampedProgress - 4));
    
    // Calculate progress56 untuk Section 6 (selalu dihitung, bahkan saat progress < 5)
    const progress56 = Math.max(0, Math.min(1, clampedProgress - 5));
    
    // Handle transisi 0->1 (Cover -> Section 1)
    if (clampedProgress <= 1) {
      const progress01 = Math.max(0, Math.min(1, clampedProgress));
      
      // Update refs untuk performa optimal
      // Background: tetap di posisi vertikal center (0) selama progress01,
      // pergerakan menuju bg1.y di-handle oleh interpolasi di parallax-scene.tsx
      bgTranslateYRef.current = 0;
      coupleTranslateYRef.current = coupleStartYOffset + (0 - coupleStartYOffset) * progress01;
      // Grass: akhir Cover (progress01 = 1) disamakan dengan awal Section 2 (Y = 30)
      grassTranslateYRef.current = -40 + (30 - (-40)) * progress01;
      cloudTranslateYRef.current = 0;
      
      // Update state untuk re-render
      setParallaxValues({
        bgTranslateY: bgTranslateYRef.current,
        coupleTranslateY: coupleTranslateYRef.current,
        grassTranslateY: grassTranslateYRef.current,
        cloudTranslateY: cloudTranslateYRef.current,
      });
      
      // Interpolate scale: 0.8 -> 1.0 untuk section 1
      const section1StartScale = 1 / bg1.scale;
      const section1EndScale = 1;
      setSection1Scale(section1StartScale + (section1EndScale - section1StartScale) * progress01);
      
      // Update section berdasarkan progress
      const newSection = progress01 >= 0.5 ? 1 : 0;
      if (newSection !== currentSectionRef.current) {
        currentSectionRef.current = newSection;
        onSectionChange?.(newSection);
        onOpeningChange?.(newSection === 1);
      }
      
      // Text opacity selalu 0 saat progress < 1
      setSection2TextOpacity(0);
    }
    
    // Handle transisi 1->2 (Section 1 -> Section 2) - SELALU dihitung untuk real-time drag
    if (clampedProgress >= 1) {
      
      // Background zoom
      const bgEased = easeInOutCubic(progress12Zoom);
      setSection2BgScale(interpolate(bg1.scale, bg2.scale, bgEased));
      setSection2BgY(interpolate(bg1.y, bg2.y, bgEased));
      
      // Couple zoom and pan
      const coupleStart12 = COUPLE_KEYFRAMES[1];
      const coupleEnd12 = COUPLE_KEYFRAMES[2];

      const coupleZoomSplit12 = 0.6;

      let coupleEaseT12: number;
      if (progress12Zoom <= coupleZoomSplit12) {
        const localT = progress12Zoom / coupleZoomSplit12;
        coupleEaseT12 = localT * coupleZoomSplit12;
      } else {
        const localT = (progress12Zoom - coupleZoomSplit12) / (1 - coupleZoomSplit12);
        coupleEaseT12 = coupleZoomSplit12 + localT * (1 - coupleZoomSplit12);
      }

      const coupleEased12 = easeInOutQuint(Math.pow(coupleEaseT12, 1.3));
      setSection2CoupleScale(
        interpolate(coupleStart12.scale, coupleEnd12.scale, coupleEased12)
      );
      setSection2CoupleY(
        interpolate(coupleStart12.y, coupleEnd12.y, coupleEased12)
      );
      
      // Horizontal pan - DELAYED start from 60%
      const xProgress = Math.max(0, (progress12 - 0.6) / 0.4);
      const xEased = easeSmoothBelok(xProgress);
      setSection2CoupleX(interpolate(coupleStart12.x, coupleEnd12.x, xEased));
      const bgPanDistance12 = Math.abs(bg2.x - bg1.x);
      setSection2BgX(bg1.x - bgPanDistance12 * xEased);
      
      // Grass: transisi dari pose Section 1 -> pose Section 2 (config-driven)
      if (grass1 && grass2) {
        const grassEased = easeInOutCubic(progress12);
        setSection2GrassScale(
          interpolate(grass1.scale, grass2.scale, grassEased)
        );
        setSection2GrassY(
          interpolate(grass1.y, grass2.y, grassEased)
        );

        // Opacity: fade dari opacity Section 1 -> Section 2 di bagian akhir transisi
        const fadeStart = 0.7;
        const fadeEnd = 1.0;
        if (progress12 <= fadeStart) {
          setSection2GrassOpacity(grass1.opacity ?? 1);
        } else {
          const t = Math.max(
            0,
            Math.min(1, (progress12 - fadeStart) / (fadeEnd - fadeStart))
          );
          const grassFadeEased = easeInOutCubic(t);
          setSection2GrassOpacity(
            interpolate(
              grass1.opacity ?? 1,
              grass2.opacity ?? 1,
              grassFadeEased
            )
          );
        }
      }
      
      // Cloud - langsung hilang tanpa fade
      if (progress12 <= 0) {
        setSection2CloudOpacity(1);
        setSection2CloudScale(0.6);
        setSection2CloudTop(0);
      } else {
        setSection2CloudOpacity(0);
        setSection2CloudScale(1.3);
        setSection2CloudTop(150);
      }
      
      // Text fade in (70% -> 90%)
      const fadeInStart = 0.7;
      const fadeInEnd = 0.9;
      if (progress12 <= fadeInStart) {
        setSection2TextOpacity(0);
      } else if (progress12 < fadeInEnd) {
        const t = (progress12 - fadeInStart) / (fadeInEnd - fadeInStart);
        const textEased = easeInOutQuint(Math.max(0, Math.min(1, t)));
        setSection2TextOpacity(interpolate(0, 1, textEased));
      } else {
        setSection2TextOpacity(1);
      }
      
      // Update section berdasarkan progress
      const newSection = progress12 >= 0.5 ? 2 : 1;
      if (newSection !== currentSectionRef.current) {
        currentSectionRef.current = newSection;
        onSectionChange?.(newSection);
        onOpeningChange?.(newSection === 2);
      }
    }
    
    // Handle transisi 2->3 (Section 2 -> Section 3) - SELALU dihitung untuk real-time drag
    if (clampedProgress >= 2) {
      // Background pan - AWAL bg2 (Section 2 akhir) -> bg3 (Section 3 pose utama)
      const bgEased = easeInOutCubic(progress23);
      setSection3BgScale(interpolate(bg2.scale, bg3.scale, bgEased));
      setSection3BgX(interpolate(bg2.x, bg3.x, bgEased));
      setSection3BgY(interpolate(bg2.y, bg3.y, bgEased));
      
      // Couple pan - AWAL 0.60, -150, 350 (sama Section 2 akhir) -> 0.60, 150, 350
      const coupleEased = easeSmoothBelok(progress23);
      const coupleStart23 = COUPLE_KEYFRAMES[2];
      const coupleEnd23 = COUPLE_KEYFRAMES[3];
      setSection3CoupleScale(interpolate(coupleStart23.scale, coupleEnd23.scale, coupleEased)); // No change in scale
      setSection3CoupleX(interpolate(coupleStart23.x, coupleEnd23.x, coupleEased));
      setSection3CoupleY(interpolate(coupleStart23.y, coupleEnd23.y, coupleEased));
      
      // Gradient opacity - selalu 1
      setSection3GradientOpacity(1);
      
      // Bride text fade out (0% -> 30%)
      if (progress23 <= 0.3) {
        const brideFadeProgress = progress23 / 0.3;
        const brideFadeEased = easeInOutCubic(brideFadeProgress);
        setSection3BrideTextOpacity(interpolate(1, 0, brideFadeEased));
      } else {
        setSection3BrideTextOpacity(0);
      }
      
      // Groom text fade in (50% -> 100%)
      if (progress23 <= 0.5) {
        setSection3GroomTextOpacity(0);
      } else {
        const groomFadeProgress = (progress23 - 0.5) / 0.5; // Normalize 0.5-1.0 to 0-1
        const groomFadeEased = easeInOutQuint(Math.max(0, Math.min(1, groomFadeProgress)));
        setSection3GroomTextOpacity(interpolate(0, 1, groomFadeEased));
      }
      
      // Update section berdasarkan progress
      const newSection = progress23 >= 0.5 ? 3 : 2;
      if (newSection !== currentSectionRef.current) {
        currentSectionRef.current = newSection;
        onSectionChange?.(newSection);
        onOpeningChange?.(newSection === 3);
      }
    } else {
      // Pastikan Section 3 menggunakan nilai akhir Section 2 saat progress < 2
      // Section 2 akhir (progress12 = 1): bg2, couple(0.60, -200, 700)
      setSection3BgScale(bg2.scale);
      setSection3BgX(bg2.x);
      setSection3BgY(bg2.y);
      const coupleEndSection2 = COUPLE_KEYFRAMES[2];
      setSection3CoupleScale(coupleEndSection2.scale);
      setSection3CoupleX(coupleEndSection2.x);
      setSection3CoupleY(coupleEndSection2.y);
      setSection3GradientOpacity(1);
      // Text opacity selalu 0 saat progress < 2
      setSection3BrideTextOpacity(0);
      setSection3GroomTextOpacity(0);
    }
    
    // Handle transisi 3->4 (Section 3 -> Section 4) - SELALU dihitung untuk real-time drag
    // Berdasarkan CoupleFullSection3.framer.tsx dengan 3 phase:
    // Phase 1 (0-40%): Horizontal centering
    // Phase 2 (40-60%): Zoom out
    // Phase 3 (60-100%): Move down for clouds
    if (clampedProgress >= 3) {
      const phase1End = 0.3; // Horizontal centering completes
      const phase2End = 0.4; // Zoom out completes
      const phase3End = 1.0; // Move down for clouds completes

      const bgPhase12Ease = easeInOutCubic;
      const bgPhase3Ease = easeInOutQuint;
      const couplePhase12Ease = easeInOutQuint;
      const couplePhase3Ease = easeOutCubic;
      const grassPhase12Ease = easeInOutCubic;
      const grassPhase3Ease = easeInOutCubic;
      
      // Background animations - Three phases
      if (progress34 <= phase2End) {
        // Phase 1 & 2: Zoom out (0-60%)
        const zoomOutProgress = progress34 / phase2End;
        const bgScaleEnd = interpolate(bg3.scale, 1.2, 0.6); // 1.32
        const bgEased = bgPhase12Ease(zoomOutProgress);
        setSection4BgScale(interpolate(bg3.scale, bgScaleEnd, bgEased));
        const bgXEnd = interpolate(bg3.x, 10, 0.6); // 18
        setSection4BgX(interpolate(bg3.x, bgXEnd, bgEased));
        const bgYEnd = interpolate(bg3.y, 5, 0.6); // 9
        setSection4BgY(interpolate(bg3.y, bgYEnd, bgEased));
      } else {
        // Phase 3: Slight zoom in (60-100%)
        const phase3Progress = (progress34 - phase2End) / (phase3End - phase2End);
        const bgScaleEnd = interpolate(bg3.scale, 1.2, 0.6); // 1.32
        const bgEased = bgPhase3Ease(phase3Progress);
        setSection4BgScale(interpolate(bgScaleEnd, bg4.scale, bgEased));
        const bgXEnd = interpolate(bg3.x, 10, 0.6); // 18
        setSection4BgX(bgXEnd); // Fixed at 18
        const bgYEnd = interpolate(bg3.y, 5, 0.6); // 9
        setSection4BgY(bgYEnd); // Fixed at 9
      }
      
      // Couple animations
      const coupleStart34 = COUPLE_KEYFRAMES[3];
      const coupleScaleMid34 = 0.16;
      const coupleYMid34 = interpolate(coupleStart34.y, 12.5, 0.6);
      const coupleStart45 = COUPLE_KEYFRAMES[4];

      if (progress34 <= phase2End) {
        // Phase 1 & 2: Zoom out and center horizontally
        const zoomOutProgress = progress34 / phase2End;
        const coupleEased = couplePhase12Ease(zoomOutProgress);
        setSection4CoupleScale(
          interpolate(coupleStart34.scale, coupleScaleMid34, coupleEased)
        );
        setSection4CoupleY(
          interpolate(coupleStart34.y, coupleYMid34, coupleEased)
        );
      } else {
        // Phase 3: Zoom in and move down
        const phase3Progress = (progress34 - phase2End) / (phase3End - phase2End);
        const coupleEased = couplePhase3Ease(phase3Progress);
        setSection4CoupleScale(
          interpolate(coupleScaleMid34, coupleStart45.scale, coupleEased)
        );
        setSection4CoupleY(
          interpolate(coupleYMid34, coupleStart45.y, coupleEased)
        );
      }
      
      // Horizontal centering (Phase 1: 0-40%)
      const xProgress = Math.min(1, progress34 / phase1End);
      const xEased = easeSmoothBelok(xProgress);
      setSection4CoupleX(
        interpolate(coupleStart34.x, 0, xEased)
      );
      
      // Grass animations - config-driven: pose Section 3 -> pose Section 4
      if (grass3 && grass4) {
        const grassMidScale = interpolate(grass3.scale, grass4.scale, 0.5);
        const grassMidY = interpolate(grass3.y, grass4.y, 0.4);

        if (progress34 <= phase2End) {
          const grassProgress = progress34 / phase2End;
          const grassEased = grassPhase12Ease(grassProgress);
          setSection4GrassScale(
            interpolate(grass3.scale, grassMidScale, grassEased)
          );
          setSection4GrassY(
            interpolate(grass3.y, grassMidY, grassEased)
          );
        } else {
          const grassProgress = (progress34 - phase2End) / (phase3End - phase2End);
          const grassEased = grassPhase3Ease(grassProgress);
          setSection4GrassScale(
            interpolate(grassMidScale, grass4.scale, grassEased)
          );
          setSection4GrassY(
            interpolate(grassMidY, grass4.y, grassEased)
          );
        }

        const startOpacity = grass3.opacity ?? 1;
        const endOpacity = grass4.opacity ?? 1;
        const grassOpacityEased = easeInOutCubic(progress34);
        setSection4GrassOpacity(
          interpolate(startOpacity, endOpacity, grassOpacityEased)
        );
      }
      
      // Gradient and groom text fade out (0-30%)
      if (progress34 <= 0.3) {
        const fadeProgress = progress34 / 0.3;
        const fadeEased = easeInOutCubic(fadeProgress);
        setSection4GradientOpacity(interpolate(1, 0, fadeEased));
        setSection4GroomTextOpacity(interpolate(1, 0, fadeEased));
      } else {
        setSection4GradientOpacity(0);
        setSection4GroomTextOpacity(0);
      }
      
      // Cloud fade in + drop from top (50-95%)
      const cloudFadeStart34 = 0.5;
      const cloudFadeEnd34 = 0.95;
      const cloudMaxOpacity34 = 0.9;
      const cloudStartTop34 = -25; // mulai lebih tinggi di atas viewport
      const cloudEndTop34 = 5; // posisi akhir sedikit lebih ke atas
      const cloudStaticScale34 = 1.008; // ukuran tetap untuk cloud "Couple"

      if (progress34 <= cloudFadeStart34) {
        setSection4CloudOpacity(0);
        setSection4CloudScale(cloudStaticScale34);
        setSection4CloudTop(cloudStartTop34);
      } else if (progress34 <= cloudFadeEnd34) {
        const cloudProgress = (progress34 - cloudFadeStart34) / (cloudFadeEnd34 - cloudFadeStart34);
        const cloudEased = easeInOutCubic(cloudProgress);
        setSection4CloudOpacity(interpolate(0, cloudMaxOpacity34, cloudEased));
        setSection4CloudScale(cloudStaticScale34);
        setSection4CloudTop(interpolate(cloudStartTop34, cloudEndTop34, cloudEased));
      } else {
        setSection4CloudOpacity(cloudMaxOpacity34);
        setSection4CloudScale(cloudStaticScale34);
        setSection4CloudTop(cloudEndTop34);
      }

      // Hide Section 4 cloud once Section 5 starts controlling the old cloud
      if (clampedProgress >= 4) {
        setSection4CloudOpacity(0);
      }
      
      
      // Update section berdasarkan progress
      const newSection = progress34 >= 0.5 ? 4 : 3;
      if (newSection !== currentSectionRef.current) {
        currentSectionRef.current = newSection;
        onSectionChange?.(newSection);
        onOpeningChange?.(newSection === 4);
      }
    } else {
      // Pastikan Section 4 menggunakan nilai akhir Section 3 saat progress < 3
      // Section 3 akhir (progress23 = 1): bg3, couple(0.60, 150, 350)
      setSection4BgScale(bg3.scale);
      setSection4BgX(bg3.x);
      setSection4BgY(bg3.y);
      const coupleEndSection3 = COUPLE_KEYFRAMES[3];
      setSection4CoupleScale(coupleEndSection3.scale);
      setSection4CoupleX(coupleEndSection3.x);
      setSection4CoupleY(coupleEndSection3.y);
      if (grass3) {
        setSection4GrassScale(grass3.scale);
        setSection4GrassY(grass3.y);
        setSection4GrassOpacity(grass3.opacity ?? 1);
      }
      setSection4CloudOpacity(0);
      setSection4CloudScale(0.5);
      setSection4CloudTop(10);
      setSection4GradientOpacity(1);
      setSection4GroomTextOpacity(1);
    }
    
    // Handle transisi 4->5 (Section 4 -> Section 5) - SELALU dihitung untuk real-time drag
    // Berdasarkan CoupleFullSection4.framer.tsx dengan 2.5D parallax zoom out
    if (clampedProgress >= 4) {
      // Background: Zoom out with 2.5D parallax effect (pose Section 4 -> Section 5)
      const bgEased = easeOutQuart(progress45);
      setSection5BgScale(interpolate(bg4.scale, bg5.scale, bgEased));
      setSection5BgX(interpolate(bg4.x, bg5.x, bgEased));
      setSection5BgY(interpolate(bg4.y, bg5.y, bgEased));
      
      // Couple: Zoom out and move to bottom of screen
      const coupleEased = easeOutQuart(progress45);
      const coupleStart45 = COUPLE_KEYFRAMES[4];
      const coupleEnd45 = COUPLE_KEYFRAMES[5];
      setSection5CoupleScale(interpolate(coupleStart45.scale, COUPLE_KEYFRAMES[6].scale, coupleEased));
      setSection5CoupleY(interpolate(coupleStart45.y, coupleEnd45.y, coupleEased));
      setSection5CoupleX(interpolate(coupleStart45.x, coupleEnd45.x, coupleEased)); // Start and end centered
      
      // Grass: Continues and adjusts to couple's feet (pose Section 4 -> Section 5)
      if (grass4 && grass5) {
        const grassEased = easeOutQuart(progress45);
        setSection5GrassScale(
          interpolate(grass4.scale, grass5.scale, grassEased)
        );
        setSection5GrassY(
          interpolate(grass4.y, grass5.y, grassEased)
        );
        const startOpacity = grass4.opacity ?? 1;
        const endOpacity = grass5.opacity ?? 1;
        setSection5GrassOpacity(
          interpolate(startOpacity, endOpacity, grassEased)
        );
      }
      
      // Old Cloud: Fade out 0-30% (move back up while fading)
      const oldCloudStaticScale45 = 1.008;
      const oldCloudStartY45 = 0;
      const oldCloudEndY45 = -200;

      if (progress45 <= 0.3) {
        const fadeProgress = progress45 / 0.3;
        const fadeEased = easeInOutCubic(fadeProgress);
        setSection5OldCloudOpacity(interpolate(1, 0, fadeEased));
        setSection5OldCloudScale(oldCloudStaticScale45);
        setSection5OldCloudY(
          interpolate(oldCloudStartY45, oldCloudEndY45, fadeEased)
        );
      } else {
        setSection5OldCloudOpacity(0);
        setSection5OldCloudScale(oldCloudStaticScale45);
        setSection5OldCloudY(oldCloudEndY45);
      }
      
      // New Cloud: Fade in 40-80%
      const newCloudMaxOpacity45 = 0.9;

      if (progress45 <= 0.4) {
        setSection5NewCloudOpacity(0);
        setSection5NewCloudTop(-200);
      } else if (progress45 <= 0.8) {
        const fadeProgress = (progress45 - 0.4) / 0.4;
        const fadeEased = easeInOutCubic(fadeProgress);
        setSection5NewCloudOpacity(interpolate(0, newCloudMaxOpacity45, fadeEased));
        setSection5NewCloudTop(interpolate(-200, 0, fadeEased));
      } else {
        setSection5NewCloudOpacity(newCloudMaxOpacity45);
        setSection5NewCloudTop(0);
      }
      
      // Update section berdasarkan progress
      const newSection = progress45 >= 0.5 ? 5 : 4;
      if (newSection !== currentSectionRef.current) {
        currentSectionRef.current = newSection;
        onSectionChange?.(newSection);
        onOpeningChange?.(newSection === 5);
      }
    } else {
      // Pastikan Section 5 menggunakan nilai akhir Section 4 saat progress < 4
      setSection5BgScale(bg4.scale);
      setSection5BgX(bg4.x);
      setSection5BgY(bg4.y);
      const coupleEndSection4 = COUPLE_KEYFRAMES[4];
      setSection5CoupleScale(coupleEndSection4.scale);
      setSection5CoupleX(coupleEndSection4.x);
      setSection5CoupleY(coupleEndSection4.y);
      if (grass4) {
        setSection5GrassScale(grass4.scale);
        setSection5GrassY(grass4.y);
        setSection5GrassOpacity(grass4.opacity ?? 1);
      }
      setSection5OldCloudOpacity(1);
      setSection5OldCloudScale(1.008);
      setSection5OldCloudY(0);
      setSection5NewCloudOpacity(0);
      setSection5NewCloudTop(-200);
    }
    
    // Handle transisi 5->6 (Section 5 -> Section 6) - SELALU dihitung untuk real-time drag
    // Berdasarkan CoupleFullSection5.framer.tsx dengan continue zoom out
    if (clampedProgress >= 5) {
      // Background: Continue zoom out with 2.5D parallax effect
      const bgEased = easeOutQuart(progress56);
      setSection6BgScale(interpolate(bg5.scale, bg6.scale, bgEased));
      setSection6BgX(interpolate(bg5.x, bg6.x, bgEased));
      setSection6BgY(interpolate(bg5.y, bg6.y, bgEased));
      
      // Couple: Continue zoom out (camera moving back)
      const coupleEased = easeOutQuart(progress56);
      const coupleStart56 = COUPLE_KEYFRAMES[5];
      const coupleEnd56 = COUPLE_KEYFRAMES[6];
      setSection6CoupleScale(interpolate(coupleEnd56.scale, 0.1, coupleEased));
      setSection6CoupleY(interpolate(coupleStart56.y, coupleEnd56.y, coupleEased));
      setSection6CoupleX(interpolate(coupleStart56.x, coupleEnd56.x, coupleEased)); // Start and end centered
      
      // Grass: Continue adjusting with zoom out (pose Section 5 -> Section 6)
      if (grass5 && grass6) {
        const grassEased = easeOutQuart(progress56);
        setSection6GrassScale(
          interpolate(grass5.scale, grass6.scale, grassEased)
        );
        setSection6GrassY(
          interpolate(grass5.y, grass6.y, grassEased)
        );
        const startOpacity = grass5.opacity ?? 1;
        const endOpacity = grass6.opacity ?? 1;
        setSection6GrassOpacity(
          interpolate(startOpacity, endOpacity, grassEased)
        );
      }
      
      // New Cloud: Fade out 0-50%
      if (progress56 <= 0.5) {
        const fadeProgress = progress56 / 0.5;
        const fadeEased = easeInOutCubic(fadeProgress);
        setSection6NewCloudOpacity(interpolate(1, 0, fadeEased));
        setSection6NewCloudTop(interpolate(80, -20, fadeEased));
      } else {
        setSection6NewCloudOpacity(0);
        setSection6NewCloudTop(-20);
      }

      // Hide Section 5 new cloud once Section 6 is active, so only one cloud fades out
      setSection5NewCloudOpacity(0);

      // Update section berdasarkan progress
      const newSection = progress56 >= 0.5 ? 6 : 5;
      if (newSection !== currentSectionRef.current) {
        currentSectionRef.current = newSection;
        onSectionChange?.(newSection);
        onOpeningChange?.(newSection === 6);
      }
    } else {
      // Pastikan Section 6 menggunakan nilai akhir Section 5 saat progress < 5
      setSection6BgScale(bg5.scale);
      setSection6BgX(bg5.x);
      setSection6BgY(bg5.y);
      const coupleEndSection5 = COUPLE_KEYFRAMES[5];
      setSection6CoupleScale(coupleEndSection5.scale);
      setSection6CoupleX(coupleEndSection5.x);
      setSection6CoupleY(coupleEndSection5.y);
      if (grass5) {
        setSection6GrassScale(grass5.scale);
        setSection6GrassY(grass5.y);
        setSection6GrassOpacity(grass5.opacity ?? 1);
      }
      setSection6NewCloudOpacity(1);
      setSection6NewCloudTop(80);
    }
  }, [onSectionChange, onOpeningChange]);
  
  // Get current section from progress
  const getSectionFromProgress = useCallback((progress: number): number => {
    if (progress < 0.5) return 0;
    if (progress < 1.5) return 1;
    if (progress < 2.5) return 2;
    if (progress < 3.5) return 3;
    if (progress < 4.5) return 4;
    if (progress < 5.5) return 5;
    return 6;
  }, []);
  
  // Compose animation values
  const animationValues: SectionAnimationValues = {
    parallaxValues,
    section1Scale,
    section2WrapperScale,
    section2BgScale,
    section2BgX,
    section2BgY,
    section2CoupleScale,
    section2CoupleX,
    section2CoupleY,
    section2GrassScale,
    section2GrassY,
    section2GrassOpacity,
    section2CloudOpacity,
    section2CloudScale,
    section2CloudTop,
    section2TextOpacity,
    section3WrapperScale,
    section3BgScale,
    section3BgX,
    section3BgY,
    section3CoupleScale,
    section3CoupleX,
    section3CoupleY,
    section3GradientOpacity,
    section3BrideTextOpacity,
    section3GroomTextOpacity,
    section4WrapperScale,
    section4BgScale,
    section4BgX,
    section4BgY,
    section4CoupleScale,
    section4CoupleX,
    section4CoupleY,
    section4GrassScale,
    section4GrassY,
    section4GrassOpacity,
    section4CloudOpacity,
    section4CloudScale,
    section4CloudTop,
    section4GradientOpacity,
    section4GroomTextOpacity,
    section5WrapperScale,
    section5BgScale,
    section5BgX,
    section5BgY,
    section5CoupleScale,
    section5CoupleX,
    section5CoupleY,
    section5GrassScale,
    section5GrassY,
    section5GrassOpacity,
    section5OldCloudOpacity,
    section5OldCloudScale,
    section5OldCloudY,
    section5NewCloudOpacity,
    section5NewCloudTop,
    section6WrapperScale,
    section6BgScale,
    section6BgX,
    section6BgY,
    section6CoupleScale,
    section6CoupleX,
    section6CoupleY,
    section6GrassScale,
    section6GrassY,
    section6GrassOpacity,
    section6NewCloudOpacity,
    section6NewCloudTop,
  };
  
  return {
    animationValues,
    updateFromProgress,
    getSectionFromProgress,
  };
}

