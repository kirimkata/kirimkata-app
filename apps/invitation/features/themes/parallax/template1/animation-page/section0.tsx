'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getImage } from '@/themes/parallax/parallax-template1/config/imageConfig';
import { getBrideConfig, getGroomConfig, getWeddingDateConfig } from '@/themes/parallax/parallax-template1/config/textConfig';
import { getTransitionValuesForSection, getDefaultTransitionValues, animationConfig } from '@/themes/parallax/parallax-template1/config/animationConfig';
import { useInvitationContent } from '@/lib/contexts/InvitationContentContext';
import { typographyConfig, getTypographyStyle } from '@/themes/parallax/parallax-template1/config/fontConfig';

const section0Typography = typographyConfig.animation.section0;

interface Section0Props {
  currentSection: number;
  isTransitioning: boolean;
  isOpening: boolean;
  isDragging: boolean;
  dragProgress: number;
  hasOpenedOnce: boolean;
  onOpenInvitation: () => void;
  guestName?: string;
  isLoadingComplete?: boolean; // Signal from parent that loading is done
  enableCoverGate?: boolean;
}

export default function Section0({
  currentSection,
  isTransitioning,
  isOpening,
  isDragging,
  dragProgress,
  hasOpenedOnce,
  onOpenInvitation,
  guestName,
  isLoadingComplete = true, // Default true for backward compatibility
  enableCoverGate = false,
}: Section0Props) {
  const invitationContent = useInvitationContent();
  const defaultBride = getBrideConfig();
  const defaultGroom = getGroomConfig();
  const defaultWeddingDate = getWeddingDateConfig();

  const bride = invitationContent?.bride ?? defaultBride;
  const groom = invitationContent?.groom ?? defaultGroom;
  const weddingDate = {
    ...defaultWeddingDate,
    fullDate: invitationContent?.event.fullDateLabel ?? defaultWeddingDate.fullDate,
    isoDate: invitationContent?.event.isoDate ?? defaultWeddingDate.isoDate,
  };
  const defaultTransition = getDefaultTransitionValues(animationConfig);
  const displayGuestName = guestName?.trim() ? guestName.trim() : 'Guest';

  // Gate opening animation state
  const [isGateOpen, setIsGateOpen] = useState(!enableCoverGate);
  const [isGateFading, setIsGateFading] = useState(!enableCoverGate);
  const [shouldRenderGates, setShouldRenderGates] = useState(enableCoverGate);

  useEffect(() => {
    if (!enableCoverGate) {
      setIsGateOpen(true);
      setIsGateFading(true);
      setShouldRenderGates(false);
      return;
    }
    setIsGateOpen(false);
    setIsGateFading(false);
    setShouldRenderGates(true);
  }, [enableCoverGate]);

  // Trigger gate opening animation ONLY after loading completes
  useEffect(() => {
    if (!enableCoverGate) return;
    if (!isLoadingComplete) return; // Wait for loading to finish

    const timer = setTimeout(() => {
      setIsGateOpen(true);
    }, 1500); // 1.5 second delay after loading completes

    return () => clearTimeout(timer);
  }, [isLoadingComplete, enableCoverGate]); // Re-run when loading completes

  // Fade out gates after animation completes
  useEffect(() => {
    if (!enableCoverGate) return;
    if (isGateOpen) {
      // Wait for slide animation to complete (2s)
      const fadeTimer = setTimeout(() => {
        setIsGateFading(true);
      }, 2000); // Start fading after slide completes

      return () => clearTimeout(fadeTimer);
    }
  }, [isGateOpen, enableCoverGate]);

  // Remove gates from DOM after fade completes
  useEffect(() => {
    if (!enableCoverGate) return;
    if (isGateFading) {
      // Wait for fade transition (1s)
      const removeTimer = setTimeout(() => {
        setShouldRenderGates(false);
      }, 1000); // Remove after fade completes

      return () => clearTimeout(removeTimer);
    }
  }, [isGateFading, enableCoverGate]);

  // Normalized progress untuk transisi Cover (0) -> Section 1 (1)
  // Digunakan untuk menyatukan fade & transform berdasarkan satu sumber kebenaran (dragProgress)
  const progress01 = Math.max(0, Math.min(1, dragProgress));

  // Hanya render jika section 0 aktif atau sedang transisi
  if (!(currentSection === 0 || isTransitioning || dragProgress < 1)) {
    return null;
  }

  return (
    <div
      className="absolute inset-0"
      style={{
        zIndex: 20,
        // Opacity cover selalu komplementer terhadap progress (satu kesatuan dengan Section 1)
        // progress = 0   -> opacity = 1 (full cover)
        // progress = 1   -> opacity = 0 (cover hilang)
        opacity: 1 - progress01,
      }}
    >
      {/* Cover Image */}
      <div
        className="gpu-accelerated absolute inset-0 w-full h-full"
        style={{
          transform: 'translate3d(0, 0, 0)',
          WebkitTransform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          willChange: 'transform',
        }}
      >
        <Image
          src={getImage('cover')}
          alt="Wedding Cover"
          fill
          className="object-cover scale-100"
          priority
          quality={100}
          sizes="100vw"
          unoptimized={true}
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>

      {/* Gradient Overlay */}
      <div
        className="gpu-accelerated absolute inset-0 w-full h-full"
        style={{
          background:
            'linear-gradient(to top, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.9) 20%, rgba(255, 255, 255, 0.6) 40%, rgba(255, 255, 255, 0) 60%)',
          transform: 'translate3d(0, 0, 0)',
          WebkitTransform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          willChange: 'transform',
        }}
      />

      {/* Cover Text */}
      <div
        className="gpu-accelerated absolute inset-0 flex flex-col justify-end items-center text-center"
        style={{
          transform: 'translate3d(0, 0, 0)',
          WebkitTransform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          willChange: 'transform',
          marginBottom: '24%'
        }}
      >
        {/* Group 1: Wedding Information (16px) */}
        <div className="mb-8">
          <p
            className="text-sm md:text-base text-gray-600 mb-2 tracking-wide"
            style={
              section0Typography.coverInfo
                ? getTypographyStyle(section0Typography.coverInfo)
                : {}
            }
          >
            The Wedding Of
          </p>
          <h1
            className="text-5xl md:text-6xl text-gray-800 mb-4"
            style={getTypographyStyle(section0Typography.title)}
          >
            {bride.name} & {groom.name}
          </h1>
          <p
            className="text-sm md:text-base text-gray-700"
            style={
              section0Typography.coverInfo
                ? getTypographyStyle(section0Typography.coverInfo)
                : {}
            }
          >
            {weddingDate.fullDate}
          </p>
        </div>

        {/* Group 2: Guest Invitation (12px) */}
        <div className="mt-4" style={{ marginTop: '30px' }}>
          <p
            className="text-sm text-gray-600 mb-2"
            style={
              section0Typography.guestInfo
                ? getTypographyStyle(section0Typography.guestInfo)
                : {}
            }
          >
            Kepada Yth. Bapak/Ibu/Saudara/i
          </p>
          <p
            className="text-lg font-bold text-gray-800"
            style={{
              ...(section0Typography.subtitle
                ? getTypographyStyle(section0Typography.subtitle)
                : {}),
              marginTop: '8px',
              marginBottom: '8px',
            }}
          >
            {displayGuestName}
          </p>
          {/* <p
            className="text-sm md:text-base text-gray-600 mt-4 px-6 leading-relaxed"
            style={
              section0Typography.guestInfo
                ? getTypographyStyle(section0Typography.guestInfo)
                : {}
            }
          >
            Tanpa mengurangi rasa hormat,<br />
            kami mengundang anda untuk menghadiri<br />
            acara pernikahan kami.
          </p> */}
        </div>
      </div>

      {/* Gate Left - Positioned at left edge */}
      {enableCoverGate && shouldRenderGates && (
        <div
          className="absolute left-0 top-0 h-full"
          style={{
            zIndex: 25,
            width: 'auto',
            pointerEvents: 'none',
            transform: isGateOpen ? 'translateX(-100%)' : 'translateX(0)',
            opacity: isGateFading ? 0 : 1,
            transition: 'transform 2s ease-in-out, opacity 1s ease-out',
            filter: 'drop-shadow(4px 0 8px rgba(0, 0, 0, 1))',
          }}
        >
          <img
            src="https://media.kirimkata.com/gate_left.png"
            alt="Gate Left"
            width={200}
            height={1920}
            className="h-full w-auto object-cover"
            loading="eager"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
          />
        </div>
      )}

      {/* Gate Right - Positioned at right edge */}
      {enableCoverGate && shouldRenderGates && (
        <div
          className="absolute right-0 top-0 h-full"
          style={{
            zIndex: 25,
            width: 'auto',
            pointerEvents: 'none',
            transform: isGateOpen ? 'translateX(100%)' : 'translateX(0)',
            opacity: isGateFading ? 0 : 1,
            transition: 'transform 2s ease-in-out, opacity 1s ease-out',
            filter: 'drop-shadow(-4px 0 8px rgba(0, 0, 0, 1))',
          }}
        >
          <img
            src="https://media.kirimkata.com/gate_right.png"
            alt="Gate Right"
            width={200}
            height={1920}
            className="h-full w-auto object-cover"
            loading="eager"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
          />
        </div>
      )}

      {/* Buka Undangan Button - Hanya muncul sekali */}
      {!hasOpenedOnce && (
        <div
          className="fixed bottom-10 left-1/2 -translate-x-1/2"
          style={{
            zIndex: 24, // Di depan cover, di belakang gate (gate z-25)
            pointerEvents: 'auto', // Pastikan button bisa diklik
          }}
        >
          <button
            onClick={onOpenInvitation}
            className="flex items-center gap-2 bg-[#7b5a45] hover:bg-[#6a4a39] text-white text-base font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            style={{
              padding: '5px 10px',
              minWidth: '10px',
              width: 'auto',
              cursor: 'pointer',
              pointerEvents: 'auto', // Pastikan button bisa diklik
              borderRadius: '5px',
            }}
          >
            <span aria-hidden="true" className="flex items-center">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current"
              >
                <path
                  d="M4 6H20C21.1 6 22 6.9 22 8V16C22 17.1 21.1 18 20 18H4C2.9 18 2 17.1 2 16V8C2 6.9 2.9 6 4 6Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M22 8L12 13L2 8"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span>Buka Undangan</span>
          </button>
        </div>
      )}
    </div>
  );
}
