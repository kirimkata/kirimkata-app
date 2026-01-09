'use client';

import { useState, useEffect, useRef } from 'react';
import type { SimpleAnimationConfig } from '@/config/animationConfig';
import { getTransitionConfig, getEasingFunction } from '@/config/animationConfig';

export interface UseSwipeGestureOptions {
  // Config
  animationConfig: SimpleAnimationConfig;
  dragSensitivity?: number;
  
  // State dari parent
  currentSection: number;
  hasOpenedOnce: boolean;
  
  // Callbacks
  onProgressChange: (progress: number) => void;
  onSectionChange?: (section: number) => void;
  onTransitionChange?: (isTransitioning: boolean) => void;
  onHasOpenedOnceChange?: (hasOpenedOnce: boolean) => void;
}

export interface UseSwipeGestureReturn {
  // State
  dragProgress: number;
  isDragging: boolean;
  velocity: number;
  
  // Handlers
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  
  // Programmatic control
  snapToSection: (targetSection: number) => void;
  setDragProgress: (progress: number) => void;
  interruptAnimation: () => void;
}

export function useSwipeGesture({
  animationConfig,
  dragSensitivity = animationConfig.dragSensitivity,
  currentSection,
  hasOpenedOnce,
  onProgressChange,
  onSectionChange,
  onTransitionChange,
  onHasOpenedOnceChange,
}: UseSwipeGestureOptions): UseSwipeGestureReturn {
  // State
  const [dragProgress, setDragProgressState] = useState(0); // 0 = Cover, 1 = Section 1, 2 = Section 2
  const [isDragging, setIsDragging] = useState(false);
  const [velocity, setVelocity] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Refs untuk tracking drag gesture
  const touchStartY = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  const mouseStartY = useRef<number | null>(null);
  const mouseIsDown = useRef(false);
  const lastY = useRef<number | null>(null);
  const lastTime = useRef<number | null>(null);
  const momentumAnimationRef = useRef<number | null>(null);
  const momentumTypeRef = useRef<'none' | 'physics' | 'snap'>('none');
  const preservedMomentumVelocityRef = useRef(0);
  const hasPreservedMomentumRef = useRef(false);
  const isMomentumPausedForNudgeRef = useRef(false);

  // Throttle drag progress updates to once per animation frame during drag
  const dragAnimationRef = useRef<number | null>(null);
  const pendingProgressRef = useRef<number | null>(null);
  const effectiveDragSensitivity = dragSensitivity ?? animationConfig.dragSensitivity;
  const lastAutoDirectionRef = useRef<0 | 1 | -1>(0);

  const springEasing = (t: number): number => {
    const clamped = t < 0 ? 0 : t > 1 ? 1 : t;
    return 1 - Math.exp(-6 * clamped) * (1 + 6 * clamped);
  };
  
  // Wrapper untuk setDragProgress yang juga trigger callback
  const setDragProgress = (progress: number) => {
    const clampedProgress = Math.max(0, Math.min(6, progress)); // Update max progress ke 6 untuk Section 6
    setDragProgressState(clampedProgress);
    onProgressChange(clampedProgress);
  };

  // Schedule drag progress update using requestAnimationFrame (untuk smooth 60fps)
  const scheduleDragProgressUpdate = (progress: number) => {
    const clampedProgress = Math.max(0, Math.min(6, progress));
    pendingProgressRef.current = clampedProgress;

    if (dragAnimationRef.current == null) {
      dragAnimationRef.current = requestAnimationFrame(() => {
        dragAnimationRef.current = null;
        if (pendingProgressRef.current != null) {
          setDragProgress(pendingProgressRef.current);
        }
      });
    }
  };
  
  // Hentikan semua animasi otomatis (momentum/snap) dan kembalikan kontrol ke user
  const interruptAnimation = () => {
    if (momentumAnimationRef.current != null) {
      cancelAnimationFrame(momentumAnimationRef.current);
      momentumAnimationRef.current = null;
    }
    if (dragAnimationRef.current != null) {
      cancelAnimationFrame(dragAnimationRef.current);
      dragAnimationRef.current = null;
    }
    momentumTypeRef.current = 'none';
    hasPreservedMomentumRef.current = false;
    preservedMomentumVelocityRef.current = 0;
    isMomentumPausedForNudgeRef.current = false;
    setIsTransitioning(false);
    onTransitionChange?.(false);
    setVelocity(0);
    lastAutoDirectionRef.current = 0;
  };

  const pauseMomentumForNudge = () => {
    if (
      momentumAnimationRef.current != null &&
      momentumTypeRef.current === 'physics' &&
      hasPreservedMomentumRef.current
    ) {
      cancelAnimationFrame(momentumAnimationRef.current);
      momentumAnimationRef.current = null;
      isMomentumPausedForNudgeRef.current = true;
      setIsTransitioning(false);
      onTransitionChange?.(false);
    }
  };
  
  // Helper: Get adjacent sections (hanya section yang berdekatan)
  const getAdjacentSections = (section: number): number[] => {
    if (section === 0) {
      // Saat belum pernah dibuka, Cover hanya bisa menuju Section 1.
      // Setelah pernah dibuka (hasOpenedOnce = true), Cover boleh snap
      // kembali ke 0 atau maju ke 1 tergantung arah dan progress.
      return hasOpenedOnce ? [0, 1] : [1];
    }
    if (section === 1) return [0, 1, 2]; // Section 1 bisa ke 0 atau 2
    if (section === 2) return [1, 2, 3]; // Section 2 bisa ke 1 atau 3
    if (section === 3) return [2, 3, 4]; // Section 3 bisa ke 2 atau 4
    if (section === 4) return [3, 4, 5]; // Section 4 bisa ke 3 atau 5
    if (section === 5) return [4, 5, 6]; // Section 5 bisa ke 4 atau 6
    if (section === 6) return [5, 6]; // Section 6 hanya bisa ke 5
    return [];
  };
  
  // Helper: Clamp target section ke adjacent sections saja
  const clampToAdjacentSection = (targetSection: number, currentSection: number): number => {
    const adjacentSections = getAdjacentSections(currentSection);
    // Jika target section adalah adjacent, gunakan target
    if (adjacentSections.includes(targetSection)) {
      return targetSection;
    }
    // Jika tidak, pilih section terdekat dari adjacent sections
    const distances = adjacentSections.map(s => Math.abs(s - targetSection));
    const minDistance = Math.min(...distances);
    const index = distances.indexOf(minDistance);
    return adjacentSections[index];
  };
  
  // Snap ke section terdekat (atau ke target section tertentu) berbasis progress saat ini
  // DIBATASI: Hanya bisa snap ke section yang adjacent (berdekatan)
  const snapToNearest = (
    startProgress: number,
    forcedTargetSection?: number,
    sourceSectionOverride?: number,
    useSpring?: boolean
  ) => {
    const sourceSection =
      typeof sourceSectionOverride === 'number' ? sourceSectionOverride : currentSection;

    // Tentukan target section
    let targetSection: number;
    if (typeof forcedTargetSection === 'number') {
      // Clamp ke adjacent section jika forced target tidak adjacent
      targetSection = clampToAdjacentSection(forcedTargetSection, sourceSection);
    } else {
      // Snap ke nearest section berdasarkan progress
      if (startProgress < 0.5) {
        targetSection = 0;
      } else if (startProgress < 1.5) {
        targetSection = 1;
      } else if (startProgress < 2.5) {
        targetSection = 2;
      } else if (startProgress < 3.5) {
        targetSection = 3;
      } else if (startProgress < 4.5) {
        targetSection = 4;
      } else if (startProgress < 5.5) {
        targetSection = 5;
      } else {
        targetSection = 6;
      }
      // Clamp ke adjacent section
      targetSection = clampToAdjacentSection(targetSection, sourceSection);
    }

    // Mapping section -> progress (0, 1, 2, ...)
    const targetProgress = targetSection;

    // Dapatkan config transisi dari section saat ini ke target section
    const primaryConfig = getTransitionConfig(
      animationConfig,
      sourceSection,
      targetSection
    );

    let duration: number;
    let easingFunction: (t: number) => number;

    if (primaryConfig) {
      // Config transisi langsung tersedia
      duration = primaryConfig.duration;
      easingFunction = getEasingFunction(primaryConfig);
    } else {
      // Fallback: jika tidak ada config (misalnya 0 -> 0),
      // gunakan config transisi 1 -> 0 supaya durasi konsisten
      // untuk semua gerakan yang secara visual terasa seperti kembali
      // dari Section 1 ke Section 0.
      let fallbackConfig = null;

      if (sourceSection === 0 && targetSection === 0) {
        fallbackConfig = getTransitionConfig(animationConfig, 1, 0);
      }

      if (fallbackConfig) {
        duration = fallbackConfig.duration;
        easingFunction = getEasingFunction(fallbackConfig);
      } else {
        // Fallback terakhir ke default value
        duration = 400;
        easingFunction = (t: number) => 1 - Math.pow(1 - t, 3);
      }
    }
    
    if (useSpring) {
      easingFunction = springEasing;
    }

    const delta = targetProgress - startProgress;
    const autoDirection: 0 | 1 | -1 = delta === 0 ? 0 : delta > 0 ? 1 : -1;
    lastAutoDirectionRef.current = autoDirection;
    
    const startTime = Date.now();
    
    setIsTransitioning(true);
    onTransitionChange?.(true);
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      
      const eased = easingFunction(t);
      const currentProgress = startProgress + (targetProgress - startProgress) * eased;
      
      setDragProgress(currentProgress);
      
      // Update section jika diperlukan
      if (onSectionChange) {
        if (currentProgress >= 1 && currentSection < 1) {
          onSectionChange(1);
        } else if (currentProgress >= 2 && currentSection < 2) {
          onSectionChange(2);
        } else if (currentProgress < 1 && currentSection > 0) {
          onSectionChange(0);
        } else if (currentProgress < 2 && currentSection > 1) {
          onSectionChange(1);
        }
      }
      
      if (t < 1) {
        momentumAnimationRef.current = requestAnimationFrame(animate);
      } else {
        // Finalize
        setDragProgress(targetProgress);
        setIsTransitioning(false);
        onTransitionChange?.(false);
        setVelocity(0);
        lastAutoDirectionRef.current = 0;
        momentumTypeRef.current = 'none';
        
        if (targetProgress >= 1) {
          onHasOpenedOnceChange?.(true);
        }
      }
    };
    
    momentumTypeRef.current = 'snap';
    momentumAnimationRef.current = requestAnimationFrame(animate);
  };
  
  // Momentum animation - DIBATASI: Tidak bisa melewati section
  const startMomentum = (initialVelocity: number) => {
    let currentVelocity = initialVelocity;
    let currentProgress = dragProgress;
    preservedMomentumVelocityRef.current = initialVelocity;
    hasPreservedMomentumRef.current = true;
    isMomentumPausedForNudgeRef.current = false;
    
    // Tentukan batas progress berdasarkan current section
    const getProgressBounds = (section: number): { min: number; max: number } => {
      if (section === 0) return { min: 0, max: 1 }; // Section 0: progress 0-1
      if (section === 1) return { min: 0, max: 2 }; // Section 1: progress 0-2 (bisa ke 0 atau 2)
      if (section === 2) return { min: 1, max: 3 }; // Section 2: progress 1-3 (bisa ke 1 atau 3)
      if (section === 3) return { min: 2, max: 4 }; // Section 3: progress 2-4 (bisa ke 2 atau 4)
      if (section === 4) return { min: 3, max: 5 }; // Section 4: progress 3-5 (bisa ke 3 atau 5)
      if (section === 5) return { min: 4, max: 6 }; // Section 5: progress 4-6 (bisa ke 4 atau 6)
      if (section === 6) return { min: 5, max: 6 }; // Section 6: progress 5-6
      return { min: 0, max: 6 };
    };
    
    const bounds = getProgressBounds(currentSection);

    const autoDirection: 0 | 1 | -1 = initialVelocity === 0 ? 0 : initialVelocity > 0 ? 1 : -1;
    lastAutoDirectionRef.current = autoDirection;
    
    const animate = () => {
      // Apply friction dari config
      currentVelocity *= animationConfig.momentum.friction;
      preservedMomentumVelocityRef.current = currentVelocity;
      currentProgress += currentVelocity;
      
      // Clamp progress berdasarkan current section (tidak bisa melewati)
      if (currentProgress <= bounds.min) {
        currentProgress = bounds.min;
        currentVelocity = 0;
      } else if (currentProgress >= bounds.max) {
        currentProgress = bounds.max;
        currentVelocity = 0;
      }
    
      setDragProgress(currentProgress);
      
      // Continue momentum jika masih ada velocity
      if (Math.abs(currentVelocity) > animationConfig.momentum.minVelocity) {
        momentumAnimationRef.current = requestAnimationFrame(animate);
      } else {
        // Snap ke nearest section (dibatasi ke adjacent)
        hasPreservedMomentumRef.current = false;
        preservedMomentumVelocityRef.current = 0;
        isMomentumPausedForNudgeRef.current = false;
        momentumTypeRef.current = 'none';
        snapToNearest(currentProgress);
        lastAutoDirectionRef.current = 0;
      }
    };
    
    momentumTypeRef.current = 'physics';
    momentumAnimationRef.current = requestAnimationFrame(animate);
  };
  
  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    // Hanya aktif jika sudah pernah buka atau di section 1/2
    if (!hasOpenedOnce && currentSection === 0) return;
    
    // Cancel semua animasi otomatis (momentum/snap) sehingga user bisa intervensi
    const isPhysicsMomentumRunning =
      momentumTypeRef.current === 'physics' &&
      momentumAnimationRef.current != null &&
      hasPreservedMomentumRef.current;
    if (isPhysicsMomentumRunning) {
      pauseMomentumForNudge();
    } else {
      interruptAnimation();
    }
    
    const now = Date.now();
    touchStartY.current = e.targetTouches[0].clientY;
    lastY.current = touchStartY.current;
    lastTime.current = now;
    setIsDragging(true);
    setIsTransitioning(false);
    onTransitionChange?.(false);
    setVelocity(0);
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !touchStartY.current || !lastY.current || !lastTime.current) return;
    
    const currentY = e.touches[0].clientY;
    const currentTime = Date.now();
    const deltaY = lastY.current - currentY; // Positive = up
    const deltaTime = currentTime - lastTime.current;
    
    // Calculate velocity (px/ms)
    const currentVelocity = deltaTime > 0 ? deltaY / deltaTime : 0;
    setVelocity(currentVelocity);
    
    // Update progress based on drag - DIBATASI: Tidak bisa melewati section
    const viewportHeight = window.innerHeight || 1;
    const progressDelta = (deltaY / viewportHeight) * effectiveDragSensitivity;
    let newProgress = dragProgress + progressDelta;
    
    // Clamp progress berdasarkan current section (tidak bisa melewati)
    if (currentSection === 0) {
      newProgress = Math.max(0, Math.min(1, newProgress)); // Section 0: hanya bisa ke 1
    } else if (currentSection === 1) {
      newProgress = Math.max(0, Math.min(2, newProgress)); // Section 1: bisa ke 0 atau 2
    } else if (currentSection === 2) {
      newProgress = Math.max(1, Math.min(3, newProgress)); // Section 2: bisa ke 1 atau 3
    } else if (currentSection === 3) {
      newProgress = Math.max(2, Math.min(4, newProgress)); // Section 3: bisa ke 2 atau 4
    } else if (currentSection === 4) {
      newProgress = Math.max(3, Math.min(5, newProgress)); // Section 4: bisa ke 3 atau 5
    } else if (currentSection === 5) {
      newProgress = Math.max(4, Math.min(6, newProgress)); // Section 5: bisa ke 4 atau 6
    } else if (currentSection === 6) {
      newProgress = Math.max(5, Math.min(6, newProgress)); // Section 6: hanya bisa ke 5
    } else {
      newProgress = Math.max(0, Math.min(6, newProgress)); // Fallback
    }
    
    // Gunakan requestAnimationFrame untuk update progress agar lebih halus
    scheduleDragProgressUpdate(newProgress);
    
    lastY.current = currentY;
    lastTime.current = currentTime;
  };
  
  const onTouchEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);

    // Bersihkan pending drag animation frame jika ada
    if (dragAnimationRef.current) {
      cancelAnimationFrame(dragAnimationRef.current);
      dragAnimationRef.current = null;
    }
    
    // Hitung total distance untuk fling detection
    const swipeDistance = touchStartY.current && lastY.current 
      ? touchStartY.current - lastY.current 
      : 0; // Positive = swipe up, Negative = swipe down
    
    const viewportHeight = window.innerHeight;
    const swipeDistanceRatio = viewportHeight > 0 ? Math.abs(swipeDistance) / viewportHeight : 0;
    const minSwipeDistanceRatio = animationConfig.swipeDistanceThresholdRatio;

    // Deteksi arah swipe
    const isSwipeUp = swipeDistance > 0;
    const isSwipeDown = swipeDistance < 0;
    
    const isStrongSwipe = swipeDistanceRatio >= minSwipeDistanceRatio;

    const swipeDir: 0 | 1 | -1 = isSwipeUp ? 1 : isSwipeDown ? -1 : 0;
    const shouldUseSpring =
      lastAutoDirectionRef.current !== 0 &&
      swipeDir !== 0 &&
      swipeDir !== lastAutoDirectionRef.current;

    const hadPausedMomentumForNudge =
      isMomentumPausedForNudgeRef.current && hasPreservedMomentumRef.current;

    if (hadPausedMomentumForNudge) {
      const preservedVelocity = preservedMomentumVelocityRef.current;
      isMomentumPausedForNudgeRef.current = false;

      if (!isStrongSwipe) {
        if (Math.abs(preservedVelocity) > animationConfig.momentum.minVelocity) {
          const resumeBoost = 1.05;
          const resumeVelocity = preservedVelocity * resumeBoost;
          startMomentum(resumeVelocity);
        } else {
          hasPreservedMomentumRef.current = false;
          preservedMomentumVelocityRef.current = 0;
          snapToNearest(dragProgress, undefined, undefined, shouldUseSpring);
        }

        touchStartY.current = null;
        touchEndY.current = null;
        lastY.current = null;
        lastTime.current = null;
        return;
      }

      hasPreservedMomentumRef.current = false;
      preservedMomentumVelocityRef.current = 0;
    }

    hasPreservedMomentumRef.current = false;
    preservedMomentumVelocityRef.current = 0;
    isMomentumPausedForNudgeRef.current = false;

    // Logika: hanya arah yang valid yang akan trigger
    if (isStrongSwipe) {
      if (currentSection === 0 && hasOpenedOnce) {
        // Di Section 0: hanya swipe UP yang valid (ke Section 1)
        if (isSwipeUp) {
          onHasOpenedOnceChange?.(true);
          const isNearSection1 = dragProgress > 0.9;
          if (isNearSection1) {
            snapToNearest(dragProgress, 2, 1, shouldUseSpring);
          } else {
            snapToNearest(dragProgress, 1, undefined, shouldUseSpring);
          }
        } else {
          snapToNearest(dragProgress, 0, undefined, shouldUseSpring);
        }
      } else if (currentSection === 1) {
        // Di Section 1: swipe UP ke Section 2, swipe DOWN ke Section 0
        if (isSwipeUp) {
          // Swipe up dari section 1 -> ke section 2 (dengan opsi lanjut ke 3 jika sudah >90% ke 2)
          const nextBoundary = 2;
          const isNearNext = dragProgress > nextBoundary - 0.1;
          if (isNearNext && 1 + 2 <= 6) {
            snapToNearest(dragProgress, 3, 2, shouldUseSpring);
          } else {
            snapToNearest(dragProgress, 2, undefined, shouldUseSpring);
          }
        } else if (isSwipeDown) {
          // Swipe down dari section 1 -> ke section 0
          snapToNearest(dragProgress, 0, undefined, shouldUseSpring);
        } else {
          // Tidak ada arah yang jelas, snap berdasarkan progress
          snapToNearest(dragProgress, undefined, undefined, shouldUseSpring);
        }
      } else if (currentSection === 2) {
        // Di Section 2: swipe UP ke Section 3, swipe DOWN ke Section 1
        if (isSwipeUp) {
          // Swipe up dari section 2 -> ke section 3 (dengan opsi lanjut ke 4 jika sudah >90% ke 3)
          const nextBoundary = 3;
          const isNearNext = dragProgress > nextBoundary - 0.1;
          if (isNearNext && 2 + 2 <= 6) {
            snapToNearest(dragProgress, 4, 3, shouldUseSpring);
          } else {
            snapToNearest(dragProgress, 3, undefined, shouldUseSpring);
          }
        } else if (isSwipeDown) {
          // Swipe down dari section 2 -> ke section 1 (dengan opsi lanjut ke 0 jika sudah >90% ke 1)
          const prevBoundary = 1;
          const isNearPrev = dragProgress < prevBoundary + 0.1;
          if (isNearPrev && 2 - 2 >= 0) {
            snapToNearest(dragProgress, 0, 1, shouldUseSpring);
          } else {
            snapToNearest(dragProgress, 1, undefined, shouldUseSpring);
          }
        } else {
          // Tidak ada arah yang jelas, snap berdasarkan progress
          snapToNearest(dragProgress, undefined, undefined, shouldUseSpring);
        }
      } else if (currentSection === 3) {
        // Di Section 3: swipe UP ke Section 4, swipe DOWN ke Section 2
        if (isSwipeUp) {
          // Swipe up dari section 3 -> ke section 4 (dengan opsi lanjut ke 5 jika sudah >90% ke 4)
          const nextBoundary = 4;
          const isNearNext = dragProgress > nextBoundary - 0.1;
          if (isNearNext && 3 + 2 <= 6) {
            snapToNearest(dragProgress, 5, 4, shouldUseSpring);
          } else {
            snapToNearest(dragProgress, 4, undefined, shouldUseSpring);
          }
        } else if (isSwipeDown) {
          // Swipe down dari section 3 -> ke section 2 (dengan opsi lanjut ke 1 jika sudah >90% ke 2)
          const prevBoundary = 2;
          const isNearPrev = dragProgress < prevBoundary + 0.1;
          if (isNearPrev && 3 - 2 >= 0) {
            snapToNearest(dragProgress, 1, 2, shouldUseSpring);
          } else {
            snapToNearest(dragProgress, 2, undefined, shouldUseSpring);
          }
        } else {
          // Tidak ada arah yang jelas, snap berdasarkan progress
          snapToNearest(dragProgress, undefined, undefined, shouldUseSpring);
        }
      } else if (currentSection === 4) {
        // Di Section 4: swipe UP ke Section 5, swipe DOWN ke Section 3
        if (isSwipeUp) {
          // Swipe up dari section 4 -> ke section 5 (dengan opsi lanjut ke 6 jika sudah >90% ke 5)
          const nextBoundary = 5;
          const isNearNext = dragProgress > nextBoundary - 0.1;
          if (isNearNext && 4 + 2 <= 6) {
            snapToNearest(dragProgress, 6, 5, shouldUseSpring);
          } else {
            snapToNearest(dragProgress, 5, undefined, shouldUseSpring);
          }
        } else if (isSwipeDown) {
          // Swipe down dari section 4 -> ke section 3 (dengan opsi lanjut ke 2 jika sudah >90% ke 3)
          const prevBoundary = 3;
          const isNearPrev = dragProgress < prevBoundary + 0.1;
          if (isNearPrev && 4 - 2 >= 0) {
            snapToNearest(dragProgress, 2, 3, shouldUseSpring);
          } else {
            snapToNearest(dragProgress, 3, undefined, shouldUseSpring);
          }
        } else {
          // Tidak ada arah yang jelas, snap berdasarkan progress
          snapToNearest(dragProgress, undefined, undefined, shouldUseSpring);
        }
      } else if (currentSection === 5) {
        // Di Section 5: swipe UP ke Section 6, swipe DOWN ke Section 4
        if (isSwipeUp) {
          // Swipe up dari section 5 -> ke section 6 (tidak ada section 7 dalam swipe gesture)
          snapToNearest(dragProgress, 6, undefined, shouldUseSpring);
        } else if (isSwipeDown) {
          // Swipe down dari section 5 -> ke section 4 (dengan opsi lanjut ke 3 jika sudah >90% ke 4)
          const prevBoundary = 4;
          const isNearPrev = dragProgress < prevBoundary + 0.1;
          if (isNearPrev && 5 - 2 >= 0) {
            snapToNearest(dragProgress, 3, 4, shouldUseSpring);
          } else {
            snapToNearest(dragProgress, 4, undefined, shouldUseSpring);
          }
        } else {
          // Tidak ada arah yang jelas, snap berdasarkan progress
          snapToNearest(dragProgress, undefined, undefined, shouldUseSpring);
        }
      } else if (currentSection === 6) {
        // Di Section 6: hanya swipe DOWN yang valid (ke Section 5)
        if (isSwipeDown) {
          snapToNearest(dragProgress, 5, undefined, shouldUseSpring);
        } else {
          snapToNearest(dragProgress, 6, undefined, shouldUseSpring);
        }
      } else if (Math.abs(velocity) > 0.001) {
        // Ada velocity tapi tidak di section yang valid, gunakan momentum
        const velocityPerFrame = (velocity * 16.67) / viewportHeight;
        startMomentum(velocityPerFrame);
      } else {
        // Fallback: snap berdasarkan progress
        snapToNearest(dragProgress, undefined, undefined, shouldUseSpring);
      }
    } else {
      // Swipe terlalu kecil: fallback ke snap berdasarkan progress saja
      snapToNearest(dragProgress, undefined, undefined, shouldUseSpring);
    }
    
    touchStartY.current = null;
    touchEndY.current = null;
    lastY.current = null;
    lastTime.current = null;
  };
  
  // Mouse handlers untuk desktop
  const onMouseDown = (e: React.MouseEvent) => {
    // Hanya aktif jika sudah pernah buka atau di section 1/2
    if (!hasOpenedOnce && currentSection === 0) return;
    
    // Cancel semua animasi otomatis (momentum/snap) sehingga user bisa intervensi
    const isPhysicsMomentumRunning =
      momentumTypeRef.current === 'physics' &&
      momentumAnimationRef.current != null &&
      hasPreservedMomentumRef.current;
    if (isPhysicsMomentumRunning) {
      pauseMomentumForNudge();
    } else {
      interruptAnimation();
    }
    
    const now = Date.now();
    mouseIsDown.current = true;
    mouseStartY.current = e.clientY;
    lastY.current = e.clientY;
    lastTime.current = now;
    setIsDragging(true);
    setIsTransitioning(false);
    onTransitionChange?.(false);
    setVelocity(0);
  };
  
  const onMouseMove = (e: React.MouseEvent) => {
    if (!mouseIsDown.current || !isDragging || !lastY.current || !lastTime.current) return;
    
    // Prevent default behavior
    if (e.cancelable) {
      e.preventDefault();
    }
    
    const currentY = e.clientY;
    const currentTime = Date.now();
    const deltaY = lastY.current - currentY; // Positive = up
    const deltaTime = currentTime - lastTime.current;
    
    // Calculate velocity (px/ms)
    const currentVelocity = deltaTime > 0 ? deltaY / deltaTime : 0;
    setVelocity(currentVelocity);
    
    // Update progress based on drag - DIBATASI: Tidak bisa melewati section
    const viewportHeight = window.innerHeight || 1;
    const progressDelta = (deltaY / viewportHeight) * effectiveDragSensitivity;
    let newProgress = dragProgress + progressDelta;
    
    // Clamp progress berdasarkan current section (tidak bisa melewati)
    if (currentSection === 0) {
      newProgress = Math.max(0, Math.min(1, newProgress)); // Section 0: hanya bisa ke 1
    } else if (currentSection === 1) {
      newProgress = Math.max(0, Math.min(2, newProgress)); // Section 1: bisa ke 0 atau 2
    } else if (currentSection === 2) {
      newProgress = Math.max(1, Math.min(3, newProgress)); // Section 2: bisa ke 1 atau 3
    } else if (currentSection === 3) {
      newProgress = Math.max(2, Math.min(4, newProgress)); // Section 3: bisa ke 2 atau 4
    } else if (currentSection === 4) {
      newProgress = Math.max(3, Math.min(5, newProgress)); // Section 4: bisa ke 3 atau 5
    } else if (currentSection === 5) {
      newProgress = Math.max(4, Math.min(6, newProgress)); // Section 5: bisa ke 4 atau 6
    } else if (currentSection === 6) {
      newProgress = Math.max(5, Math.min(6, newProgress)); // Section 6: hanya bisa ke 5
    } else {
      newProgress = Math.max(0, Math.min(6, newProgress)); // Fallback
    }
    
    scheduleDragProgressUpdate(newProgress);
    
    lastY.current = currentY;
    lastTime.current = currentTime;
  };
  
  const onMouseUp = (e: React.MouseEvent) => {
    if (!mouseIsDown.current || !isDragging) {
      mouseIsDown.current = false;
      return;
    }
    
    setIsDragging(false);
    mouseIsDown.current = false;
    
    // Hitung total distance untuk fling detection
    const swipeDistance = mouseStartY.current && lastY.current 
      ? mouseStartY.current - lastY.current 
      : 0; // Positive = drag up, Negative = drag down
    
    const viewportHeight = window.innerHeight;
    const swipeDistanceRatio = viewportHeight > 0 ? Math.abs(swipeDistance) / viewportHeight : 0;
    const minSwipeDistanceRatio = animationConfig.swipeDistanceThresholdRatio;

    // Deteksi arah swipe
    const isSwipeUp = swipeDistance > 0;
    const isSwipeDown = swipeDistance < 0;
    
    const isStrongSwipe = swipeDistanceRatio >= minSwipeDistanceRatio;

    const swipeDir: 0 | 1 | -1 = isSwipeUp ? 1 : isSwipeDown ? -1 : 0;
    const shouldUseSpring =
      lastAutoDirectionRef.current !== 0 &&
      swipeDir !== 0 &&
      swipeDir !== lastAutoDirectionRef.current;

    // Logika: hanya arah yang valid yang akan trigger
    if (isStrongSwipe) {
      if (currentSection === 0 && hasOpenedOnce) {
        // Di Section 0: hanya swipe UP yang valid (ke Section 1)
        if (isSwipeUp) {
          onHasOpenedOnceChange?.(true);
          const isNearSection1 = dragProgress > 0.9;
          if (isNearSection1) {
            snapToNearest(dragProgress, 2, 1, shouldUseSpring);
          } else {
            snapToNearest(dragProgress, 1, undefined, shouldUseSpring);
          }
        } else {
          snapToNearest(dragProgress, 0, undefined, shouldUseSpring);
        }
      } else if (currentSection === 1) {
        // Di Section 1: swipe UP ke Section 2, swipe DOWN ke Section 0
        if (isSwipeUp) {
          // Swipe up dari section 1 -> ke section 2 (dengan opsi lanjut ke 3 jika sudah >90% ke 2)
          const nextBoundary = 2;
          const isNearNext = dragProgress > nextBoundary - 0.1;
          if (isNearNext && 1 + 2 <= 6) {
            snapToNearest(dragProgress, 3, 2);
          } else {
            snapToNearest(dragProgress, 2);
          }
        } else if (isSwipeDown) {
          // Swipe down dari section 1 -> ke section 0
          snapToNearest(dragProgress, 0);
        } else {
          // Tidak ada arah yang jelas, snap berdasarkan progress
          snapToNearest(dragProgress);
        }
      } else if (currentSection === 2) {
        // Di Section 2: swipe UP ke Section 3, swipe DOWN ke Section 1
        if (isSwipeUp) {
          // Swipe up dari section 2 -> ke section 3 (dengan opsi lanjut ke 4 jika sudah >90% ke 3)
          const nextBoundary = 3;
          const isNearNext = dragProgress > nextBoundary - 0.1;
          if (isNearNext && 2 + 2 <= 6) {
            snapToNearest(dragProgress, 4, 3);
          } else {
            snapToNearest(dragProgress, 3);
          }
        } else if (isSwipeDown) {
          // Swipe down dari section 2 -> ke section 1 (dengan opsi lanjut ke 0 jika sudah >90% ke 1)
          const prevBoundary = 1;
          const isNearPrev = dragProgress < prevBoundary + 0.1;
          if (isNearPrev && 2 - 2 >= 0) {
            snapToNearest(dragProgress, 0, 1);
          } else {
            snapToNearest(dragProgress, 1);
          }
        } else {
          // Tidak ada arah yang jelas, snap berdasarkan progress
          snapToNearest(dragProgress);
        }
      } else if (currentSection === 3) {
        // Di Section 3: swipe UP ke Section 4, swipe DOWN ke Section 2
        if (isSwipeUp) {
          // Swipe up dari section 3 -> ke section 4 (dengan opsi lanjut ke 5 jika sudah >90% ke 4)
          const nextBoundary = 4;
          const isNearNext = dragProgress > nextBoundary - 0.1;
          if (isNearNext && 3 + 2 <= 6) {
            snapToNearest(dragProgress, 5, 4);
          } else {
            snapToNearest(dragProgress, 4);
          }
        } else if (isSwipeDown) {
          // Swipe down dari section 3 -> ke section 2 (dengan opsi lanjut ke 1 jika sudah >90% ke 2)
          const prevBoundary = 2;
          const isNearPrev = dragProgress < prevBoundary + 0.1;
          if (isNearPrev && 3 - 2 >= 0) {
            snapToNearest(dragProgress, 1, 2);
          } else {
            snapToNearest(dragProgress, 2);
          }
        } else {
          // Tidak ada arah yang jelas, snap berdasarkan progress
          snapToNearest(dragProgress);
        }
      } else if (currentSection === 4) {
        // Di Section 4: swipe UP ke Section 5, swipe DOWN ke Section 3
        if (isSwipeUp) {
          // Swipe up dari section 4 -> ke section 5 (dengan opsi lanjut ke 6 jika sudah >90% ke 5)
          const nextBoundary = 5;
          const isNearNext = dragProgress > nextBoundary - 0.1;
          if (isNearNext && 4 + 2 <= 6) {
            snapToNearest(dragProgress, 6, 5);
          } else {
            snapToNearest(dragProgress, 5);
          }
        } else if (isSwipeDown) {
          // Swipe down dari section 4 -> ke section 3 (dengan opsi lanjut ke 2 jika sudah >90% ke 3)
          const prevBoundary = 3;
          const isNearPrev = dragProgress < prevBoundary + 0.1;
          if (isNearPrev && 4 - 2 >= 0) {
            snapToNearest(dragProgress, 2, 3);
          } else {
            snapToNearest(dragProgress, 3);
          }
        } else {
          // Tidak ada arah yang jelas, snap berdasarkan progress
          snapToNearest(dragProgress);
        }
      } else if (currentSection === 5) {
        // Di Section 5: swipe UP ke Section 6, swipe DOWN ke Section 4
        if (isSwipeUp) {
          // Swipe up dari section 5 -> ke section 6 (tidak ada section 7 dalam swipe gesture)
          snapToNearest(dragProgress, 6);
        } else if (isSwipeDown) {
          // Swipe down dari section 5 -> ke section 4 (dengan opsi lanjut ke 3 jika sudah >90% ke 4)
          const prevBoundary = 4;
          const isNearPrev = dragProgress < prevBoundary + 0.1;
          if (isNearPrev && 5 - 2 >= 0) {
            snapToNearest(dragProgress, 3, 4, shouldUseSpring);
          } else {
            snapToNearest(dragProgress, 4, undefined, shouldUseSpring);
          }
        } else {
          // Tidak ada arah yang jelas, snap berdasarkan progress
          snapToNearest(dragProgress, undefined, undefined, shouldUseSpring);
        }
      } else if (currentSection === 6) {
        // Di Section 6: hanya swipe DOWN yang valid (ke Section 5)
        if (isSwipeDown) {
          snapToNearest(dragProgress, 5, undefined, shouldUseSpring);
        } else {
          snapToNearest(dragProgress, 6, undefined, shouldUseSpring);
        }
      } else if (Math.abs(velocity) > 0.001) {
        // Ada velocity tapi tidak di section yang valid, gunakan momentum
        const velocityPerFrame = (velocity * 16.67) / viewportHeight;
        startMomentum(velocityPerFrame);
      } else {
        // Fallback: snap berdasarkan progress
        snapToNearest(dragProgress, undefined, undefined, shouldUseSpring);
      }
    } else {
      // Swipe terlalu kecil: fallback ke snap berdasarkan progress saja
      snapToNearest(dragProgress, undefined, undefined, shouldUseSpring);
    }
    
    mouseStartY.current = null;
    lastY.current = null;
    lastTime.current = null;
  };
  
  // Programmatic control
  const snapToSection = (targetSection: number) => {
    if (isDragging) return;
    snapToNearest(dragProgress, targetSection);
  };
  
  // Cleanup on unmount
  useEffect(() => {
    const momentumRef = momentumAnimationRef.current;
    
    return () => {
      if (momentumRef) {
        cancelAnimationFrame(momentumRef);
      }
    };
  }, []);
  
  return {
    dragProgress,
    isDragging,
    velocity,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    snapToSection,
    setDragProgress,
    interruptAnimation,
  };
}

