'use client';

import FontLoader from '@/lib/fonts/FontLoader';
import { getFontFamily } from '@/lib/fonts/fontBank';

interface EventDetailProps {
    title: string;
    dateLabel: string;
    timeLabel: string;
    venueName: string;
    venueAddress: string;
    mapsUrl?: string;
    mapsLabel?: string;
}

interface Section7Props {
    backgroundImageUrl: string;
    overlayOpacity?: number;
    fullDateLabel: string;
    holyMatrimony: EventDetailProps;
    reception: EventDetailProps;
}

function MapsLink({ mapsUrl, mapsLabel }: { mapsUrl?: string; mapsLabel?: string }) {
    if (!mapsUrl) return null;
    return (
        <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
                display: 'inline-block',
                marginTop: '12px',
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
            {mapsLabel || 'GOOGLE MAPS'}
        </a>
    );
}

function EventBlock({ title, dateLabel, timeLabel, venueName, venueAddress, mapsUrl, mapsLabel }: EventDetailProps) {
    return (
        <div style={{ width: '100%' }}>
            <h3
                style={{
                    fontFamily: getFontFamily('ebGaramond', 'serif'),
                    fontSize: '22px',
                    fontWeight: 400,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    margin: 0,
                    color: '#ffffff',
                }}
            >
                {title}
            </h3>

            <p
                style={{
                    fontFamily: getFontFamily('ebGaramond', 'serif'),
                    fontSize: '14px',
                    fontWeight: 400,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    margin: '12px 0 0 0',
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
                    fontFamily: getFontFamily('ebGaramond', 'serif'),
                    fontSize: '18px',
                    fontWeight: 400,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    margin: '18px 0 0 0',
                    color: '#ffffff',
                }}
            >
                {venueName}
            </p>

            <p
                style={{
                    fontFamily: getFontFamily('rasa', 'serif'),
                    fontSize: '14px',
                    fontWeight: 300,
                    lineHeight: 1.6,
                    margin: '8px 0 0 0',
                    color: 'rgba(255,255,255,0.92)',
                    whiteSpace: 'pre-line',
                }}
            >
                {venueAddress}
            </p>

            <MapsLink mapsUrl={mapsUrl} mapsLabel={mapsLabel} />
        </div>
    );
}

export default function Section7({
    backgroundImageUrl,
    overlayOpacity = 0.55,
    fullDateLabel,
    holyMatrimony,
    reception,
}: Section7Props) {
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
                        color: '#ffffff',
                    }}
                >
                    <h2
                        style={{
                            fontFamily: getFontFamily('ebGaramond', 'serif'),
                            fontSize: '34px',
                            fontWeight: 400,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            margin: 0,
                            lineHeight: 1.15,
                            maxWidth: '360px',
                        }}
                    >
                        {fullDateLabel}
                    </h2>

                    <div
                        style={{
                            width: '100%',
                            height: '1px',
                            backgroundColor: 'rgba(255,255,255,0.55)',
                            marginTop: '18px',
                            marginBottom: '22px',
                        }}
                    />

                    <EventBlock {...holyMatrimony} />

                    <div
                        style={{
                            width: '100%',
                            height: '1px',
                            backgroundColor: 'rgba(255,255,255,0.55)',
                            marginTop: '26px',
                            marginBottom: '22px',
                        }}
                    />

                    <EventBlock {...reception} />
                </div>
            </div>
        </section>
    );
}
