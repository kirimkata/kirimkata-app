'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import SaveTheDateSection from '../sections/SaveTheDateSection';
import RSVPSection from '../sections/RSVPSection';
import WishesSection from '../sections/WishesSection';
import WeddingGiftSection from '../sections/WeddingGiftSection';
import FooterSection from '../sections/FooterSection';
import ClosingSection from '../sections/ClosingSection';
import { getBrideConfig, getGroomConfig, getWeddingDateConfig, getSaveTheDateConfig } from '@/config/textConfig';
import LoveStorySection from '../sections/LoveStorySection';
import GallerySection from '../sections/GallerySection';
import { useInvitationContent } from '@/lib/contexts/InvitationContentContext';

const LottiePlayer = dynamic(
  () => import('@lottiefiles/react-lottie-player').then((m) => m.Player),
  { ssr: false }
);

interface ScrollableContentProps {
  visibility: number; // 0-1, controls snap animation (progress56)
  dragProgress: number; // global dragProgress (0-6)
  onProgressDrag: (progress: number) => void; // update dragProgress saat user drag di atas content
  onSnapToSection?: (section: number) => void; // optional, pakai snap animasi bawaan
  onInterruptAnimation?: () => void; // hentikan animasi snap/momentum saat user mulai drag
  invitationSlug: string;
  brideName?: string;
  groomName?: string;
  weddingDate?: string;
}

export default function ScrollableContent({
  visibility,
  dragProgress,
  onProgressDrag,
  onSnapToSection,
  onInterruptAnimation,
  invitationSlug,
  brideName,
  groomName,
  weddingDate,
}: ScrollableContentProps) {
  const invitationContent = useInvitationContent();
  const bride = getBrideConfig();
  const groom = getGroomConfig();
  const weddingDateConfig = getWeddingDateConfig();
  const saveDateConfig = getSaveTheDateConfig();

  const finalBrideName =
    brideName || invitationContent?.bride.name || bride.name;
  const finalGroomName =
    groomName || invitationContent?.groom.name || groom.name;

  const finalWeddingDate =
    weddingDate ||
    invitationContent?.event.countdownDateTime ||
    invitationContent?.event.isoDate ||
    saveDateConfig.countdownDateTime ||
    saveDateConfig.isoDate ||
    weddingDateConfig.isoDate;
  const [mounted, setMounted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const previousVisibilityRef = useRef(visibility);
  const [hasEntrance, setHasEntrance] = useState(false);
  const [manualTransform, setManualTransform] = useState<string | null>(null);
  const [hasDismissedSwipeHint, setHasDismissedSwipeHint] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);

  // Touch tracking untuk sinkronisasi dengan dragProgress Section 5↔6
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const lastTouchY = useRef(0);
  const lastTouchTime = useRef(0);
  const isControllingParallaxRef = useRef(false);
  const dragStartProgressRef = useRef(0);

  // SSR safety - only render portal on client
  const FULLY_OPEN_THRESHOLD = 5.98;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset manual transform and trigger entrance animation when visibility changes
  useEffect(() => {
    const previousVisibility = previousVisibilityRef.current;
    previousVisibilityRef.current = visibility;

    const wasVisible = previousVisibility > 0;
    const isVisible = visibility > 0;

    if (isVisible && !wasVisible) {
      setManualTransform(null);
      setHasEntrance(false); // Start hidden
      console.log('🎬 Reset for entrance animation - starting hidden');

      // Delay to trigger entrance animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setHasEntrance(true); // Now show with animation
          console.log('🎬 Entrance animation triggered');
        });
      });
    } else if (!isVisible && wasVisible) {
      setHasEntrance(false);
    }
  }, [visibility]);

  useEffect(() => {
    if (contentRef.current && visibility > 0) {
      // Enable native scroll when visible
      contentRef.current.style.pointerEvents = 'auto';
    } else if (contentRef.current) {
      contentRef.current.style.pointerEvents = 'none';
    }
  }, [visibility]);

  // Touch event handlers untuk sinkronkan gesture dengan dragProgress Section 5↔6
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || visibility < 0.05) {
      return;
    }

    const handleTouchStart = (e: TouchEvent) => {
      const now = Date.now();
      const touchY = e.touches[0].clientY;
      touchStartY.current = touchY;
      touchStartTime.current = now;
      lastTouchY.current = touchY;
      lastTouchTime.current = now;

      const currentScrollTop = container.scrollTop;
      const isAtTopBoundary = currentScrollTop <= 1;

      // Hanya saat berada di paling atas dan progress di range 5–6,
      // gesture akan mengontrol dragProgress parallax.
      const canControlParallax = isAtTopBoundary && dragProgress >= 5 && dragProgress <= 6;
      isControllingParallaxRef.current = canControlParallax;
      if (canControlParallax) {
        // Hentikan semua animasi otomatis sebelum user ambil alih
        onInterruptAnimation?.();
        dragStartProgressRef.current = Math.min(6, Math.max(5, dragProgress));
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touchY = e.touches[0].clientY;
      const now = Date.now();
      const deltaY = touchY - touchStartY.current;
      const currentScrollTop = container.scrollTop;
      const isSwipeUp = deltaY < 0;
      const isSwipeDown = deltaY > 0;

      if (isControllingParallaxRef.current) {
        // Jika gesture dimulai saat Section 6 sudah full open (progress ~6)
        // dan user swipe ke ATAS, jangan kontrol parallax lagi - biarkan isi scroll.
        if (dragStartProgressRef.current >= FULLY_OPEN_THRESHOLD && isSwipeUp) {
          isControllingParallaxRef.current = false;
          // Lanjut ke mode scroll normal di bawah.
        } else {
          const viewportHeight = window.innerHeight || 1;
          // Untuk transisi Section 5↔6, gunakan sensitivitas 1:1 (1 tinggi layar = 1 progress)
          const progressDelta = (-deltaY / viewportHeight) * 1;
          let nextProgress = dragStartProgressRef.current + progressDelta;

          // Clamp hanya ke range Section 5–6
          if (nextProgress < 5) nextProgress = 5;
          if (nextProgress > 6) nextProgress = 6;

          onProgressDrag(nextProgress);

          lastTouchY.current = touchY;
          lastTouchTime.current = now;

          if (e.cancelable) {
            e.preventDefault();
          }
          e.stopPropagation();
          return;
        }
      }

      // Mode scroll normal
      const atTop = currentScrollTop <= 0;
      const atBottom = currentScrollTop >= container.scrollHeight - container.clientHeight;
      const isScrollingUp = isSwipeUp;
      const isScrollingDown = isSwipeDown;

      // Prevent window scroll di boundary
      if ((atTop && isScrollingDown) || (atBottom && isScrollingUp)) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }

      // Selalu stop propagation untuk mencegah parallax
      e.stopPropagation();
    };

    const handleTouchEnd = () => {
      if (!isControllingParallaxRef.current) return;

      isControllingParallaxRef.current = false;

      const windowHeight = window.innerHeight || 1;
      const dragDistance = lastTouchY.current - touchStartY.current;
      const dragPercentage = dragDistance / windowHeight;

      const now = Date.now();
      const timeDelta = now - touchStartTime.current;
      const velocity = timeDelta > 0 ? dragDistance / timeDelta : 0;

      const FLING_VELOCITY_THRESHOLD = 0.5; // px/ms
      const SNAP_THRESHOLD = 0.2; // 20% layar

      const isFlingDown = velocity > FLING_VELOCITY_THRESHOLD;
      const isFlingUp = velocity < -FLING_VELOCITY_THRESHOLD;
      const isDragDown = dragPercentage >= SNAP_THRESHOLD;
      const isDragUp = dragPercentage <= -SNAP_THRESHOLD;

      let targetSection: number;
      if (isFlingDown || isDragDown) {
        targetSection = 5;
      } else if (isFlingUp || isDragUp) {
        targetSection = 6;
      } else {
        // Tanpa fling / drag besar, gunakan posisi akhir untuk memutuskan
        targetSection = dragProgress >= 5.5 ? 6 : 5;
      }

      if (onSnapToSection) {
        onSnapToSection(targetSection);
      } else {
        onProgressDrag(targetSection);
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
  }, [visibility, dragProgress, onProgressDrag, onSnapToSection, onInterruptAnimation]);

  const clampedVisibility = Math.max(0, Math.min(1, visibility));
  const saveTheDateAnimationsReady = clampedVisibility > 0.96;

  useEffect(() => {
    if (clampedVisibility < 0.05) {
      setIsAtTop(true);
    }
  }, [clampedVisibility]);

  // Track scroll dan blok propagasi ke window
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      // CRITICAL: Stop propagation to prevent window scroll events
      e.stopPropagation();

      const currentTop = e.currentTarget.scrollTop;
      setIsAtTop(currentTop < 24);
      if (!hasDismissedSwipeHint && currentTop > 60) {
        setHasDismissedSwipeHint(true);
      }
    },
    [hasDismissedSwipeHint]
  );

  // Wheel handler for desktop - always block propagation
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation(); // Always block animation page

    // Also prevent at boundaries to avoid window scroll
    const container = scrollContainerRef.current;
    if (!container) return;

    const atTop = container.scrollTop <= 0;
    const atBottom = container.scrollTop >= (container.scrollHeight - container.clientHeight);
    const isScrollingUp = e.deltaY < 0;
    const isScrollingDown = e.deltaY > 0;

    if ((atTop && isScrollingUp) || (atBottom && isScrollingDown)) {
      if (e.cancelable) {
        e.preventDefault();
      }
    }
  }, []);

  // Capture all touch/pointer events to prevent bubbling to animation page
  const handleWrapperTouch = useCallback((e: React.TouchEvent) => {
    e.stopPropagation(); // Block all touch events from reaching parent
  }, []);

  // SSR safety - don't render until mounted
  if (!mounted) return null;

  // visibility (0-1) langsung mengontrol posisi overlay secara linear dari bawah ke atas
  const translatePercent = (1 - clampedVisibility) * 100;
  const transform = `translateY(${translatePercent}%)`;
  const shouldShowSwipeHint =
    !hasDismissedSwipeHint && clampedVisibility > 0.98 && isAtTop;


  const content = (
    <div
      ref={contentRef}
      className="fixed z-[100]"
      style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        transform,
        opacity: clampedVisibility,
        transition: 'none',
        pointerEvents: clampedVisibility > 0.05 ? 'auto' : 'none',
        backgroundColor: 'transparent',
        // Prevent expansion when address bar hides - use explicit height instead of inset
        height: 'calc(var(--vh, 1vh) * 100)',
        maxHeight: 'calc(var(--vh, 1vh) * 100)',
        width: '100%',
      }}
      onTouchStart={handleWrapperTouch}
      onTouchMove={handleWrapperTouch}
      onTouchEnd={handleWrapperTouch}
    >
      {/* Scrollable container with native scroll - matches animation page width */}
      <div
        ref={scrollContainerRef}
        className="w-full h-full overflow-y-auto overflow-x-hidden scrollable-content"
        style={{
          backgroundColor: 'transparent',
          WebkitOverflowScrolling: 'touch', // Smooth scroll on iOS
          overscrollBehavior: 'contain', // Contain scroll within element
          touchAction: 'pan-y', // Only allow vertical scroll
          position: 'relative',
          // Use CSS variable for mobile viewport fix
          height: 'calc(var(--vh, 1vh) * 100)',
          maxHeight: 'calc(var(--vh, 1vh) * 100)',
          width: '100%',
          maxWidth: '500px',
          margin: '0 auto',
        }}
        onScroll={handleScroll}
        onWheel={handleWheel}
      >
        <style jsx>{`
          .scrollable-content::-webkit-scrollbar {
            width: 0;
            height: 0;
            background: transparent;
          }
          .scrollable-content::-webkit-scrollbar-track {
            background: transparent;
          }
          .scrollable-content::-webkit-scrollbar-thumb {
            background: transparent;
          }
          .scrollable-content::-webkit-scrollbar-thumb:hover {
            background: transparent;
          }
          .scrollable-content {
            scrollbar-width: none;
            scrollbar-color: transparent transparent;
            -ms-overflow-style: none;
          }
          
          /* Prevent overscroll bounce on the scrollable content */
          .scrollable-content {
            overscroll-behavior-y: none;
            -webkit-overscroll-behavior-y: none;
          }
        `}</style>
        {/* Content wrapper - matches animation page width */}
        <div className="w-full max-w-[500px] mx-auto px-5 md:px-6">
          {/* Save The Date Section */}
          <SaveTheDateSection
            brideName={finalBrideName}
            groomName={finalGroomName}
            weddingDate={finalWeddingDate}
            startAnimation={saveTheDateAnimationsReady}
          />

          {shouldShowSwipeHint && (
            <div className="flex flex-col items-center mt-4 mb-12 pointer-events-none">
              <LottiePlayer
                autoplay
                loop
                src="/swipeup.json"
                style={{ width: 72, height: 72, pointerEvents: 'none' }}
              />
              <p className="mt-2 text-xs tracking-[0.25em] uppercase text-white/80">
                Swipe up untuk lanjut
              </p>
            </div>
          )}

          {/* Wishes Section */}
          <div className="mb-20">
            <WishesSection invitationSlug={invitationSlug} />
          </div>

          {/* Love Story Section */}
          <div className="mb-20">
            <LoveStorySection />
          </div>

          {/* Gallery Section */}
          <div className="mb-20">
            <GallerySection />
          </div>

          {/* Wedding Gift Section */}
          <div className="mb-20">
            <WeddingGiftSection />
          </div>

          {/* Closing Section */}
          <div className="mb-20">
            <ClosingSection />
          </div>

          {/* Footer */}
          <FooterSection
            brideName={finalBrideName}
            groomName={finalGroomName}
            year={new Date(finalWeddingDate).getFullYear()}
          />
        </div>
      </div>
    </div>
  );

  // Render via portal to document.body for maximum isolation
  return createPortal(content, document.body);
}



