'use client';

import Image from 'next/image';
import { getImage } from '@/config/imageConfig';
import { getCloudText } from '@/config/textConfig';
import { getDefaultTransitionValues } from '@/config/animationConfig';
import { animationConfig } from '@/config/animationConfig';
import { interpolate, easeInOutCubic, easeInOutQuint } from '@/components/animation/animation-helpers';
import { getCloudConfig } from '@/config/cloudConfig';
import { useInvitationContent } from '@/lib/contexts/InvitationContentContext';
import { typographyConfig, getTypographyStyle } from '@/config/fontConfig';

const section5Typography = typographyConfig.animation.section5;

interface Section5Props {
  currentSection: number;
  isTransitioning: boolean;
  isOpening: boolean;
  isDragging: boolean;
  dragProgress: number;
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
}

export default function Section5({
  currentSection,
  isTransitioning,
  isOpening,
  isDragging,
  dragProgress,
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
}: Section5Props) {
  const oldCloudVisual = getCloudConfig('4-5');
  const newCloudVisual = getCloudConfig('5-6');
  const invitationContent = useInvitationContent();
  const defaultNewCloudText = getCloudText(newCloudVisual.textKey);
  const dbClouds = invitationContent?.clouds as
    | Record<string, typeof defaultNewCloudText>
    | undefined;
  const newCloudText = dbClouds?.[newCloudVisual.textKey] ?? defaultNewCloudText;
  const defaultTransition = getDefaultTransitionValues(animationConfig);

  const clampedProgress = Math.max(0, Math.min(6, dragProgress));
  const progress45 = Math.max(0, Math.min(1, clampedProgress - 4));

  const oldCloudStaticScale = 1.008;
  const oldCloudStartY = 0;
  const oldCloudEndY = -200;

  let oldCloudOpacity = 0;
  let oldCloudScale = oldCloudStaticScale;
  let oldCloudY = oldCloudEndY;

  if (progress45 <= 0.3) {
    const fadeProgress = progress45 / 0.3;
    const fadeEased = easeInOutCubic(fadeProgress);
    oldCloudOpacity = interpolate(1, 0, fadeEased);
    oldCloudY = interpolate(oldCloudStartY, oldCloudEndY, fadeEased);
  } else {
    oldCloudOpacity = 0;
    oldCloudY = oldCloudEndY;
  }

  // Opacity Section 5 (mirip pola Section 4):
  // 4 <= dragProgress <= 5  : full
  // 5 <  dragProgress <= 5.3: fade-out di atas Section 6
  let section5Opacity = 0;
  if (dragProgress < 4) {
    section5Opacity = 0;
  } else if (dragProgress <= 5) {
    section5Opacity = 1;
  } else {
    const fadeOutStart = 5;
    const fadeOutEnd = 5.3;
    if (dragProgress >= fadeOutEnd) {
      section5Opacity = 0;
    } else {
      const t = (dragProgress - fadeOutStart) / (fadeOutEnd - fadeOutStart);
      section5Opacity = 1 - t;
    }
  }

  const newCloudMaxOpacity = newCloudVisual.opacity.max;
  let newCloudOpacity = 0;
  let newCloudTopPercent = newCloudVisual.position.baseTopPercent;

  if (progress45 <= 0.4) {
    newCloudOpacity = 0;
  } else if (progress45 <= 0.8) {
    const fadeProgress = (progress45 - 0.4) / 0.4;
    const fadeEased = easeInOutCubic(fadeProgress);
    newCloudOpacity = interpolate(0, newCloudMaxOpacity, fadeEased);
  } else {
    newCloudOpacity = newCloudMaxOpacity;
  }

  // Exit phase: saat dragProgress > 5, cloud kecil 5-6 sedikit naik sambil fade-out
  if (dragProgress > 5) {
    const liftStart = 5;
    const liftEnd = 5.3;
    const rawLiftT = (dragProgress - liftStart) / (liftEnd - liftStart);
    const liftT = Math.max(0, Math.min(1, rawLiftT));
    const liftOffset = -10 * liftT; // geser hingga ~10% ke atas
    newCloudTopPercent = newCloudTopPercent + liftOffset;
  }

  if (clampedProgress >= 5) {
    oldCloudOpacity = 0;
  }

  return (
    <div
      className="absolute inset-0"
      style={{
        // Selama 4 <= dragProgress <= 5, Section 5 aktif penuh.
        // Setelah > 5, Section 5 melakukan fade-out singkat (5 -> 5.3) di atas Section 6.
        zIndex: dragProgress < 5 ? 60 : 75,
        opacity: section5Opacity,
        pointerEvents: dragProgress >= 4 && dragProgress < 5 ? 'auto' : 'none',
        visibility: section5Opacity > 0 ? 'visible' : 'hidden',
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
    >
      {/* Background Layer - 2.5D Parallax */}
      {/* Gate + Pengantin - Zoom out and move to bottom */}
      {/* Grass Layer - Bottom */}
      {/* Old Cloud Group - Fade out 0-30% */}
      {/* Event Details - Separate layer, full viewport width */}

      {/* New Cloud - Enters from top 40-80% */}
      <div
        className="parallax-layer absolute left-1/2 -translate-x-1/2"
        style={{
          opacity: newCloudOpacity,
          top: `${newCloudTopPercent}%`,
          zIndex: 60,
          width: `${newCloudVisual.width}px`,
          height: 'auto',
          willChange: 'opacity, top',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        <div className="relative w-full">
          <Image
            src={getImage('cloud', '/cloud.png')}
            alt="New Cloud"
            width={1200}
            height={600}
            className="w-full h-auto"
            quality={100}
          />
        </div>
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: '80%',
            paddingLeft: '10%',
            paddingRight: '10%',
          }}
        >
          <div className="text-center px-6">
            {newCloudText?.title && (
              <h1
                className="text-gray-800 mb-2"
                style={getTypographyStyle(section5Typography.title)}
              >
                {newCloudText.title}
              </h1>
            )}
            <p
              className="text-gray-800 leading-relaxed"
              style={{
                marginTop: '10%',
                ...(section5Typography.subtitle
                  ? getTypographyStyle(section5Typography.subtitle)
                  : {}),
              }}
            >
              {newCloudText?.subtitle || 'To Our Wedding'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

