'use client';

import LayoutSimple2 from './layout';
import type { LoadedClientContext } from '@/lib/loaders/loadClientData';
import { InvitationContentProvider } from '@/lib/contexts/InvitationContentContext';

export interface Simple2RendererProps {
    clientSlug: string;
    guestName?: string;
    fullInvitationContent?: LoadedClientContext['fullInvitationContent'];
}

/**
 * Simple2Renderer
 * 
 * A premium static invitation with elegant cover section featuring:
 * - Video or photo backgrounds from R2 storage
 * - Auto-rotating photo slideshow
 * - Cormorant typography for elegant design
 * - Smooth transition to scrollable content
 * 
 * Uses LayoutSimple2 for content rendering.
 */
export default function Simple2Renderer({
    clientSlug,
    guestName,
    fullInvitationContent
}: Simple2RendererProps) {
    // If no content, render LayoutSimple2 without provider
    if (!fullInvitationContent) {
        return (
            <LayoutSimple2
                clientSlug={clientSlug}
                guestName={guestName}
            />
        );
    }

    // With content, wrap in provider
    return (
        <InvitationContentProvider value={fullInvitationContent}>
            <LayoutSimple2
                clientSlug={clientSlug}
                guestName={guestName}
                brideName={fullInvitationContent.bride.name}
                groomName={fullInvitationContent.groom.name}
                weddingDate={fullInvitationContent.event.isoDate}
            />
        </InvitationContentProvider>
    );
}
