import { getSupabaseClient } from '@/lib/supabaseClient';
import type { ClientProfile } from '@/clients/types';
import { masterMockPoppyFadli } from '@/clients/masterMockPoppyFadli';
import { masterMockGeneral } from '@/clients/masterMockGeneral';
import { masterMockBudiAni } from '@/clients/mocks/masterMockBudiAni';
import { masterMockTest2 } from '@/clients/mocks/masterMockTest2';
import { masterMockTestSimple } from '@/clients/mocks/masterMockTestSimple';

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
  clientProfile: ClientProfile;
  bride: BrideContent;
  groom: GroomContent;
  event: EventContent;
  clouds: CloudsContent;
  eventCloud: EventCloudContent;
  loveStory: LoveStoryContent;
  gallery: GalleryContent;
  weddingGift: WeddingGiftContent;
  closing: ClosingContent;
  backgroundMusic?: BackgroundMusicContent;
}

interface InvitationContentRow {
  id: string;
  slug: string;
  theme_key?: string;
  custom_images?: any;
  client_profile: FullInvitationContent['clientProfile'];
  bride: FullInvitationContent['bride'];
  groom: FullInvitationContent['groom'];
  event: FullInvitationContent['event'];
  clouds: FullInvitationContent['clouds'];
  event_cloud: FullInvitationContent['eventCloud'];
  love_story: FullInvitationContent['loveStory'];
  gallery: FullInvitationContent['gallery'];
  wedding_gift: FullInvitationContent['weddingGift'];
  closing: FullInvitationContent['closing'];
  background_music?: FullInvitationContent['backgroundMusic'];
  created_at: string;
  updated_at: string;
}

const TABLE_NAME = 'invitation_contents';

function mapRowToFullContent(row: InvitationContentRow): FullInvitationContent {
  return {
    slug: row.slug,
    clientProfile: {
      ...row.client_profile,
      custom_images: row.custom_images || row.client_profile?.custom_images,
    },
    bride: row.bride,
    groom: row.groom,
    event: row.event,
    clouds: row.clouds,
    eventCloud: row.event_cloud,
    loveStory: row.love_story,
    gallery: row.gallery,
    weddingGift: row.wedding_gift,
    backgroundMusic: row.background_music,
    closing: row.closing,
  };
}

function buildFullContentFromGeneralMock(slug: string): FullInvitationContent {
  return {
    slug,
    clientProfile: masterMockGeneral.clientProfile,
    bride: masterMockGeneral.bride as BrideContent,
    groom: masterMockGeneral.groom as GroomContent,
    event: masterMockGeneral.event as EventContent,
    clouds: masterMockGeneral.clouds as CloudsContent,
    eventCloud: masterMockGeneral.eventCloud as EventCloudContent,
    loveStory: masterMockGeneral.loveStory as unknown as LoveStoryContent,
    gallery: masterMockGeneral.gallery as unknown as GalleryContent,
    weddingGift: masterMockGeneral.weddingGift as unknown as WeddingGiftContent,
    backgroundMusic: masterMockGeneral.backgroundMusic as BackgroundMusicContent,
    closing: masterMockGeneral.closing as unknown as ClosingContent,
  };
}

export function buildFullContentFromSlugMock(slug: string): FullInvitationContent {
  switch (slug) {
    case 'poppy-fadli':
      return {
        slug,
        clientProfile: masterMockPoppyFadli.clientProfile,
        bride: masterMockPoppyFadli.bride as BrideContent,
        groom: masterMockPoppyFadli.groom as GroomContent,
        event: masterMockPoppyFadli.event as EventContent,
        clouds: masterMockPoppyFadli.clouds as CloudsContent,
        eventCloud: masterMockPoppyFadli.eventCloud as EventCloudContent,
        loveStory: masterMockPoppyFadli.loveStory as unknown as LoveStoryContent,
        gallery: masterMockPoppyFadli.gallery as unknown as GalleryContent,
        weddingGift: masterMockPoppyFadli.weddingGift as unknown as WeddingGiftContent,
        backgroundMusic: masterMockPoppyFadli.backgroundMusic as BackgroundMusicContent,
        closing: masterMockPoppyFadli.closing as unknown as ClosingContent,
      };
    case 'budi-ani':
      return {
        slug,
        clientProfile: masterMockBudiAni.clientProfile,
        bride: masterMockBudiAni.bride as BrideContent,
        groom: masterMockBudiAni.groom as GroomContent,
        event: masterMockBudiAni.event as EventContent,
        clouds: masterMockBudiAni.clouds as CloudsContent,
        eventCloud: masterMockBudiAni.eventCloud as EventCloudContent,
        loveStory: masterMockBudiAni.loveStory as unknown as LoveStoryContent,
        gallery: masterMockBudiAni.gallery as unknown as GalleryContent,
        weddingGift: masterMockBudiAni.weddingGift as unknown as WeddingGiftContent,
        backgroundMusic: masterMockBudiAni.backgroundMusic as BackgroundMusicContent,
        closing: masterMockBudiAni.closing as unknown as ClosingContent,
      };
    case 'test-2':
      return {
        slug,
        clientProfile: masterMockTest2.clientProfile,
        bride: masterMockTest2.bride as BrideContent,
        groom: masterMockTest2.groom as GroomContent,
        event: masterMockTest2.event as EventContent,
        clouds: masterMockTest2.clouds as CloudsContent,
        eventCloud: masterMockTest2.eventCloud as EventCloudContent,
        loveStory: masterMockTest2.loveStory as unknown as LoveStoryContent,
        gallery: masterMockTest2.gallery as unknown as GalleryContent,
        weddingGift: masterMockTest2.weddingGift as unknown as WeddingGiftContent,
        backgroundMusic: masterMockTest2.backgroundMusic as BackgroundMusicContent,
        closing: masterMockTest2.closing as unknown as ClosingContent,
      };
    case 'test-simple':
      return {
        slug,
        clientProfile: masterMockTestSimple.clientProfile,
        bride: masterMockTestSimple.bride as BrideContent,
        groom: masterMockTestSimple.groom as GroomContent,
        event: masterMockTestSimple.event as EventContent,
        clouds: masterMockTestSimple.clouds as CloudsContent,
        eventCloud: masterMockTestSimple.eventCloud as EventCloudContent,
        loveStory: masterMockTestSimple.loveStory as unknown as LoveStoryContent,
        gallery: masterMockTestSimple.gallery as unknown as GalleryContent,
        weddingGift: masterMockTestSimple.weddingGift as unknown as WeddingGiftContent,
        backgroundMusic: masterMockTestSimple.backgroundMusic as BackgroundMusicContent,
        closing: masterMockTestSimple.closing as unknown as ClosingContent,
      };
    default:
      return buildFullContentFromGeneralMock(slug);
  }
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
    const { invitationCompiler } = await import('../services/invitationCompilerService');
    const compiled = await invitationCompiler.compileAndCache(slug);

    console.log(`✅ Successfully compiled and cached: ${slug}`);
    return compiled;

  } catch (clientError: any) {
    console.error('Error in fetchFullInvitationContent:', clientError);

    // Last resort: fallback to mock data
    console.warn(`⚠️ Falling back to mock data for slug: ${slug}`);
    return buildFullContentFromGeneralMock(slug);
  }
}
