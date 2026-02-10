'use client';

import Image from 'next/image';
import { getImage } from '@/themes/parallax/parallax-template1/config/imageConfig';
import { getCloudText } from '@/themes/parallax/parallax-template1/config/textConfig';
import { getTransitionValuesForSection, getDefaultTransitionValues, animationConfig } from '@/themes/parallax/parallax-template1/config/animationConfig';
import { getCloudConfig } from '@/themes/parallax/parallax-template1/config/cloudConfig';
import { useInvitationContent } from '@/lib/contexts/InvitationContentContext';
import { typographyConfig, getTypographyStyle } from '@/themes/parallax/parallax-template1/config/fontConfig';

const section1Typography = typographyConfig.animation.section1;

interface Section1Props {
  currentSection: number;
  isTransitioning: boolean;
  isOpening: boolean;
  isDragging: boolean;
  dragProgress: number;
  section1Scale: number;
  parallaxValues: {
    bgTranslateY: number;
    coupleTranslateY: number;
    grassTranslateY: number;
    cloudTranslateY: number;
  };
}

export default function Section1({
  currentSection,
  isTransitioning,
  isOpening,
  isDragging,
  dragProgress,
  section1Scale,
  parallaxValues,
}: Section1Props) {
  const cloudVisual = getCloudConfig('0-1');
  const invitationContent = useInvitationContent();
  const defaultCloudText = getCloudText(cloudVisual.textKey);

  const dbClouds = invitationContent?.greetings as
    | Record<string, typeof defaultCloudText>
    | undefined;
  const mergedCloudText = {
    ...defaultCloudText,
    ...(dbClouds?.[cloudVisual.textKey] ?? {}),
  };

  const brideText =
    mergedCloudText.brideText ??
    invitationContent?.bride?.name ??
    defaultCloudText.brideText;

  const groomText =
    mergedCloudText.groomText ??
    invitationContent?.groom?.name ??
    defaultCloudText.groomText;

  const cloudText = {
    ...mergedCloudText,
    brideText,
    groomText,
  };
  const defaultTransition = getDefaultTransitionValues(animationConfig);

  // Normalized progress untuk transisi Cover (0) -> Section 1 (1)
  // Digunakan untuk menyatukan fade & transform berdasarkan satu sumber kebenaran (dragProgress)
  const progress01 = Math.max(0, Math.min(1, dragProgress));

  const cloudBaseScale = 0.6;
  const cloudStartScale = cloudBaseScale * 0.5;
  const cloudScale = cloudStartScale + (cloudBaseScale
    - cloudStartScale) * progress01;

  const cloudMinOpacity = cloudVisual.opacity.min;
  const cloudMaxOpacity = cloudVisual.opacity.max;
  const cloudOpacity = cloudMinOpacity + (cloudMaxOpacity - cloudMinOpacity) * progress01;

  const fadeStart = 1;
  const fadeEnd = 1.3;
  let sectionOpacity = dragProgress >= 1 ? 1 : progress01;
  if (dragProgress > fadeStart) {
    if (dragProgress >= fadeEnd) {
      sectionOpacity = 0;
    } else {
      const t = (dragProgress - fadeStart) / (fadeEnd - fadeStart);
      sectionOpacity = 1 - t;
    }
  }

  const heroEntranceOffset = (1 - progress01) * 40;
  const heroEntranceOpacity = sectionOpacity;

  return (
    <div
      className="absolute inset-0"
      style={{
        zIndex: 25,
        // Opacity Section 1: fade in dari Cover (0->1), tapi TIDAK fade out saat ke Section 2
        // progress = 0   -> opacity = 0  (belum muncul)
        // progress >= 1  -> opacity = 1  (full Section 1, tetap visible saat Section 2 muncul)
        opacity: sectionOpacity,
        // Transform dihandle oleh JS untuk parallax effects (scale + hardware acceleration)
        transform: 'scale(1) translateZ(0)',
        WebkitTransform: 'scale(1) translateZ(0)',
        pointerEvents: currentSection === 1 && !isTransitioning && !isDragging ? 'auto' : 'none',
        visibility: currentSection === 1 || isTransitioning || dragProgress > 0 ? 'visible' : 'hidden',
        transformOrigin: 'center center',
      }}
    >
      {/* Background Layer - Parallax Y movement */}
      {/* Gate + Pengantin - Parallax Y movement */}
      {/* Grass Layer - Parallax Y movement */}
      {/* Cloud + Welcome Text - Parallax Y movement */}
      <div
        className="parallax-layer absolute left-1/2"
        style={{
          transform: `translate3d(-50%, ${parallaxValues.cloudTranslateY}px, 0) scale(${cloudScale})`,
          WebkitTransform: `translate3d(-50%, ${parallaxValues.cloudTranslateY}px, 0) scale(${cloudScale})`,
          // Hapus CSS transition - animasi dihandle oleh JS state updates
          zIndex: 10,
          top: `${cloudVisual.position.baseTopPercent}%`,
          width: `${cloudVisual.width}px`,
          height: 'auto',
          transformOrigin: 'top center',
          WebkitTransformOrigin: 'top center',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        {/* Cloud Image */}
        <div
          className="relative w-full"
          style={{
            opacity: cloudOpacity,
            transform: 'translate3d(0, 0, 0)',
            WebkitTransform: 'translate3d(0, 0, 0)',
            backfaceVisibility: 'hidden',
            willChange: 'opacity',
          }}
        >
          <Image
            src={getImage('cloud', '/cloudsmall.webp')}
            alt="Cloud"
            width={1200}
            height={600}
            className="w-full h-auto"
            quality={100}
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            style={{
              transform: 'translate3d(0, 0, 0)',
              WebkitTransform: 'translate3d(0, 0, 0)',
            }}
          />
        </div>

        {/* Welcome Text - Positioned on top of cloud */}
        <div
          className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2" //turunkan text dalam cloud
          style={{
            width: '90%',
            opacity: 1,
            willChange: 'transform',
            backfaceVisibility: 'hidden',
          }}
        >
          <div className="text-center px-6">
            <h1
              className="text-white mb-2 whitespace-pre-line"
              style={getTypographyStyle(section1Typography.title)}
            >
              {cloudText.title}
            </h1>
            <p
              className="text-white whitespace-pre-line"
              style={
                section1Typography.subtitle
                  ? getTypographyStyle(section1Typography.subtitle)
                  : {}
              }
            >
              {cloudText.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Bride & Groom Text */}
      {(cloudText.brideText || cloudText.groomText) && (
        <div
          className="absolute left-1/2"
          style={{
            top: '25%',
            transform: `translate3d(-50%, ${heroEntranceOffset}px, 0)`,
            WebkitTransform: `translate3d(-50%, ${heroEntranceOffset}px, 0)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            opacity: heroEntranceOpacity,
            transition: 'opacity 0.4s ease-out',
            willChange: 'transform, opacity',
          }}
        >
          {/* Initials Background
          {cloudText.brideText && cloudText.groomText && (
            <div
              style={{
                position: 'absolute',
                top: '10%',
                transform: 'translateY(-50%)',
                fontFamily: 'Cormorant',
                fontSize: 'clamp(3rem, 18vw, 9rem)',
                fontWeight: 200,
                color: 'rgba(255,255,255,0.15)',
                letterSpacing: '0.1em',
                display: 'flex',
                gap: '12px',
                pointerEvents: 'none',
              }}
            >
              <span>{cloudText.brideText.slice(0, 1).toUpperCase()}</span>
              <span>{cloudText.groomText.slice(0, 1).toUpperCase()}</span>
            </div>
          )} */}

          {/* The Wedding Of Title */}
          <h1
            style={{
              textAlign: 'center',
              width: '100%',
              marginBottom: '6px',
              ...(section1Typography.theWeddingOf
                ? getTypographyStyle(section1Typography.theWeddingOf)
                : { color: '#f3f2f0' }),
            }}
          >

          </h1>

          {/* Names
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
            }}
          >
            {cloudText.brideText && (
              <span
                style={{
                  ...(section1Typography.brideGroom
                    ? getTypographyStyle(section1Typography.brideGroom)
                    : { color: '#fff' }),
                }}
              >
                {cloudText.brideText.toUpperCase()}
              </span>
            )}
            {cloudText.brideText && cloudText.groomText && (
              <span
                style={{
                  ...(section1Typography.brideGroom
                    ? getTypographyStyle(section1Typography.brideGroom)
                    : { color: '#fff' }),
                }}
              >
                &
              </span>
            )}
            {cloudText.groomText && (
              <span
                style={{
                  ...(section1Typography.brideGroom
                    ? getTypographyStyle(section1Typography.brideGroom)
                    : { color: '#fff' }),
                }}
              >
                {cloudText.groomText.toUpperCase()}
              </span>
            )}
          </div> */}
        </div>
      )}
    </div>
  );
}
