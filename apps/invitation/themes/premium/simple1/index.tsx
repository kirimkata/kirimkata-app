'use client';

import LayoutA from './layout';
import type { LoadedClientContext } from '@/lib/loaders/loadClientData';
import { InvitationContentProvider } from '@/lib/contexts/InvitationContentContext';

export interface PremiumSimpleThemeRendererProps {
    clientSlug: string;
    guestName?: string;
    fullInvitationContent?: LoadedClientContext['fullInvitationContent'];
}

/**
 * SimpleScrollRenderer
 * 
 * A clean, simple scrollable invitation without any opening animation.
 * Perfect for clients who want fast loading and straightforward UX.
 * 
 * Uses LayoutA for content rendering.
 */
export default function PremiumSimpleThemeRenderer({
    clientSlug,
    guestName,
    fullInvitationContent
}: PremiumSimpleThemeRendererProps) {
    // If no content, render LayoutA without provider
    if (!fullInvitationContent) {
        return (
            <LayoutA
                clientSlug={clientSlug}
                guestName={guestName}
            />
        );
    }

    // With content, wrap in provider
    return (
        <InvitationContentProvider value={fullInvitationContent}>
            <LayoutA
                clientSlug={clientSlug}
                guestName={guestName}
                brideName={fullInvitationContent.bride.name}
                groomName={fullInvitationContent.groom.name}
                weddingDate={fullInvitationContent.event.isoDate}
            />
        </InvitationContentProvider>
    );
}
