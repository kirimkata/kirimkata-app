'use client';

import Image from 'next/image';
import { getImage, getCoupleGroupPosition } from '@/themes/parallax/parallax-template1/config/imageConfig';
import { SECTION_LAYOUTS } from '@/themes/parallax/parallax-template1/config/sectionLayoutConfig';
import { GUNUNGAN_CONFIG } from '@/themes/parallax/parallax-template1/config/gununganConfig';
import { LAYER_VISIBILITY_CONFIG } from '@/themes/parallax/parallax-template1/config/layerVisibilityConfig';
import { BACKGROUND_OVERLAY_CONFIG } from '@/themes/parallax/parallax-template1/config/backgroundOverlayConfig';
import type { SectionAnimationValues } from '@/hooks/useSectionAnimation';

interface ParallaxSceneProps {
  dragProgress: number;
  animationValues: SectionAnimationValues;
}

export default function ParallaxScene({
  dragProgress,
  animationValues,
}: ParallaxSceneProps) {
  const {
    parallaxValues,
    section1Scale,
    section2BgScale,
    section2BgX,
    section2BgY,
    section2CoupleScale,
    section2CoupleX,
    section2CoupleY,
    section3BgScale,
    section3BgX,
    section3BgY,
    section3CoupleScale,
    section3CoupleX,
    section3CoupleY,
    section4BgScale,
    section4BgX,
    section4BgY,
    section4CoupleScale,
    section4CoupleX,
    section4CoupleY,
    section5BgScale,
    section5BgX,
    section5BgY,
    section5CoupleScale,
    section5CoupleX,
    section5CoupleY,
    section6BgScale,
    section6BgX,
    section6BgY,
    section6CoupleScale,
    section6CoupleX,
    section6CoupleY,
    section2GrassScale,
    section2GrassY,
    section2GrassOpacity,
    section4GrassScale,
    section4GrassY,
    section4GrassOpacity,
    section5GrassScale,
    section5GrassY,
    section5GrassOpacity,
    section6GrassScale,
    section6GrassY,
    section6GrassOpacity,
  } = animationValues;

  const p = dragProgress;

  const coupleLayout1 = SECTION_LAYOUTS[1].couple;

  // Background transform berdasarkan progress
  const bgLayout1 = SECTION_LAYOUTS[1].background;

  let bgScale = bgLayout1.scale;
  let bgX = bgLayout1.x;
  let bgY = bgLayout1.y + parallaxValues.bgTranslateY;

  if (p < 1) {
    const progress01 = Math.max(0, Math.min(1, p));
    const initialBgX = 0;
    const initialBgY = 0;

    bgX = initialBgX + (bgLayout1.x - initialBgX) * progress01;
    bgY = initialBgY + (bgLayout1.y - initialBgY) * progress01 + parallaxValues.bgTranslateY;
  } else if (p >= 1 && p < 2) {
    bgScale = section2BgScale;
    bgX = section2BgX;
    bgY = section2BgY;
  } else if (p >= 2 && p < 3) {
    bgScale = section3BgScale;
    bgX = section3BgX;
    bgY = section3BgY;
  } else if (p >= 3 && p < 4) {
    bgScale = section4BgScale;
    bgX = section4BgX;
    bgY = section4BgY;
  } else if (p >= 4 && p < 5) {
    bgScale = section5BgScale;
    bgX = section5BgX;
    bgY = section5BgY;
  } else if (p >= 5) {
    bgScale = section6BgScale;
    bgX = section6BgX;
    bgY = section6BgY;
  }

  // Couple (gate + pengantin + grass_pengantin) transform berdasarkan progress
  let coupleScale = coupleLayout1.scale;
  let coupleX = coupleLayout1.x;
  let coupleY = coupleLayout1.y + parallaxValues.coupleTranslateY;

  if (p >= 1 && p < 2) {
    coupleScale = section2CoupleScale;
    coupleX = section2CoupleX;
    coupleY = section2CoupleY;
  } else if (p >= 2 && p < 3) {
    coupleScale = section3CoupleScale;
    coupleX = section3CoupleX;
    coupleY = section3CoupleY;
  } else if (p >= 3 && p < 4) {
    coupleScale = section4CoupleScale;
    coupleX = section4CoupleX;
    coupleY = section4CoupleY;
  } else if (p >= 4 && p < 5) {
    coupleScale = section5CoupleScale;
    coupleX = section5CoupleX;
    coupleY = section5CoupleY;
  } else if (p >= 5) {
    coupleScale = section6CoupleScale;
    coupleX = section6CoupleX;
    coupleY = section6CoupleY;
  }

  // Grass bawah (foreground) transform berdasarkan progress
  let grassScale = 1.4;
  let grassY = parallaxValues.grassTranslateY;
  let grassOpacity = 1;

  if (p >= 1 && p < 3) {
    grassScale = section2GrassScale;
    grassY = section2GrassY;
    grassOpacity = section2GrassOpacity;
  } else if (p >= 3 && p < 4) {
    grassScale = section4GrassScale;
    grassY = section4GrassY;
    grassOpacity = section4GrassOpacity;
  } else if (p >= 4 && p < 5) {
    grassScale = section5GrassScale;
    grassY = section5GrassY;
    grassOpacity = section5GrassOpacity;
  } else if (p >= 5) {
    grassScale = section6GrassScale;
    grassY = section6GrassY;
    grassOpacity = section6GrassOpacity;
  }

  // Wrapper scale untuk transisi Section 1 (0 -> 1)
  const wrapperScale = p <= 1 ? section1Scale : 1;

  // Couple group internal layout scales (to keep visual size after width updates)
  const gateGroupBase = getCoupleGroupPosition('gate');
  const gateGroupScale = gateGroupBase?.scale ?? 1;
  const { scale: _gateScale, ...gateGroupStyle } = gateGroupBase || {};

  const pengantinGroupBase = getCoupleGroupPosition('pengantin');
  const pengantinGroupScale = pengantinGroupBase?.scale ?? 1;
  const { scale: _pengantinScale, ...pengantinGroupStyle } = pengantinGroupBase || {};

  const grassPengantinGroupBase = getCoupleGroupPosition('grass_pengantin');
  const grassPengantinGroupScale = grassPengantinGroupBase?.scale ?? 1;
  const { scale: _grassPengantinScale, ...grassPengantinGroupStyle } = grassPengantinGroupBase || {};

  const gununganLeftBase = getCoupleGroupPosition('gunungan_left');
  const gununganLeftScale = gununganLeftBase?.scale ?? 1;
  const { scale: _gununganLeftScale, ...gununganLeftStyle } = gununganLeftBase || {};

  const gununganRightBase = getCoupleGroupPosition('gunungan_right');
  const gununganRightScale = gununganRightBase?.scale ?? 1;
  const { scale: _gununganRightScale, ...gununganRightStyle } = gununganRightBase || {};

  const gununganLeft2Base = getCoupleGroupPosition('gunungan_left2');
  const gununganLeft2Scale = gununganLeft2Base?.scale ?? 1;
  const { scale: _gununganLeft2Scale, ...gununganLeft2Style } = gununganLeft2Base || {};

  const gununganRight2Base = getCoupleGroupPosition('gunungan_right2');
  const gununganRight2Scale = gununganRight2Base?.scale ?? 1;
  const { scale: _gununganRight2Scale, ...gununganRight2Style } = gununganRight2Base || {};

  const gununganLeft3Base = getCoupleGroupPosition('gunungan_left3');
  const gununganLeft3Scale = gununganLeft3Base?.scale ?? 1;
  const { scale: _gununganLeft3Scale, ...gununganLeft3Style } = gununganLeft3Base || {};

  const gununganRight3Base = getCoupleGroupPosition('gunungan_right3');
  const gununganRight3Scale = gununganRight3Base?.scale ?? 1;
  const { scale: _gununganRight3Scale, ...gununganRight3Style } = gununganRight3Base || {};

  // Parallax depth untuk gunungan (lebih dekat bergerak sedikit lebih banyak)
  const clampedP = Math.max(0, Math.min(6, p));
  const maxSegment = 5;

  // Overlay fade-in berdasarkan progress 0→1
  let overlayOpacity = 0;
  if (BACKGROUND_OVERLAY_CONFIG.enabled) {
    if (clampedP <= 0) {
      overlayOpacity = 0;
    } else if (clampedP < 1) {
      const t = clampedP; // 0..1
      overlayOpacity = BACKGROUND_OVERLAY_CONFIG.opacity * t;
    } else {
      overlayOpacity = BACKGROUND_OVERLAY_CONFIG.opacity;
    }
  }

  // progress01 (0→1): TIDAK ada depth, pose Section1 akhir murni dari config
  // progress >= 1: depth hanya muncul di dalam transisi antar section (1→2, 2→3, dst)
  // dengan nilai 0 di batas integer (1,2,3,...) agar pose setiap section tetap murni config
  let segmentShape = 0;
  if (clampedP >= 5 && clampedP <= 6) {
    // progress56 (5→6): S-curve 0→1, 5.0=0, 6.0=1
    const t56 = clampedP - 5; // 0..1
    const t = Math.max(0, Math.min(1, t56));
    segmentShape = t * t * (3 - 2 * t);
  } else if (clampedP > 1 && clampedP < 5) {
    // Segmen lain (1→2,2→3,3→4,4→5): 0→1→0
    const segmentIndex = Math.min(Math.floor(clampedP), maxSegment);
    const segmentT = clampedP - segmentIndex; // 0..1 di dalam segmen
    segmentShape = 4 * segmentT * (1 - segmentT);
  }

  // Opacity gunungan per section & progress
  // - Section1 (0–1): selalu terlihat penuh
  // - Progress12 (1–2): fade out hanya pada 90–100% (p=1.9–2.0)
  // - Section3 & 4 (2–4): hilang
  // - Section5 & 6 (>=4): langsung muncul penuh tanpa fade-in
  let gununganOpacity = 1;
  if (p >= 1 && p < 2) {
    const progress12 = p - 1; // 0..1
    if (progress12 < 0.9) {
      // 0–90%: masih penuh
      gununganOpacity = 1;
    } else {
      // 90–100%: fade out 1→0
      const localT = (progress12 - 0.9) / 0.1; // 0..1 pada 0.9..1.0
      const t = Math.max(0, Math.min(1, localT));
      gununganOpacity = 1 - t;
    }
  } else if (p >= 2 && p < 4) {
    gununganOpacity = 0;
  } else if (p >= 4) {
    gununganOpacity = 1;
  }

  const computeDepthFactor = (scale: number) => Math.max(0, (scale - 1) * 3);

  const gununganDepth1 = computeDepthFactor(gununganLeftScale);
  const gununganDepth2 = computeDepthFactor(gununganLeft2Scale);
  const gununganDepth3 = computeDepthFactor(gununganLeft3Scale);

  const depthAmplitudeX = 0.25;
  const depthAmplitudeY = 0.15;
  const depthAmplitudeScale = 0.1;

  const gununganLayer1Scale = coupleScale * (1 + gununganDepth1 * depthAmplitudeScale * segmentShape);
  const gununganLayer1X = coupleX * (1 + gununganDepth1 * depthAmplitudeX * segmentShape);
  const gununganLayer1Y = coupleY * (1 + gununganDepth1 * depthAmplitudeY * segmentShape);

  const gununganLayer2Scale = coupleScale * (1 + gununganDepth2 * depthAmplitudeScale * segmentShape);
  const gununganLayer2X = coupleX * (1 + gununganDepth2 * depthAmplitudeX * segmentShape);
  const gununganLayer2Y = coupleY * (1 + gununganDepth2 * depthAmplitudeY * segmentShape);

  const gununganLayer3Scale = coupleScale * (1 + gununganDepth3 * depthAmplitudeScale * segmentShape);
  const gununganLayer3X = coupleX * (1 + gununganDepth3 * depthAmplitudeX * segmentShape);
  const gununganLayer3Y = coupleY * (1 + gununganDepth3 * depthAmplitudeY * segmentShape);

  // Cross-fade progress between Section 3 and 4
  const progress34 = Math.max(0, Math.min(1, clampedP - 3));

  let bgPadangOpacity = 1;
  let bgLimasanOpacity = 0;
  let pengantinFadliOpacity = 1;
  let fadliJawaOpacity = 0;

  if (clampedP >= 3 && clampedP <= 4) {
    // Background always cross-fades sepanjang progress34 0..1
    bgPadangOpacity = 1 - progress34;
    bgLimasanOpacity = progress34;

    // Couple cross-fade hanya di phase3 (progress34 ≈ 0.4..1.0)
    const coupleFadeStart34 = 0.4;
    const coupleFadeEnd34 = 1.0;

    let coupleT = 0;
    if (progress34 > coupleFadeStart34) {
      const rawT = (progress34 - coupleFadeStart34) / (coupleFadeEnd34 - coupleFadeStart34);
      coupleT = Math.max(0, Math.min(1, rawT));
    }

    pengantinFadliOpacity = 1 - coupleT;
    fadliJawaOpacity = coupleT;
  } else if (clampedP > 4) {
    bgPadangOpacity = 0;
    bgLimasanOpacity = 1;
    pengantinFadliOpacity = 0;
    fadliJawaOpacity = 1;
  }

  return (
    <div
      className="absolute inset-0"
      style={{
        zIndex: 15,
        pointerEvents: 'none',
        transform: `scale(${wrapperScale}) translateZ(0)`,
        WebkitTransform: `scale(${wrapperScale}) translateZ(0)`,
        transformOrigin: 'center center',
      }}
    >
      {/* Background Layer - shared */}
      {LAYER_VISIBILITY_CONFIG.background && (
        <div
          className="parallax-layer absolute inset-0 w-full h-full"
          style={{
            transform: `scale(${bgScale}) translate(${bgX}px, ${bgY}px) translate3d(0, 0, 0)`,
            WebkitTransform: `scale(${bgScale}) translate(${bgX}px, ${bgY}px) translate3d(0, 0, 0)`,
            zIndex: 1,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            willChange: 'transform',
          }}
        >
          <Image
            src={getImage('background', '/bg_padang2.webp')}
            alt="Background"
            fill
            className="object-cover"
            priority
            quality={80}
            sizes="100vw"
            style={{ opacity: bgPadangOpacity }}
          />

          <Image
            src={getImage('background_limasan', '/limasan.jpg')}
            alt="Background Limasan"
            fill
            className="object-cover"
            quality={80}
            sizes="100vw"
            style={{ opacity: bgLimasanOpacity }}
          />
        </div>
      )}

      {/* Blur overlay di depan background, belakang semua layer lain.
          Menggunakan scale kebalikan wrapper agar terlihat tidak ikut zoom. */}
      {BACKGROUND_OVERLAY_CONFIG.enabled && (
        <div
          className="parallax-layer absolute inset-0 w-full h-full"
          style={{
            zIndex: 2,
            pointerEvents: 'none',
            backgroundColor: BACKGROUND_OVERLAY_CONFIG.color,
            opacity: overlayOpacity,
            transform: `scale(${wrapperScale !== 0 ? 1 / wrapperScale : 1}) translateZ(0)`,
            WebkitTransform: `scale(${wrapperScale !== 0 ? 1 / wrapperScale : 1}) translateZ(0)`,
            transformOrigin: 'center center',
            WebkitTransformOrigin: 'center center',
            backdropFilter: `blur(${BACKGROUND_OVERLAY_CONFIG.blurPx}px)`,
            WebkitBackdropFilter: `blur(${BACKGROUND_OVERLAY_CONFIG.blurPx}px)`,
          }}
        />
      )}

      {/* Gate + Pengantin - shared */}
      {LAYER_VISIBILITY_CONFIG.coupleGroup && (
        <div
          className="parallax-layer absolute left-1/2"
          style={{
            transform: `translate3d(-50%, 0, 0) scale(${coupleScale}) translate(${coupleX}px, ${coupleY}px)`,
            WebkitTransform: `translate3d(-50%, 0, 0) scale(${coupleScale}) translate(${coupleX}px, ${coupleY}px)`,
            zIndex: 3,
            bottom: '15%',
            width: '1500px',
            height: 'auto',
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          {/* Monsterra & Anggrek layers disabled */}
          {/* Gate - Behind (Centered) */}
          {LAYER_VISIBILITY_CONFIG.gate && (
            <div
              className="absolute"
              style={{
                ...gateGroupStyle,
                transform: `translateX(-50%) translate3d(0, 0, 0) scale(${gateGroupScale})`,
                WebkitTransform: `translateX(-50%) translate3d(0, 0, 0) scale(${gateGroupScale})`,
              }}
            >
              <Image
                src={getImage('gate', '/gate_padang.webp')}
                alt="Gate"
                width={1080}
                height={1080}
                className="w-full h-auto object-contain"
                quality={80}
              />
            </div>
          )}

          {/* Pengantin - Front */}
          {LAYER_VISIBILITY_CONFIG.pengantin && (
            <>
              <div
                className="absolute"
                style={{
                  ...pengantinGroupStyle,
                  transform: `translate3d(0, 0, 0) scale(${pengantinGroupScale})`,
                  WebkitTransform: `translate3d(0, 0, 0) scale(${pengantinGroupScale})`,
                  opacity: pengantinFadliOpacity,
                }}
              >
                <Image
                  src={getImage('pengantin', '/pengantin_fadli.png')}
                  alt="Pengantin"
                  width={960}
                  height={1280}
                  className="w-full h-auto object-contain"
                  quality={80}
                />
              </div>

              <div
                className="absolute"
                style={{
                  ...pengantinGroupStyle,
                  transform: `translate3d(0, 0, 0) scale(${pengantinGroupScale})`,
                  WebkitTransform: `translate3d(0, 0, 0) scale(${pengantinGroupScale})`,
                  opacity: fadliJawaOpacity,
                }}
              >
                <Image
                  src={getImage('pengantin_jawa', '/fadli_jawa.png')}
                  alt="Pengantin Jawa"
                  width={960}
                  height={1280}
                  className="w-full h-auto object-contain"
                  quality={80}
                />
              </div>
            </>
          )}
          {/* Grass Pengantin - Below pengantin */}
          {LAYER_VISIBILITY_CONFIG.grassPengantin && (
            <div
              className="absolute"
              style={{
                ...grassPengantinGroupStyle,
                transform: `translate3d(0, 0, 0) scale(${grassPengantinGroupScale})`,
                WebkitTransform: `translate3d(0, 0, 0) scale(${grassPengantinGroupScale})`,
              }}
            >
              <Image
                src={getImage('grass_pengantin', '/grass_pengantin.png')}
                alt="Grass Pengantin"
                width={1000}
                height={254}
                className="w-full h-auto object-contain"
                quality={80}
              />
            </div>
          )}
        </div>
      )}

      {/* Gunungan Layer - Depth 1 (paling dekat dengan pengantin) */}
      {GUNUNGAN_CONFIG.layer1 && (
        <div
          className="parallax-layer absolute left-1/2"
          style={{
            transform: `translate3d(-50%, 0, 0) scale(${gununganLayer1Scale}) translate(${gununganLayer1X}px, ${gununganLayer1Y}px)`,
            WebkitTransform: `translate3d(-50%, 0, 0) scale(${gununganLayer1Scale}) translate(${gununganLayer1X}px, ${gununganLayer1Y}px)`,
            zIndex: 4,
            bottom: '15%',
            width: '1500px',
            height: 'auto',
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            pointerEvents: 'none',
            opacity: gununganOpacity,
          }}
        >
          <div
            className="absolute"
            style={{
              ...gununganLeftStyle,
              transform: `translate3d(0, 0, 0) scale(${gununganLeftScale})`,
              WebkitTransform: `translate3d(0, 0, 0) scale(${gununganLeftScale})`,
            }}
          >
            <Image
              src={getImage('gunungan_wayang', '/gunungan_wayang.webp')}
              alt="Gunungan Wayang Left"
              width={400}
              height={800}
              className="w-full h-auto object-contain"
              quality={70}
            />
          </div>

          <div
            className="absolute"
            style={{
              ...gununganRightStyle,
              transform: `translate3d(0, 0, 0) scale(${gununganRightScale})`,
              WebkitTransform: `translate3d(0, 0, 0) scale(${gununganRightScale})`,
            }}
          >
            <Image
              src={getImage('gunungan_wayang', '/gunungan_wayang.webp')}
              alt="Gunungan Wayang Right"
              width={400}
              height={800}
              className="w-full h-auto object-contain"
              quality={70}
            />
          </div>
        </div>
      )}

      {/* Gunungan Layer - Depth 2 */}
      {GUNUNGAN_CONFIG.layer2 && (
        <div
          className="parallax-layer absolute left-1/2"
          style={{
            transform: `translate3d(-50%, 0, 0) scale(${gununganLayer2Scale}) translate(${gununganLayer2X}px, ${gununganLayer2Y}px)`,
            WebkitTransform: `translate3d(-50%, 0, 0) scale(${gununganLayer2Scale}) translate(${gununganLayer2X}px, ${gununganLayer2Y}px)`,
            zIndex: 4,
            bottom: '15%',
            width: '1500px',
            height: 'auto',
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            pointerEvents: 'none',
            opacity: gununganOpacity,
          }}
        >
          <div
            className="absolute"
            style={{
              ...gununganLeft2Style,
              transform: `translate3d(0, 0, 0) scale(${gununganLeft2Scale})`,
              WebkitTransform: `translate3d(0, 0, 0) scale(${gununganLeft2Scale})`,
            }}
          >
            <Image
              src={getImage('gunungan_wayang', '/gunungan_wayang.webp')}
              alt="Gunungan Wayang Left 2"
              width={400}
              height={800}
              className="w-full h-auto object-contain"
              quality={70}
            />
          </div>

          <div
            className="absolute"
            style={{
              ...gununganRight2Style,
              transform: `translate3d(0, 0, 0) scale(${gununganRight2Scale})`,
              WebkitTransform: `translate3d(0, 0, 0) scale(${gununganRight2Scale})`,
            }}
          >
            <Image
              src={getImage('gunungan_wayang', '/gunungan_wayang.webp')}
              alt="Gunungan Wayang Right 2"
              width={400}
              height={800}
              className="w-full h-auto object-contain"
              quality={70}
            />
          </div>
        </div>
      )}

      {/* Gunungan Layer - Depth 3 (paling jauh di depan) */}
      {GUNUNGAN_CONFIG.layer3 && (
        <div
          className="parallax-layer absolute left-1/2"
          style={{
            transform: `translate3d(-50%, 0, 0) scale(${gununganLayer3Scale}) translate(${gununganLayer3X}px, ${gununganLayer3Y}px)`,
            WebkitTransform: `translate3d(-50%, 0, 0) scale(${gununganLayer3Scale}) translate(${gununganLayer3X}px, ${gununganLayer3Y}px)`,
            zIndex: 4,
            bottom: '15%',
            width: '1500px',
            height: 'auto',
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            pointerEvents: 'none',
            opacity: gununganOpacity,
          }}
        >
          <div
            className="absolute"
            style={{
              ...gununganLeft3Style,
              transform: `translate3d(0, 0, 0) scale(${gununganLeft3Scale})`,
              WebkitTransform: `translate3d(0, 0, 0) scale(${gununganLeft3Scale})`,
            }}
          >
            <Image
              src={getImage('gunungan_wayang', '/gunungan_wayang.webp')}
              alt="Gunungan Wayang Left 3"
              width={400}
              height={800}
              className="w-full h-auto object-contain"
              quality={70}
            />
          </div>

          <div
            className="absolute"
            style={{
              ...gununganRight3Style,
              transform: `translate3d(0, 0, 0) scale(${gununganRight3Scale})`,
              WebkitTransform: `translate3d(0, 0, 0) scale(${gununganRight3Scale})`,
            }}
          >
            <Image
              src={getImage('gunungan_wayang', '/gunungan_wayang.webp')}
              alt="Gunungan Wayang Right 3"
              width={400}
              height={800}
              className="w-full h-auto object-contain"
              quality={70}
            />
          </div>
        </div>
      )}

      {/* Grass Layer - shared */}
      {LAYER_VISIBILITY_CONFIG.foregroundGrass && (
        <div
          className="parallax-layer absolute left-1/2"
          style={{
            transform: `translate3d(-50%, ${grassY}px, 0) scale(${grassScale})`,
            WebkitTransform: `translate3d(-50%, ${grassY}px, 0) scale(${grassScale})`,
            zIndex: 2,
            bottom: '-100px',
            width: '500px',
            height: 'auto',
            opacity: grassOpacity,
            willChange: 'transform, opacity',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <Image
            src={getImage('grass')}
            alt="Grass"
            width={1000}
            height={254}
            className="w-full h-auto object-contain"
            quality={80}
          />
        </div>
      )}
    </div>
  );
}
