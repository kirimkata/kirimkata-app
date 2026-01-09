'use client';

import Image from 'next/image';
import { getImage } from '@/config/imageConfig';
import { getDefaultTransitionValues } from '@/config/animationConfig';
import { animationConfig } from '@/config/animationConfig';
import { getCloudText } from '@/config/textConfig';
import { getCloudConfig } from '@/config/cloudConfig';
import { useInvitationContent } from '@/lib/contexts/InvitationContentContext';

interface Section6Props {
  currentSection: number;
  isTransitioning: boolean;
  isOpening: boolean;
  isDragging: boolean;
  dragProgress: number;
  section6WrapperScale: number;
  section6BgScale: number;
  section6BgX: number;
  section6BgY: number;
  section6CoupleScale: number;
  section6CoupleX: number;
  section6CoupleY: number;
  section6GrassScale: number;
  section6GrassY: number;
  section6GrassOpacity: number;
  section6NewCloudOpacity: number;
  section6NewCloudTop: number;
}

export default function Section6({
  currentSection,
  isTransitioning,
  isOpening,
  isDragging,
  dragProgress,
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
}: Section6Props) {
  const defaultTransition = getDefaultTransitionValues(animationConfig);
  const cloudVisual = getCloudConfig('5-6');
  const invitationContent = useInvitationContent();
  const defaultCloudText = getCloudText(cloudVisual.textKey);
  const dbClouds = invitationContent?.clouds as
    | Record<string, typeof defaultCloudText>
    | undefined;
  const cloudText = dbClouds?.[cloudVisual.textKey] ?? defaultCloudText;

  return (
    <div
      className="absolute inset-0"
      style={{
        zIndex: 70,
        // TIDAK ADA FADE - Section 6 langsung visible, hanya x, y, scale yang berubah
        opacity: dragProgress >= 5 ? 1 : 0,
        pointerEvents: dragProgress >= 5 ? 'auto' : 'none',
        visibility: dragProgress >= 5 ? 'visible' : 'hidden',
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
    >
      {/* Background Layer - 2.5D Parallax */}
      {/* Gate + Pengantin - Continue zoom out */}
      {/* Grass Layer - Bottom */}
    </div>
  );
}

