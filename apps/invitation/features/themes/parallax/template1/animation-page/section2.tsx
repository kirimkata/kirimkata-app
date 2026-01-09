'use client';

import Image from 'next/image';
import { getBrideConfig } from '@/themes/parallax/parallax-template1/config/textConfig';
import { useInvitationContent } from '@/lib/contexts/InvitationContentContext';
import { typographyConfig, getTypographyStyle } from '@/themes/parallax/parallax-template1/config/fontConfig';

const section2Typography = typographyConfig.animation.section2;

interface Section2Props {
  currentSection: number;
  isTransitioning: boolean;
  isOpening: boolean;
  isDragging: boolean;
  dragProgress: number;
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
}

export default function Section2({
  currentSection,
  isTransitioning,
  isOpening,
  isDragging,
  dragProgress,
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
}: Section2Props) {
  const invitationContent = useInvitationContent();
  const defaultBride = getBrideConfig();
  const bride = invitationContent?.bride ?? defaultBride;
  const gradientFadeInStart = 1.6;
  const gradientFadeInEnd = 2.0;
  const gradientFadeOutStart = 3.0;
  const gradientFadeOutEnd = 3.4;

  let brideOverlayOpacity = 0;

  if (dragProgress <= gradientFadeInStart) {
    brideOverlayOpacity = 0;
  } else if (dragProgress < gradientFadeInEnd) {
    const t = (dragProgress - gradientFadeInStart) / (gradientFadeInEnd - gradientFadeInStart);
    brideOverlayOpacity = t;
  } else if (dragProgress <= gradientFadeOutStart) {
    brideOverlayOpacity = 1;
  } else if (dragProgress < gradientFadeOutEnd) {
    const t = (dragProgress - gradientFadeOutStart) / (gradientFadeOutEnd - gradientFadeOutStart);
    brideOverlayOpacity = 1 - t;
  } else {
    brideOverlayOpacity = 0;
  }

  const brideTextFadeInStart = 1.7;
  const brideTextFadeInEnd = 2.0;
  const brideTextFadeOutStart = 2.0;
  const brideTextFadeOutEnd = 2.5;

  const easeInOut = (t: number) => t * t * (3 - 2 * t);

  let brideTextOpacity = 0;
  let brideTextTranslateX = 50; // %, positif = geser ke kanan (di luar viewport)

  if (dragProgress <= brideTextFadeInStart) {
    brideTextOpacity = 0;
    brideTextTranslateX = 50;
  } else if (dragProgress < brideTextFadeInEnd) {
    const t = (dragProgress - brideTextFadeInStart) / (brideTextFadeInEnd - brideTextFadeInStart);
    const eased = easeInOut(t);
    brideTextOpacity = eased;
    // 1.6–1.9: teks masuk dari kanan (80%) ke posisi tengah (0%) dengan easing
    brideTextTranslateX = 50 * (1 - eased);
  } else if (dragProgress <= brideTextFadeOutStart) {
    brideTextOpacity = 1;
    brideTextTranslateX = 0;
  } else if (dragProgress < brideTextFadeOutEnd) {
    const t = (dragProgress - brideTextFadeOutStart) / (brideTextFadeOutEnd - brideTextFadeOutStart);
    const eased = easeInOut(t);
    brideTextOpacity = 1 - eased;
    // 2.1–2.4: teks keluar lagi ke kanan dari tengah (0%) ke 80% dengan easing
    brideTextTranslateX = 50 * eased;
  } else {
    brideTextOpacity = 0;
    brideTextTranslateX = 50;
  }

  const canInteract = currentSection === 2 && brideTextOpacity > 0;

  return (
    <div
      className="absolute inset-0"
      style={{
        // Selama 1 <= dragProgress < 2, Section 2 berada di bawah Section 3.
        // Setelah > 2, Section 2 sedikit dinaikkan zIndex-nya agar overlay Bride
        // bisa fade-out sebentar di atas Section 3 (mirip pola cloud Section 4).
        zIndex: dragProgress < 2 ? 30 : 45,
        // TIDAK ADA FADE - Section 2 langsung visible, hanya x, y, scale yang berubah
        opacity: dragProgress >= 1 ? 1 : 0, // Visible saat progress >= 1, hidden saat < 1
        // Wrapper scale: 1.0 (sama dengan Section 1 akhir) - tetap 1.0
        transform: `scale(${section2WrapperScale}) translateZ(0)`,
        WebkitTransform: `scale(${section2WrapperScale}) translateZ(0)`,
        pointerEvents: canInteract ? 'auto' : 'none',
        visibility: dragProgress >= 1 ? 'visible' : 'hidden', // Visible saat progress >= 1
        transformOrigin: 'center center',
      }}
    >
      {/* Background Layer */}
      {/* Gate + Pengantin - Combined, zoom together */}
      {/* Grass Layer - AWAL SAMA PERSIS DENGAN SECTION 1 AKHIR */}
      {/* Section 1 akhir: bottom: '-100px', width: '500px', translate3d(-50%, 0px, 0) scale(1.4) */}
      {/* Cloud Group - AWAL SAMA PERSIS DENGAN SECTION 1 AKHIR (sekarang dihandle oleh Section 1) */}

      {/* Bride Information Overlay - Fade in with gradient - REAL-TIME PROGRESS */}
      <div
        className="parallax-layer absolute inset-0 z-50"
        style={{
          opacity: brideOverlayOpacity,
          // Hapus CSS transition - opacity langsung mengikuti progress real-time
          // transition: isDragging ? 'none' : `opacity ${defaultTransition.duration}ms ${defaultTransition.easing}`,
          pointerEvents: 'none',
          willChange: 'opacity',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'translate3d(0, 0, 0)',
        }}
      >
        {/* Black Gradient Overlay - from bottom to top */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            background:
              'linear-gradient(to top, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.9) 20%, rgba(0, 0, 0, 0.6) 40%, rgba(0, 0, 0, 0) 60%)',
          }}
        />
        
        {/* Text Content */}
        <div
          className="absolute inset-x-0 bottom-20 flex flex-col items-center pointer-events-auto"
          style={{
            opacity: brideTextOpacity,
            transform: `translateX(${brideTextTranslateX}%)`,
            WebkitTransform: `translateX(${brideTextTranslateX}%)`,
          }}
        >
          <div className="text-center px-6">
            <h2
              className="mb-4 text-white"
              style={getTypographyStyle(section2Typography.title)}
            >
              {bride.name}
            </h2>
            <h3
              className="text-white/90 mb-6"
              style={
                section2Typography.subtitle
                  ? getTypographyStyle(section2Typography.subtitle)
                  : {}
              }
            >
              {bride.fullName}
            </h3>
            <div
              className="text-white/80 mb-4"
              style={
                section2Typography.body
                  ? getTypographyStyle(section2Typography.body)
                  : {}
              }
            >
              <p>Putri dari</p>
              <p className="font-medium">{bride.fatherName} &</p>
              <p className="font-medium">{bride.motherName}</p>
            </div>
            <a
              href={`https://instagram.com/${bride.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center rounded-lg border border-white/80 bg-white/10 text-sm hover:bg-white/20 transition-colors"
              style={{
                padding: '5px 5px',
                gap: '8px',
              }}
            >
              <span
                className="font-medium text-white"
                style={
                  section2Typography.body
                    ? getTypographyStyle(section2Typography.body)
                    : {}
                }
              >
                @{bride.instagram}
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

