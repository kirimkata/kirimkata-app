import type { ClientDefinition, ClientRegistry } from '@/clients/types';
import poppyFadliProfile from '@/clients/profiles/poppy-fadli';
import budiAniProfile from '@/clients/profiles/budi-ani';
import test2Profile from '@/clients/profiles/test-2';
import testSimpleProfile from '@/clients/profiles/test-simple';
import test1Profile from '@/clients/profiles/test-1';
import { fetchClientProfileFromDB } from '@/lib/repositories/clientProfileRepository';

export const CLIENTS: ClientRegistry = {
  'poppy-fadli': {
    profile: poppyFadliProfile,
    theme: {
      key: 'parallax/parallax-custom1',
      dataId: 'poppy-fadli',
    },
  },
  'budi-ani': {
    profile: budiAniProfile,
    theme: {
      key: 'parallax/parallax-custom1',
      dataId: 'budi-ani',
    },
  },
  'test-2': {
    profile: test2Profile,
    theme: {
      key: 'parallax/parallax-template1',
      dataId: 'test-2',
    },
  },
  'test-simple': {
    profile: testSimpleProfile,
    theme: {
      key: 'premium/simple1',
      dataId: 'test-simple',
    },
  },
  'test-1': {
    profile: test1Profile,
    theme: {
      key: 'premium/simple2',
      dataId: 'test-1',
    },
  },
};

/**
 * Get client definition - fully database-driven
 * Database is the primary source, file-based registry is only for development/testing
 * @param slug - Client slug
 * @returns ClientDefinition or undefined if not found
 */
export async function getClientDefinition(slug: string): Promise<ClientDefinition | undefined> {
  // Try to fetch profile from database first (PRIMARY SOURCE)
  const dbResult = await fetchClientProfileFromDB(slug);

  if (dbResult) {
    // Found in DB - use DB profile with theme from DB or default
    return {
      profile: dbResult.profile,
      theme: {
        key: (dbResult.themeKey as any) ?? 'parallax/parallax-custom1', // Use DB theme or default
        dataId: slug,
      },
    };
  }

  // Not in DB - fallback to file-based registry for development/testing only
  // This allows mock data like 'poppy-fadli', 'test-2', etc. to work
  const registryClient = CLIENTS[slug];
  if (registryClient) {
    return registryClient;
  }

  // Slug not found in database or registry
  return undefined;
}
