'use client';

import FontLoader from '@/lib/fonts/FontLoader';
import { getFontFamily } from '@/lib/fonts/fontBank';

interface Section9Props {
    backgroundImageUrl: string;
    overlayOpacity?: number;
    thumbnailImageUrl: string;
    title: string;
    dateLabel: string;
    timeLabel: string;
    description: string;
    streamingUrl?: string;
    linkLabel: string;
}

function normalizeTitleLines(value: string) {
    return (value || '').split(/\n/).filter(Boolean);
}

export default function Section9({
    backgroundImageUrl,
    overlayOpacity = 0.6,
    thumbnailImageUrl,
    title,
    dateLabel,
    timeLabel,
    description,
    streamingUrl,
    linkLabel,
}: Section9Props) {
    const titleLines = normalizeTitleLines(title);
    const hasUrl = Boolean(streamingUrl && streamingUrl.trim());

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
                        padding: '64px 24px 40px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        color: '#ffffff',
                    }}
                >
                    <div
                        style={{
                            width: 120,
                            height: 120,
                            borderRadius: 0,
                            overflow: 'hidden',
                            backgroundColor: 'rgba(255,255,255,0.08)',
                            boxShadow: '0 10px 26px rgba(0,0,0,0.35)',
                            marginBottom: '22px',
                        }}
                    >
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                backgroundImage: `url(${thumbnailImageUrl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                            }}
                        />
                    </div>

                    <h2
                        style={{
                            fontFamily: getFontFamily('ebGaramond', 'serif'),
                            fontSize: '30px',
                            fontWeight: 400,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            margin: 0,
                            lineHeight: 1.1,
                            maxWidth: '380px',
                        }}
                    >
                        {titleLines.length ? (
                            titleLines.map((line, idx) => (
                                <span key={`${line}-${idx}`}>
                                    {line}
                                    {idx < titleLines.length - 1 ? <br /> : null}
                                </span>
                            ))
                        ) : (
                            <span>{title}</span>
                        )}
                    </h2>

                    <p
                        style={{
                            fontFamily: getFontFamily('ebGaramond', 'serif'),
                            fontSize: '14px',
                            fontWeight: 400,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            margin: '18px 0 0 0',
                            color: 'rgba(255,255,255,0.92)',
                        }}
                    >
                        {dateLabel}
                    </p>

                    <p
                        style={{
                            fontFamily: getFontFamily('ebGaramond', 'serif'),
                            fontSize: '14px',
                            fontWeight: 400,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            margin: '6px 0 0 0',
                            color: 'rgba(255,255,255,0.92)',
                        }}
                    >
                        {timeLabel}
                    </p>

                    <p
                        style={{
                            fontFamily: getFontFamily('rasa', 'serif'),
                            fontSize: '14px',
                            fontWeight: 300,
                            lineHeight: 1.7,
                            margin: '16px 0 0 0',
                            color: 'rgba(255,255,255,0.92)',
                            maxWidth: '420px',
                        }}
                    >
                        {description}
                    </p>

                    {hasUrl ? (
                        <a
                            href={streamingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginTop: '18px',
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
                            <span>{linkLabel}</span>
                        </a>
                    ) : null}
                </div>
            </div>
        </section>
    );
}
