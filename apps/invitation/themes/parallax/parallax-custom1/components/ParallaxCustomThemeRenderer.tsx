'use client';

import InvitationParallax from '@/features/themes/parallax/custom1/InvitationParallax';
import type { LoadedClientContext } from '@/lib/loaders/loadClientData';
import { InvitationContentProvider } from '@/lib/contexts/InvitationContentContext';
import { parallaxCustom1ThemeDefinition } from '../index';

export interface ParallaxCustomThemeRendererProps {
  clientSlug: string;
  guestName?: string;
  fullInvitationContent?: LoadedClientContext['fullInvitationContent'];
}

export default function ParallaxCustomThemeRenderer({
  clientSlug,
  guestName,
  fullInvitationContent,
}: ParallaxCustomThemeRendererProps) {
  // Get loading design from theme configuration
  const themeLoadingDesign = parallaxCustom1ThemeDefinition.opening.loadingDesign;

  if (!fullInvitationContent) {
    return <InvitationParallax clientSlug={clientSlug} guestName={guestName} loadingDesign={themeLoadingDesign} />;
  }

  return (
    <InvitationContentProvider value={fullInvitationContent}>
      <InvitationParallax clientSlug={clientSlug} guestName={guestName} loadingDesign={themeLoadingDesign} />
    </InvitationContentProvider>
  );
}
