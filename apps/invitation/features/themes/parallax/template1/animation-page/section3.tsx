'use client';

import Image from 'next/image';
import { getImage } from '@/themes/parallax/parallax-template1/config/imageConfig';
import { getBrideConfig, getGroomConfig } from '@/themes/parallax/parallax-template1/config/textConfig';
import { getDefaultTransitionValues, animationConfig } from '@/themes/parallax/parallax-template1/config/animationConfig';
import { useInvitationContent } from '@/lib/contexts/InvitationContentContext';
import { typographyConfig, getTypographyStyle } from '@/themes/parallax/parallax-template1/config/fontConfig';

const section3Typography = typographyConfig.animation.section3;

interface Section3Props {
  currentSection: number;
  isTransitioning: boolean;
  isOpening: boolean;
  isDragging: boolean;
  dragProgress: number;
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
}

export default function Section3({
  currentSection,
  isTransitioning,
  isOpening,
  isDragging,
  dragProgress,
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
}: Section3Props) {
  const invitationContent = useInvitationContent();
  const defaultBride = getBrideConfig();
  const defaultGroom = getGroomConfig();
  const bride = invitationContent?.bride ?? defaultBride;
  const groom = invitationContent?.groom ?? defaultGroom;
  const defaultTransition = getDefaultTransitionValues(animationConfig);
  // Nonaktifkan gradient hitam di Section 3 untuk menghindari duplikasi dengan Section 4
  const gradientOpacity = 0;
  const groomFadeInStart = 2.6;
  const groomFadeInEnd = 3.0;
  const groomFadeOutStart = 3.0;
  const groomFadeOutEnd = 3.3;

  const easeInOut = (t: number) => t * t * (3 - 2 * t);

  let groomTextOpacity = 0;
  let groomTextTranslateX = -50; // %, negatif = geser ke kiri (di luar viewport)

  if (dragProgress <= groomFadeInStart) {
    groomTextOpacity = 0;
    groomTextTranslateX = -50;
  } else if (dragProgress < groomFadeInEnd) {
    const t = (dragProgress - groomFadeInStart) / (groomFadeInEnd - groomFadeInStart);
    const eased = easeInOut(t);
    groomTextOpacity = eased;
    // 2.7–2.9: teks Groom masuk dari kiri (-80%) ke posisi tengah (0%) dengan easing
    groomTextTranslateX = -50 * (1 - eased);
  } else if (dragProgress <= groomFadeOutStart) {
    groomTextOpacity = 1;
    groomTextTranslateX = 0;
  } else if (dragProgress < groomFadeOutEnd) {
    const t = (dragProgress - groomFadeOutStart) / (groomFadeOutEnd - groomFadeOutStart);
    const eased = easeInOut(t);
    groomTextOpacity = 1 - eased;
    // 3.1–3.4: teks Groom keluar lagi ke kiri dari tengah (0%) ke -80% dengan easing
    groomTextTranslateX = -50 * eased;
  } else {
    groomTextOpacity = 0;
    groomTextTranslateX = -50;
  }

  const canInteract = groomTextOpacity > 0;

  return (
    <div
      className="absolute inset-0"
      style={{
        // Section 3 (Groom) berada di layer tetap zIndex 50 selama aktif
        zIndex: 50,
        // TIDAK ADA FADE - Section 3 langsung visible, hanya x, y, scale yang berubah
        opacity: dragProgress >= 2 ? 1 : 0,
        pointerEvents: canInteract ? 'auto' : 'none', // Hanya aktif saat teks Groom terlihat
        visibility: dragProgress >= 2 ? 'visible' : 'hidden', // Tambahkan visibility untuk memastikan tidak memblokir
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
    >
      {/* Black Gradient Overlay - Visible from start (continues from S2) */}
      <div
        className="parallax-layer absolute inset-0 z-40"
        style={{
          opacity: gradientOpacity,
          pointerEvents: 'none',
          willChange: 'opacity',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            background:
              'linear-gradient(to top, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.9) 20%, rgba(0, 0, 0, 0.6) 40%, rgba(0, 0, 0, 0) 60%)',
          }}
        />
      </div>

      {/* Groom Information Text - Fade in/out with horizontal slide */}
      <div
        className="parallax-layer absolute inset-0 z-50"
        style={{
          opacity: groomTextOpacity,
          pointerEvents: 'none',
          willChange: 'opacity',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        <div
          className="absolute inset-x-0 bottom-20 flex flex-col items-center pointer-events-auto"
          style={{
            transform: `translateX(${groomTextTranslateX}%)`,
            WebkitTransform: `translateX(${groomTextTranslateX}%)`,
          }}
        >
          <div className="text-center px-6">
            <h2
              className="mb-4 text-white"
              style={getTypographyStyle(section3Typography.title)}
            >
              {groom.name}
            </h2>
            <h3
              className="text-white/90 mb-6"
              style={
                section3Typography.subtitle
                  ? getTypographyStyle(section3Typography.subtitle)
                  : {}
              }
            >
              {groom.fullName}
            </h3>
            <div
              className="text-white/80 mb-4"
              style={
                section3Typography.body
                  ? getTypographyStyle(section3Typography.body)
                  : {}
              }
            >
              <p>Putra dari</p>
              <p className="font-medium">{groom.fatherName} &</p>
              <p className="font-medium">{groom.motherName}</p>
            </div>
            <a
              href={`https://instagram.com/${groom.instagram}`}
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
                  section3Typography.body
                    ? getTypographyStyle(section3Typography.body)
                    : {}
                }
              >
                @{groom.instagram}
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

