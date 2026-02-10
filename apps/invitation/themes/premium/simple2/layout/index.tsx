'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getBrideConfig, getGroomConfig } from '@/config/textConfig';
import { useInvitationContent } from '@/lib/contexts/InvitationContentContext';
import type { ContentLayoutProps } from '@/themes/types';
import CoverSection from '../components/CoverSection';
import { backgroundConfig } from '../config/backgroundConfig';
import Section2 from '../components/Section2';
import { section2Config } from '../config/section2Config';
import Section3 from '../components/Section3';
import { section3Config } from '../config/section3Config';
import Section4 from '../components/Section4';
import { section4Config } from '../config/section4Config';
import Section5 from '../components/Section5';
import { section5Config } from '../config/section5Config';
import Section6 from '../components/Section6';
import { section6Config } from '../config/section6Config';
import Section7 from '../components/Section7';
import { section7Config } from '../config/section7Config';
import Section8 from '../components/Section8';
import { section8Config } from '../config/section8Config';
import Section9 from '../components/Section9';
import { section9Config } from '../config/section9Config';
import Section10 from '../components/Section10';
import { section10Config } from '../config/section10Config';
import Section11 from '../components/Section11';
import { section11Config } from '../config/section11Config';
import Section12 from '../components/Section12';
import { section12Config } from '../config/section12Config';
import Section13 from '../components/Section13';
import { section13Config } from '../config/section13Config';
import Section14 from '../components/Section14';
import { section14Config } from '../config/section14Config';
import Section15 from '../components/Section15';
import { section15Config } from '../config/section15Config';

interface LayoutSimple2Props extends ContentLayoutProps {
    showCover?: boolean;
    onCoverComplete?: () => void;
}

/**
 * LayoutSimple2 - Layout with static cover + scrollable content
 * 
 * Features:
 * - Premium static cover with video/photo backgrounds
 * - Smooth transition from cover to content
 * - Full-page scrollable content
 * - All standard invitation sections
 * - Mobile-optimized with viewport fix
 */
export default function LayoutSimple2({
    clientSlug,
    guestName,
    brideName,
    groomName,
    showCover = true,
    onCoverComplete,
}: LayoutSimple2Props) {
    const invitationContent = useInvitationContent();
    const bride = getBrideConfig();
    const groom = getGroomConfig();

    const finalBrideName = brideName || invitationContent?.bride.name || bride.name;
    const finalGroomName = groomName || invitationContent?.groom.name || groom.name;

    const brideFullName = invitationContent?.bride.fullName || bride.fullName || finalBrideName;
    const brideFatherName = invitationContent?.bride.fatherName || bride.fatherName || '[BRIDE_FATHER_NAME]';
    const brideMotherName = invitationContent?.bride.motherName || bride.motherName || '[BRIDE_MOTHER_NAME]';
    const brideInstagram = invitationContent?.bride.instagram || bride.instagram;

    const loveStoryFromDb = invitationContent?.loveStory;
    const loveStoryTitle = loveStoryFromDb?.mainTitle || section5Config.mainTitle;
    const loveStoryBackgroundImageUrl = loveStoryFromDb?.backgroundImage || section5Config.backgroundImageUrl;
    const loveStoryBlocks =
        loveStoryFromDb?.blocks?.length
            ? loveStoryFromDb.blocks
            : section5Config.blocks;

    const eventTitle =
        invitationContent?.event?.eventTitle ||
        invitationContent?.profile?.coupleNames ||
        `${finalBrideName} & ${finalGroomName}`;

    const calendarLink = invitationContent?.event?.calendarLink;
    const countdownDateTime = invitationContent?.event?.countdownDateTime;
    const eventIsoDate = invitationContent?.event?.isoDate;

    const [mounted, setMounted] = useState(false);
    const [isCoverVisible, setIsCoverVisible] = useState(showCover);
    const [isCoverMounted, setIsCoverMounted] = useState(showCover);
    const [isSectionVisible, setIsSectionVisible] = useState(!showCover);
    const hideCoverTimerRef = useRef<number | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        return () => {
            if (hideCoverTimerRef.current) {
                window.clearTimeout(hideCoverTimerRef.current);
            }
        };
    }, []);

    // Handle cover open
    const handleOpenInvitation = useCallback(() => {
        setIsCoverVisible(false);
        setIsSectionVisible(true);
        onCoverComplete?.();
        if (hideCoverTimerRef.current) {
            window.clearTimeout(hideCoverTimerRef.current);
        }
        hideCoverTimerRef.current = window.setTimeout(() => {
            setIsCoverMounted(false);
        }, 1000);
    }, [onCoverComplete]);

    // SSR safety
    if (!mounted) return null;

    return (
        <>
            {/* Cover Section */}
            {isCoverMounted && (
                <CoverSection
                    brideName={finalBrideName}
                    groomName={finalGroomName}
                    weddingDate={invitationContent?.event.isoDate ?? ''}
                    guestName={guestName}
                    backgroundConfig={backgroundConfig}
                    onOpenInvitation={handleOpenInvitation}
                    isVisible={isCoverVisible}
                />
            )}

            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 50,
                    backgroundColor: '#000000',
                    opacity: isSectionVisible ? 1 : 0,
                    visibility: isSectionVisible ? 'visible' : 'hidden',
                    pointerEvents: isSectionVisible ? 'auto' : 'none',
                    transition: 'opacity 1000ms ease-in-out, visibility 0s linear 1000ms',
                    height: 'calc(var(--vh, 1vh) * 100)',
                    maxHeight: 'calc(var(--vh, 1vh) * 100)',
                }}
            >
                <div
                    className="w-full h-full overflow-y-auto overflow-x-hidden"
                    style={{
                        WebkitOverflowScrolling: 'touch',
                        overscrollBehavior: 'contain',
                        touchAction: 'pan-y',
                        scrollSnapType: 'y mandatory',
                        height: 'calc(var(--vh, 1vh) * 100)',
                        maxHeight: 'calc(var(--vh, 1vh) * 100)',
                        width: '100%',
                        maxWidth: '500px',
                        margin: '0 auto',
                    }}
                >
                    <div style={{ scrollSnapAlign: 'start' }}>
                        <Section2
                            brideName={finalBrideName}
                            groomName={finalGroomName}
                            backgroundImageUrl={section2Config.backgroundImageUrl}
                            overlayOpacity={section2Config.overlayOpacity}
                            quoteText={section2Config.quoteText}
                            quoteReference={section2Config.quoteReference}
                        />
                    </div>

                    <div style={{ scrollSnapAlign: 'start' }}>
                        <Section3
                            backgroundImageUrl={section3Config.backgroundImageUrl}
                            overlayOpacity={section3Config.overlayOpacity}
                            quoteText={section3Config.quoteText}
                            signatureText={section3Config.signatureText ?? `${finalBrideName} & ${finalGroomName}`}
                        />
                    </div>

                    <div style={{ scrollSnapAlign: 'start' }}>
                        <Section4
                            titleLabel="THE BRIDE"
                            name={brideFullName}
                            childLabel="PUTRI KEDUA DARI"
                            fatherName={brideFatherName}
                            motherName={brideMotherName}
                            instagram={brideInstagram}
                            backgroundImageUrl={section4Config.backgroundImageUrl}
                            overlayOpacity={section4Config.overlayOpacity}
                            gradientStartOpacity={section4Config.gradientStartOpacity}
                            gradientEndOpacity={section4Config.gradientEndOpacity}
                            gradientStopPercent={section4Config.gradientStopPercent}
                        />
                    </div>

                    <div style={{ scrollSnapAlign: 'start' }}>
                        <Section5
                            mainTitle={loveStoryTitle}
                            coupleLabel={`${finalBrideName} & ${finalGroomName}`}
                            centerImageUrl={section5Config.centerImageUrl}
                            backgroundImageUrl={loveStoryBackgroundImageUrl}
                            overlayOpacity={section5Config.overlayOpacity}
                            blocks={loveStoryBlocks}
                        />
                    </div>

                    <div style={{ scrollSnapAlign: 'start' }}>
                        <Section6
                            brideName={finalBrideName}
                            groomName={finalGroomName}
                            title={section6Config.title}
                            quoteText={section6Config.quoteText}
                            backgroundImageUrl={section6Config.backgroundImageUrl}
                            overlayOpacity={section6Config.overlayOpacity}
                            buttonLabel={section6Config.buttonLabel}
                            targetDateTime={countdownDateTime}
                            targetIsoDate={eventIsoDate}
                            calendarLink={calendarLink}
                            eventTitle={eventTitle}
                        />
                    </div>

                    <div style={{ scrollSnapAlign: 'start' }}>
                        <Section7
                            backgroundImageUrl={section7Config.backgroundImageUrl}
                            overlayOpacity={section7Config.overlayOpacity}
                            fullDateLabel={invitationContent?.event?.fullDateLabel || section7Config.fullDateLabel}
                            holyMatrimony={{
                                title: invitationContent?.eventDetails?.holyMatrimony?.title || section7Config.holyMatrimony.title,
                                dateLabel: invitationContent?.eventDetails?.holyMatrimony?.dateLabel || section7Config.holyMatrimony.dateLabel,
                                timeLabel: invitationContent?.eventDetails?.holyMatrimony?.timeLabel || section7Config.holyMatrimony.timeLabel,
                                venueName: invitationContent?.eventDetails?.holyMatrimony?.venueName || section7Config.holyMatrimony.venueName,
                                venueAddress: invitationContent?.eventDetails?.holyMatrimony?.venueAddress || section7Config.holyMatrimony.venueAddress,
                                mapsUrl: invitationContent?.eventDetails?.holyMatrimony?.mapsUrl || section7Config.holyMatrimony.mapsUrl,
                                mapsLabel: invitationContent?.eventDetails?.holyMatrimony?.mapsLabel || section7Config.holyMatrimony.mapsLabel,
                            }}
                            reception={{
                                title: invitationContent?.eventDetails?.reception?.title || section7Config.reception.title,
                                dateLabel: invitationContent?.eventDetails?.reception?.dateLabel || section7Config.reception.dateLabel,
                                timeLabel: invitationContent?.eventDetails?.reception?.timeLabel || section7Config.reception.timeLabel,
                                venueName: invitationContent?.eventDetails?.reception?.venueName || section7Config.reception.venueName,
                                venueAddress: invitationContent?.eventDetails?.reception?.venueAddress || section7Config.reception.venueAddress,
                                mapsUrl: invitationContent?.eventDetails?.reception?.mapsUrl || section7Config.reception.mapsUrl,
                                mapsLabel: invitationContent?.eventDetails?.reception?.mapsLabel || section7Config.reception.mapsLabel,
                            }}
                        />
                    </div>

                    <div style={{ scrollSnapAlign: 'start' }}>
                        <Section8
                            backgroundImageUrl={section8Config.backgroundImageUrl}
                            overlayOpacity={section8Config.overlayOpacity}
                            title={invitationContent?.clouds?.attireGuide?.title || section8Config.title}
                            description={invitationContent?.clouds?.attireGuide?.subtitle || section8Config.description}
                            colors={section8Config.colors}
                        />
                    </div>

                    <div style={{ scrollSnapAlign: 'start' }}>
                        <Section9
                            backgroundImageUrl={section9Config.backgroundImageUrl}
                            overlayOpacity={section9Config.overlayOpacity}
                            thumbnailImageUrl={section9Config.thumbnailImageUrl}
                            title={section9Config.title}
                            dateLabel={
                                invitationContent?.eventDetails?.holyMatrimony?.dateLabel ||
                                invitationContent?.event?.fullDateLabel ||
                                section9Config.dateLabel
                            }
                            timeLabel={invitationContent?.eventDetails?.holyMatrimony?.timeLabel || section9Config.timeLabel}
                            description={invitationContent?.eventDetails?.streaming?.description || section9Config.description}
                            streamingUrl={invitationContent?.eventDetails?.streaming?.url || undefined}
                            linkLabel={invitationContent?.eventDetails?.streaming?.buttonLabel || section9Config.linkLabel}
                        />
                    </div>

                    <div style={{ scrollSnapAlign: 'start' }}>
                        <Section10
                            backgroundImageUrl={section10Config.backgroundImageUrl}
                            overlayOpacity={section10Config.overlayOpacity}
                            eyebrow={invitationContent?.clouds?.weddingFrame?.title || section10Config.eyebrow}
                            title={section10Config.title}
                            description={invitationContent?.clouds?.weddingFrame?.subtitle || section10Config.description}
                            weddingFrameLink={section10Config.weddingFrameLink}
                            uploadPhotosLink={section10Config.uploadPhotosLink}
                            disclaimer={section10Config.disclaimer}
                        />
                    </div>

                    <div style={{ scrollSnapAlign: 'start' }}>
                        <Section11
                            backgroundImageUrl={section11Config.backgroundImageUrl}
                            overlayOpacity={section11Config.overlayOpacity}
                            mainTitle={section11Config.mainTitle}
                            youtubeEmbedUrl={section11Config.youtubeEmbedUrl}
                            showYoutube={section11Config.showYoutube}
                            middleImages={section11Config.middleImages}
                        />
                    </div>

                    <div style={{ scrollSnapAlign: 'start' }}>
                        <Section12
                            invitationSlug={clientSlug}
                            backgroundImageUrl={section12Config.backgroundImageUrl}
                            overlayOpacity={section12Config.overlayOpacity}
                            title={section12Config.title}
                            description={section12Config.description}
                            labels={section12Config.labels}
                        />
                    </div>

                    <div style={{ scrollSnapAlign: 'start' }}>
                        <Section13
                            invitationSlug={clientSlug}
                            backgroundImageUrl={section13Config.backgroundImageUrl}
                            overlayOpacity={section13Config.overlayOpacity}
                            title={section13Config.title}
                            description={section13Config.description}
                            maxListHeightVh={section13Config.maxListHeightVh}
                        />
                    </div>

                    <div style={{ scrollSnapAlign: 'start' }}>
                        <Section14
                            backgroundImageUrl={section14Config.backgroundImageUrl}
                            overlayOpacity={section14Config.overlayOpacity}
                            title={section14Config.title}
                            heroImageUrl={invitationContent?.weddingGift?.giftImageSrc || section14Config.heroImageUrl}
                            description={invitationContent?.weddingGift?.subtitle || section14Config.description}
                            tabs={section14Config.tabs}
                            eAmplop={{
                                ...section14Config.eAmplop,
                            }}
                            confirmation={section14Config.confirmation}
                            giftRegistry={section14Config.giftRegistry}
                            whatsappNumber={section14Config.whatsappNumber}
                        />
                    </div>

                    <div style={{ scrollSnapAlign: 'start' }}>
                        <Section15
                            backgroundImageUrl={section15Config.backgroundImageUrl}
                            overlayOpacity={section15Config.overlayOpacity}
                            title={section15Config.title}
                            description={section15Config.description}
                            brandName={section15Config.brandName}
                            footerLabel={section15Config.footerLabel}
                            socialLinks={section15Config.socialLinks}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
