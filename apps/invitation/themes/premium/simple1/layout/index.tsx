'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import SaveTheDateSection from '@/features/content/general/sections/SaveTheDateSection';
import RSVPSection from '@/features/content/general/sections/RSVPSection';
import WishesSection from '@/features/content/general/sections/WishesSection';
import WeddingGiftSection from '@/features/content/general/sections/WeddingGiftSection';
import FooterSection from '@/features/content/general/sections/FooterSection';
import ClosingSection from '@/features/content/general/sections/ClosingSection';
import LoveStorySection from '@/features/content/general/sections/LoveStorySection';
import GallerySection from '@/features/content/general/sections/GallerySection';
import { getBrideConfig, getGroomConfig, getWeddingDateConfig, getSaveTheDateConfig } from '@/config/textConfig';
import { useInvitationContent } from '@/lib/contexts/InvitationContentContext';
import type { ContentLayoutProps } from '@/themes/types';

const LottiePlayer = dynamic(
    () => import('@lottiefiles/react-lottie-player').then((m) => m.Player),
    { ssr: false }
);

/**
 * LayoutA - Standalone Scrollable Content Layout
 * 
 * A fully scrollable invitation content layout that works independently
 * without requiring parallax animation integration.
 * 
 * Features:
 * - Full-page scrollable content
 * - All standard invitation sections
 * - Mobile-optimized with viewport fix
 * - Can be used with any opening (parallax, static, or none)
 */
export default function LayoutA({
    clientSlug,
    guestName,
    brideName,
    groomName,
    weddingDate,
}: ContentLayoutProps) {
    const invitationContent = useInvitationContent();
    const bride = getBrideConfig();
    const groom = getGroomConfig();
    const weddingDateConfig = getWeddingDateConfig();
    const saveDateConfig = getSaveTheDateConfig();

    const finalBrideName = brideName || invitationContent?.bride.name || bride.name;
    const finalGroomName = groomName || invitationContent?.groom.name || groom.name;
    const finalWeddingDate =
        weddingDate ||
        invitationContent?.event.countdownDateTime ||
        invitationContent?.event.isoDate ||
        saveDateConfig.countdownDateTime ||
        saveDateConfig.isoDate ||
        weddingDateConfig.isoDate;

    const [mounted, setMounted] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showScrollHint, setShowScrollHint] = useState(true);
    const [isAtTop, setIsAtTop] = useState(true);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Track scroll position
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const currentTop = e.currentTarget.scrollTop;
        setIsAtTop(currentTop < 24);
        if (showScrollHint && currentTop > 60) {
            setShowScrollHint(false);
        }
    }, [showScrollHint]);

    // Wheel handler for desktop
    const handleWheel = useCallback((e: React.WheelEvent) => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const atTop = container.scrollTop <= 0;
        const atBottom = container.scrollTop >= (container.scrollHeight - container.clientHeight);
        const isScrollingUp = e.deltaY < 0;
        const isScrollingDown = e.deltaY > 0;

        // Prevent window scroll at boundaries
        if ((atTop && isScrollingUp) || (atBottom && isScrollingDown)) {
            if (e.cancelable) {
                e.preventDefault();
            }
        }
    }, []);

    // SSR safety
    if (!mounted) return null;

    return (
        <div
            className="fixed inset-0 z-[50] bg-white"
            style={{
                height: 'calc(var(--vh, 1vh) * 100)',
                maxHeight: 'calc(var(--vh, 1vh) * 100)',
            }}
        >
            {/* Scrollable container */}
            <div
                ref={scrollContainerRef}
                className="w-full h-full overflow-y-auto overflow-x-hidden scrollable-content"
                style={{
                    backgroundColor: '#ffffff',
                    WebkitOverflowScrolling: 'touch',
                    overscrollBehavior: 'contain',
                    touchAction: 'pan-y',
                    position: 'relative',
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
          .scrollable-content {
            scrollbar-width: none;
            -ms-overflow-style: none;
            overscroll-behavior-y: none;
            -webkit-overscroll-behavior-y: none;
          }
        `}</style>

                {/* Content wrapper */}
                <div className="w-full max-w-[500px] mx-auto px-5 md:px-6">
                    {/* Save The Date Section */}
                    <SaveTheDateSection
                        brideName={finalBrideName}
                        groomName={finalGroomName}
                        weddingDate={finalWeddingDate}
                        startAnimation={true}
                    />

                    {/* Scroll hint */}
                    {showScrollHint && isAtTop && (
                        <div className="flex flex-col items-center mt-4 mb-12 pointer-events-none">
                            <LottiePlayer
                                autoplay
                                loop
                                src="/swipeup.json"
                                style={{ width: 72, height: 72, pointerEvents: 'none' }}
                            />
                            <p className="mt-2 text-xs tracking-[0.25em] uppercase text-gray-600">
                                Scroll untuk lanjut
                            </p>
                        </div>
                    )}

                    {/* Wishes Section */}
                    <div className="mb-20">
                        <WishesSection invitationSlug={clientSlug} />
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
}
