'use client';

import Image from 'next/image';
import { getImage } from '@/config/imageConfig';
import { geteventDetailsText } from '@/config/textConfig';
import { getDefaultTransitionValues } from '@/config/animationConfig';
import { animationConfig } from '@/config/animationConfig';
import { interpolate, easeInOutCubic } from '@/components/animation/animation-helpers';
import { getCloudConfig } from '@/config/cloudConfig';
import { useInvitationContent } from '@/lib/contexts/InvitationContentContext';
import { typographyConfig, getTypographyStyle } from '@/config/fontConfig';

const section4Typography = typographyConfig.animation.section4;

interface Section4Props {
  currentSection: number;
  isTransitioning: boolean;
  isOpening: boolean;
  isDragging: boolean;
  dragProgress: number;
  section4WrapperScale: number;
  section4BgScale: number;
  section4BgX: number;
  section4BgY: number;
  section4CoupleScale: number;
  section4CoupleX: number;
  section4CoupleY: number;
  section4GrassScale: number;
  section4GrassY: number;
  section4GrassOpacity: number;
  section4GradientOpacity: number;
  section4GroomTextOpacity: number;
}

export default function Section4({
  currentSection,
  isTransitioning,
  isOpening,
  isDragging,
  dragProgress,
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
}: Section4Props) {
  const cloudVisual = getCloudConfig('4-5');
  const invitationContent = useInvitationContent();
  const defaulteventDetailsText = geteventDetailsText();
  const eventDetailsText = invitationContent
    ? {
      holyMatrimony: {
        ...defaulteventDetailsText.holyMatrimony,
        ...invitationContent.eventDetails.holyMatrimony,
      },
      reception: {
        ...defaulteventDetailsText.reception,
        ...invitationContent.eventDetails.reception,
      },
      streaming: {
        ...defaulteventDetailsText.streaming,
        ...invitationContent.eventDetails.streaming,
      },
    }
    : defaulteventDetailsText;
  const defaultTransition = getDefaultTransitionValues(animationConfig);

  const clampedProgress = Math.max(0, Math.min(6, dragProgress));
  const progress34 = Math.max(0, Math.min(1, clampedProgress - 3));

  let section4Opacity = 0;
  if (dragProgress < 3) {
    section4Opacity = 0;
  } else if (dragProgress <= 4) {
    section4Opacity = 1;
  } else {
    const fadeOutStart = 4;
    const fadeOutEnd = 4.3;
    if (dragProgress >= fadeOutEnd) {
      section4Opacity = 0;
    } else {
      const t = (dragProgress - fadeOutStart) / (fadeOutEnd - fadeOutStart);
      section4Opacity = 1 - t;
    }
  }

  // Fade-in cloud (dan teks event) dimulai sedikit setelah masuk Section 4
  // progress34: 0.3 -> dragProgress ≈ 3.3
  //           ~0.9 -> dragProgress ≈ 3.9
  const cloudFadeStart = 0.3;
  const cloudFadeEnd = 0.9;
  const cloudMaxOpacity = cloudVisual.opacity.max;
  const cloudStartTop = -25;
  const cloudEndTop = cloudVisual.position.baseTopPercent;
  const cloudStaticScale = 1.008;

  let cloudOpacity = 0;
  let cloudScale = cloudStaticScale;
  let cloudTop = cloudStartTop;

  if (progress34 <= cloudFadeStart) {
    cloudOpacity = 0;
  } else if (progress34 <= cloudFadeEnd) {
    const cloudProgress = (progress34 - cloudFadeStart) / (cloudFadeEnd - cloudFadeStart);
    const cloudEased = easeInOutCubic(cloudProgress);
    cloudOpacity = interpolate(0, cloudMaxOpacity, cloudEased);
    cloudTop = interpolate(cloudStartTop, cloudEndTop, cloudEased);
  } else {
    cloudOpacity = cloudMaxOpacity;
    cloudTop = cloudEndTop;
  }

  // Exit phase: saat dragProgress > 4, cloudbig + teks event sedikit naik ke atas
  if (dragProgress > 4) {
    const liftStart = 4;
    const liftEnd = 4.3;
    const rawLiftT = (dragProgress - liftStart) / (liftEnd - liftStart);
    const liftT = Math.max(0, Math.min(1, rawLiftT));
    const liftOffset = -10 * liftT; // geser hingga ~10% ke atas
    cloudTop = cloudTop + liftOffset;
  }

  let textOpacity = 0;
  const textFadeStart = 0.4;
  const textFadeEnd = 0.9;

  if (progress34 <= textFadeStart) {
    textOpacity = 0;
  } else if (progress34 <= textFadeEnd) {
    const textProgress = (progress34 - textFadeStart) / (textFadeEnd - textFadeStart);
    const textEased = easeInOutCubic(textProgress);
    textOpacity = interpolate(0, 1, textEased);
  } else {
    textOpacity = 1;
  }

  return (
    <div
      className="absolute inset-0"
      style={{
        // Selama 3 <= dragProgress <= 4, Section 4 aktif penuh.
        // Setelah > 4, Section 4 melakukan fade-out singkat (4 -> 4.3) di atas Section 5.
        zIndex: dragProgress < 4 ? 50 : 65,
        opacity: section4Opacity,
        pointerEvents: section4Opacity > 0 ? 'auto' : 'none',
        visibility: section4Opacity > 0 ? 'visible' : 'hidden',
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
    >
      {/* Background Layer */}
      {/* Gate + Pengantin - Combined, zoom out to show full couple */}
      {/* Grass Layer - Bottom */}

      {/* Cloud Group - Fade in 80-100% with zoom in */}
      <div
        className="parallax-layer absolute left-1/2"
        style={{
          transform: `translateX(-50%) translate3d(0, 0, 0) scale(${cloudScale})`,
          WebkitTransform: `translateX(-50%) translate3d(0, 0, 0) scale(${cloudScale})`,
          zIndex: 60,
          top: `${cloudTop}%`,
          width: `${cloudVisual.width}px`,
          height: 'auto',
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
            willChange: 'opacity',
          }}
        >
          <Image
            src={getImage('cloudbig')}
            alt="Cloud"
            width={1200}
            height={600}
            className="w-full h-auto"
            quality={100}
          />
        </div>
      </div>

      {/* Event Details - Separate layer, full viewport width */}
      <div
        className="parallax-layer absolute inset-x-0"
        style={{
          opacity: textOpacity,
          zIndex: 61,
          top: `${cloudTop + 15}%`,
          paddingLeft: '5%',
          paddingRight: '5%',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        <div className="max-w-md mx-auto px-6 text-gray-800">
          {/* Holy Matrimony Section */}
          <div className="mb-5" style={{
            marginTop: '15px',
          }}>
            <h2
              className="mb-1"
              style={{
                color: '#8B7355',
                ...getTypographyStyle(section4Typography.title),
              }}
            >
              {eventDetailsText.holyMatrimony.title}
            </h2>
            <p
              className="mb-0.5"
              style={
                section4Typography.subtitle
                  ? getTypographyStyle(section4Typography.subtitle)
                  : {}
              }
            >
              {eventDetailsText.holyMatrimony.dateLabel}
            </p>
            <p
              className="mb-2"
              style={
                section4Typography.subtitle
                  ? getTypographyStyle(section4Typography.subtitle)
                  : {}
              }
            >
              {eventDetailsText.holyMatrimony.timeLabel}
            </p>

            <p
              className="mb-0.5"
              style={
                section4Typography.subtitle
                  ? getTypographyStyle(section4Typography.subtitle)
                  : {}
              }
            >
              {eventDetailsText.holyMatrimony.venueName}
            </p>
            <p
              className="mb-2"
              style={{
                whiteSpace: 'pre-line',
                ...(section4Typography.body
                  ? getTypographyStyle(section4Typography.body)
                  : {}),
              }}
            >
              {eventDetailsText.holyMatrimony.venueAddress}
            </p>

            <a
              href={eventDetailsText.holyMatrimony.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-[5px] text-white text-xs font-medium"
              style={{
                color: '#fff',
                backgroundColor: '#7b5a45',
                marginTop: '10px',
                padding: '5px 20px',
              }}
            >
              {eventDetailsText.holyMatrimony.mapsLabel}
            </a>
          </div>

          {/* Reception Section */}
          <div className="mb-5 text-right"
            style={{
              marginTop: '10px',
            }}>
            <h2
              className="mb-1"
              style={{
                color: '#8B7355',
                ...getTypographyStyle(section4Typography.title),
              }}
            >
              {eventDetailsText.reception.title}
            </h2>
            <p
              className="mb-0.5"
              style={
                section4Typography.subtitle
                  ? getTypographyStyle(section4Typography.subtitle)
                  : {}
              }
            >
              {eventDetailsText.reception.dateLabel}
            </p>
            <p
              className="mb-2"
              style={
                section4Typography.subtitle
                  ? getTypographyStyle(section4Typography.subtitle)
                  : {}
              }
            >
              {eventDetailsText.reception.timeLabel}
            </p>

            <p
              className="mb-0.5"
              style={
                section4Typography.subtitle
                  ? getTypographyStyle(section4Typography.subtitle)
                  : {}
              }
            >
              {eventDetailsText.reception.venueName}
            </p>
            <p
              className="mb-2"
              style={{
                whiteSpace: 'pre-line',
                ...(section4Typography.body
                  ? getTypographyStyle(section4Typography.body)
                  : {}),
              }}
            >
              {eventDetailsText.reception.venueAddress}
            </p>

            <a
              href={eventDetailsText.reception.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-[5px] text-white text-xs font-medium"
              style={{
                color: '#fff',
                backgroundColor: '#7b5a45',
                marginTop: '10px',
                padding: '5px 20px',
              }}
            >
              {eventDetailsText.reception.mapsLabel}
            </a>
          </div>

          {/* Live Streaming Section
          <div
            className="text-center pt-2"
            style={{
              marginTop: '24px',
            }}
          >
            <p className="text-xs mb-2 leading-relaxed whitespace-pre-line">
              {eventDetailsText.streaming.description}
            </p>

            <a
              href={eventDetailsText.streaming.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-[5px] text-white text-xs font-medium"
              style={{
                color: '#fff',
                backgroundColor: '#7b5a45',
                marginTop: '10px',
                padding: '5px 20px',
              }}
            >
              <span aria-hidden="true" className="flex items-center">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current"
                >
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                </svg>
              </span>
              {eventDetailsText.streaming.buttonLabel}
            </a>
          </div> */}
        </div>
      </div>
    </div>
  );
}

