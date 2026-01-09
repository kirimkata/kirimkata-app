"use client";

import { useEffect, useState } from "react";
import { getBrideConfig, getGroomConfig, getWeddingDateConfig, getSaveTheDateConfig } from "@/config/textConfig";
import { typographyConfig, getTypographyStyle } from "@/config/fontConfig";
import { useInViewSlideIn } from "@/hooks/useInViewAnimation";
import { useInvitationContent } from "@/lib/contexts/InvitationContentContext";

const saveTheDateTitleTypography = typographyConfig.scrollable.saveTheDate.title;
const saveTheDateBodyTypography = typographyConfig.scrollable.saveTheDate.body;

interface SaveTheDateSectionProps {
  brideName?: string;
  groomName?: string;
  weddingDate?: string; // Format: "2026-02-14"
  eventTitle?: string;
  calendarLink?: string;
  startAnimation?: boolean;
}

export default function SaveTheDateSection({
  brideName,
  groomName,
  weddingDate,
  eventTitle,
  calendarLink,
  startAnimation,
}: SaveTheDateSectionProps) {
  const invitationContent = useInvitationContent();
  const bride = getBrideConfig();
  const groom = getGroomConfig();
  const weddingDateConfig = getWeddingDateConfig();
  const saveDateConfig = getSaveTheDateConfig();

  const finalBrideName = brideName || invitationContent?.bride.name || bride.name;
  const finalGroomName = groomName || invitationContent?.groom.name || groom.name;
  const finalWeddingDate =
    weddingDate ||
    invitationContent?.event.countdownDateTime ||
    invitationContent?.event.isoDate ||
    saveDateConfig.countdownDateTime ||
    saveDateConfig.isoDate ||
    weddingDateConfig.isoDate;
  const [viewportHeight, setViewportHeight] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [hasStartedAnimation, setHasStartedAnimation] = useState(false);

  useEffect(() => {
    if (startAnimation && !hasStartedAnimation) {
      setHasStartedAnimation(true);
    }
  }, [startAnimation, hasStartedAnimation]);

  const titleBaseTransform = 'translate3d(-24px, 0, 0)';
  const countdownBaseTransform = 'translate3d(-24px, 0, 0)';

  const titleAnimatedStyle = {
    opacity: hasStartedAnimation ? 1 : 0,
    transform: hasStartedAnimation ? 'translate3d(0, 0, 0)' : titleBaseTransform,
    transition: 'opacity 600ms ease-out 0ms, transform 600ms ease-out 0ms',
    willChange: 'opacity, transform',
  } as const;

  const countdownAnimatedStyle = {
    opacity: hasStartedAnimation ? 1 : 0,
    transform: hasStartedAnimation ? 'translate3d(0, 0, 0)' : countdownBaseTransform,
    transition: 'opacity 600ms ease-out 60ms, transform 600ms ease-out 60ms',
    willChange: 'opacity, transform',
  } as const;

  const { ref: saveButtonRef, style: saveButtonStyle } = useInViewSlideIn({
    direction: "up",
    distance: 24,
    delayMs: 120,
  });

  useEffect(() => {
    const updateViewport = () => {
      setViewportHeight(window.innerHeight);
      setIsMobile(window.innerWidth < 768);
    };

    // Set initial values
    updateViewport();

    // Listen for resize events
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, []);

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const targetDate = new Date(finalWeddingDate).getTime();
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    // Calculate immediately
    calculateTimeLeft();

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [finalWeddingDate]);

  // Dynamic sizing calculations based on viewport height
  const containerHeight = viewportHeight;
  const containerHeightStyle = containerHeight ? `${containerHeight}px` : '100vh';

  const handleSaveTheDate = () => {
    const defaultTitle = `The Wedding of ${finalBrideName} & ${finalGroomName}`;
    const titleFromContent = invitationContent?.event.eventTitle;
    const title = eventTitle || titleFromContent || defaultTitle;

    // Get full datetime from countdownDateTime or isoDate
    const fullDateTime = invitationContent?.event.countdownDateTime || finalWeddingDate;

    // Format date for Google Calendar
    // If we have time info (ISO 8601 with time), use it; otherwise just date
    let formattedDates = '';
    if (fullDateTime.includes('T')) {
      // Has time component - format as YYYYMMDDTHHMMSS
      const dateObj = new Date(fullDateTime);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      const seconds = String(dateObj.getSeconds()).padStart(2, '0');

      const startDateTime = `${year}${month}${day}T${hours}${minutes}${seconds}`;
      // End time: 4 hours later (typical wedding duration)
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
      // Just date - format as YYYYMMDD (all-day event)
      const formattedDate = fullDateTime.replace(/-/g, '');
      formattedDates = `${formattedDate}/${formattedDate}`;
    }

    // Get location from eventCloud (prioritize reception, fallback to holyMatrimony)
    const receptionVenue = invitationContent?.eventCloud?.reception?.venueName;
    const receptionVenueAddress = invitationContent?.eventCloud?.reception?.venueAddress;
    const receptionDateLabel = invitationContent?.eventCloud?.reception?.dateLabel;
    const receptionMapsUrl = invitationContent?.eventCloud?.reception?.mapsUrl;
    const holyMatrimonyVenue = invitationContent?.eventCloud?.holyMatrimony?.venueName;
    const holyMatrimonyVenueAddress = invitationContent?.eventCloud?.holyMatrimony?.venueAddress;
    const holyMatrimonyDateLabel = invitationContent?.eventCloud?.holyMatrimony?.dateLabel;
    const holyMatrimonyMapsUrl = invitationContent?.eventCloud?.holyMatrimony?.mapsUrl;

    // Use reception data if available, otherwise use holyMatrimony
    const locationName = receptionVenue || holyMatrimonyVenue || '';
    const locationAddress = receptionVenueAddress || holyMatrimonyVenueAddress || '';
    const dateLabel = receptionDateLabel || holyMatrimonyDateLabel || invitationContent?.event.fullDateLabel || '';
    const locationUrl = receptionMapsUrl || holyMatrimonyMapsUrl || '';

    // Build location parameter: combine venue name and maps URL
    const locationParam = locationUrl
      ? `${locationName ? encodeURIComponent(locationName) + ' - ' : ''}${encodeURIComponent(locationUrl)}`
      : locationName
        ? encodeURIComponent(locationName)
        : '';

    // Build description with wedding details
    const descriptionLines = [
      `Pernikahan ${finalBrideName} & ${finalGroomName}`,
      '',
      dateLabel ? `Tanggal: ${dateLabel}` : '',
      locationName ? `Alamat: ${locationName}` : '',
      locationAddress ? locationAddress.replace(/\\n/g, ', ') : '',
      '',
      'Terima kasih atas kehadirannya.',
    ].filter(line => line !== ''); // Remove empty lines

    const description = descriptionLines.join('\n');
    const detailsParam = encodeURIComponent(description);

    const defaultLink = `https://calendar.google.com/calendar/u/0/r/eventedit?text=${encodeURIComponent(title)}&details=${detailsParam}&dates=${formattedDates}&location=${locationParam}`;
    const linkFromContent = invitationContent?.event.calendarLink || undefined;

    const link = calendarLink || linkFromContent || defaultLink;
    window.open(link, '_blank');
  };

  return (
    <div
      className="relative w-full flex flex-col justify-between bg-black/60"
      style={{
        minHeight: containerHeightStyle,
        height: containerHeightStyle,
      }}
    >
      {/* Save The Date Section - Top */}
      <div className="w-full flex flex-col items-center pt-8 pb-8 px-6">
        {/* Title */}
        <h1
          className="text-white text-center mt-8 pt-[30px] font-light"
          style={{
            marginTop: '40px',
            ...getTypographyStyle(saveTheDateTitleTypography),
            ...titleAnimatedStyle,
          }}
        >
          Save The Date
        </h1>

        {/* Countdown Timer */}
        <div
          className="flex gap-6 md:gap-8 mb-8"
          style={countdownAnimatedStyle}
        >
          {/* Days */}
          <div className="flex flex-col items-center">
            <div
              className="font-bold text-white mb-2 text-[2.5rem] md:text-[3.5rem]"
            >
              {String(timeLeft.days).padStart(2, '0')}
            </div>
            <div
              className="text-sm md:text-base text-white/80 tracking-wider"
              style={
                saveTheDateBodyTypography
                  ? getTypographyStyle(saveTheDateBodyTypography)
                  : {}
              }
            >
              Days
            </div>
          </div>

          {/* Hours */}
          <div className="flex flex-col items-center">
            <div
              className="font-bold text-white mb-2 text-[2.5rem] md:text-[3.5rem]"
            >
              {String(timeLeft.hours).padStart(2, '0')}
            </div>
            <div
              className="text-sm md:text-base text-white/80 tracking-wider"
              style={
                saveTheDateBodyTypography
                  ? getTypographyStyle(saveTheDateBodyTypography)
                  : {}
              }
            >
              Hours
            </div>
          </div>

          {/* Minutes */}
          <div className="flex flex-col items-center">
            <div
              className="font-bold text-white mb-2 text-[2.5rem] md:text-[3.5rem]"
            >
              {String(timeLeft.minutes).padStart(2, '0')}
            </div>
            <div
              className="text-sm md:text-base text-white/80 tracking-wider"
              style={
                saveTheDateBodyTypography
                  ? getTypographyStyle(saveTheDateBodyTypography)
                  : {}
              }
            >
              Minutes
            </div>
          </div>

          {/* Seconds */}
          <div className="flex flex-col items-center">
            <div
              className="font-bold text-white mb-2 text-[2.5rem] md:text-[3.5rem]"
            >
              {String(timeLeft.seconds).padStart(2, '0')}
            </div>
            <div
              className="text-sm md:text-base text-white/80 tracking-wider"
              style={
                saveTheDateBodyTypography
                  ? getTypographyStyle(saveTheDateBodyTypography)
                  : {}
              }
            >
              Seconds
            </div>
          </div>
        </div>

      </div>

      <div
        ref={saveButtonRef}
        className="w-full"
        style={{
          paddingLeft: 24,
          paddingRight: 24,
          paddingBottom: 48,
          display: 'flex',
          justifyContent: 'center',
          ...saveButtonStyle,
        }}
      >
        <button
          id="kirikata-save-the-date-button"
          onClick={handleSaveTheDate}
          className="inline-flex items-center justify-center px-8 py-3 rounded-[8px] border-2 border-white/70 text-white text-sm md:text-base font-medium uppercase tracking-[0.12em] hover:bg-white/10 hover:border-white transition-all duration-300 cursor-pointer"
          style={{
            padding: '5px 20px',
          }}
        >
          SAVE THE DATE
        </button>
      </div>
    </div>
  );
}


