/**
 * API Data Adapter
 * Converts API responses to FullInvitationContent format for backward compatibility
 */

import type { ClientProfile } from '@/clients/types';
import type {
    FullInvitationContent,
    BrideContent,
    GroomContent,
    EventContent,
    CloudsContent,
    eventDetailsContent,
    LoveStoryContent,
    GalleryContent,
    WeddingGiftContent,
    ClosingContent,
    BackgroundMusicContent,
} from '@/lib/repositories/invitationContentRepository';
import type {
    RegistrationData,
    LoveStoryData,
    GalleryData,
    WeddingGiftData,
    ClosingData,
    MusicData,
} from './transformers';

/**
 * Convert API registration data to FullInvitationContent format
 */
export function adaptApiDataToFullContent(
    slug: string,
    clientProfile: ClientProfile,
    apiData: {
        registration: RegistrationData | null;
        loveStory: LoveStoryData | null;
        gallery: GalleryData | null;
        weddingGift: WeddingGiftData | null;
        closing: ClosingData | null;
        music: MusicData | null;
    }
): FullInvitationContent {
    const { registration, loveStory, gallery, weddingGift, closing, music } = apiData;

    // Bride content
    const bride: BrideContent = {
        name: registration?.brideName || '',
        fullName: registration?.brideFullName || '',
        fatherName: registration?.brideFatherName || '',
        motherName: registration?.brideMotherName || '',
        instagram: registration?.brideInstagram || '',
    };

    // Groom content
    const groom: GroomContent = {
        name: registration?.groomName || '',
        fullName: registration?.groomFullName || '',
        fatherName: registration?.groomFatherName || '',
        motherName: registration?.groomMotherName || '',
        instagram: registration?.groomInstagram || '',
    };

    // Event content
    const event: EventContent = {
        fullDateLabel: formatFullDate(registration?.event1Date),
        isoDate: registration?.event1Date || '',
        countdownDateTime: registration?.event1Date || '',
        eventTitle: 'Akad Nikah',
        calendarLink: null,
    };

    // Clouds content (static for now)
    const clouds: CloudsContent = {
        cloud1: {
            title: 'The Wedding of',
            subtitle: `${bride.name} & ${groom.name}`,
        },
    };

    // Event cloud content
    const eventDetails: eventDetailsContent = {
        holyMatrimony: {
            title: 'Akad Nikah',
            dateLabel: formatFullDate(registration?.event1Date),
            timeLabel: formatTime(registration?.event1Time),
            venueName: registration?.event1VenueName || '',
            venueAddress: registration?.event1VenueAddress || '',
            mapsUrl: registration?.event1MapsUrl || '',
            mapsLabel: 'Open Maps',
        },
        reception: {
            title: 'Resepsi',
            dateLabel: formatFullDate(registration?.event2Date || registration?.event1Date),
            timeLabel: formatTime(registration?.event2Time || registration?.event1Time),
            venueName: registration?.event2VenueName || registration?.event1VenueName || '',
            venueAddress: registration?.event2VenueAddress || registration?.event1VenueAddress || '',
            mapsUrl: registration?.event2MapsUrl || registration?.event1MapsUrl || '',
            mapsLabel: 'Open Maps',
        },
        streaming: {
            description: 'Watch our wedding live',
            url: '',
            buttonLabel: 'Watch Live',
        },
    };

    // Love story content
    const loveStoryContent: LoveStoryContent = {
        mainTitle: loveStory?.settings?.mainTitle || 'Our Love Story',
        backgroundImage: loveStory?.settings?.backgroundImageUrl || '',
        overlayOpacity: loveStory?.settings?.overlayOpacity || 0.6,
        blocks: (loveStory?.blocks || []).map((block) => ({
            title: block.title,
            body: block.bodyText,
        })),
    };

    // Gallery content
    const galleryContent: GalleryContent = {
        mainTitle: gallery?.settings?.mainTitle || 'Our Moments',
        backgroundColor: gallery?.settings?.backgroundColor || '#F5F5F0',
        topRowImages: [],
        middleImages: [],
        bottomGridImages: [],
        youtubeEmbedUrl: gallery?.settings?.youtubeEmbedUrl,
        showYoutube: gallery?.settings?.showYoutube || false,
    };

    // Convert image URLs to gallery structure
    // API now returns single 'images' array, we distribute it for UI compatibility
    if (gallery?.settings?.images && Array.isArray(gallery.settings.images)) {
        const images = gallery.settings.images.map((url, index) => ({
            src: url,
            alt: `Gallery image ${index + 1}`,
        }));

        // Distribute images across sections (simple distribution)
        const third = Math.ceil(images.length / 3);
        galleryContent.topRowImages = images.slice(0, third);
        galleryContent.middleImages = images.slice(third, third * 2);
        galleryContent.bottomGridImages = images.slice(third * 2);
    }

    // Wedding gift content
    const weddingGiftContent: WeddingGiftContent = {
        title: weddingGift?.settings?.title || 'Wedding Gift',
        subtitle: weddingGift?.settings?.subtitle || 'Your prayers are the best gift for us',
        buttonLabel: weddingGift?.settings?.buttonLabel || 'Send Gift',
        giftImageSrc: weddingGift?.settings?.giftImageUrl || '',
        backgroundOverlayOpacity: weddingGift?.settings?.backgroundOverlayOpacity || 0.55,
        bankAccounts: (weddingGift?.bankAccounts || []).map((account) => ({
            templateId: account.bankName.toLowerCase(),
            accountNumber: account.accountNumber,
            accountName: account.accountHolderName,
        })),
        physicalGift: {
            recipientName: weddingGift?.settings?.recipientName || registration?.groomFullName || '',
            phone: weddingGift?.settings?.recipientPhone || '',
            addressLines: [
                weddingGift?.settings?.recipientAddressLine1,
                weddingGift?.settings?.recipientAddressLine2,
                weddingGift?.settings?.recipientAddressLine3
            ].filter((line): line is string => !!line),
        },
    };

    // Closing content
    const closingContent: ClosingContent = {
        backgroundColor: closing?.settings?.backgroundColor || '#F5F5F0',
        photoSrc: closing?.settings?.photoUrl || '',
        photoAlt: closing?.settings?.photoAlt || 'Closing photo',
        namesScript: closing?.settings?.namesDisplay || `${bride.name} & ${groom.name}`,
        messageLines: [
            closing?.settings?.messageLine1 || 'Thank you for being part of our special day',
            closing?.settings?.messageLine2 || 'Your presence means the world to us',
            closing?.settings?.messageLine3 || '',
        ].filter(Boolean),
    };

    // Background music content
    const backgroundMusic: BackgroundMusicContent | undefined = music?.settings?.audioUrl
        ? {
            src: music.settings.audioUrl,
            title: music.settings.title,
            artist: music.settings.artist,
            loop: music.settings.loop !== false,
            registerAsBackgroundAudio: music.settings.registerAsBackgroundAudio ?? true,
        }
        : undefined;

    return {
        slug,
        profile: clientProfile,
        bride,
        groom,
        event,
        greetings: clouds,
        eventDetails,
        loveStory: loveStoryContent,
        gallery: galleryContent,
        weddingGift: weddingGiftContent,
        closing: closingContent,
        musicSettings: backgroundMusic,
    };
}

/**
 * Format date to full date label
 */
function formatFullDate(dateString?: string): string {
    if (!dateString) return '';

    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    } catch {
        return dateString;
    }
}

/**
 * Format time string
 */
function formatTime(timeString?: string): string {
    if (!timeString) return '';

    // If it's already in HH:MM format, return as is
    if (/^\d{2}:\d{2}/.test(timeString)) {
        return `${timeString} ${getTimezone()}`;
    }

    return timeString;
}

/**
 * Get timezone string
 */
function getTimezone(): string {
    // Default to WIB, can be made dynamic later
    return 'WIB';
}
