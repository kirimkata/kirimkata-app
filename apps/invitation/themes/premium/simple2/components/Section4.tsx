'use client';

import FontLoader from '@/lib/fonts/FontLoader';
import { getFontFamily } from '@/lib/fonts/fontBank';

interface Section4Props {
    titleLabel?: string;
    name: string;
    roleLabel?: string;
    childLabel?: string;
    fatherName: string;
    motherName: string;
    instagram?: string;
    backgroundImageUrl: string;
    overlayOpacity?: number;
    gradientStartOpacity?: number;
    gradientEndOpacity?: number;
    gradientStopPercent?: number;
}

function normalizeInstagramHandle(value?: string) {
    const raw = (value ?? '').trim();
    if (!raw) return '';
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
        try {
            const u = new URL(raw);
            const parts = u.pathname.split('/').filter(Boolean);
            return parts[0] ? `@${parts[0]}` : raw;
        } catch {
            return raw;
        }
    }
    return raw.startsWith('@') ? raw : `@${raw}`;
}

export default function Section4({
    titleLabel = 'THE BRIDE',
    roleLabel,
    name,
    childLabel = 'PUTRI KEDUA DARI',
    fatherName,
    motherName,
    instagram,
    backgroundImageUrl,
    overlayOpacity = 0,
    gradientStartOpacity = 0.85,
    gradientEndOpacity = 0,
    gradientStopPercent = 65,
}: Section4Props) {
    const igHandle = normalizeInstagramHandle(instagram);

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

            {overlayOpacity > 0 ? (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
                    }}
                />
            ) : null}

            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: `linear-gradient(to top, rgba(0,0,0,${gradientStartOpacity}) 0%, rgba(0,0,0,${gradientEndOpacity}) ${gradientStopPercent}%)`,
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
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        padding: '0 24px 72px',
                        color: '#ffffff',
                    }}
                >
                    <p
                        style={{
                            fontFamily: getFontFamily('ebGaramond', 'serif'),
                            fontSize: '12px',
                            fontWeight: 400,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            margin: 0,
                            opacity: 0.9,
                        }}
                    >
                        {titleLabel}
                    </p>

                    <h2
                        style={{
                            fontFamily: getFontFamily('ebGaramond', 'serif'),
                            fontSize: 'clamp(36px, 7vw, 54px)',
                            fontWeight: 400,
                            lineHeight: 1.05,
                            margin: '10px 0 14px 0',
                        }}
                    >
                        {name}
                    </h2>

                    {roleLabel ? (
                        <p
                            style={{
                                fontFamily: getFontFamily('rasa', 'serif'),
                                fontSize: '12px',
                                fontWeight: 300,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                margin: '0 0 14px 0',
                                opacity: 0.85,
                            }}
                        >
                            {roleLabel}
                        </p>
                    ) : null}

                    <p
                        style={{
                            fontFamily: getFontFamily('rasa', 'serif'),
                            fontSize: '12px',
                            fontWeight: 300,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            margin: '0 0 8px 0',
                            opacity: 0.85,
                        }}
                    >
                        {childLabel}
                    </p>

                    <p
                        style={{
                            fontFamily: getFontFamily('rasa', 'serif'),
                            fontSize: '14px',
                            fontWeight: 300,
                            lineHeight: 1.55,
                            margin: 0,
                            opacity: 0.92,
                        }}
                    >
                        {fatherName}
                        <br />
                        &amp; {motherName}
                    </p>

                    {igHandle ? (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginTop: '16px',
                                opacity: 0.95,
                            }}
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden="true"
                            >
                                <path
                                    d="M7 2H17C19.7614 2 22 4.23858 22 7V17C22 19.7614 19.7614 22 17 22H7C4.23858 22 2 19.7614 2 17V7C2 4.23858 4.23858 2 7 2Z"
                                    stroke="rgba(255,255,255,0.9)"
                                    strokeWidth="1.5"
                                />
                                <path
                                    d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z"
                                    stroke="rgba(255,255,255,0.9)"
                                    strokeWidth="1.5"
                                />
                                <path
                                    d="M17.5 6.5H17.51"
                                    stroke="rgba(255,255,255,0.9)"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <span
                                style={{
                                    fontFamily: getFontFamily('rasa', 'serif'),
                                    fontSize: '12px',
                                    fontWeight: 400,
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                }}
                            >
                                {igHandle}
                            </span>
                        </div>
                    ) : null}
                </div>
            </div>
        </section>
    );
}
