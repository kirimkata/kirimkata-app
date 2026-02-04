import { getClientDefinition } from '@/clients';
import type { ClientDefinition } from '@/clients/types';
import { fetchFullInvitationContent, buildFullContentFromSlugMock } from '@/lib/repositories/invitationContentRepository';
import { resolveTheme } from '@/lib/theme/resolveTheme';
import { fetchAllInvitationData } from '@/lib/api/services/invitationService';
import { adaptApiDataToFullContent } from '@/lib/api/adapter';

export interface LoadedClientContext {
  client: ClientDefinition;
  theme: ReturnType<typeof resolveTheme>;
  fullInvitationContent: Awaited<ReturnType<typeof fetchFullInvitationContent>>;
}

type InvitationContentMode = 'db' | 'mock' | 'api';

const CLIENT_CONTENT_MODE: Record<string, InvitationContentMode> = {
  // By default, ALL slugs use 'api' mode (API-driven)
  // Specify 'mock' for development/testing slugs that should use file-based mock data
  // Specify 'db' for direct database access (legacy)
  'test-2': 'mock', // Use masterMockTest2 data for testing
  'test-simple': 'mock', // Use masterMockTestSimple data for testing
};

function getInvitationContentMode(client: ClientDefinition): InvitationContentMode {
  return CLIENT_CONTENT_MODE[client.profile.slug] ?? 'api'; // Default to 'api'
}

export async function loadClientData(slug: string): Promise<LoadedClientContext> {
  const client = await getClientDefinition(slug);

  if (!client) {
    throw new Error(`Client with slug "${slug}" not found.`);
  }

  const theme = resolveTheme(client.theme.key);
  const mode = getInvitationContentMode(client);

  let fullInvitationContent;

  if (mode === 'mock') {
    fullInvitationContent = buildFullContentFromSlugMock(client.profile.slug);
  } else if (mode === 'api') {
    // Fetch all data from API endpoints in parallel
    const apiData = await fetchAllInvitationData(client.profile.slug);

    // Adapt API data to FullInvitationContent format
    fullInvitationContent = adaptApiDataToFullContent(
      client.profile.slug,
      client.profile,
      apiData
    );
  } else {
    // Legacy: direct database access
    fullInvitationContent = await fetchFullInvitationContent(client.profile.slug);
  }

  return {
    client,
    theme,
    fullInvitationContent,
  };
}
