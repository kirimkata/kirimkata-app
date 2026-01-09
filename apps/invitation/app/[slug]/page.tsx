import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getClientDefinition } from '@/clients';
import { DEFAULT_METADATA, absoluteUrl } from '@/lib/siteMetadata';
import { loadClientData } from '@/lib/loaders/loadClientData';

interface InvitePageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ to?: string }>;
}

// Force dynamic rendering since we fetch data from database
export const dynamic = 'force-dynamic';

// Return empty array to prevent static generation at build time
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const client = await getClientDefinition(slug);

  if (!client) {
    return {
      title: DEFAULT_METADATA.title,
      description: DEFAULT_METADATA.description,
    };
  }

  const { profile } = client;
  const title = profile.metaTitle ?? `${profile.coupleNames} — Digital Invitation`;
  const description =
    profile.metaDescription ?? profile.shortDescription ?? DEFAULT_METADATA.description;

  // Handle shareImage - use as-is if already absolute URL, otherwise make it absolute
  const rawShareImage = profile.shareImage ?? profile.coverImage ?? '';
  const shareImage = rawShareImage.startsWith('http') ? rawShareImage : absoluteUrl(rawShareImage);
  const url = `${DEFAULT_METADATA.baseUrl}/${profile.slug}`;

  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
      nocache: true,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: DEFAULT_METADATA.siteName,
      type: 'website',
      images: shareImage ? [{ url: shareImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: shareImage ? [shareImage] : undefined,
    },
  };
}

export default async function InvitePage({ params, searchParams }: InvitePageProps) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  let guestName: string | undefined = '';
  if (typeof resolvedSearchParams?.to === 'string') {
    const toParam = resolvedSearchParams.to.trim();
    if (toParam) {
      guestName = toParam;
    } else {
      guestName = '';
    }
  }

  let loadedContext: Awaited<ReturnType<typeof loadClientData>> | null = null;
  try {
    loadedContext = await loadClientData(slug);
  } catch (error) {
    loadedContext = null;
  }

  if (!loadedContext) {
    notFound();
  }

  const ThemeRenderer = loadedContext.theme.render;

  if (!ThemeRenderer) {
    notFound();
  }

  return (
    <div data-page="invitation">
      <ThemeRenderer
        clientSlug={slug}
        guestName={guestName}
        fullInvitationContent={loadedContext.fullInvitationContent}
      />
    </div>
  );
}
