'use client';

import FontLoader from '@/lib/fonts/FontLoader';
import { getFontFamily } from '@/lib/fonts/fontBank';

interface Section10Link {
    label: string;
    url?: string;
}

interface Section10Props {
    backgroundImageUrl: string;
    overlayOpacity?: number;
    eyebrow: string;
    title: string;
    description: string;
    weddingFrameLink: Section10Link;
    uploadPhotosLink: Section10Link;
    disclaimer: string;
}

function LinkRow({ icon, link }: { icon: React.ReactNode; link: Section10Link }) {
    if (!link.url) return null;
    return (
        <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                marginTop: '14px',
                fontFamily: getFontFamily('ebGaramond', 'serif'),
                fontSize: '14px',
                fontWeight: 400,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#ffffff',
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
            }}
        >
            {icon}
            <span>{link.label}</span>
        </a>
    );
}

export default function Section10({
    backgroundImageUrl,
    overlayOpacity = 0.62,
    eyebrow,
    title,
    description,
    weddingFrameLink,
    uploadPhotosLink,
    disclaimer,
}: Section10Props) {
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
                        padding: '0 24px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        color: '#ffffff',
                    }}
                >
                    <p
                        style={{
                            fontFamily: getFontFamily('ebGaramond', 'serif'),
                            fontSize: '14px',
                            fontWeight: 400,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            margin: 0,
                            color: 'rgba(255,255,255,0.92)',
                        }}
                    >
                        {eyebrow}
                    </p>

                    <h2
                        style={{
                            fontFamily: getFontFamily('ebGaramond', 'serif'),
                            fontSize: '34px',
                            fontWeight: 400,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            margin: '12px 0 0 0',
                            lineHeight: 1.05,
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
                            margin: '16px 0 0 0',
                            maxWidth: '420px',
                        }}
                    >
                        {description}
                    </p>

                    <div style={{ marginTop: '6px' }}>
                        <LinkRow
                            link={weddingFrameLink}
                            icon={
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
                            }
                        />

                        <LinkRow
                            link={uploadPhotosLink}
                            icon={
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M12 3V15"
                                        stroke="rgba(255,255,255,0.9)"
                                        strokeWidth="1.6"
                                        strokeLinecap="round"
                                    />
                                    <path
                                        d="M7 8L12 3L17 8"
                                        stroke="rgba(255,255,255,0.9)"
                                        strokeWidth="1.6"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        d="M4 14V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V14"
                                        stroke="rgba(255,255,255,0.9)"
                                        strokeWidth="1.6"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            }
                        />
                    </div>

                    <p
                        style={{
                            fontFamily: getFontFamily('rasa', 'serif'),
                            fontSize: '13px',
                            fontWeight: 300,
                            lineHeight: 1.6,
                            margin: '26px 0 0 0',
                            color: 'rgba(255,255,255,0.9)',
                        }}
                    >
                        {disclaimer}
                    </p>
                </div>
            </div>
        </section>
    );
}
