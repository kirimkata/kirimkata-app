'use client';

import FontLoader from '@/lib/fonts/FontLoader';
import { getFontFamily } from '@/lib/fonts/fontBank';

interface Section2Props {
    brideName: string;
    groomName: string;
    backgroundImageUrl: string;
    overlayOpacity?: number;
    quoteText: string;
    quoteReference: string;
}

export default function Section2({
    brideName,
    groomName,
    backgroundImageUrl,
    overlayOpacity = 0.65,
    quoteText,
    quoteReference,
}: Section2Props) {
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
                }}
            />

            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
                }}
            />

            <div style={{ position: 'relative', zIndex: 1, height: '100%', width: '100%' }}>
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        maxWidth: '500px',
                        margin: '0 auto',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        padding: '0 24px 64px',
                        textAlign: 'center',
                    }}
                >
                <p
                    style={{
                        fontFamily: getFontFamily('ebGaramond', 'serif'),
                        fontSize: '11px',
                        fontWeight: 400,
                        letterSpacing: '0.25em',
                        textTransform: 'uppercase',
                        color: '#ffffff',
                        margin: '0 0 12px 0',
                    }}
                >
                    THE WEDDING OF
                </p>

                <h2
                    style={{
                        fontFamily: getFontFamily('ebGaramond', 'serif'),
                        fontSize: 'clamp(34px, 7vw, 52px)',
                        fontWeight: 400,
                        letterSpacing: '0.05em',
                        lineHeight: 1.1,
                        color: '#ffffff',
                        margin: '0 0 20px 0',
                        textTransform: 'uppercase',
                    }}
                >
                    {brideName} & {groomName}
                </h2>

                <p
                    style={{
                        fontFamily: getFontFamily('rasa', 'serif'),
                        fontSize: '14px',
                        fontWeight: 300,
                        lineHeight: 1.6,
                        color: 'rgba(255, 255, 255, 0.85)',
                        maxWidth: '360px',
                        margin: '0 0 10px 0',
                    }}
                >
                    {quoteText}
                </p>

                <p
                    style={{
                        fontFamily: getFontFamily('rasa', 'serif'),
                        fontSize: '12px',
                        fontWeight: 400,
                        letterSpacing: '0.04em',
                        color: 'rgba(255, 255, 255, 0.85)',
                        margin: 0,
                    }}
                >
                    {quoteReference}
                </p>
                </div>
            </div>
        </section>
    );
}
