import { getSupabaseClient } from '../lib/supabase';

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

interface InvitationContentRow {
  id: string;
  slug: string;
  theme_key?: string;
  custom_images?: any;
  profile: FullInvitationContent['profile'];
  bride: FullInvitationContent['bride'];
  groom: FullInvitationContent['groom'];
  event: FullInvitationContent['event'];
  greetings: FullInvitationContent['greetings'];
  event_details: FullInvitationContent['eventDetails'];
  love_story: FullInvitationContent['loveStory'];
  gallery: FullInvitationContent['gallery'];
  wedding_gift: FullInvitationContent['weddingGift'];
  closing: FullInvitationContent['closing'];
  music_settings?: FullInvitationContent['musicSettings'];
  created_at: string;
  updated_at: string;
}

const TABLE_NAME = 'invitation_contents';

function mapRowToFullContent(row: InvitationContentRow): FullInvitationContent {
  return {
    slug: row.slug,
    profile: {
      ...row.profile,
      custom_images: row.custom_images || row.profile?.custom_images,
    },
    bride: row.bride,
    groom: row.groom,
    event: row.event,
    greetings: row.greetings,
    eventDetails: row.event_details,
    loveStory: row.love_story,
    gallery: row.gallery,
    weddingGift: row.wedding_gift,
    musicSettings: row.music_settings,
    closing: row.closing,
  };
}

export async function fetchFullInvitationContent(slug: string): Promise<FullInvitationContent> {
  try {
    const supabase = getSupabaseClient();

    // Try to read from cache
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('slug', slug)
      .single();

    if (data && !error) {
      // Cache hit! Map and return
      console.log(`✅ Cache hit for slug: ${slug}`);
      try {
        return mapRowToFullContent(data as InvitationContentRow);
      } catch (mapError) {
        console.error('Error mapping cached content, will recompile:', mapError);
        // If mapping fails, treat as cache miss
      }
    }

    // Cache miss or mapping error - compile from source tables
    console.log(`⚠️ Cache miss for ${slug}, compiling from normalized tables...`);

    // Dynamically import to avoid circular dependency
    const { invitationCompiler } = await import('../services-invitation/invitationCompilerService');
    const compiled = await invitationCompiler.compileAndCache(slug);

    console.log(`Successfully compiled and cached: ${slug}`);
    return compiled;

  } catch (clientError: any) {
    console.error('Error in fetchFullInvitationContent:', clientError);
    throw new Error(`Failed to fetch invitation content for slug '${slug}': ${clientError.message}`);
  }
}
