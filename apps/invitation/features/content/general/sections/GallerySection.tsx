'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { getGalleryConfig } from '@/config/galleryConfig';
import { motion, useMotionValue, animate } from 'motion/react';
import { useInViewSlideIn } from '@/hooks/useInViewAnimation';
import { useInvitationContent } from '@/lib/contexts/InvitationContentContext';
import { typographyConfig, getTypographyStyle } from '@/config/fontConfig';

const galleryTypography = typographyConfig.scrollable.gallery;

type LightboxImage = { src: string; alt: string };

export default function GallerySection() {
  const invitationContent = useInvitationContent();
  const fallbackConfig = getGalleryConfig();
  const activeGallery = invitationContent ? invitationContent.gallery : fallbackConfig;

  const {
    // mainTitle,
    backgroundColor,
    topRowImages,
    middleImages,
    bottomGridImages,
    youtubeEmbedUrl,
    showYoutube,
  } = activeGallery;

  const hasMiddle = middleImages && middleImages.length > 0;
  const hasBottomGrid = bottomGridImages && bottomGridImages.length >= 2;

  const clickableImages: LightboxImage[] = middleImages
    ? middleImages
      .filter((img) => img.src && img.src.trim() !== '')
      .map((img) => ({ src: img.src, alt: img.alt }))
    : [];

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { ref: titleRef, style: titleStyle } = useInViewSlideIn({
    direction: 'left',
    distance: 28,
  });

  const openLightbox = (img: LightboxImage) => {
    const index = clickableImages.findIndex(
      (item) => item.src === img.src && item.alt === img.alt,
    );
    if (index === -1) return;
    setLightboxIndex(index);
    if (typeof window !== 'undefined') {
      try {
        window.history.pushState({ lightbox: true }, '', window.location.href);
      } catch {
        // ignore history errors
      }
    }
  };

  const closeLightbox = () => {
    if (typeof window !== 'undefined') {
      try {
        window.history.back();
        return;
      } catch {
        // fallback: just close
      }
    }
    setLightboxIndex(null);
  };

  useEffect(() => {
    if (lightboxIndex === null) return;

    const handlePopState = () => {
      setLightboxIndex(null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [lightboxIndex]);

  const middleRows: (
    | { type: 'pair'; indices: [number, number] }
    | { type: 'full'; index: number }
  )[] = [];

  if (middleImages && middleImages.length > 0) {
    const total = middleImages.length;
    let i = 0;

    while (i < total) {
      const isLast = i === total - 1;
      const isOddTotal = total % 2 === 1;

      if (isLast && isOddTotal) {
        middleRows.push({ type: 'full', index: i });
        i += 1;
      } else {
        if (i + 1 < total) {
          middleRows.push({ type: 'pair', indices: [i, i + 1] });
        } else {
          middleRows.push({ type: 'full', index: i });
        }
        i += 2;
      }
    }
  }

  return (
    <section
      style={{
        width: '100%',
        paddingTop: 32,
        paddingBottom: 20,
        backgroundColor,
      }}
    >
      <div
        style={{
          maxWidth: 640,
          margin: '0 auto',
          paddingLeft: 24,
          paddingRight: 24,
        }}
      >
        {/* Gallery title (static text) */}
        <div
          style={{
            marginBottom: 40,
          }}
        >
          <h2
            ref={titleRef}
            className="text-center"
            style={{
              textAlign: 'center',
              marginBottom: 32,
              color: '#4f4a3f',
              ...getTypographyStyle(galleryTypography.title),
              ...titleStyle,
            }}
          >
            Our Moments
          </h2>
        </div>

        {/* Middle grid section */}
        {hasMiddle && (
          <div
            style={{
              marginBottom: 40,
            }}
          >
            {middleRows.map((row, rowIndex) =>
              row.type === 'pair' ? (
                <div
                  key={`pair-row-${rowIndex}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    columnGap: 12,
                    rowGap: 12,
                    marginBottom: rowIndex < middleRows.length - 1 ? 16 : 0,
                  }}
                >
                  {row.indices.map((i, pairIdx) => (
                    <GalleryImage
                      key={middleImages[i].alt + i}
                      image={middleImages[i]}
                      onClick={() => {
                        openLightbox({
                          src: middleImages[i].src,
                          alt: middleImages[i].alt,
                        });
                      }}
                      height={210}
                      index={rowIndex * 2 + pairIdx}
                      direction={pairIdx === 0 ? 'left' : 'right'}
                    />
                  ))}
                </div>
              ) : (
                <GalleryImage
                  key={`full-row-${rowIndex}`}
                  image={middleImages[row.index]}
                  onClick={() => {
                    openLightbox({
                      src: middleImages[row.index].src,
                      alt: middleImages[row.index].alt,
                    });
                  }}
                  height={220}
                  index={rowIndex}
                  direction="left"
                />
              ),
            )}
          </div>
        )}

        {/* Bottom grid before video */}
        {/* {hasBottomGrid && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              columnGap: 12,
              rowGap: 12,
              marginBottom: 40,
            }}
          >
            {bottomGridImages.slice(0, 2).map((img, index) => (
              <div
                key={img.alt + index}
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 8,
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  height: 210,
                  cursor: 'pointer',
                }}
                onClick={() =>
                  openLightbox({ src: img.src, alt: img.alt })
                }
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 768px) 50vw, 240px"
                  style={{
                    objectFit: 'cover',
                  }}
                />
              </div>
            ))}
          </div>
        )} */}

        {showYoutube && youtubeEmbedUrl && (
          <div
            style={{
              width: '100%',
              marginTop: 24,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                paddingTop: '56.25%',
                backgroundColor: 'rgba(0,0,0,0.4)',
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              <iframe
                src={youtubeEmbedUrl}
                title="Wedding Video"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 0,
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Lightbox overlay with Framer Motion carousel */}
        {lightboxIndex !== null && clickableImages.length > 0 && (
          <div
            onClick={closeLightbox}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: 16,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                maxWidth: '90vw',
                maxHeight: '85vh',
              }}
            >
              <FramerCarouselThumbnails
                items={clickableImages}
                index={lightboxIndex}
                setIndex={(idx) => setLightboxIndex(idx)}
              />

              <button
                type="button"
                onClick={closeLightbox}
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 32,
                  height: 32,
                  borderRadius: 9999,
                  border: 'none',
                  backgroundColor: 'rgba(0,0,0,0.85)',
                  color: '#ffffff',
                  fontSize: 18,
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

type FramerCarouselThumbnailsProps = {
  items: LightboxImage[];
  index: number;
  setIndex: (index: number) => void;
};

const FULL_WIDTH_PX = 120;
const COLLAPSED_WIDTH_PX = 35;
const GAP_PX = 2;
const MARGIN_PX = 2;
const MIN_SCALE = 1;
const MAX_SCALE = 3;
const RESET_THRESHOLD = 1.05;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function FramerCarouselThumbnails({ items, index, setIndex }: FramerCarouselThumbnailsProps) {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [imageTransform, setImageTransform] = useState({ scale: 1, offsetX: 0, offsetY: 0 });
  const transformRef = useRef(imageTransform);
  const pinchStateRef = useRef({ active: false, initialDistance: 0, initialScale: 1 });
  const panStateRef = useRef({ active: false, lastX: 0, lastY: 0 });
  const animateIndexChangeRef = useRef(false);

  const x = useMotionValue(0);

  useEffect(() => {
    transformRef.current = imageTransform;
  }, [imageTransform]);

  useEffect(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.offsetWidth || 1;
    const targetX = -index * containerWidth;

    if (animateIndexChangeRef.current && !isDragging) {
      animate(x, targetX, {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      });
    } else {
      x.stop();
      x.set(targetX);
    }

    animateIndexChangeRef.current = false;
  }, [index, x, isDragging]);

  useEffect(() => {
    // Reset zoom whenever slide changes
    setImageTransform({ scale: 1, offsetX: 0, offsetY: 0 });
  }, [index]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const getDistance = (touches: TouchList) => {
      const [a, b] = [touches[0], touches[1]];
      if (!a || !b) return 0;
      const deltaX = b.clientX - a.clientX;
      const deltaY = b.clientY - a.clientY;
      return Math.hypot(deltaX, deltaY);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinchStateRef.current = {
          active: true,
          initialDistance: getDistance(e.touches),
          initialScale: transformRef.current.scale,
        };
        panStateRef.current.active = false;
      } else if (e.touches.length === 1 && transformRef.current.scale > MIN_SCALE + 0.01) {
        panStateRef.current = {
          active: true,
          lastX: e.touches[0].clientX,
          lastY: e.touches[0].clientY,
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (pinchStateRef.current.active && e.touches.length === 2) {
        if (e.cancelable) {
          e.preventDefault();
        }
        const newDistance = getDistance(e.touches);
        if (!pinchStateRef.current.initialDistance) return;
        const scaleFactor = newDistance / pinchStateRef.current.initialDistance;
        const nextScale = clamp(
          pinchStateRef.current.initialScale * scaleFactor,
          MIN_SCALE,
          MAX_SCALE
        );
        setImageTransform((prev) => ({ ...prev, scale: nextScale }));
      } else if (panStateRef.current.active && e.touches.length === 1) {
        if (e.cancelable) {
          e.preventDefault();
        }
        const touch = e.touches[0];
        const deltaX = touch.clientX - panStateRef.current.lastX;
        const deltaY = touch.clientY - panStateRef.current.lastY;
        panStateRef.current.lastX = touch.clientX;
        panStateRef.current.lastY = touch.clientY;

        setImageTransform((prev) => {
          if (prev.scale <= MIN_SCALE + 0.01) {
            panStateRef.current.active = false;
            return prev;
          }
          const containerWidth = element.offsetWidth || 1;
          const containerHeight = element.offsetHeight || 1;
          const maxOffsetX = ((prev.scale - 1) * containerWidth) / 2;
          const maxOffsetY = ((prev.scale - 1) * containerHeight) / 2;
          const nextOffsetX = clamp(prev.offsetX + deltaX, -maxOffsetX, maxOffsetX);
          const nextOffsetY = clamp(prev.offsetY + deltaY, -maxOffsetY, maxOffsetY);
          return { ...prev, offsetX: nextOffsetX, offsetY: nextOffsetY };
        });
      }
    };

    const handleTouchEnd = () => {
      if (transformRef.current.scale <= RESET_THRESHOLD) {
        setImageTransform({ scale: 1, offsetX: 0, offsetY: 0 });
      }
      if (pinchStateRef.current.active && transformRef.current.scale <= MIN_SCALE) {
        pinchStateRef.current.active = false;
      }
      panStateRef.current.active = false;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  const requestIndexChange = (nextIndex: number, withAnimation: boolean) => {
    animateIndexChangeRef.current = withAnimation;
    setIndex(nextIndex);
  };

  return (
    <div className="w-[80vw] max-w-[480px] mx-auto lg:p-6 p-2">
      <div className="flex flex-col gap-3">
        {/* Main Carousel */}
        <div
          className="relative overflow-hidden rounded-lg"
          ref={containerRef}
          style={{ touchAction: 'none' }}
        >
          <motion.div
            className="flex"
            drag={imageTransform.scale > MIN_SCALE + 0.01 ? false : 'x'}
            dragElastic={0.2}
            dragMomentum={false}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(e, info) => {
              setIsDragging(false);
              const containerWidth = containerRef.current?.offsetWidth || 1;
              const offset = info.offset.x;
              const velocity = info.velocity.x;

              let newIndex = index;

              // If fast swipe, use velocity
              if (Math.abs(velocity) > 500) {
                newIndex = velocity > 0 ? index - 1 : index + 1;
              }
              // Otherwise use offset threshold (30% of container width)
              else if (Math.abs(offset) > containerWidth * 0.3) {
                newIndex = offset > 0 ? index - 1 : index + 1;
              }

              // Clamp index
              newIndex = Math.max(0, Math.min(items.length - 1, newIndex));
              requestIndexChange(newIndex, true);
            }}
            style={{ x }}
          >
            {items.map((item, i) => (
              <div
                key={`${item.src}-${i}`}
                className="relative shrink-0 w-full h-[400px] flex items-center justify-center overflow-hidden"
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 768px) 80vw, 480px"
                  className="object-cover rounded-lg select-none pointer-events-none"
                  style={
                    i === index
                      ? {
                        transform: `translate3d(${imageTransform.offsetX}px, ${imageTransform.offsetY}px, 0) scale(${imageTransform.scale})`,
                        transition: pinchStateRef.current.active ? 'none' : 'transform 0.15s ease-out',
                      }
                      : { transform: 'scale(1)' }
                  }
                  draggable={false}
                />
              </div>
            ))}
          </motion.div>

          {/* Prev Button */}
          <motion.button
            disabled={index === 0}
            onClick={() => requestIndexChange(index > 0 ? index - 1 : 0, false)}
            className={`absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform z-10
              ${index === 0
                ? 'opacity-40 cursor-not-allowed'
                : 'bg-white hover:scale-110 hover:opacity-100 opacity-70'
              }`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </motion.button>

          {/* Next Button */}
          <motion.button
            disabled={index === items.length - 1}
            onClick={() =>
              setIndex(
                index < items.length - 1 ? index + 1 : items.length - 1,
              )
            }
            className={`absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform z-10
              ${index === items.length - 1
                ? 'opacity-40 cursor-not-allowed'
                : 'bg-white hover:scale-110 hover:opacity-100 opacity-70'
              }`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </motion.button>
        </div>

        <Thumbnails index={index} setIndex={setIndex} items={items} />
      </div>
    </div>
  );
}

type ThumbnailsProps = {
  index: number;
  setIndex: (index: number) => void;
  items: LightboxImage[];
};

function Thumbnails({ index, setIndex, items }: ThumbnailsProps) {
  const thumbnailsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (thumbnailsRef.current) {
      let scrollPosition = 0;
      for (let i = 0; i < index; i++) {
        scrollPosition += COLLAPSED_WIDTH_PX + GAP_PX;
      }

      scrollPosition += MARGIN_PX;

      const containerWidth = thumbnailsRef.current.offsetWidth;
      const centerOffset = containerWidth / 2 - FULL_WIDTH_PX / 2;
      scrollPosition -= centerOffset;

      thumbnailsRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth',
      });
    }
  }, [index]);

  return (
    <div
      ref={thumbnailsRef}
      className="overflow-x-auto scrollbar-hide"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <div className="flex gap-1 h-20 pb-2" style={{ width: 'fit-content' }}>
        {items.map((item, i) => (
          <motion.button
            key={`${item.src}-thumb-${i}`}
            onClick={() => setIndex(i)}
            initial={false}
            animate={i === index ? 'active' : 'inactive'}
            variants={{
              active: {
                width: FULL_WIDTH_PX,
                marginLeft: MARGIN_PX,
                marginRight: MARGIN_PX,
              },
              inactive: {
                width: COLLAPSED_WIDTH_PX,
                marginLeft: 0,
                marginRight: 0,
              },
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative shrink-0 h-full overflow-hidden"
          >
            <Image
              src={item.src}
              alt={item.alt}
              fill
              sizes="64px"
              className="object-cover pointer-events-none select-none"
            />
          </motion.button>
        ))}
      </div>
    </div>
  );
}

interface GalleryImageProps {
  image: { src: string; alt: string };
  onClick: () => void;
  height: number;
  index: number;
  direction: 'left' | 'right';
}

function GalleryImage({ image, onClick, height, index, direction }: GalleryImageProps) {
  const { ref, style } = useInViewSlideIn({
    direction,
    distance: 40,
    delayMs: index * 80,
  });

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.1)',
        height,
        cursor: 'pointer',
        ...style,
      }}
      onClick={onClick}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes="(max-width: 768px) 50vw, 240px"
        style={{
          objectFit: 'cover',
        }}
      />
    </div>
  );
}
