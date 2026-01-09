'use client';

import { useEffect } from 'react';
import InvitationParallax from '@/features/themes/parallax/template1/InvitationParallax';
import { parallaxTemplate1ThemeDefinition } from '../index';
import type { LoadedClientContext } from '@/lib/loaders/loadClientData';
import { InvitationContentProvider } from '@/lib/contexts/InvitationContentContext';
import { setCustomImages } from '../config/imageConfig';

export interface ParallaxTemplateThemeRendererProps {
    clientSlug: string;
    guestName?: string;
    fullInvitationContent?: LoadedClientContext['fullInvitationContent'];
}

/**
 * CustomTheme2Renderer
 * 
 * Bridge component that demonstrates the new composable architecture.
 * Uses existing InvitationParallax for opening animation, then transitions
 * to standalone LayoutA for content.
 * 
 * This is a transitional approach:
 * - Keeps parallax animation working (uses InvitationParallax)
 * - Demonstrates new LayoutA content layout
 * - Shows how templates can mix old and new components
 */
export default function ParallaxTemplateThemeRenderer({
    clientSlug,
    guestName,
    fullInvitationContent
}: ParallaxTemplateThemeRendererProps) {
    const themeLoadingDesign = parallaxTemplate1ThemeDefinition.opening.loadingDesign;
    const enableCoverGate = parallaxTemplate1ThemeDefinition.opening.config?.enableCoverGate;

    useEffect(() => {
        if (fullInvitationContent?.clientProfile?.custom_images) {
            setCustomImages(fullInvitationContent.clientProfile.custom_images);
        }
        return () => {
            setCustomImages(null);
        };
    }, [fullInvitationContent]);

    if (!fullInvitationContent) {
        return (
            <InvitationParallax
                clientSlug={clientSlug}
                guestName={guestName}
                loadingDesign={themeLoadingDesign}
                enableCoverGate={enableCoverGate}
            />
        );
    }

    return (
        <InvitationContentProvider value={fullInvitationContent}>
            <InvitationParallax
                clientSlug={clientSlug}
                guestName={guestName}
                loadingDesign={themeLoadingDesign}
                enableCoverGate={enableCoverGate}
            />
        </InvitationContentProvider>
    );
}
