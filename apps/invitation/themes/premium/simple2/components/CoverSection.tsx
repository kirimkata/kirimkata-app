'use client';

import { useState, useEffect } from 'react';
import type { BackgroundConfig } from '../config/backgroundConfig';
import FontLoader from '@/lib/fonts/FontLoader';
import { getFontFamily } from '@/lib/fonts/fontBank';

interface CoverSectionProps {
    brideName: string;
    groomName: string;
    weddingDate: string;
    guestName?: string;
    backgroundConfig: BackgroundConfig;
    onOpenInvitation: () => void;
    isVisible?: boolean;
}

/**
 * CoverSection - Premium static cover with dynamic backgrounds
 * 
 * Features:
 * - Video background support
 * - Single image background
 * - Multiple images with auto-rotation slideshow
 * - Cormorant font for elegant typography
 * - Dark overlay for text readability
 * - Fully styled with inline styles for consistent UI
 */
export default function CoverSection({
    brideName,
    groomName,
    weddingDate,
    guestName,
    backgroundConfig,
    onOpenInvitation,
    isVisible = true,
}: CoverSectionProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

    const isMultipleImages = backgroundConfig.type === 'images' &&
        backgroundConfig.imageUrls &&
        backgroundConfig.imageUrls.length > 1;

    // Auto-rotate images if multiple
    useEffect(() => {
        if (!isMultipleImages) return;

        const interval = setInterval(() => {
            setCurrentImageIndex((prev) =>
                (prev + 1) % (backgroundConfig.imageUrls?.length || 1)
            );
        }, backgroundConfig.slideshowInterval || 5000);

        return () => clearInterval(interval);
    }, [isMultipleImages, backgroundConfig.slideshowInterval, backgroundConfig.imageUrls?.length]);

    useEffect(() => {
        // Small delay to ensure smooth fade-in
        const timer = setTimeout(() => setIsLoaded(true), 100);
        return () => clearTimeout(timer);
    }, []);

    // Format wedding date
    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }).toUpperCase();
        } catch {
            return dateString;
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 100,
            overflow: 'hidden',
            width: '100%',
            height: '100vh',
            opacity: isVisible ? 1 : 0,
            visibility: isVisible ? 'visible' : 'hidden',
            pointerEvents: isVisible ? 'auto' : 'none',
            transition: 'opacity 1000ms ease-in-out, visibility 0s linear 1000ms',
        }}>
            {/* Load required fonts */}
            <FontLoader fonts={['ebGaramond', 'rasa']} />
            {/* Background Layer */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
            }}>
                {/* Video Background */}
                {backgroundConfig.type === 'video' && backgroundConfig.videoUrl && (
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            opacity: isLoaded ? 1 : 0,
                            transition: 'opacity 1s ease-in-out',
                        }}
                    >
                        <source src={backgroundConfig.videoUrl} type="video/mp4" />
                    </video>
                )}

                {/* Image Background(s) */}
                {backgroundConfig.type === 'images' && backgroundConfig.imageUrls && (
                    <>
                        {backgroundConfig.imageUrls.map((imageUrl, index) => {
                            const imageOpacity: number = isLoaded
                                ? (isMultipleImages ? (index === currentImageIndex ? 1 : 0) : 1)
                                : 0;

                            return (
                                <div
                                    key={imageUrl}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        backgroundImage: `url(${imageUrl})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        backgroundRepeat: 'no-repeat',
                                        opacity: imageOpacity,
                                        transition: 'opacity 1s ease-in-out',
                                    }}
                                />
                            );
                        })}
                    </>
                )}

                {/* Dark Overlay */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: `rgba(0, 0, 0, ${backgroundConfig.overlayOpacity || 0.4})`,
                }} />
            </div>

            {/* Content Layer - Space Between */}
            <div style={{
                position: 'relative',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                width: '100%',
                padding: '80px 24px 50px',
                textAlign: 'center',
            }}>
                {/* Top Section: Wedding Information */}
                <div style={{
                    opacity: isLoaded ? 1 : 0,
                    transform: isLoaded ? 'translateY(0)' : 'translateY(-20px)',
                    transition: 'opacity 1s ease-out 0.3s, transform 1s ease-out 0.3s',
                }}>
                    {/* "THE WEDDING OF" */}
                    <p style={{
                        fontFamily: getFontFamily('ebGaramond', 'serif'),
                        fontSize: '11px',
                        fontWeight: 400,
                        letterSpacing: '0.25em',
                        textTransform: 'uppercase',
                        color: '#ffffff',
                        marginBottom: '16px',
                        marginTop: 0,
                    }}>
                        THE WEDDING OF
                    </p>

                    {/* Couple Names - Large */}
                    <h1 style={{
                        fontFamily: getFontFamily('ebGaramond', 'serif'),
                        fontSize: window.innerWidth >= 768 ? '52px' : '38px',
                        fontWeight: 400,
                        letterSpacing: '0.05em',
                        lineHeight: 1.1,
                        color: '#ffffff',
                        marginBottom: '20px',
                        marginTop: 0,
                        textTransform: 'uppercase',
                    }}>
                        {brideName} & {groomName}
                    </h1>

                    {/* Wedding Date with underline */}
                    <div style={{
                        // display: 'inline-block',
                        // borderBottom: '1px solid rgba(255, 255, 255, 0.6)',
                        // paddingBottom: '8px',
                    }}>
                        <p style={{
                            fontFamily: getFontFamily('ebGaramond', 'serif'),
                            fontSize: '11px',
                            fontWeight: 400,
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            color: '#ffffff',
                            marginTop: 0,
                            marginBottom: 0,
                        }}>
                            {formatDate(weddingDate)}
                        </p>
                    </div>
                </div>

                {/* Bottom Section: Guest Info + Button */}
                <div style={{
                    opacity: isLoaded ? 1 : 0,
                    transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'opacity 1s ease-out 0.6s, transform 1s ease-out 0.6s',
                }}>
                    {/* Guest Information */}
                    <div style={{
                        marginBottom: '18px',
                    }}>
                        <p style={{
                            fontFamily: getFontFamily('rasa', 'serif'),
                            fontSize: '11px',
                            fontWeight: 400,
                            letterSpacing: '0.1em',
                            color: 'rgba(255, 255, 255, 0.85)',
                            marginBottom: guestName === '' ? 0 : '10px',
                            marginTop: 0,
                        }}>
                            Yth. Bapak/Ibu/Saudara/i
                        </p>
                        {guestName === '' ? null : (
                            <p style={{
                                fontFamily: getFontFamily('ebGaramond', 'serif'),
                                fontSize: '28px',
                                fontWeight: 400,
                                color: '#ffffff',
                                marginBottom: 0,
                                marginTop: 0,
                                lineHeight: 1.2,
                            }}>
                                {guestName || 'Tamu Undangan'}
                            </p>
                        )}
                        {guestName === '' ? <div style={{ height: '30px' }} /> : null}
                    </div>

                    {/* Invitation Message */}
                    <p style={{
                        fontFamily: getFontFamily('rasa', 'serif'),
                        fontSize: '12px',
                        fontWeight: 300,
                        lineHeight: 1.6,
                        color: 'rgba(255, 255, 255, 0.8)',
                        maxWidth: '320px',
                        margin: '0 auto 32px',
                    }}>
                        Tanpa mengurangi rasa hormat,<br />
                        kami mengundang anda untuk menghadiri<br />
                        acara pernikahan kami.
                    </p>

                    {/* Button - Full Rounded */}
                    <button
                        onClick={onOpenInvitation}
                        style={{
                            padding: '8px 20px',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.5)',
                            borderRadius: '50px',
                            color: '#ffffff',
                            fontFamily: getFontFamily('ebGaramond', 'serif'),
                            fontSize: '12px',
                            fontWeight: 500,
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            transition: 'all 300ms ease',
                            outline: 'none',
                            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.25)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.35)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.25)';
                        }}
                    >
                        BUKA UNDANGAN
                    </button>
                </div>
            </div>

        </div>
    );
}
