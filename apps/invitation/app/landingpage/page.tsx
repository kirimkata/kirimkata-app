'use client';

import Link from 'next/link';
import { useState } from 'react';
import { trackButtonClick } from '@/lib/services/analytics';
import TextLoop from '@/components/common/TextLoop';

export default function LandingPageV2() {
    const [currentSlide, setCurrentSlide] = useState(0);

    // Auto-advance carousel
    useState(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % 4);
        }, 4000);
        return () => clearInterval(interval);
    });

    return (
        <div
            data-page="landing-v2"
            style={{
                minHeight: '100vh',
                height: '100vh',
                overflowX: 'hidden',
                overflowY: 'auto',
                // Brown background - can be replaced with background image
                // backgroundColor: '#8B7355',
                backgroundImage: 'url("https://media.kirimkata.com/pexels1.jpg")', // Placeholder for future image
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                position: 'relative',
            }}
        >
            {/* Overlay for better text readability */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(19, 11, 0, 0.6)',
                    zIndex: 0,
                }}
            />

            {/* Content Container */}
            <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <header
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 50,
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(12px)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                >
                    <div
                        style={{
                            maxWidth: '1280px',
                            margin: '0 auto',
                            padding: '1rem 1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        {/* Logo */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span
                                style={{
                                    fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                                    fontWeight: '300',
                                    color: '#F5F5F0',
                                    fontFamily: 'Georgia, serif',
                                    letterSpacing: '0.1em',
                                }}
                            >
                                kirimkata
                            </span>
                        </div>

                        {/* Order Button */}
                        <button
                            onClick={() => trackButtonClick('order_header', 'landing_page_v2', 'ORDER')}
                            style={{
                                padding: '0.5rem 1.5rem',
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                color: '#F5F5F0',
                                fontWeight: '500',
                                borderRadius: '2rem',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                letterSpacing: '0.05em',
                                transition: 'all 0.3s',
                                fontFamily: 'Segoe UI, sans-serif',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 1)';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            ORDER
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <main
                    className="landing-main"
                    style={{
                        paddingTop: 'clamp(4rem, 20vh, 12rem)',
                        paddingBottom: '2rem',
                        paddingLeft: 'clamp(1.5rem, 5vw, 2rem)',
                        paddingRight: 'clamp(1.5rem, 5vw, 2rem)',
                        minHeight: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <div
                        style={{
                            maxWidth: '1280px',
                            margin: '0 auto',
                            width: '100%',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: '4rem',
                            alignItems: 'center',
                        }}
                    >
                        {/* Left Content */}
                        <div
                            className="landing-content"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2rem',
                                color: '#F5F5F0',
                            }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div
                                    style={{
                                        fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                                        letterSpacing: '0.2em',
                                        fontWeight: '400',
                                        opacity: 0.9,
                                        fontFamily: 'Segoe UI, sans-serif',
                                    }}
                                >
                                    DIGITAL WEDDING INVITATION
                                </div>

                                <h1
                                    style={{
                                        fontSize: 'clamp(2rem, 6vw, 3.5rem)',
                                        fontWeight: '300',
                                        lineHeight: 1.1,
                                        margin: 0,
                                        fontFamily: 'Georgia, serif',
                                        minHeight: 'clamp(2.2rem, 6.6vw, 3.85rem)',
                                    }}
                                >
                                    <TextLoop
                                        children={[
                                            "premium design.",
                                            "minimalist design.",
                                            "3D interactive design."
                                        ]}
                                        style={{
                                            fontFamily: 'Georgia, serif',
                                            fontWeight: '300',
                                        }}
                                    />
                                </h1>

                                <p
                                    style={{
                                        fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                                        lineHeight: 1.6,
                                        opacity: 0.9,
                                        fontStyle: 'italic',
                                        margin: 0,
                                        fontFamily: 'Georgia, serif',
                                    }}
                                >
                                    Amaze your guests from the moment they click.
                                    <br />
                                    wedding invitations with kirimkata.
                                </p>
                            </div>

                            {/* CTA Buttons */}
                            <div
                                className="cta-buttons"
                                style={{
                                    display: 'flex',
                                    gap: '1rem',
                                    flexWrap: 'wrap',
                                }}
                            >
                                {/* <a
                                    href="https://wa.me/6285780205096?text=Halo%2C%20saya%20ingin%20membuat%20undangan%20website"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => trackButtonClick('book_now', 'landing_page_v2', 'BOOK NOW')}
                                    style={{
                                        padding: '0.5rem 1.5rem',
                                        backgroundColor: 'transparent',
                                        color: '#F5F5F0',
                                        fontWeight: '500',
                                        borderRadius: '50rem',
                                        border: '1px solid #F5F5F0',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem',
                                        letterSpacing: '0.1em',
                                        transition: 'all 0.3s',
                                        textDecoration: 'none',
                                        display: 'inline-block',
                                        fontFamily: 'Segoe UI, sans-serif',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#F5F5F0';
                                        e.currentTarget.style.color = '#8B7355';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.color = '#F5F5F0';
                                    }}
                                >
                                    BOOK NOW
                                </a> */}

                                <button
                                    onClick={() => {
                                        trackButtonClick('view_catalog', 'landing_page_v2', 'VIEW CATALOG');
                                        // Scroll to catalog section or open modal
                                    }}
                                    style={{
                                        padding: '0.5rem 1.5rem',
                                        backgroundColor: 'transparent',
                                        color: '#F5F5F0',
                                        fontWeight: '500',
                                        borderRadius: '50rem',
                                        border: '1px solid #F5F5F0',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem',
                                        letterSpacing: '0.1em',
                                        transition: 'all 0.3s',
                                        fontFamily: 'Segoe UI, sans-serif',
                                        marginTop: '1rem',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#F5F5F0';
                                        e.currentTarget.style.color = '#8B7355';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.color = '#F5F5F0';
                                    }}
                                >
                                    VIEW CATALOG
                                </button>
                            </div>
                        </div>

                        {/* Right Content - Phone Mockups Carousel */}
                        <div
                            style={{
                                position: 'relative',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                minHeight: '600px',
                            }}
                        >
                            {/* Carousel Container */}
                            <div
                                style={{
                                    position: 'relative',
                                    width: '100%',
                                    maxWidth: '500px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginTop: '-4rem',
                                }}
                            >
                                {/* Phone Mockup 1 - Enter from Right */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        width: '280px',
                                        height: '560px',
                                        backgroundColor: 'black',
                                        borderRadius: '3rem',
                                        padding: '0.4rem',
                                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                        transform: currentSlide === 0 ? 'translateX(0) scale(1)' : (currentSlide < 0 || currentSlide === 3 ? 'translateX(100%) scale(0.8)' : 'translateX(-100%) scale(0.8)'),
                                        opacity: currentSlide === 0 ? 1 : 0,
                                        transition: 'all 0.6s ease-in-out',
                                        zIndex: currentSlide === 0 ? 2 : 1,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            backgroundColor: '#1a1a1a',
                                            borderRadius: '2.5rem',
                                            overflow: 'hidden',
                                            backgroundImage: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#F5F5F0',
                                            fontFamily: 'Georgia, serif',
                                            fontSize: '1.5rem',
                                            textAlign: 'center',
                                            padding: '2rem',
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontSize: '0.875rem', marginBottom: '1rem', opacity: 0.7 }}>
                                                THE WEDDING OF
                                            </div>
                                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Niskina</div>
                                            <div style={{ fontSize: '1.25rem', opacity: 0.9 }}>&amp;</div>
                                            <div style={{ fontSize: '2rem', marginTop: '0.5rem' }}>Niskina</div>
                                        </div>
                                    </div>
                                    {/* Dynamic Island Notch */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: '1rem',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            width: '5.5rem',
                                            height: '1.5rem',
                                            backgroundColor: 'black',
                                            borderRadius: '1.5rem',
                                        }}
                                    />
                                </div>

                                {/* Phone Mockup 2 - Enter from Left */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        width: '280px',
                                        height: '560px',
                                        backgroundColor: 'black',
                                        borderRadius: '3rem',
                                        padding: '0.4rem',
                                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                        transform: currentSlide === 1 ? 'translateX(0) scale(1)' : (currentSlide < 1 ? 'translateX(-100%) scale(0.8)' : 'translateX(100%) scale(0.8)'),
                                        opacity: currentSlide === 1 ? 1 : 0,
                                        transition: 'all 0.6s ease-in-out',
                                        zIndex: currentSlide === 1 ? 2 : 1,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            backgroundColor: '#1a1a1a',
                                            borderRadius: '2.5rem',
                                            overflow: 'hidden',
                                            backgroundImage: 'linear-gradient(135deg, #3d3d3d 0%, #1a1a1a 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#F5F5F0',
                                            fontFamily: 'Georgia, serif',
                                            fontSize: '1.5rem',
                                            textAlign: 'center',
                                            padding: '2rem',
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontSize: '0.875rem', marginBottom: '1rem', opacity: 0.7 }}>
                                                THE WEDDING OF
                                            </div>
                                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Dira</div>
                                            <div style={{ fontSize: '1.25rem', opacity: 0.9 }}>&amp;</div>
                                            <div style={{ fontSize: '2rem', marginTop: '0.5rem' }}>Kofi</div>
                                        </div>
                                    </div>
                                    {/* Dynamic Island Notch */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: '1rem',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            width: '5.5rem',
                                            height: '1.5rem',
                                            backgroundColor: 'black',
                                            borderRadius: '1.5rem',
                                        }}
                                    />
                                </div>

                                {/* Phone Mockup 3 - Enter from Right */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        width: '280px',
                                        height: '560px',
                                        backgroundColor: 'black',
                                        borderRadius: '3rem',
                                        padding: '0.4rem',
                                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                        transform: currentSlide === 2 ? 'translateX(0) scale(1)' : (currentSlide < 2 ? 'translateX(100%) scale(0.8)' : 'translateX(-100%) scale(0.8)'),
                                        opacity: currentSlide === 2 ? 1 : 0,
                                        transition: 'all 0.6s ease-in-out',
                                        zIndex: currentSlide === 2 ? 2 : 1,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            backgroundColor: '#1a1a1a',
                                            borderRadius: '2.5rem',
                                            overflow: 'hidden',
                                            backgroundImage: 'linear-gradient(135deg, #4d4d4d 0%, #1a1a1a 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#F5F5F0',
                                            fontFamily: 'Georgia, serif',
                                            fontSize: '1.5rem',
                                            textAlign: 'center',
                                            padding: '2rem',
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontSize: '0.875rem', marginBottom: '1rem', opacity: 0.7 }}>
                                                THE WEDDING OF
                                            </div>
                                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Sarah</div>
                                            <div style={{ fontSize: '1.25rem', opacity: 0.9 }}>&amp;</div>
                                            <div style={{ fontSize: '2rem', marginTop: '0.5rem' }}>John</div>
                                        </div>
                                    </div>
                                    {/* Dynamic Island Notch */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: '1rem',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            width: '5.5rem',
                                            height: '1.5rem',
                                            backgroundColor: 'black',
                                            borderRadius: '1.5rem',
                                        }}
                                    />
                                </div>

                                {/* Phone Mockup 4 - Enter from Left */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        width: '280px',
                                        height: '560px',
                                        backgroundColor: 'black',
                                        borderRadius: '3rem',
                                        padding: '0.4rem',
                                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                        transform: currentSlide === 3 ? 'translateX(0) scale(1)' : (currentSlide < 3 ? 'translateX(-100%) scale(0.8)' : 'translateX(100%) scale(0.8)'),
                                        opacity: currentSlide === 3 ? 1 : 0,
                                        transition: 'all 0.6s ease-in-out',
                                        zIndex: currentSlide === 3 ? 2 : 1,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            backgroundColor: '#1a1a1a',
                                            borderRadius: '2.5rem',
                                            overflow: 'hidden',
                                            backgroundImage: 'linear-gradient(135deg, #5d5d5d 0%, #1a1a1a 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#F5F5F0',
                                            fontFamily: 'Georgia, serif',
                                            fontSize: '1.5rem',
                                            textAlign: 'center',
                                            padding: '2rem',
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontSize: '0.875rem', marginBottom: '1rem', opacity: 0.7 }}>
                                                THE WEDDING OF
                                            </div>
                                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Emma</div>
                                            <div style={{ fontSize: '1.25rem', opacity: 0.9 }}>&amp;</div>
                                            <div style={{ fontSize: '2rem', marginTop: '0.5rem' }}>Michael</div>
                                        </div>
                                    </div>
                                    {/* Dynamic Island Notch */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: '1rem',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            width: '5.5rem',
                                            height: '1.5rem',
                                            backgroundColor: 'black',
                                            borderRadius: '1.5rem',
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Carousel Indicators */}
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: '2rem',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    display: 'flex',
                                    gap: '0.75rem',
                                    zIndex: 10,
                                }}
                            >
                                {[0, 1, 2, 3].map((index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentSlide(index)}
                                        style={{
                                            width: currentSlide === index ? '2rem' : '0.5rem',
                                            height: '0.5rem',
                                            borderRadius: '0.25rem',
                                            backgroundColor: currentSlide === index ? '#F5F5F0' : 'rgba(245, 245, 240, 0.3)',
                                            border: 'none',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s',
                                        }}
                                        aria-label={`Slide ${index + 1}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </main>

                {/* Kenapa pilih kami Section */}
                <section
                    style={{
                        padding: '4rem 2rem',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    <div
                        style={{
                            maxWidth: '1280px',
                            margin: '0 auto',
                        }}
                    >
                        {/* Section Title */}
                        <h2
                            style={{
                                fontSize: 'clamp(2rem, 5vw, 3rem)',
                                fontWeight: '300',
                                textAlign: 'center',
                                color: '#F5F5F0',
                                marginBottom: '3rem',
                                fontFamily: 'Georgia, serif',
                            }}
                        >
                            Kenapa pilih kami?
                        </h2>

                        {/* Features Grid */}
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                gap: '2rem',
                            }}
                        >
                            {/* Feature 1 */}
                            <div
                                style={{
                                    padding: '2rem',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '1rem',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    textAlign: 'center',
                                    transition: 'all 0.3s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <p
                                    style={{
                                        fontSize: '0.875rem',
                                        color: 'rgba(245, 245, 240, 0.9)',
                                        lineHeight: 1.8,
                                        margin: 0,
                                        fontFamily: 'Segoe UI, sans-serif',
                                    }}
                                >
                                    Menggunakan server terbaik menjadi hal prioritas kami dalam kelancaran mengirimkan undangan.
                                </p>
                            </div>

                            {/* Feature 2 */}
                            <div
                                style={{
                                    padding: '2rem',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '1rem',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    textAlign: 'center',
                                    transition: 'all 0.3s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <p
                                    style={{
                                        fontSize: '0.875rem',
                                        color: 'rgba(245, 245, 240, 0.9)',
                                        lineHeight: 1.8,
                                        margin: 0,
                                        fontFamily: 'Segoe UI, sans-serif',
                                    }}
                                >
                                    Unlimited nama tamu dengan fitur dashboard kirim kit yang mudah digunakan.
                                </p>
                            </div>

                            {/* Feature 3 */}
                            <div
                                style={{
                                    padding: '2rem',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '1rem',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    textAlign: 'center',
                                    transition: 'all 0.3s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <p
                                    style={{
                                        fontSize: '0.875rem',
                                        color: 'rgba(245, 245, 240, 0.9)',
                                        lineHeight: 1.8,
                                        margin: 0,
                                        fontFamily: 'Segoe UI, sans-serif',
                                    }}
                                >
                                    Desain undangan original dari Attari, yang disesuaikan dengan tema foto pre-wedding orang-orang Indonesia.
                                </p>
                            </div>

                            {/* Feature 4 */}
                            <div
                                style={{
                                    padding: '2rem',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '1rem',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    textAlign: 'center',
                                    transition: 'all 0.3s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <p
                                    style={{
                                        fontSize: '0.875rem',
                                        color: 'rgba(245, 245, 240, 0.9)',
                                        lineHeight: 1.8,
                                        margin: 0,
                                        fontFamily: 'Segoe UI, sans-serif',
                                    }}
                                >
                                    Semua data klien kami jaga dan tidak terdaftar dalam pencarian google.
                                </p>
                            </div>

                            {/* Feature 5 */}
                            <div
                                style={{
                                    padding: '2rem',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '1rem',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    textAlign: 'center',
                                    transition: 'all 0.3s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <p
                                    style={{
                                        fontSize: '0.875rem',
                                        color: 'rgba(245, 245, 240, 0.9)',
                                        lineHeight: 1.8,
                                        margin: 0,
                                        fontFamily: 'Segoe UI, sans-serif',
                                    }}
                                >
                                    Segala informasi dalam isi undangan disusun secara sistematis agar mudah terbaca.
                                </p>
                            </div>

                            {/* Feature 6 */}
                            <div
                                style={{
                                    padding: '2rem',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '1rem',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    textAlign: 'center',
                                    transition: 'all 0.3s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <p
                                    style={{
                                        fontSize: '0.875rem',
                                        color: 'rgba(245, 245, 240, 0.9)',
                                        lineHeight: 1.8,
                                        margin: 0,
                                        fontFamily: 'Segoe UI, sans-serif',
                                    }}
                                >
                                    Semua produk undangan kami high quality design dengan harga yang super affordable.
                                </p>
                            </div>

                        </div>
                    </div>
                </section>
            </div>

            {/* Responsive CSS */}
            <style jsx>{`
                @media (max-width: 768px) {
                    .landing-main {
                        padding-top: 7rem !important;
                    }
                    .landing-content {
                        text-align: center;
                        align-items: center;
                    }
                    .cta-buttons {
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
}
