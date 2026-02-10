/**
 * Reusable hook for fetching event/wedding date data
 * Can be used across different theme designs
 */

import { useInvitationContent } from '@/lib/contexts/InvitationContentContext';

export interface EventDetails {
    date: string;
    isoDate: string;
    time: string;
    location: string;
    address: string;
    mapUrl?: string;
}

export interface UseEventDataReturn {
    event: EventDetails | null;
    isLoading: boolean;
    hasEvent: boolean;
    brideName: string;
    groomName: string;
}

export function useEventData(): UseEventDataReturn {
    const invitationContent = useInvitationContent();

    const event = invitationContent?.event ? {
        date: invitationContent.event.fullDateLabel,
        isoDate: invitationContent.event.isoDate,
        time: invitationContent.eventDetails?.reception?.timeLabel || '',
        location: invitationContent.eventDetails?.reception?.venueName || '',
        address: invitationContent.eventDetails?.reception?.venueAddress || '',
        mapUrl: invitationContent.eventDetails?.reception?.mapsUrl,
    } : null;

    return {
        event,
        isLoading: false,
        hasEvent: !!event,
        brideName: invitationContent?.bride?.name || '',
        groomName: invitationContent?.groom?.name || '',
    };
}
