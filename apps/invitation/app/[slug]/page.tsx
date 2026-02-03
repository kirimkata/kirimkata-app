'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { notFound } from 'next/navigation';
import { getClientDefinition } from '@/clients';
import type { FullInvitationContent } from '@/lib/repositories/invitationContentRepository';
import { resolveTheme } from '@/lib/theme/resolveTheme';
import { InvitationLoading } from '@/components/InvitationLoading';
import { API_ENDPOINTS } from '@/lib/api-config';

export default function InvitePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const guestName = searchParams?.get('to')?.trim() || '';

  const [invitationData, setInvitationData] = useState<FullInvitationContent | null>(null);
  const [clientDef, setClientDef] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadInvitation() {
      try {
        setLoading(true);
        setError(false);

        // Load client definition (for theme info)
        const client = await getClientDefinition(slug);
        if (!client) {
          setError(true);
          setLoading(false);
          return;
        }
        setClientDef(client);

        // Fetch compiled invitation data from centralized API
        const response = await fetch(API_ENDPOINTS.invitations.compile(slug));

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          setInvitationData(result.data);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Failed to load invitation:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadInvitation();
  }, [slug]);

  if (loading) {
    return <InvitationLoading />;
  }

  if (error || !invitationData || !clientDef) {
    notFound();
    return null;
  }

  const theme = resolveTheme(clientDef.theme.key);
  const ThemeRenderer = theme.render;

  if (!ThemeRenderer) {
    notFound();
    return null;
  }

  return (
    <div data-page="invitation">
      <ThemeRenderer
        clientSlug={slug}
        guestName={guestName}
        fullInvitationContent={invitationData}
      />
    </div>
  );
}
