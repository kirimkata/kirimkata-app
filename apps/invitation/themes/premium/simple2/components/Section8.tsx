'use client';

import FontLoader from '@/lib/fonts/FontLoader';
import { getFontFamily } from '@/lib/fonts/fontBank';

interface Section8Props {
    backgroundImageUrl: string;
    overlayOpacity?: number;
    title: string;
    description: string;
    colors: string[];
}

export default function Section8({
    backgroundImageUrl,
    overlayOpacity = 0.45,
    title,
    description,
    colors,
}: Section8Props) {
    const palette = (colors || []).slice(0, 6);

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
                    filter: 'saturate(0.95) contrast(1.05)',
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
                        padding: '0 24px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        color: '#ffffff',
                    }}
                >
                    <h2
                        style={{
                            fontFamily: getFontFamily('ebGaramond', 'serif'),
                            fontSize: '28px',
                            fontWeight: 400,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            margin: 0,
                            maxWidth: '360px',
                            lineHeight: 1.15,
                        }}
                    >
                        {title}
                    </h2>

                    <p
                        style={{
                            fontFamily: getFontFamily('rasa', 'serif'),
                            fontSize: '14px',
                            fontWeight: 300,
                            lineHeight: 1.75,
                            color: 'rgba(255,255,255,0.92)',
                            margin: '14px 0 0 0',
                            maxWidth: '380px',
                        }}
                    >
                        {description}
                    </p>

                    <div
                        style={{
                            display: 'flex',
                            gap: '14px',
                            marginTop: '18px',
                            flexWrap: 'wrap',
                        }}
                    >
                        {palette.map((color, idx) => (
                            <div
                                key={`${color}-${idx}`}
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 9999,
                                    backgroundColor: color,
                                    border: '2px solid rgba(255,255,255,0.9)',
                                    boxShadow: '0 10px 20px rgba(0,0,0,0.25)',
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
