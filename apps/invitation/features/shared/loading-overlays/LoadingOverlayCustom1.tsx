'use client';

import { useState, useEffect } from 'react';

interface LoadingOverlayCustom1Props {
    progress: number;
    isVisible: boolean;
    brideGroomNames?: string;
}

/**
 * Custom loading overlay with animated text sequence
 * Black transparent background with fade-in/fade-out text animations
 * 
 * Animation sequence:
 * 0-0.5s: Black screen (ensure visibility)
 * 0.5-1.5s: "THE WEDDING OF" fade in (1s)
 * 1.5-2.5s: "THE WEDDING OF" stay (1s)
 * 2.5-3.5s: "THE WEDDING OF" fade out (1s)
 * 3.5-4.5s: Bride & groom names fade in (1s)
 * 4.5-5.5s: Bride & groom names stay (1s)
 * 5.5s+: If loading complete: fade out, else: pulse until complete
 */
export function LoadingOverlayCustom1({
    progress,
    isVisible,
    brideGroomNames = 'Bride & Groom'
}: LoadingOverlayCustom1Props) {
    const [animationPhase, setAnimationPhase] = useState<'black-screen' | 'wedding-of-in' | 'wedding-of-stay' | 'wedding-of-out' | 'names-in' | 'names-stay' | 'names-ready'>('black-screen');
    const clampedProgress = Math.max(0, Math.min(1, progress));
    const isLoadingComplete = clampedProgress >= 1;

    useEffect(() => {
        if (!isVisible) {
            setAnimationPhase('black-screen');
            return;
        }

        // Phase 0: Black screen (0-0.5s) - ensure black screen is visible first
        const timer0 = setTimeout(() => {
            setAnimationPhase('wedding-of-in');
        }, 500);

        // Phase 1: "THE WEDDING OF" fade in (0.5-1.5s)
        const timer1 = setTimeout(() => {
            setAnimationPhase('wedding-of-stay');
        }, 1500);

        // Phase 2: "THE WEDDING OF" stay (1.5-2.5s)
        const timer2 = setTimeout(() => {
            setAnimationPhase('wedding-of-out');
        }, 2500);

        // Phase 3: "THE WEDDING OF" fade out (2.5-3.5s)
        const timer3 = setTimeout(() => {
            setAnimationPhase('names-in');
        }, 3500);

        // Phase 4: Names fade in (3.5-4.5s)
        const timer4 = setTimeout(() => {
            setAnimationPhase('names-stay');
        }, 4500);

        // Phase 5: Names stay (4.5-5.5s)
        const timer5 = setTimeout(() => {
            setAnimationPhase('names-ready');
        }, 5500);

        return () => {
            clearTimeout(timer0);
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
            clearTimeout(timer4);
            clearTimeout(timer5);
        };
    }, [isVisible]); // Remove isLoadingComplete dependency to prevent timing issues

    // Determine opacity for "THE WEDDING OF"
    const weddingOfOpacity =
        animationPhase === 'black-screen' ? 0 :
            animationPhase === 'wedding-of-in' ? 1 :
                animationPhase === 'wedding-of-stay' ? 1 :
                    animationPhase === 'wedding-of-out' ? 0 : 0;

    // Determine opacity for names
    const namesOpacity =
        animationPhase === 'names-in' ? 1 :
            animationPhase === 'names-stay' ? 1 :
                animationPhase === 'names-ready' ? 1 : 0;

    // Determine if we should show pulsing effect
    // Only pulse if animation is ready AND loading is not complete
    const shouldPulse = animationPhase === 'names-ready' && !isLoadingComplete;


    return (
        <div
            className="fixed inset-0 flex flex-col items-center justify-center"
            style={{
                zIndex: 10000,
                backgroundColor: 'rgba(0, 0, 0, 0.93)',
                opacity: isVisible ? 1 : 0,
                // Delay visibility change to allow fade out transition
                visibility: isVisible ? 'visible' : 'hidden',
                pointerEvents: isVisible ? 'auto' : 'none',
                transition: 'opacity 1000ms ease-in-out, visibility 0s linear 1000ms', // Fade opacity, then hide
            }}
        >
            <div className="text-center px-6 relative">
                {/* Phase 1-3: "THE WEDDING OF" text */}
                <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                        opacity: weddingOfOpacity,
                        transition: 'opacity 1000ms ease-in-out',
                    }}
                >
                    <p
                        className="text-sm uppercase tracking-[0.5em] text-white font-light"
                        style={{
                            fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif",
                            letterSpacing: '0.5em',
                        }}
                    >
                        THE WEDDING OF
                    </p>
                </div>

                {/* Phase 4-6: Bride & Groom names */}
                <div
                    style={{
                        opacity: namesOpacity,
                        transition: 'opacity 1000ms ease-in-out',
                    }}
                >
                    <p
                        className="text-3xl text-white uppercase"
                        style={{
                            fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif",
                            fontWeight: 400,
                            letterSpacing: '0.15em',
                            // Pulsing glow effect only when in pulse phase
                            textShadow: shouldPulse
                                ? '0 0 20px rgba(255, 255, 255, 0.5), 0 0 40px rgba(255, 255, 255, 0.3)'
                                : 'none',
                            animation: shouldPulse ? 'pulse-glow 2s ease-in-out infinite' : 'none',
                        }}
                    >
                        {brideGroomNames}
                    </p>
                </div>
            </div>

            <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 1;
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.5), 0 0 40px rgba(255, 255, 255, 0.3);
          }
          50% {
            opacity: 0.7;
            text-shadow: 0 0 30px rgba(255, 255, 255, 0.7), 0 0 60px rgba(255, 255, 255, 0.5);
          }
        }
      `}</style>
        </div>
    );
}
