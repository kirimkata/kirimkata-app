'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import NextImage from 'next/image';
import { animationConfig } from '@/themes/parallax/parallax-template1/config/animationConfig';
import { getAssetManifest, type AssetResource } from '@/themes/parallax/parallax-template1/config/assetManifest';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useSectionAnimation } from '@/hooks/useSectionAnimation';
import Section0 from './animation-page/section0';
import Section1 from './animation-page/section1';
import Section2 from './animation-page/section2';
import Section3 from './animation-page/section3';
import Section4 from './animation-page/section4';
import Section5 from './animation-page/section5';
import Section6 from './animation-page/section6';
import ParallaxScene from './animation-page/parallax-scene';
import ScrollableContent from '@/features/content/general/layouts/ScrollableContent';
import SwipeUpHint from '@/features/shared/SwipeUpHint';
import { LoadingOverlayGeneral, LoadingOverlayCustom1 } from '@/features/shared/loading-overlays';
import { useInvitationContent } from '@/lib/contexts/InvitationContentContext';
import type { LoadingDesignType } from '@/themes/types';

interface InvitationParallaxProps {
  clientSlug: string;
  guestName?: string;
  loadingDesign?: LoadingDesignType; // Optional: override from theme configuration
  enableCoverGate?: boolean;
}

export default function InvitationParallax({
  clientSlug,
  guestName,
  loadingDesign: themeLoadingDesign,
  enableCoverGate = true,
}: InvitationParallaxProps) {
  // Get invitation content from context (if available)
  const invitationContent = useInvitationContent();

  // Determine loading design type with priority:
  // 1. Client profile loadingDesign (from database or mock)
  // 2. Theme-level loadingDesign (passed as prop)
  // 3. Default to 'general'
  const loadingDesign: LoadingDesignType =
    (invitationContent?.clientProfile?.loadingDesign as LoadingDesignType) ??
    themeLoadingDesign ??
    'general';

  // Get bride & groom names for custom loading overlay
  const brideGroomNames =
    invitationContent?.bride?.name && invitationContent?.groom?.name
      ? `${invitationContent.bride.name} & ${invitationContent.groom.name}`
      : (invitationContent?.clientProfile?.coupleNames ?? 'Bride & Groom');

  // State management
  const [currentSection, setCurrentSection] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(true); // Set to true to disable password screen
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isMusicPortalMounted, setIsMusicPortalMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isAssetsReady, setIsAssetsReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [hasTriggeredLoader, setHasTriggeredLoader] = useState(true); // Start loading immediately
  const [hasMinimumLoaderElapsed, setHasMinimumLoaderElapsed] = useState(false);

  // Animation hook - handles all animation values based on progress
  const { animationValues, updateFromProgress, getSectionFromProgress } = useSectionAnimation({
    onSectionChange: setCurrentSection,
    onOpeningChange: setIsOpening,
  });

  // Swipe gesture hook - handles all swipe/momentum/snap logic
  const {
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
  } = useSwipeGesture({
    animationConfig,
    currentSection,
    hasOpenedOnce,
    onProgressChange: updateFromProgress,
    onSectionChange: setCurrentSection,
    onTransitionChange: setIsTransitioning,
    onHasOpenedOnceChange: setHasOpenedOnce,
  });

  useEffect(() => {
    let isCancelled = false;
    const manifest = getAssetManifest();
    const total = manifest.length;
    const audioInstances: HTMLAudioElement[] = [];

    if (total === 0) {
      setLoadProgress(1);
      setIsAssetsReady(true);
      return () => {
        audioRef.current?.pause();
        audioRef.current = null;
      };
    }

    let completed = 0;
    const handleAssetComplete = () => {
      completed += 1;
      if (isCancelled) return;
      setLoadProgress(completed / total);
    };

    const loadAsset = (asset: AssetResource) =>
      new Promise<void>((resolve) => {
        if (asset.type === 'audio') {
          const audio = new Audio();
          audio.src = asset.src;
          audio.loop = asset.loop ?? false;
          audio.preload = 'auto';
          audioInstances.push(audio);

          if (asset.registerAsBackgroundAudio) {
            audioRef.current?.pause();
            audioRef.current = audio;
          }

          const finalize = () => {
            audio.removeEventListener('canplaythrough', finalize);
            audio.removeEventListener('error', finalize);
            resolve();
          };

          audio.addEventListener('canplaythrough', finalize, { once: true });
          audio.addEventListener('error', finalize, { once: true });
          audio.load();
          setTimeout(finalize, 8000);
          return;
        }

        if (asset.type === 'data') {
          fetch(asset.src)
            .catch(() => undefined)
            .finally(() => resolve());
          return;
        }

        const img = new Image();
        img.src = asset.src;
        if (img.complete) {
          resolve();
        } else {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }
      });

    const loaders = manifest.map((asset) =>
      loadAsset(asset)
        .catch(() => undefined)
        .finally(() => handleAssetComplete()),
    );

    Promise.all(loaders).then(() => {
      if (isCancelled) return;
      setTimeout(() => {
        if (!isCancelled) {
          setIsAssetsReady(true);
        }
      }, 200);
    });

    return () => {
      isCancelled = true;
      audioInstances.forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    setIsMusicPortalMounted(true);
  }, []);

  useEffect(() => {
    if (!hasTriggeredLoader) return;
    setHasMinimumLoaderElapsed(false);

    // For custom1 design, enforce minimum 5.5-second animation
    // (0.5s black screen + 3s for "THE WEDDING OF" + 2s for names = 5.5s total)
    // For general design, use shorter 600ms minimum
    const minimumTime = loadingDesign === 'custom1' ? 5500 : 600;

    const timer = setTimeout(() => {
      setHasMinimumLoaderElapsed(true);
    }, minimumTime);

    return () => {
      clearTimeout(timer);
    };
  }, [hasTriggeredLoader, loadingDesign]);

  useEffect(() => {
    if (isAuthorized && !hasTriggeredLoader) {
      setHasTriggeredLoader(true);
    }
  }, [isAuthorized, hasTriggeredLoader]);

  useEffect(() => {
    const updateIsDesktop = () => {
      if (typeof window === 'undefined') return;
      setIsDesktop(window.innerWidth >= 768);
    };

    updateIsDesktop();
    window.addEventListener('resize', updateIsDesktop);

    return () => {
      window.removeEventListener('resize', updateIsDesktop);
    };
  }, []);

  const playMusic = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      await audio.play();
      setIsMusicPlaying(true);
    } catch (error) {
      console.error('Failed to play background music:', error);
    }
  }, []);

  const pauseMusic = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setIsMusicPlaying(false);
  }, []);

  const handleToggleMusic = useCallback(() => {
    if (!audioRef.current) return;
    if (isMusicPlaying) {
      pauseMusic();
    } else {
      void playMusic();
    }
  }, [isMusicPlaying, playMusic, pauseMusic]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!isDesktop) return;
    if (isTransitioning || isDragging) {
      if (e.cancelable) {
        e.preventDefault();
      }
      return;
    }

    const deltaY = e.deltaY;
    if (Math.abs(deltaY) < 10) return;

    if (e.cancelable) {
      e.preventDefault();
    }

    const direction = deltaY > 0 ? 1 : -1;

    if (currentSection === 0 && !hasOpenedOnce && direction > 0) {
      setHasOpenedOnce(true);
      snapToSection(1);
      void playMusic();
      return;
    }

    let targetSection = currentSection + direction;
    if (targetSection < 0) targetSection = 0;
    if (targetSection > 6) targetSection = 6;

    if (targetSection === currentSection) return;

    snapToSection(targetSection);
  }, [isDesktop, isTransitioning, isDragging, currentSection, hasOpenedOnce, snapToSection, playMusic]);

  // Sync dragProgress dengan currentSection saat mount
  useEffect(() => {
    if (currentSection === 1 && dragProgress === 0) {
      updateFromProgress(1);
    } else if (currentSection === 2 && dragProgress < 2) {
      updateFromProgress(2);
    } else if (currentSection === 3 && dragProgress < 3) {
      updateFromProgress(3);
    } else if (currentSection === 4 && dragProgress < 4) {
      updateFromProgress(4);
    } else if (currentSection === 5 && dragProgress < 5) {
      updateFromProgress(5);
    } else if (currentSection === 6 && dragProgress < 6) {
      updateFromProgress(6);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handlers untuk button
  const handleOpenInvitation = () => {
    if (isDragging) return;
    setHasOpenedOnce(true);
    snapToSection(1);
    void playMusic();
  };

  const handleCloseInvitation = () => {
    if (isDragging) return;
    snapToSection(0);
  };

  const handlePasswordSubmit = () => {
    if (passwordInput === '120253') {
      setIsAuthorized(true);
      setPasswordError(false);
      setHasTriggeredLoader(true);
    } else {
      setPasswordError(true);
    }
  };

  // Attach touch event listeners dengan passive: false untuk preventDefault
  useEffect(() => {
    const container = document.querySelector('[data-drag-container]') as HTMLElement;
    if (!container) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    container.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isDragging]);

  // Destructure animation values untuk props
  const {
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
  } = animationValues;

  const progress56 = Math.max(0, Math.min(1, dragProgress - 5));
  const scrollableVisibility = Math.max(0, Math.min(1, (dragProgress - 5.1) / 0.7));
  // Show loading overlay when: not authorized yet, OR authorized but assets not ready
  // IMPORTANT: For custom1 design, overlay should be visible from the start to ensure
  // animation begins immediately, regardless of connection speed
  const shouldShowLoadingOverlay = !isAuthorized || !isAssetsReady || !hasMinimumLoaderElapsed;
  const isCoverGateEnabled = enableCoverGate;

  return (
    <>
      <div
        className="flex items-center justify-center w-full"
        style={{
          backgroundColor: '#ffffff',
          height: '100dvh', // Dynamic viewport height (fallback ada di globals.css)
          width: '100vw',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
        }}
      >
        <div
          data-drag-container
          className="viewport-container relative w-full overflow-hidden mx-auto"
          style={{
            height: '100dvh', // Dynamic viewport height (fallback ada di globals.css)
            backgroundColor: '#ffffff',
            maxWidth: '500px',
            width: '100%',
            transform: 'translate3d(-50%, 0, 0)', // Center + GPU acceleration
            WebkitTransform: 'translate3d(-50%, 0, 0)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            willChange: 'transform',
          }}
          onTouchStart={hasOpenedOnce ? onTouchStart : undefined}
          onTouchMove={hasOpenedOnce ? onTouchMove : undefined}
          onTouchEnd={hasOpenedOnce ? onTouchEnd : undefined}
          onMouseDown={hasOpenedOnce ? onMouseDown : undefined}
          onMouseMove={hasOpenedOnce ? onMouseMove : undefined}
          onMouseUp={hasOpenedOnce ? onMouseUp : undefined}
          onWheel={hasOpenedOnce ? handleWheel : undefined}
          onMouseLeave={hasOpenedOnce ? () => {
            if (isDragging) {
              // Jika sedang drag dan mouse leave, snap ke nearest
              snapToSection(getSectionFromProgress(dragProgress));
            }
          } : undefined}
        >
          <ParallaxScene
            dragProgress={dragProgress}
            animationValues={animationValues}
          />
          {/* Section 0: Cover */}
          <Section0
            currentSection={currentSection}
            isTransitioning={isTransitioning}
            isOpening={isOpening}
            isDragging={isDragging}
            dragProgress={dragProgress}
            hasOpenedOnce={hasOpenedOnce}
            onOpenInvitation={handleOpenInvitation}
            guestName={guestName}
            isLoadingComplete={isAssetsReady && hasMinimumLoaderElapsed}
            enableCoverGate={isCoverGateEnabled}
          />

          {/* Section 1: Wedding Scene - Fade In Animation with Zoom */}
          <Section1
            currentSection={currentSection}
            isTransitioning={isTransitioning}
            isOpening={isOpening}
            isDragging={isDragging}
            dragProgress={dragProgress}
            section1Scale={section1Scale}
            parallaxValues={parallaxValues}
          />

          {/* Section 2: Bride Detail - Zoom Animation (diadaptasi dari BrideDetailSection1.framer.tsx) */}
          <Section2
            currentSection={currentSection}
            isTransitioning={isTransitioning}
            isOpening={isOpening}
            isDragging={isDragging}
            dragProgress={dragProgress}
            section2WrapperScale={section2WrapperScale}
            section2BgScale={section2BgScale}
            section2BgX={section2BgX}
            section2BgY={section2BgY}
            section2CoupleScale={section2CoupleScale}
            section2CoupleX={section2CoupleX}
            section2CoupleY={section2CoupleY}
            section2GrassScale={section2GrassScale}
            section2GrassY={section2GrassY}
            section2GrassOpacity={section2GrassOpacity}
            section2CloudOpacity={section2CloudOpacity}
            section2CloudScale={section2CloudScale}
            section2CloudTop={section2CloudTop}
            section2TextOpacity={section2TextOpacity}
          />

          {/* Section 3: Groom Detail - Pan Animation (diadaptasi dari GroomDetailSection2.framer.tsx) */}
          <Section3
            currentSection={currentSection}
            isTransitioning={isTransitioning}
            isOpening={isOpening}
            isDragging={isDragging}
            dragProgress={dragProgress}
            section3WrapperScale={section3WrapperScale}
            section3BgScale={section3BgScale}
            section3BgX={section3BgX}
            section3BgY={section3BgY}
            section3CoupleScale={section3CoupleScale}
            section3CoupleX={section3CoupleX}
            section3CoupleY={section3CoupleY}
            section3GradientOpacity={section3GradientOpacity}
            section3BrideTextOpacity={section3BrideTextOpacity}
            section3GroomTextOpacity={section3GroomTextOpacity}
          />

          {/* Section 4: Couple Full - 3 Phase Zoom Out Animation (diadaptasi dari CoupleFullSection3.framer.tsx) */}
          <Section4
            currentSection={currentSection}
            isTransitioning={isTransitioning}
            isOpening={isOpening}
            isDragging={isDragging}
            dragProgress={dragProgress}
            section4WrapperScale={section4WrapperScale}
            section4BgScale={section4BgScale}
            section4BgX={section4BgX}
            section4BgY={section4BgY}
            section4CoupleScale={section4CoupleScale}
            section4CoupleX={section4CoupleX}
            section4CoupleY={section4CoupleY}
            section4GrassScale={section4GrassScale}
            section4GrassY={section4GrassY}
            section4GrassOpacity={section4GrassOpacity}
            section4GradientOpacity={section4GradientOpacity}
            section4GroomTextOpacity={section4GroomTextOpacity}
          />

          {/* Section 5: Couple Full - 2.5D Parallax Zoom Out Animation (diadaptasi dari CoupleFullSection4.framer.tsx) */}
          <Section5
            currentSection={currentSection}
            isTransitioning={isTransitioning}
            isOpening={isOpening}
            isDragging={isDragging}
            dragProgress={dragProgress}
            section5WrapperScale={section5WrapperScale}
            section5BgScale={section5BgScale}
            section5BgX={section5BgX}
            section5BgY={section5BgY}
            section5CoupleScale={section5CoupleScale}
            section5CoupleX={section5CoupleX}
            section5CoupleY={section5CoupleY}
            section5GrassScale={section5GrassScale}
            section5GrassY={section5GrassY}
            section5GrassOpacity={section5GrassOpacity}
          />

          {/* Section 6: Couple Full - Continue Zoom Out Animation (diadaptasi dari CoupleFullSection5.framer.tsx) */}
          <Section6
            currentSection={currentSection}
            isTransitioning={isTransitioning}
            isOpening={isOpening}
            isDragging={isDragging}
            dragProgress={dragProgress}
            section6WrapperScale={section6WrapperScale}
            section6BgScale={section6BgScale}
            section6BgX={section6BgX}
            section6BgY={section6BgY}
            section6CoupleScale={section6CoupleScale}
            section6CoupleX={section6CoupleX}
            section6CoupleY={section6CoupleY}
            section6GrassScale={section6GrassScale}
            section6GrassY={section6GrassY}
            section6GrassOpacity={section6GrassOpacity}
            section6NewCloudOpacity={section6NewCloudOpacity}
            section6NewCloudTop={section6NewCloudTop}
          />

          {/* Scrollable Content Overlay - muncul saat transisi dari section 5 ke 6 */}
          <ScrollableContent
            visibility={scrollableVisibility}
            dragProgress={dragProgress}
            onProgressDrag={setDragProgress}
            onSnapToSection={snapToSection}
            onInterruptAnimation={interruptAnimation}
            invitationSlug={clientSlug}
          />

          <SwipeUpHint
            dragProgress={dragProgress}
            currentSection={currentSection}
            hasOpenedOnce={hasOpenedOnce}
          />
        </div>
      </div>

      {/* Floating music play/pause button - bottom-left (portal to body) */}
      {hasOpenedOnce && isMusicPortalMounted &&
        createPortal(
          <button
            type="button"
            onClick={handleToggleMusic}
            aria-label={isMusicPlaying ? 'Pause background music' : 'Play background music'}
            className="fixed music-button bottom-4 z-[2000] flex items-center justify-center"
            style={{ width: 40, height: 40 }}
          >
            <div
              className="relative music-disc-spin"
              style={{ width: 40, height: 40, animationPlayState: isMusicPlaying ? 'running' : 'paused' }}
            >
              <NextImage
                src="/music-disc.svg"
                alt="Background music disc"
                width={40}
                height={40}
                className="w-full h-full"
              />
            </div>
          </button>,
          document.body,
        )}
      {!isAuthorized && (
        <div className="fixed inset-0 flex items-center justify-center bg-white z-999">
          <div className="w-full max-w-xs px-6 py-8">
            <input
              type="password"
              className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-gray-500"
              placeholder="Password"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                if (passwordError) {
                  setPasswordError(false);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handlePasswordSubmit();
                }
              }}
            />
            <button
              type="button"
              className="w-full bg-black text-white py-2 rounded"
              onClick={handlePasswordSubmit}
            >
              Masuk
            </button>
            {passwordError && (
              <p className="mt-2 text-sm text-red-500">
                Password salah
              </p>
            )}
          </div>
        </div>
      )}
      {/* Dynamic loading overlay based on configuration */}
      {loadingDesign === 'custom1' ? (
        <LoadingOverlayCustom1
          progress={loadProgress}
          isVisible={shouldShowLoadingOverlay}
          brideGroomNames={brideGroomNames}
        />
      ) : (
        <LoadingOverlayGeneral
          progress={loadProgress}
          isVisible={shouldShowLoadingOverlay}
        />
      )}
    </>
  );
}
