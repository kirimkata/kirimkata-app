'use client';

import { useEffect, useState } from 'react';
import FontLoader from '@/lib/fonts/FontLoader';
import { getFontFamily } from '@/lib/fonts/fontBank';
import { listWishes, type AttendanceStatus } from '@/lib/repositories/wishesRepository';

interface Section13Props {
    invitationSlug: string;
    backgroundImageUrl: string;
    overlayOpacity?: number;
    title: string;
    description: string;
    maxListHeightVh?: number;
}

interface MessageItem {
    id: number;
    name: string;
    message: string;
    timeAgo: string;
    attendance?: AttendanceStatus;
}

function AttendanceBadge({ attendance }: { attendance?: AttendanceStatus }) {
    if (!attendance) return null;

    const badgeOutlinePath =
        'M13.8179 4.54512L13.6275 4.27845C12.8298 3.16176 11.1702 3.16176 10.3725 4.27845L10.1821 4.54512C9.76092 5.13471 9.05384 5.45043 8.33373 5.37041L7.48471 5.27608C6.21088 5.13454 5.13454 6.21088 5.27608 7.48471L5.37041 8.33373C5.45043 9.05384 5.13471 9.76092 4.54512 10.1821L4.27845 10.3725C3.16176 11.1702 3.16176 12.8298 4.27845 13.6275L4.54512 13.8179C5.13471 14.2391 5.45043 14.9462 5.37041 15.6663L5.27608 16.5153C5.13454 17.7891 6.21088 18.8655 7.48471 18.7239L8.33373 18.6296C9.05384 18.5496 9.76092 18.8653 10.1821 19.4549L10.3725 19.7215C11.1702 20.8382 12.8298 20.8382 13.6275 19.7215L13.8179 19.4549C14.2391 18.8653 14.9462 18.5496 15.6663 18.6296L16.5153 18.7239C17.7891 18.8655 18.8655 17.7891 18.7239 16.5153L18.6296 15.6663C18.5496 14.9462 18.8653 14.2391 19.4549 13.8179L19.7215 13.6275C20.8382 12.8298 20.8382 11.1702 19.7215 10.3725L19.4549 10.1821C18.8653 9.76092 18.5496 9.05384 18.6296 8.33373L18.7239 7.48471C18.8655 6.21088 17.7891 5.13454 16.5153 5.27608L15.6663 5.37041C14.9462 5.45043 14.2391 5.13471 13.8179 4.54512Z';

    const strokeColor =
        attendance === 'hadir'
            ? '#3d9a62'
            : attendance === 'tidak-hadir'
                ? '#dc2626'
                : '#eab308';

    const commonStroke = {
        stroke: strokeColor,
        strokeWidth: 2,
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
    };

    return (
        <span
            style={{
                marginLeft: 8,
                display: 'inline-flex',
                alignItems: 'center',
            }}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                style={{ display: 'block' }}
                aria-hidden="true"
            >
                <path d={badgeOutlinePath} {...commonStroke} />
                {attendance === 'hadir' ? (
                    <path d="M9 12L10.8189 13.8189L15 10" {...commonStroke} />
                ) : null}
                {attendance === 'tidak-hadir' ? (
                    <path d="M10 10L14 14M14 10L10 14" {...commonStroke} />
                ) : null}
                {attendance === 'masih-ragu' ? (
                    <g transform="translate(12 12) scale(0.78) translate(-12 -12)">
                        <path
                            d="M9.5 9C9.5 7.61929 10.6193 6.5 12 6.5C13.3807 6.5 14.5 7.61929 14.5 9C14.5 10.1 13.8 10.7 13.2 11.2C12.6 11.7 12 12.1 12 13.2V14"
                            {...commonStroke}
                        />
                        <path d="M12 17H12.01" {...commonStroke} />
                    </g>
                ) : null}
            </svg>
        </span>
    );
}

const formatTimeAgo = (isoString: string): string => {
    const created = new Date(isoString);
    const diffMs = Date.now() - created.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return 'Baru saja';
    if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} hari yang lalu`;
};

export default function Section13({
    invitationSlug,
    backgroundImageUrl,
    overlayOpacity = 0.62,
    title,
    description,
    maxListHeightVh = 52,
}: Section13Props) {
    const [items, setItems] = useState<MessageItem[]>([]);

    const loadWishes = async () => {
        try {
            const rows = await listWishes(invitationSlug);
            setItems(
                rows.map((row) => ({
                    id: row.id,
                    name: row.name,
                    message: row.message,
                    attendance: row.attendance,
                    timeAgo: formatTimeAgo(row.createdAt),
                })),
            );
        } catch (error) {
            console.error('Failed to load wishes from Supabase', error);
        }
    };

    useEffect(() => {
        loadWishes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                        justifyContent: 'flex-start',
                        alignItems: 'stretch',
                        color: '#ffffff',
                    }}
                >
                    <h2
                        style={{
                            textAlign: 'center',
                            fontFamily: getFontFamily('ebGaramond', 'serif'),
                            fontSize: '34px',
                            fontWeight: 400,
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                            margin: 0,
                        }}
                    >
                        {title}
                    </h2>

                    <p
                        style={{
                            textAlign: 'center',
                            fontFamily: getFontFamily('rasa', 'serif'),
                            fontSize: '14px',
                            fontWeight: 300,
                            lineHeight: 1.75,
                            color: 'rgba(255,255,255,0.92)',
                            margin: '12px auto 0',
                            maxWidth: '420px',
                        }}
                    >
                        {description}
                    </p>
                    <div
                        style={{
                            marginTop: 18,
                            borderTop: '1px solid rgba(255,255,255,0.22)',
                            paddingTop: 16,
                        }}
                    >
                        <div
                            style={{
                                maxHeight: `calc(${maxListHeightVh}vh)`,
                                overflowY: 'auto',
                                overflowX: 'hidden',
                                WebkitOverflowScrolling: 'touch',
                                paddingRight: 2,
                            }}
                        >
                            {items.map((item) => (
                                <div key={item.id} style={{ padding: '10px 0' }}>
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-start',
                                            gap: 4,
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontFamily: getFontFamily('ebGaramond', 'serif'),
                                                fontSize: 18,
                                                letterSpacing: '0.02em',
                                                fontWeight: 400,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                flexWrap: 'wrap',
                                            }}
                                        >
                                            {item.name}
                                            <AttendanceBadge attendance={item.attendance} />
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            marginTop: 6,
                                            fontFamily: getFontFamily('rasa', 'serif'),
                                            fontSize: 14,
                                            lineHeight: 1.7,
                                            color: 'rgba(255,255,255,0.92)',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                        }}
                                    >
                                        {item.message}
                                    </div>
                                    <div
                                        style={{
                                            fontFamily: getFontFamily('rasa', 'serif'),
                                            fontSize: 10,
                                            color: 'rgba(255,255,255,0.75)',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {item.timeAgo}
                                    </div>
                                    <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.18)', marginTop: 12 }} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
