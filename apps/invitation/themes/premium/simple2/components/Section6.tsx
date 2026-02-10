'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getBrideConfig, getGroomConfig } from '@/config/textConfig';
import { useInvitationContent } from '@/lib/contexts/InvitationContentContext';
import FontLoader from '@/lib/fonts/FontLoader';
import { getFontFamily } from '@/lib/fonts/fontBank';

interface CountdownParts {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

function toTwoDigits(value: number) {
    return String(Math.max(0, value)).padStart(2, '0');
}

function parseTargetDateTime(targetDateTime?: string, targetIsoDate?: string): Date | null {
    if (targetDateTime) {
        const d = new Date(targetDateTime);
        return isNaN(d.getTime()) ? null : d;
    }

    if (targetIsoDate) {
        // Expecting YYYY-MM-DD. If only date is provided, use local time 00:00.
        const d = new Date(`${targetIsoDate}T00:00:00`);
        return isNaN(d.getTime()) ? null : d;
    }

    return null;
}

export default function Section6({
    brideName,
    groomName,
    title,
    quoteText,
    backgroundImageUrl,
    overlayOpacity = 0.55,
    buttonLabel,
    targetDateTime,
    targetIsoDate,
    calendarLink,
    eventTitle,
}: {
    brideName?: string;
    groomName?: string;
    title: string;
    quoteText: string;
    backgroundImageUrl: string;
    overlayOpacity?: number;
    buttonLabel: string;
    targetDateTime?: string;
    targetIsoDate?: string;
    calendarLink?: string | null;
    eventTitle?: string;
}) {
    const invitationContent = useInvitationContent();
    const bride = getBrideConfig();
    const groom = getGroomConfig();

    const finalBrideName = brideName || invitationContent?.bride.name || bride.name;
    const finalGroomName = groomName || invitationContent?.groom.name || groom.name;
    const target = useMemo(() => parseTargetDateTime(targetDateTime, targetIsoDate), [targetDateTime, targetIsoDate]);

    const [countdown, setCountdown] = useState<CountdownParts>({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    });

    useEffect(() => {
        const tick = () => {
            if (!target) {
                setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }

            const diffMs = target.getTime() - Date.now();
            const diff = Math.max(0, diffMs);

            const totalSeconds = Math.floor(diff / 1000);
            const days = Math.floor(totalSeconds / 86400);
            const hours = Math.floor((totalSeconds % 86400) / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            setCountdown({ days, hours, minutes, seconds });
        };

        tick();
        const id = window.setInterval(tick, 1000);
        return () => window.clearInterval(id);
    }, [target]);

    const handleSaveDate = useCallback(() => {
        const defaultTitle = `The Wedding of ${finalBrideName} & ${finalGroomName}`;
        const titleFromContent = invitationContent?.event.eventTitle;
        const titleValue = eventTitle || titleFromContent || defaultTitle;

        const fullDateTime =
            invitationContent?.event.countdownDateTime ||
            targetDateTime ||
            invitationContent?.event.isoDate ||
            targetIsoDate;

        if (!fullDateTime) return;

        let formattedDates = '';
        if (fullDateTime.includes('T')) {
            const dateObj = new Date(fullDateTime);
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            const hours = String(dateObj.getHours()).padStart(2, '0');
            const minutes = String(dateObj.getMinutes()).padStart(2, '0');
            const seconds = String(dateObj.getSeconds()).padStart(2, '0');

            const startDateTime = `${year}${month}${day}T${hours}${minutes}${seconds}`;

            const endDateObj = new Date(dateObj.getTime());
            const endYear = endDateObj.getFullYear();
            const endMonth = String(endDateObj.getMonth() + 1).padStart(2, '0');
            const endDay = String(endDateObj.getDate()).padStart(2, '0');
            const endHours = String(endDateObj.getHours()).padStart(2, '0');
            const endMinutes = String(endDateObj.getMinutes()).padStart(2, '0');
            const endSeconds = String(endDateObj.getSeconds()).padStart(2, '0');
            const endDateTime = `${endYear}${endMonth}${endDay}T${endHours}${endMinutes}${endSeconds}`;

            formattedDates = `${startDateTime}/${endDateTime}`;
        } else {
            const formattedDate = fullDateTime.replace(/-/g, '');
            formattedDates = `${formattedDate}/${formattedDate}`;
        }

        const receptionVenue = invitationContent?.eventDetails?.reception?.venueName;
        const receptionVenueAddress = invitationContent?.eventDetails?.reception?.venueAddress;
        const receptionDateLabel = invitationContent?.eventDetails?.reception?.dateLabel;
        const receptionMapsUrl = invitationContent?.eventDetails?.reception?.mapsUrl;
        const holyMatrimonyVenue = invitationContent?.eventDetails?.holyMatrimony?.venueName;
        const holyMatrimonyVenueAddress = invitationContent?.eventDetails?.holyMatrimony?.venueAddress;
        const holyMatrimonyDateLabel = invitationContent?.eventDetails?.holyMatrimony?.dateLabel;
        const holyMatrimonyMapsUrl = invitationContent?.eventDetails?.holyMatrimony?.mapsUrl;

        const locationName = receptionVenue || holyMatrimonyVenue || '';
        const locationAddress = receptionVenueAddress || holyMatrimonyVenueAddress || '';
        const dateLabel =
            receptionDateLabel ||
            holyMatrimonyDateLabel ||
            invitationContent?.event.fullDateLabel ||
            '';
        const locationUrl = receptionMapsUrl || holyMatrimonyMapsUrl || '';

        const locationParam = locationUrl
            ? `${locationName ? encodeURIComponent(locationName) + ' - ' : ''}${encodeURIComponent(locationUrl)}`
            : locationName
                ? encodeURIComponent(locationName)
                : '';

        const descriptionLines = [
            `Pernikahan ${finalBrideName} & ${finalGroomName}`,
            '',
            dateLabel ? `Tanggal: ${dateLabel}` : '',
            locationName ? `Alamat: ${locationName}` : '',
            locationAddress ? locationAddress.replace(/\\n/g, ', ') : '',
            '',
            'Terima kasih atas kehadirannya.',
        ].filter((line) => line !== '');

        const description = descriptionLines.join('\n');
        const detailsParam = encodeURIComponent(description);

        const defaultLink = `https://calendar.google.com/calendar/u/0/r/eventedit?text=${encodeURIComponent(titleValue)}&details=${detailsParam}&dates=${formattedDates}&location=${locationParam}`;
        const linkFromContent = invitationContent?.event.calendarLink || undefined;

        const link = calendarLink || linkFromContent || defaultLink;
        window.open(link, '_blank');
    }, [calendarLink, eventTitle, finalBrideName, finalGroomName, invitationContent, targetDateTime, targetIsoDate]);

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
                        padding: '96px 24px 56px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        alignItems: 'flex-start',
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
                        }}
                    >
                        {title}
                    </h2>

                    <p
                        style={{
                            fontFamily: getFontFamily('rasa', 'serif'),
                            fontSize: '14px',
                            fontWeight: 300,
                            lineHeight: 1.7,
                            color: 'rgba(255,255,255,0.9)',
                            margin: '18px 0 0 0',
                            maxWidth: '360px',
                        }}
                    >
                        {quoteText}
                    </p>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                            gap: '18px',
                            marginTop: '30px',
                            width: '100%',
                            maxWidth: '380px',
                        }}
                    >
                        {[
                            { value: countdown.days, label: 'Days' },
                            { value: countdown.hours, label: 'Hours' },
                            { value: countdown.minutes, label: 'Minutes' },
                            { value: countdown.seconds, label: 'Seconds' },
                        ].map((item) => (
                            <div key={item.label} style={{ textAlign: 'left' }}>
                                <div
                                    style={{
                                        fontFamily: getFontFamily('ebGaramond', 'serif'),
                                        fontSize: '38px',
                                        fontWeight: 400,
                                        lineHeight: 1,
                                        letterSpacing: '0.02em',
                                    }}
                                >
                                    {toTwoDigits(item.value)}
                                </div>
                                <div
                                    style={{
                                        fontFamily: getFontFamily('rasa', 'serif'),
                                        fontSize: '12px',
                                        fontWeight: 300,
                                        marginTop: '6px',
                                        opacity: 0.9,
                                    }}
                                >
                                    {item.label}
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleSaveDate}
                        style={{
                            marginTop: '32px',
                            padding: 0,
                            border: 'none',
                            background: 'transparent',
                            color: '#ffffff',
                            fontFamily: getFontFamily('rasa', 'serif'),
                            fontSize: '13px',
                            fontWeight: 600,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            cursor: calendarLink || target ? 'pointer' : 'default',
                            opacity: calendarLink || target ? 1 : 0.6,
                        }}
                    >
                        {buttonLabel}
                    </button>
                </div>
            </div>
        </section>
    );
}
