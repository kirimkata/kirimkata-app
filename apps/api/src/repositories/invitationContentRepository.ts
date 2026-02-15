import { eq } from 'drizzle-orm';
import { getDb } from '../db';
import { invitationContents } from '../db/schema';
import type { Env } from '../lib/types';

// Define ClientProfile interface locally  
export interface ClientProfile {
  theme: string;
  name: string;
  slug: string;
  custom_images?: any;
}

export interface BrideContent {
  name: string;
  fullName: string;
  fatherName: string;
  motherName: string;
  instagram: string;
}

export interface GroomContent {
  name: string;
  fullName: string;
  fatherName: string;
  motherName: string;
  instagram: string;
}

export interface EventContent {
  fullDateLabel: string;
  isoDate: string;
  countdownDateTime?: string;
  eventTitle?: string;
  calendarLink?: string | null;
}

export interface CloudTextContent {
  title: string;
  subtitle: string;
  brideText?: string;
  groomText?: string;
}

export type CloudsContent = Record<string, CloudTextContent>;

export interface EventCloudSectionDetailContent {
  title: string;
  dateLabel: string;
  timeLabel: string;
  venueName: string;
  venueAddress: string;
  mapsUrl: string;
  mapsLabel: string;
}

export interface EventCloudStreamingDetailContent {
  description: string;
  url: string;
  buttonLabel: string;
  // streamEnabled is boolean in DB but here it might be implied? 
  // Let's stick to valid interface.
}

export interface EventCloudContent {
  holyMatrimony: EventCloudSectionDetailContent;
  reception: EventCloudSectionDetailContent;
  streaming: EventCloudStreamingDetailContent;
}

export interface LoveStoryBlockContent {
  title: string;
  body: string;
}

export interface LoveStoryContent {
  mainTitle: string;
  backgroundImage: string;
  overlayOpacity: number;
  blocks: LoveStoryBlockContent[];
}

export interface GalleryImageContent {
  src: string;
  alt: string;
}

export interface GalleryContent {
  mainTitle: string;
  backgroundColor: string;
  topRowImages: GalleryImageContent[];
  middleImages: GalleryImageContent[];
  bottomGridImages: GalleryImageContent[];
  youtubeEmbedUrl?: string;
  showYoutube?: boolean;
}

export interface WeddingGiftBankAccountContent {
  templateId: string;
  accountNumber: string;
  accountName: string;
}

export interface WeddingGiftPhysicalGiftContent {
  recipientName: string;
  phone?: string;
  addressLines: string[];
}

export interface WeddingGiftContent {
  title: string;
  subtitle: string;
  buttonLabel: string;
  giftImageSrc: string;
  backgroundOverlayOpacity: number;
  bankAccounts: WeddingGiftBankAccountContent[];
  physicalGift: WeddingGiftPhysicalGiftContent;
}

export interface ClosingContent {
  backgroundColor: string;
  photoSrc: string;
  photoAlt: string;
  namesScript: string;
  messageLines: string[];
}

export interface BackgroundMusicContent {
  src: string;
  title?: string;
  artist?: string;
  loop?: boolean;
  registerAsBackgroundAudio?: boolean;
}

export interface FullInvitationContent {
  slug: string;
  profile: ClientProfile;
  bride: BrideContent;
  groom: GroomContent;
  event: EventContent;
  greetings: CloudsContent;
  eventDetails: EventCloudContent;
  loveStory: LoveStoryContent;
  gallery: GalleryContent;
  weddingGift: WeddingGiftContent;
  closing: ClosingContent;
  musicSettings?: BackgroundMusicContent;
}

function mapRowToFullContent(row: typeof invitationContents.$inferSelect): FullInvitationContent {
  // Drizzle JSON columns are typed as unknown or any by default unless custom types used.
  // We cast them.
  return {
    slug: row.slug,
    profile: {
      ...(row.profile as ClientProfile),
      custom_images: row.customImages || (row.profile as ClientProfile)?.custom_images,
    },
    bride: row.bride as BrideContent,
    groom: row.groom as GroomContent,
    event: row.event as EventContent,
    greetings: row.greetings as CloudsContent,
    eventDetails: row.eventDetails as EventCloudContent,
    loveStory: row.loveStory as LoveStoryContent,
    gallery: row.gallery as GalleryContent,
    weddingGift: row.weddingGift as WeddingGiftContent,
    musicSettings: row.musicSettings as BackgroundMusicContent | undefined,
    closing: row.closing as ClosingContent,
  };
}

export async function fetchFullInvitationContent(env: Env, slug: string): Promise<FullInvitationContent> {
  try {
    const db = getDb(env);

    // Try to read from cache
    const [data] = await db
      .select()
      .from(invitationContents)
      .where(eq(invitationContents.slug, slug))
      .limit(1);

    if (data) {
      // Cache hit! Map and return
      console.log(`✅ Cache hit for slug: ${slug}`);
      try {
        return mapRowToFullContent(data);
      } catch (mapError) {
        console.error('Error mapping cached content, will recompile:', mapError);
        // If mapping fails, treat as cache miss
      }
    }

    // Cache miss or mapping error - compile from source tables
    console.log(`⚠️ Cache miss for ${slug}, compiling from normalized tables...`);

    // Dynamically import to avoid circular dependency
    const { invitationCompiler } = await import('../services-invitation/invitationCompilerService');
    const compiled = await invitationCompiler.compileAndCache(env, slug); // Pass env

    console.log(`Successfully compiled and cached: ${slug}`);
    return compiled as FullInvitationContent;

  } catch (clientError: any) {
    console.error('Error in fetchFullInvitationContent:', clientError);
    throw new Error(`Failed to fetch invitation content for slug '${slug}': ${clientError.message}`);
  }
}
