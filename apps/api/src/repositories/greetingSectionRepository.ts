import { getSupabaseClient, getSupabaseServiceClient } from '../supabaseClient';
import { encrypt, comparePassword } from '../services/encryption';

export interface Admin {
    id: string;
    username: string;
    password_encrypted: string;
    email: string | null;
    created_at: string;
    updated_at: string;
}

/**
 * Find admin by username
 */
export async function findAdminByUsername(username: string): Promise<Admin | null> {
    const supabase = getSupabaseServiceClient();

    const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('username', username)
        .single();

    if (error || !data) {
        return null;
    }

    return data as Admin;
}

/**
 * Verify admin credentials
 */
export async function verifyAdminCredentials(
    username: string,
    password: string
): Promise<Admin | null> {
    const admin = await findAdminByUsername(username);

    if (!admin) {
        return null;
    }

    const isValid = comparePassword(password, admin.password_encrypted);

    if (!isValid) {
        return null;
    }

    return admin;
}

/**
 * Create new admin
 */
export async function createAdmin(
    username: string,
    password: string,
    email?: string
): Promise<Admin | null> {
    const supabase = getSupabaseServiceClient();
    const passwordEncrypted = encrypt(password);

    const { data, error } = await supabase
        .from('admins')
        .insert({
            username,
            password_encrypted: passwordEncrypted,
            email: email || null,
        })
        .select()
        .single();

    if (error || !data) {
        console.error('Error creating admin:', error);
        return null;
    }

    return data as Admin;
}

/**
 * Update admin password
 */
export async function updateAdminPassword(
    adminId: string,
    currentPassword: string,
    newPassword: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabaseServiceClient();

    // Get current admin data
    const { data: admin, error: fetchError } = await supabase
        .from('admins')
        .select('*')
        .eq('id', adminId)
        .single();

    if (fetchError || !admin) {
        return { success: false, error: 'Admin not found' };
    }

    // Verify current password
    const isValid = comparePassword(currentPassword, admin.password_encrypted);
    if (!isValid) {
        return { success: false, error: 'Current password is incorrect' };
    }

    // Encrypt new password
    const newPasswordEncrypted = encrypt(newPassword);

    // Update password
    const { error: updateError } = await supabase
        .from('admins')
        .update({
            password_encrypted: newPasswordEncrypted,
            updated_at: new Date().toISOString()
        })
        .eq('id', adminId);

    if (updateError) {
        console.error('Error updating password:', updateError);
        return { success: false, error: 'Failed to update password' };
    }

    return { success: true };
}
import { getSupabaseClient } from '../lib/supabase';

export interface BackgroundMusicSettings {
    registration_id: string;
    audio_url: string;
    title?: string;
    artist?: string;
    loop: boolean;
    register_as_background_audio: boolean;
    is_enabled: boolean;
    created_at?: string;
    updated_at?: string;
}

class BackgroundMusicRepository {
    /**
     * Get background music settings
     */
    async getSettings(registrationId: string): Promise<BackgroundMusicSettings | null> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from('background_music_settings')
            .select('*')
            .eq('registration_id', registrationId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            console.error('Error getting background music settings:', error);
            throw new Error(`Failed to get background music settings: ${error.message}`);
        }

        return data;
    }

    /**
     * Upsert background music settings
     */
    async upsertSettings(data: BackgroundMusicSettings): Promise<BackgroundMusicSettings> {
        const supabase = getSupabaseClient();

        const { data: result, error } = await supabase
            .from('background_music_settings')
            .upsert(data, { onConflict: 'registration_id' })
            .select()
            .single();

        if (error) {
            console.error('Error upserting background music settings:', error);
            throw new Error(`Failed to upsert background music settings: ${error.message}`);
        }

        return result;
    }
}

// Export singleton instance
export const backgroundMusicRepo = new BackgroundMusicRepository();
import { getSupabaseClient } from '../lib/supabase';
import type { ClientProfile } from '@/clients/types';

const TABLE_NAME = 'invitation_contents';

interface InvitationContentRow {
    slug: string;
    client_profile: ClientProfile;
    theme_key?: string;
}

/**
 * Fetch client profile and theme from database
 * Returns null if not found or error occurs
 */
export async function fetchClientProfileFromDB(slug: string): Promise<{ profile: ClientProfile; themeKey?: string } | null> {
    try {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('slug, client_profile, theme_key')
            .eq('slug', slug)
            .limit(1);

        if (error) {
            console.error('Error fetching client profile from Supabase', error);
            return null;
        }

        const row = (data && data[0]) as InvitationContentRow | undefined;
        if (!row || !row.client_profile) {
            return null;
        }

        return {
            profile: row.client_profile,
            themeKey: row.theme_key,
        };
    } catch (clientError) {
        console.warn('Supabase client is not available or misconfigured', clientError);
        return null;
    }
}
import { getSupabaseClient, getSupabaseServiceClient } from '../supabaseClient';
import { encrypt, comparePassword } from '../services/encryption';

export interface CustomImages {
    background?: string;
    background_limasan?: string;
    pengantin?: string;
    pengantin_jawa?: string;
}

export interface Client {
    id: string;
    username: string;
    password_encrypted: string;
    email: string | null;
    slug: string | null;
    guestbook_access?: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateClientInput {
    username: string;
    password: string;
    email?: string;
    slug?: string;
}

export interface UpdateClientInput {
    username?: string;
    password?: string;
    email?: string;
    slug?: string;
}

/**
 * Find client by username
 */
export async function findClientByUsername(username: string): Promise<Client | null> {
    const supabase = getSupabaseServiceClient();

    // Use .limit(1) instead of .single() to avoid Cloudflare 500 error
    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('username', username)
        .limit(1);

    if (error || !data || data.length === 0) {
        return null;
    }

    return data[0] as Client;
}

/**
 * Verify client credentials
 */
export async function verifyClientCredentials(
    username: string,
    password: string
): Promise<Client | null> {
    const client = await findClientByUsername(username);

    if (!client) {
        return null;
    }

    const isValid = comparePassword(password, client.password_encrypted);

    if (!isValid) {
        return null;
    }

    return client;
}

/**
 * Get all clients
 */
export async function getAllClients(): Promise<Client[]> {
    const supabase = getSupabaseServiceClient();

    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching clients:', error);
        return [];
    }

    return (data as Client[]) || [];
}

/**
 * Get client by ID
 */
export async function getClientById(id: string): Promise<Client | null> {
    const supabase = getSupabaseServiceClient();

    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) {
        return null;
    }

    return data as Client;
}

/**
 * Create new client
 */
export async function createClient(input: CreateClientInput): Promise<Client | null> {
    const supabase = getSupabaseServiceClient();
    const passwordEncrypted = encrypt(input.password);

    const { data, error } = await supabase
        .from('clients')
        .insert({
            username: input.username,
            password_encrypted: passwordEncrypted,
            email: input.email || null,
            slug: input.slug || null,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating client:', error);
        return null;
    }

    return data as Client;
}

/**
 * Update client
 */
export async function updateClient(
    id: string,
    input: UpdateClientInput
): Promise<Client | null> {
    const supabase = getSupabaseServiceClient();

    const updateData: any = {};

    if (input.username !== undefined) updateData.username = input.username;
    if (input.email !== undefined) updateData.email = input.email || null;
    if (input.slug !== undefined) updateData.slug = input.slug || null;
    if (input.password) {
        updateData.password_encrypted = encrypt(input.password);
    }

    const { data, error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating client:', error);
        return null;
    }

    return data as Client;
}

/**
 * Delete client
 */
export async function deleteClient(id: string): Promise<boolean> {
    const supabase = getSupabaseServiceClient();

    const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting client:', error);
        return false;
    }

    return true;
}

/**
 * Get available slugs (slugs not assigned to any client)
 */
export async function getAvailableSlugs(): Promise<string[]> {
    const supabase = getSupabaseServiceClient();

    // Get all slugs from invitation_contents
    const { data: allSlugs, error: slugsError } = await supabase
        .from('invitation_contents')
        .select('slug');

    if (slugsError || !allSlugs) {
        console.error('Error fetching slugs:', slugsError);
        return [];
    }

    // Get all assigned slugs from clients
    const { data: assignedSlugs, error: clientsError } = await supabase
        .from('clients')
        .select('slug')
        .not('slug', 'is', null);

    if (clientsError) {
        console.error('Error fetching assigned slugs:', clientsError);
        return [];
    }

    const assigned = new Set((assignedSlugs || []).map((c: any) => c.slug));
    const available = allSlugs
        .map((s: any) => s.slug)
        .filter((slug: string) => !assigned.has(slug));

    return available;
}
import { getSupabaseClient } from '../lib/supabase';

export interface ClosingSettings {
    registration_id: string;
    background_color: string;
    photo_url?: string;
    photo_alt?: string;
    names_script: string;
    message_line1?: string;
    message_line2?: string;
    message_line3?: string;
    is_enabled: boolean;
    created_at?: string;
    updated_at?: string;
}

class ClosingRepository {
    /**
     * Get closing settings
     */
    async getSettings(registrationId: string): Promise<ClosingSettings | null> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from('closing_settings')
            .select('*')
            .eq('registration_id', registrationId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            console.error('Error getting closing settings:', error);
            throw new Error(`Failed to get closing settings: ${error.message}`);
        }

        return data;
    }

    /**
     * Upsert closing settings
     */
    async upsertSettings(data: ClosingSettings): Promise<ClosingSettings> {
        const supabase = getSupabaseClient();

        const { data: result, error } = await supabase
            .from('closing_settings')
            .upsert(data, { onConflict: 'registration_id' })
            .select()
            .single();

        if (error) {
            console.error('Error upserting closing settings:', error);
            throw new Error(`Failed to upsert closing settings: ${error.message}`);
        }

        return result;
    }
}

// Export singleton instance
export const closingRepo = new ClosingRepository();
import { getSupabaseClient } from '../lib/supabase';

export interface GallerySettings {
    registration_id: string;
    main_title: string;
    background_color: string;
    top_row_images: string[];
    middle_images: string[];
    bottom_grid_images: string[];
    youtube_embed_url?: string;
    show_youtube: boolean;
    is_enabled: boolean;
    created_at?: string;
    updated_at?: string;
}

class GalleryRepository {
    /**
     * Get gallery settings
     */
    async getSettings(registrationId: string): Promise<GallerySettings | null> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from('gallery_settings')
            .select('*')
            .eq('registration_id', registrationId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            console.error('Error getting gallery settings:', error);
            throw new Error(`Failed to get gallery settings: ${error.message}`);
        }

        return data;
    }

    /**
     * Upsert gallery settings
     */
    async upsertSettings(data: GallerySettings): Promise<GallerySettings> {
        const supabase = getSupabaseClient();

        const { data: result, error } = await supabase
            .from('gallery_settings')
            .upsert(data, { onConflict: 'registration_id' })
            .select()
            .single();

        if (error) {
            console.error('Error upserting gallery settings:', error);
            throw new Error(`Failed to upsert gallery settings: ${error.message}`);
        }

        return result;
    }

    /**
     * Add image to gallery
     */
    async addImage(
        registrationId: string,
        imageUrl: string,
        position: 'top' | 'middle' | 'bottom'
    ): Promise<GallerySettings> {
        const settings = await this.getSettings(registrationId);
        if (!settings) {
            throw new Error('Gallery settings not found');
        }

        const field = position === 'top' ? 'top_row_images'
            : position === 'middle' ? 'middle_images'
                : 'bottom_grid_images';

        const updatedImages = [...(settings[field] || []), imageUrl];

        return this.upsertSettings({
            ...settings,
            [field]: updatedImages,
        });
    }

    /**
     * Remove image from gallery
     */
    async removeImage(registrationId: string, imageUrl: string): Promise<GallerySettings> {
        const settings = await this.getSettings(registrationId);
        if (!settings) {
            throw new Error('Gallery settings not found');
        }

        return this.upsertSettings({
            ...settings,
            top_row_images: settings.top_row_images.filter(img => img !== imageUrl),
            middle_images: settings.middle_images.filter(img => img !== imageUrl),
            bottom_grid_images: settings.bottom_grid_images.filter(img => img !== imageUrl),
        });
    }

    /**
     * Reorder images in a specific position
     */
    async reorderImages(
        registrationId: string,
        position: 'top' | 'middle' | 'bottom',
        imageUrls: string[]
    ): Promise<GallerySettings> {
        const settings = await this.getSettings(registrationId);
        if (!settings) {
            throw new Error('Gallery settings not found');
        }

        const field = position === 'top' ? 'top_row_images'
            : position === 'middle' ? 'middle_images'
                : 'bottom_grid_images';

        return this.upsertSettings({
            ...settings,
            [field]: imageUrls,
        });
    }
}

// Export singleton instance
export const galleryRepo = new GalleryRepository();
import { getSupabaseClient } from '../lib/supabase';

export interface GreetingSection {
    id: string;
    registration_id: string;
    section_type: 'opening_verse' | 'main_greeting' | 'countdown_title';
    title?: string;
    subtitle?: string;
    content_text?: string;
    bride_text?: string;
    groom_text?: string;
    display_order: number;
    created_at?: string;
    updated_at?: string;
}

export type CreateGreetingSectionInput = Omit<GreetingSection, 'id' | 'created_at' | 'updated_at'>;
export type UpdateGreetingSectionInput = Partial<Omit<GreetingSection, 'id' | 'registration_id' | 'created_at' | 'updated_at'>>;

class GreetingSectionRepository {
    private tableName = 'greeting_sections';

    /**
     * Create new greeting section
     */
    async create(data: CreateGreetingSectionInput): Promise<GreetingSection> {
        const supabase = getSupabaseClient();

        const { data: result, error } = await supabase
            .from(this.tableName)
            .insert(data)
            .select()
            .single();

        if (error) {
            console.error('Error creating greeting section:', error);
            throw new Error(`Failed to create greeting section: ${error.message}`);
        }

        return result;
    }

    /**
     * Find all greeting sections by registration ID
     */
    async findByRegistrationId(registrationId: string): Promise<GreetingSection[]> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('registration_id', registrationId)
            .order('display_order', { ascending: true });

        if (error) {
            console.error('Error finding greeting sections:', error);
            throw new Error(`Failed to find greeting sections: ${error.message}`);
        }

        return data || [];
    }

    /**
     * Find greeting section by type
     */
    async findByType(registrationId: string, sectionType: GreetingSection['section_type']): Promise<GreetingSection | null> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('registration_id', registrationId)
            .eq('section_type', sectionType)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            console.error('Error finding greeting section by type:', error);
            throw new Error(`Failed to find greeting section: ${error.message}`);
        }

        return data;
    }

    /**
     * Update greeting section
     */
    async update(id: string, updates: UpdateGreetingSectionInput): Promise<GreetingSection> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from(this.tableName)
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating greeting section:', error);
            throw new Error(`Failed to update greeting section: ${error.message}`);
        }

        return data;
    }

    /**
     * Delete greeting section
     */
    async delete(id: string): Promise<void> {
        const supabase = getSupabaseClient();

        const { error } = await supabase
            .from(this.tableName)
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting greeting section:', error);
            throw new Error(`Failed to delete greeting section: ${error.message}`);
        }
    }

    /**
     * Bulk create greeting sections
     */
    async bulkCreate(items: CreateGreetingSectionInput[]): Promise<GreetingSection[]> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from(this.tableName)
            .insert(items)
            .select();

        if (error) {
            console.error('Error bulk creating greeting sections:', error);
            throw new Error(`Failed to bulk create greeting sections: ${error.message}`);
        }

        return data || [];
    }

    /**
     * Delete all greeting sections for a registration
     */
    async deleteAllByRegistrationId(registrationId: string): Promise<void> {
        const supabase = getSupabaseClient();

        const { error } = await supabase
            .from(this.tableName)
            .delete()
            .eq('registration_id', registrationId);

        if (error) {
            console.error('Error deleting all greeting sections:', error);
            throw new Error(`Failed to delete greeting sections: ${error.message}`);
        }
    }
}

// Export singleton instance
export const greetingSectionRepo = new GreetingSectionRepository();
import { getSupabaseClient } from '../lib/supabase';
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
import type { ClientDataId } from '@/clients/types';
import { masterMockPoppyFadli } from '@/clients/masterMockPoppyFadli';

export interface InvitationContentRecord {
  clientNames: string;
  eventDateLabel: string;
  locationLabel?: string;
  heroImage?: string;
  galleryImages?: string[];
  additionalNotes?: string;
}

const MOCK_INVITATION_DATA: Record<ClientDataId, InvitationContentRecord> = {
  'poppy-fadli': {
    ...masterMockPoppyFadli.invitationSummary,
    galleryImages: masterMockPoppyFadli.invitationSummary.galleryImages
      ? [...masterMockPoppyFadli.invitationSummary.galleryImages]
      : undefined,
  },
};

export async function fetchInvitationContent(dataId: ClientDataId): Promise<InvitationContentRecord> {
  const record = MOCK_INVITATION_DATA[dataId];

  if (!record) {
    throw new Error(`No invitation content found for dataId: ${dataId}`);
  }

  return record;
}
import { getSupabaseClient } from '../lib/supabase';

export interface LoveStorySettings {
    registration_id: string;
    main_title: string;
    background_image_url?: string;
    overlay_opacity: number;
    is_enabled: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface LoveStoryBlock {
    id: string;
    registration_id: string;
    title: string;
    body_text: string;
    display_order: number;
    created_at?: string;
    updated_at?: string;
}

export type CreateLoveStoryBlockInput = Omit<LoveStoryBlock, 'id' | 'created_at' | 'updated_at'>;
export type UpdateLoveStoryBlockInput = Partial<Omit<LoveStoryBlock, 'id' | 'registration_id' | 'created_at' | 'updated_at'>>;

class LoveStoryRepository {
    /**
     * Get love story settings
     */
    async getSettings(registrationId: string): Promise<LoveStorySettings | null> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from('love_story_settings')
            .select('*')
            .eq('registration_id', registrationId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            console.error('Error getting love story settings:', error);
            throw new Error(`Failed to get love story settings: ${error.message}`);
        }

        return data;
    }

    /**
     * Upsert love story settings
     */
    async upsertSettings(data: LoveStorySettings): Promise<LoveStorySettings> {
        const supabase = getSupabaseClient();

        const { data: result, error } = await supabase
            .from('love_story_settings')
            .upsert(data, { onConflict: 'registration_id' })
            .select()
            .single();

        if (error) {
            console.error('Error upserting love story settings:', error);
            throw new Error(`Failed to upsert love story settings: ${error.message}`);
        }

        return result;
    }

    /**
     * Get all love story blocks
     */
    async getBlocks(registrationId: string): Promise<LoveStoryBlock[]> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from('love_story_blocks')
            .select('*')
            .eq('registration_id', registrationId)
            .order('display_order', { ascending: true });

        if (error) {
            console.error('Error getting love story blocks:', error);
            throw new Error(`Failed to get love story blocks: ${error.message}`);
        }

        return data || [];
    }

    /**
     * Create love story block
     */
    async createBlock(block: CreateLoveStoryBlockInput): Promise<LoveStoryBlock> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from('love_story_blocks')
            .insert(block)
            .select()
            .single();

        if (error) {
            console.error('Error creating love story block:', error);
            throw new Error(`Failed to create love story block: ${error.message}`);
        }

        return data;
    }

    /**
     * Update love story block
     */
    async updateBlock(id: string, updates: UpdateLoveStoryBlockInput): Promise<LoveStoryBlock> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from('love_story_blocks')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating love story block:', error);
            throw new Error(`Failed to update love story block: ${error.message}`);
        }

        return data;
    }

    /**
     * Delete love story block
     */
    async deleteBlock(id: string): Promise<void> {
        const supabase = getSupabaseClient();

        const { error } = await supabase
            .from('love_story_blocks')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting love story block:', error);
            throw new Error(`Failed to delete love story block: ${error.message}`);
        }
    }

    /**
     * Reorder love story blocks
     */
    async reorderBlocks(registrationId: string, blockIds: string[]): Promise<void> {
        const supabase = getSupabaseClient();

        // Update display_order for each block
        const updates = blockIds.map((id, index) => ({
            id,
            display_order: index,
        }));

        const { error } = await supabase
            .from('love_story_blocks')
            .upsert(updates);

        if (error) {
            console.error('Error reordering love story blocks:', error);
            throw new Error(`Failed to reorder love story blocks: ${error.message}`);
        }
    }

    /**
     * Delete all blocks for a registration
     */
    async deleteAllBlocks(registrationId: string): Promise<void> {
        const supabase = getSupabaseClient();

        const { error } = await supabase
            .from('love_story_blocks')
            .delete()
            .eq('registration_id', registrationId);

        if (error) {
            console.error('Error deleting all love story blocks:', error);
            throw new Error(`Failed to delete love story blocks: ${error.message}`);
        }
    }
}

// Export singleton instance
export const loveStoryRepo = new LoveStoryRepository();
import { getSupabaseClient } from '../lib/supabase';

export interface ThemeSettings {
    registration_id: string;
    theme_key: string;
    enable_gallery: boolean;
    enable_love_story: boolean;
    enable_wedding_gift: boolean;
    enable_wishes: boolean;
    enable_closing: boolean;
    custom_css?: string;
    created_at?: string;
    updated_at?: string;
}

class ThemeSettingsRepository {
    /**
     * Get theme settings
     */
    async getSettings(registrationId: string): Promise<ThemeSettings | null> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from('theme_settings')
            .select('*')
            .eq('registration_id', registrationId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            console.error('Error getting theme settings:', error);
            throw new Error(`Failed to get theme settings: ${error.message}`);
        }

        return data;
    }

    /**
     * Upsert theme settings
     */
    async upsertSettings(data: ThemeSettings): Promise<ThemeSettings> {
        const supabase = getSupabaseClient();

        const { data: result, error } = await supabase
            .from('theme_settings')
            .upsert(data, { onConflict: 'registration_id' })
            .select()
            .single();

        if (error) {
            console.error('Error upserting theme settings:', error);
            throw new Error(`Failed to upsert theme settings: ${error.message}`);
        }

        return result;
    }

    /**
     * Toggle feature
     */
    async toggleFeature(
        registrationId: string,
        feature: 'gallery' | 'love_story' | 'wedding_gift' | 'wishes' | 'closing',
        enabled: boolean
    ): Promise<ThemeSettings> {
        const settings = await this.getSettings(registrationId);
        if (!settings) {
            throw new Error('Theme settings not found');
        }

        const featureMap = {
            gallery: 'enable_gallery',
            love_story: 'enable_love_story',
            wedding_gift: 'enable_wedding_gift',
            wishes: 'enable_wishes',
            closing: 'enable_closing',
        };

        return this.upsertSettings({
            ...settings,
            [featureMap[feature]]: enabled,
        });
    }
}

// Export singleton instance
export const themeSettingsRepo = new ThemeSettingsRepository();
import { getSupabaseClient } from '../lib/supabase';

export interface WeddingGiftSettings {
    registration_id: string;
    title: string;
    subtitle: string;
    button_label: string;
    gift_image_url?: string;
    background_overlay_opacity: number;
    recipient_name?: string;
    recipient_phone?: string;
    recipient_address_line1?: string;
    recipient_address_line2?: string;
    recipient_address_line3?: string;
    is_enabled: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface WeddingGiftBankAccount {
    id: string;
    registration_id: string;
    bank_name: string;
    account_number: string;
    account_holder_name: string;
    display_order: number;
    created_at?: string;
    updated_at?: string;
}

export type CreateWeddingGiftBankAccountInput = Omit<WeddingGiftBankAccount, 'id' | 'created_at' | 'updated_at'>;
export type UpdateWeddingGiftBankAccountInput = Partial<Omit<WeddingGiftBankAccount, 'id' | 'registration_id' | 'created_at' | 'updated_at'>>;

class WeddingGiftRepository {
    /**
     * Get wedding gift settings
     */
    async getSettings(registrationId: string): Promise<WeddingGiftSettings | null> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from('wedding_gift_settings')
            .select('*')
            .eq('registration_id', registrationId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            console.error('Error getting wedding gift settings:', error);
            throw new Error(`Failed to get wedding gift settings: ${error.message}`);
        }

        return data;
    }

    /**
     * Upsert wedding gift settings
     */
    async upsertSettings(data: WeddingGiftSettings): Promise<WeddingGiftSettings> {
        const supabase = getSupabaseClient();

        const { data: result, error } = await supabase
            .from('wedding_gift_settings')
            .upsert(data, { onConflict: 'registration_id' })
            .select()
            .single();

        if (error) {
            console.error('Error upserting wedding gift settings:', error);
            throw new Error(`Failed to upsert wedding gift settings: ${error.message}`);
        }

        return result;
    }

    /**
     * Get all bank accounts
     */
    async getBankAccounts(registrationId: string): Promise<WeddingGiftBankAccount[]> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from('wedding_gift_bank_accounts')
            .select('*')
            .eq('registration_id', registrationId)
            .order('display_order', { ascending: true });

        if (error) {
            console.error('Error getting bank accounts:', error);
            throw new Error(`Failed to get bank accounts: ${error.message}`);
        }

        return data || [];
    }

    /**
     * Create bank account
     */
    async createBankAccount(account: CreateWeddingGiftBankAccountInput): Promise<WeddingGiftBankAccount> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from('wedding_gift_bank_accounts')
            .insert(account)
            .select()
            .single();

        if (error) {
            console.error('Error creating bank account:', error);
            throw new Error(`Failed to create bank account: ${error.message}`);
        }

        return data;
    }

    /**
     * Update bank account
     */
    async updateBankAccount(id: string, updates: UpdateWeddingGiftBankAccountInput): Promise<WeddingGiftBankAccount> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from('wedding_gift_bank_accounts')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating bank account:', error);
            throw new Error(`Failed to update bank account: ${error.message}`);
        }

        return data;
    }

    /**
     * Delete bank account
     */
    async deleteBankAccount(id: string): Promise<void> {
        const supabase = getSupabaseClient();

        const { error } = await supabase
            .from('wedding_gift_bank_accounts')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting bank account:', error);
            throw new Error(`Failed to delete bank account: ${error.message}`);
        }
    }

    /**
     * Reorder bank accounts
     */
    async reorderBankAccounts(registrationId: string, accountIds: string[]): Promise<void> {
        const supabase = getSupabaseClient();

        const updates = accountIds.map((id, index) => ({
            id,
            display_order: index,
        }));

        const { error } = await supabase
            .from('wedding_gift_bank_accounts')
            .upsert(updates);

        if (error) {
            console.error('Error reordering bank accounts:', error);
            throw new Error(`Failed to reorder bank accounts: ${error.message}`);
        }
    }

    /**
     * Delete all bank accounts for a registration
     */
    async deleteAllBankAccounts(registrationId: string): Promise<void> {
        const supabase = getSupabaseClient();

        const { error } = await supabase
            .from('wedding_gift_bank_accounts')
            .delete()
            .eq('registration_id', registrationId);

        if (error) {
            console.error('Error deleting all bank accounts:', error);
            throw new Error(`Failed to delete bank accounts: ${error.message}`);
        }
    }
}

// Export singleton instance
export const weddingGiftRepo = new WeddingGiftRepository();
import { getSupabaseClient } from '../lib/supabase';

export interface WeddingRegistration {
    id: string;
    client_id: string;
    slug: string;
    event_type: 'islam' | 'kristen' | 'katolik' | 'hindu' | 'buddha' | 'custom';
    custom_event1_label?: string;
    custom_event2_label?: string;
    bride_name: string;
    bride_full_name: string;
    bride_father_name?: string;
    bride_mother_name?: string;
    bride_instagram?: string;
    groom_name: string;
    groom_full_name: string;
    groom_father_name?: string;
    groom_mother_name?: string;
    groom_instagram?: string;
    event1_date: string;
    event2_same_date: boolean;
    event2_date?: string;
    timezone: 'WIB' | 'WITA' | 'WIT';
    event1_time: string;
    event1_end_time?: string;
    event1_venue_name?: string;
    event1_venue_address?: string;
    event1_venue_city?: string;
    event1_venue_province?: string;
    event1_maps_url?: string;
    event2_same_venue: boolean;
    event2_time?: string;
    event2_end_time?: string;
    event2_venue_name?: string;
    event2_venue_address?: string;
    event2_venue_city?: string;
    event2_venue_province?: string;
    event2_maps_url?: string;
    created_at?: string;
    updated_at?: string;
}

export type CreateWeddingRegistrationInput = Omit<WeddingRegistration, 'id' | 'created_at' | 'updated_at'>;
export type UpdateWeddingRegistrationInput = Partial<Omit<WeddingRegistration, 'id' | 'client_id' | 'created_at' | 'updated_at'>>;

class WeddingRegistrationRepository {
    private tableName = 'wedding_registrations';

    /**
     * Create new wedding registration
     */
    async create(data: CreateWeddingRegistrationInput): Promise<WeddingRegistration> {
        const supabase = getSupabaseClient();

        const { data: result, error } = await supabase
            .from(this.tableName)
            .insert(data)
            .select()
            .single();

        if (error) {
            console.error('Error creating wedding registration:', error);
            throw new Error(`Failed to create wedding registration: ${error.message}`);
        }

        return result;
    }

    /**
     * Find wedding registration by slug
     */
    async findBySlug(slug: string): Promise<WeddingRegistration | null> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('slug', slug)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Not found
                return null;
            }
            console.error('Error finding wedding registration by slug:', error);
            throw new Error(`Failed to find wedding registration: ${error.message}`);
        }

        return data;
    }

    /**
     * Find wedding registration by ID
     */
    async findById(id: string): Promise<WeddingRegistration | null> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            console.error('Error finding wedding registration by ID:', error);
            throw new Error(`Failed to find wedding registration: ${error.message}`);
        }

        return data;
    }

    /**
     * Update wedding registration
     */
    async update(id: string, updates: UpdateWeddingRegistrationInput): Promise<WeddingRegistration> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from(this.tableName)
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating wedding registration:', error);
            throw new Error(`Failed to update wedding registration: ${error.message}`);
        }

        return data;
    }

    /**
     * Delete wedding registration
     */
    async delete(id: string): Promise<void> {
        const supabase = getSupabaseClient();

        const { error } = await supabase
            .from(this.tableName)
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting wedding registration:', error);
            throw new Error(`Failed to delete wedding registration: ${error.message}`);
        }
    }

    /**
     * Find all registrations by client ID
     */
    async findByClientId(clientId: string): Promise<WeddingRegistration[]> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error finding wedding registrations by client ID:', error);
            throw new Error(`Failed to find wedding registrations: ${error.message}`);
        }

        return data || [];
    }

    /**
     * Check if slug is available
     */
    async isSlugAvailable(slug: string): Promise<boolean> {
        const existing = await this.findBySlug(slug);
        return !existing;
    }
}

// Export singleton instance
export const weddingRegistrationRepo = new WeddingRegistrationRepository();
import { getSupabaseClient } from '../lib/supabase';

export type AttendanceStatus = 'hadir' | 'tidak-hadir' | 'masih-ragu';

export interface WishInsert {
  invitationSlug: string;
  name: string;
  message: string;
  attendance: AttendanceStatus;
  guestCount: number;
}

export interface WishRow {
  id: number;
  invitationSlug: string;
  name: string;
  message: string;
  attendance: AttendanceStatus;
  guestCount: number;
  createdAt: string;
}

interface WishRecord {
  id: number;
  invitation_slug: string;
  name: string;
  message: string;
  attendance: AttendanceStatus;
  guest_count: number;
  created_at: string;
}

const TABLE_NAME = 'wishes';

function mapWishRecord(row: WishRecord): WishRow {
  return {
    id: row.id,
    invitationSlug: row.invitation_slug,
    name: row.name,
    message: row.message,
    attendance: row.attendance,
    guestCount: row.guest_count,
    createdAt: row.created_at,
  };
}

export async function createWish(data: WishInsert): Promise<WishRow> {
  const supabase = getSupabaseClient();

  const { data: row, error } = await supabase
    .from(TABLE_NAME)
    .insert({
      invitation_slug: data.invitationSlug,
      name: data.name,
      message: data.message,
      attendance: data.attendance,
      guest_count: data.guestCount,
    })
    .select('*')
    .single();

  if (error || !row) {
    console.error('Error inserting wish', error);
    throw error || new Error('Failed to insert wish');
  }

  return mapWishRecord(row as WishRecord);
}

export async function listWishes(invitationSlug: string): Promise<WishRow[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('invitation_slug', invitationSlug)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error loading wishes', error);
    throw error;
  }

  const rows = (data || []) as WishRecord[];
  return rows.map(mapWishRecord);
}
