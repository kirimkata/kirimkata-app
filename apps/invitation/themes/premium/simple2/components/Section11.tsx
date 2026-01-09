'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import FontLoader from '@/lib/fonts/FontLoader';
import { getFontFamily } from '@/lib/fonts/fontBank';
import { useInvitationContent } from '@/lib/contexts/InvitationContentContext';
import { motion, animate, useMotionValue } from 'motion/react';

import type { Simple2GalleryImage } from '../config/section11Config';

type LightboxImage = { src: string; alt: string };

interface Section11Props {
    backgroundImageUrl: string;
    overlayOpacity?: number;
    mainTitle: string;
    youtubeEmbedUrl?: string;
    showYoutube?: boolean;
    middleImages: Simple2GalleryImage[];
}

const isProbablyYoutubeEmbed = (url?: string) => {
    if (!url) return false;
    return url.includes('youtube.com/embed') || url.includes('youtu.be') || url.includes('youtube.com');
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const FULL_WIDTH_PX = 120;
const COLLAPSED_WIDTH_PX = 35;
const GAP_PX = 2;
const MARGIN_PX = 2;
const MIN_SCALE = 1;
const MAX_SCALE = 3;
const RESET_THRESHOLD = 1.05;

export default function Section11({
    backgroundImageUrl,
    overlayOpacity = 0.6,
    mainTitle,
    youtubeEmbedUrl,
    showYoutube,
    middleImages,
}: Section11Props) {
    const invitationContent = useInvitationContent();

    const galleryFromDb = invitationContent?.gallery;

    const brideDisplayName = invitationContent?.bride?.name || '[BRIDE_NAME]';
    const groomDisplayName = invitationContent?.groom?.name || '[GROOM_NAME]';
    const coupleNames = invitationContent?.clientProfile?.coupleNames || `${brideDisplayName} & ${groomDisplayName}`;

    const activeTitle = galleryFromDb?.mainTitle || mainTitle;
    const activeShowYoutube = galleryFromDb?.showYoutube ?? showYoutube;
    const activeYoutubeEmbedUrl = galleryFromDb?.youtubeEmbedUrl || youtubeEmbedUrl;

    const activeImages = useMemo(() => {
        const dbImages = (galleryFromDb?.middleImages || []).filter((img: any) => img?.src);
        return dbImages.length ? dbImages : (middleImages || []).filter((img) => img?.src);
    }, [galleryFromDb, middleImages]);

    const clickableImages: LightboxImage[] = useMemo(
        () => activeImages.map((img) => ({ src: img.src, alt: img.alt })),
        [activeImages],
    );

    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const openLightbox = (img: LightboxImage) => {
        const index = clickableImages.findIndex((item) => item.src === img.src && item.alt === img.alt);
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

    const hasVideoUrl = Boolean(activeYoutubeEmbedUrl && activeYoutubeEmbedUrl.trim());
    const shouldRenderIframe = Boolean(activeShowYoutube && isProbablyYoutubeEmbed(activeYoutubeEmbedUrl));
    const shouldRenderVideoTag = Boolean(activeShowYoutube && hasVideoUrl && !shouldRenderIframe);

    return (
        <section
            style={{
                position: 'relative',
                width: '100%',
                height: 'calc(var(--vh, 1vh) * 100)',
                overflow: 'hidden',
            }}
        >
            <FontLoader fonts={['ebGaramond', 'rasa']} />

            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${backgroundImageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    filter: 'grayscale(1) contrast(1.05)',
                }}
            />

            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
                }}
            />

            <div
                style={{
                    position: 'relative',
                    zIndex: 1,
                    height: '100%',
                    width: '100%',
                }}
            >
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        maxWidth: '500px',
                        margin: '0 auto',
                        padding: '54px 24px 34px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        alignItems: 'stretch',
                        color: '#ffffff',
                        gap: 18,
                    }}
                >
                    <div style={{ textAlign: 'center' }}>
                        <h2
                            style={{
                                fontFamily: getFontFamily('ebGaramond', 'serif'),
                                fontSize: '30px',
                                fontWeight: 400,
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                margin: 0,
                                lineHeight: 1.1,
                            }}
                        >
                            {activeTitle}
                        </h2>

                        <p
                            style={{
                                fontFamily: getFontFamily('rasa', 'serif'),
                                fontSize: '14px',
                                fontWeight: 300,
                                lineHeight: 1.8,
                                color: 'rgba(255,255,255,0.9)',
                                margin: '14px auto 0',
                                maxWidth: '420px',
                            }}
                        >
                            “I was created in time to fill your time, and I use all the time in my life to love you.”
                        </p>
                    </div>

                    {activeShowYoutube && hasVideoUrl ? (
                        <div
                            style={{
                                width: '100%',
                                marginTop: 2,
                            }}
                        >
                            <div
                                style={{
                                    position: 'relative',
                                    width: '100%',
                                    paddingTop: '56.25%',
                                    backgroundColor: 'rgba(0,0,0,0.35)',
                                    borderRadius: 10,
                                    overflow: 'hidden',
                                    boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
                                }}
                            >
                                {shouldRenderIframe ? (
                                    <iframe
                                        src={activeYoutubeEmbedUrl}
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
                                ) : shouldRenderVideoTag ? (
                                    <video
                                        src={activeYoutubeEmbedUrl}
                                        controls
                                        playsInline
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                        }}
                                    />
                                ) : null}
                            </div>

                            <p
                                style={{
                                    fontFamily: getFontFamily('ebGaramond', 'serif'),
                                    fontSize: '13px',
                                    fontWeight: 400,
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                    color: 'rgba(255,255,255,0.86)',
                                    margin: '10px 0 0',
                                    textAlign: 'center',
                                }}
                            >
                                Photo Video by {coupleNames}
                            </p>
                        </div>
                    ) : null}

                    {activeImages.length ? (
                        <div style={{ marginTop: 2 }}>
                            <div
                                style={{
                                    display: 'flex',
                                    gap: 12,
                                    overflowX: 'auto',
                                    paddingBottom: 8,
                                    WebkitOverflowScrolling: 'touch',
                                }}
                            >
                                {activeImages.map((img, idx) => (
                                    <button
                                        key={`${img.src}-${idx}`}
                                        type="button"
                                        onClick={() => openLightbox({ src: img.src, alt: img.alt })}
                                        style={{
                                            flex: '0 0 auto',
                                            position: 'relative',
                                            width: 220,
                                            height: 220,
                                            borderRadius: 12,
                                            overflow: 'hidden',
                                            border: '1px solid rgba(255,255,255,0.12)',
                                            backgroundColor: 'rgba(255,255,255,0.06)',
                                            cursor: 'pointer',
                                            padding: 0,
                                        }}
                                    >
                                        <Image
                                            src={img.src}
                                            alt={img.alt}
                                            fill
                                            sizes="220px"
                                            style={{ objectFit: 'cover' }}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>

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
                    MAX_SCALE,
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
                <div className="relative overflow-hidden rounded-lg" ref={containerRef} style={{ touchAction: 'none' }}>
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

                            if (Math.abs(velocity) > 500) {
                                newIndex = velocity > 0 ? index - 1 : index + 1;
                            } else if (Math.abs(offset) > containerWidth * 0.3) {
                                newIndex = offset > 0 ? index - 1 : index + 1;
                            }

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
                                                  transition: pinchStateRef.current.active
                                                      ? 'none'
                                                      : 'transform 0.15s ease-out',
                                              }
                                            : { transform: 'scale(1)' }
                                    }
                                    draggable={false}
                                />
                            </div>
                        ))}
                    </motion.div>

                    <motion.button
                        disabled={index === 0}
                        onClick={() => requestIndexChange(index > 0 ? index - 1 : 0, false)}
                        className={`absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform z-10
              ${
                  index === 0
                      ? 'opacity-40 cursor-not-allowed'
                      : 'bg-white hover:scale-110 hover:opacity-100 opacity-70'
              }`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                    </motion.button>

                    <motion.button
                        disabled={index === items.length - 1}
                        onClick={() => setIndex(index < items.length - 1 ? index + 1 : items.length - 1)}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform z-10
              ${
                  index === items.length - 1
                      ? 'opacity-40 cursor-not-allowed'
                      : 'bg-white hover:scale-110 hover:opacity-100 opacity-70'
              }`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
