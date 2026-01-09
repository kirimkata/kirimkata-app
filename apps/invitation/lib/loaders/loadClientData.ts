import { getClientDefinition } from '@/clients';
import type { ClientDefinition } from '@/clients/types';
import { fetchFullInvitationContent, buildFullContentFromSlugMock } from '@/lib/repositories/invitationContentRepository';
import { resolveTheme } from '@/lib/theme/resolveTheme';

export interface LoadedClientContext {
  client: ClientDefinition;
  theme: ReturnType<typeof resolveTheme>;
  fullInvitationContent: Awaited<ReturnType<typeof fetchFullInvitationContent>>;
}

type InvitationContentMode = 'db' | 'mock';

const CLIENT_CONTENT_MODE: Record<string, InvitationContentMode> = {
  // By default, ALL slugs use 'db' mode (database-driven)
  // Only specify 'mock' for development/testing slugs that should use file-based mock data
  'test-2': 'mock', // Use masterMockTest2 data for testing
  'test-simple': 'mock', // Use masterMockTestSimple data for testing
};

function getInvitationContentMode(client: ClientDefinition): InvitationContentMode {
  return CLIENT_CONTENT_MODE[client.profile.slug] ?? 'db'; // Default to 'db'
}

export async function loadClientData(slug: string): Promise<LoadedClientContext> {
  const client = await getClientDefinition(slug);

  if (!client) {
    throw new Error(`Client with slug "${slug}" not found.`);
  }

  const theme = resolveTheme(client.theme.key);
  const mode = getInvitationContentMode(client);

  const fullInvitationContent =
    mode === 'mock'
      ? buildFullContentFromSlugMock(client.profile.slug)
      : await fetchFullInvitationContent(client.profile.slug);

  return {
    client,
    theme,
    fullInvitationContent,
  };
}
