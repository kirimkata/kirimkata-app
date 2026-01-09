'use client';

import FontLoader from '@/lib/fonts/FontLoader';
import { getFontFamily } from '@/lib/fonts/fontBank';

interface Section3Props {
    quoteText: string;
    signatureText: string;
    backgroundImageUrl: string;
    overlayOpacity?: number;
}

export default function Section3({
    quoteText,
    signatureText,
    backgroundImageUrl,
    overlayOpacity = 0.55,
}: Section3Props) {
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

            <div
                style={{
                    position: 'relative',
                    zIndex: 1,
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '0 28px',
                    maxWidth: '500px',
                    margin: '0 auto',
                }}
            >
                <p
                    style={{
                        fontFamily: getFontFamily('rasa', 'serif'),
                        fontSize: '18px',
                        fontWeight: 300,
                        lineHeight: 1.55,
                        color: 'rgba(255, 255, 255, 0.88)',
                        margin: 0,
                        maxWidth: '380px',
                        textAlign: 'left',
                    }}
                >
                    {quoteText}
                </p>

                <div
                    style={{
                        width: '100%',
                        maxWidth: '380px',
                        marginTop: '18px',
                        display: 'flex',
                        justifyContent: 'flex-end',
                    }}
                >
                    <p
                        style={{
                            fontFamily: getFontFamily('ebGaramond', 'serif'),
                            fontSize: '18px',
                            fontWeight: 400,
                            color: 'rgba(255, 255, 255, 0.92)',
                            margin: 0,
                            textAlign: 'right',
                        }}
                    >
                        {signatureText}
                    </p>
                </div>
            </div>
        </section>
    );
}
