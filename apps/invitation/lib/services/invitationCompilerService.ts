import { getSupabaseClient } from '@/lib/supabaseClient';
import { weddingRegistrationRepo, type WeddingRegistration } from '../repositories/weddingRegistrationRepository';
import { greetingSectionRepo } from '../repositories/greetingSectionRepository';
import { loveStoryRepo } from '../repositories/loveStoryRepository';
import { galleryRepo } from '../repositories/galleryRepository';
import { weddingGiftRepo } from '../repositories/weddingGiftRepository';
import { closingRepo } from '../repositories/closingRepository';
import { backgroundMusicRepo } from '../repositories/backgroundMusicRepository';
import { themeSettingsRepo } from '../repositories/themeSettingsRepository';
import type {
    FullInvitationContent,
    BrideContent,
    GroomContent,
    EventContent,
    CloudsContent,
    EventCloudContent,
    LoveStoryContent,
    GalleryContent,
    WeddingGiftContent,
    ClosingContent,
    BackgroundMusicContent,
} from '../repositories/invitationContentRepository';

/**
 * Invitation Compiler Service
 * Compiles data from normalized tables into JSON cache format
 */
class InvitationCompilerService {
    /**
     * Main method: Compile all data from normalized tables into JSON format
     */
    async compileInvitation(slug: string): Promise<FullInvitationContent> {
        // 1. Get wedding registration (core data)
        const registration = await weddingRegistrationRepo.findBySlug(slug);
        if (!registration) {
            throw new Error(`Registration not found for slug: ${slug}`);
        }

        // 2. Get theme settings to check which modules are enabled
        const themeSettings = await themeSettingsRepo.getSettings(registration.id);

        // 3. Get all related data in parallel
        const [
            greetings,
            loveStorySettings,
            loveStoryBlocks,
            gallerySettings,
            weddingGiftSettings,
            weddingGiftBankAccounts,
            closingSettings,
            musicSettings,
        ] = await Promise.all([
            greetingSectionRepo.findByRegistrationId(registration.id),
            loveStoryRepo.getSettings(registration.id),
            loveStoryRepo.getBlocks(registration.id),
            galleryRepo.getSettings(registration.id),
            weddingGiftRepo.getSettings(registration.id),
            weddingGiftRepo.getBankAccounts(registration.id),
            closingRepo.getSettings(registration.id),
            backgroundMusicRepo.getSettings(registration.id),
        ]);

        // 4. Transform to JSONB format (old structure)
        const compiled: FullInvitationContent = {
            slug: registration.slug,
            profile: await this.buildClientProfile(registration, themeSettings?.theme_key || 'simple2'),
            bride: this.buildBrideContent(registration),
            groom: this.buildGroomContent(registration),
            event: this.buildEventContent(registration),
            greetings: this.buildCloudsContent(greetings),
            eventDetails: this.buildEventCloudContent(registration),
            loveStory: this.buildLoveStoryContent(loveStorySettings, loveStoryBlocks),
            gallery: this.buildGalleryContent(gallerySettings),
            weddingGift: this.buildWeddingGiftContent(weddingGiftSettings, weddingGiftBankAccounts),
            closing: this.buildClosingContent(closingSettings),
            musicSettings: this.buildMusicContent(musicSettings),
        };

        return compiled;
    }

    /**
     * Save compiled data to invitation_contents (cache)
     */
    async saveToCache(slug: string, compiled: FullInvitationContent): Promise<void> {
        const supabase = getSupabaseClient();

        const { error } = await supabase
            .from('invitation_contents')
            .upsert(
                {
                    slug,
                    profile: compiled.profile,
                    bride: compiled.bride,
                    groom: compiled.groom,
                    event: compiled.event,
                    greetings: compiled.greetings,
                    event_details: compiled.eventDetails,
                    love_story: compiled.loveStory,
                    gallery: compiled.gallery,
                    wedding_gift: compiled.weddingGift,
                    closing: compiled.closing,
                    music_settings: compiled.musicSettings,
                    theme_key: compiled.profile.theme,
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: 'slug',
                }
            );

        if (error) {
            console.error('Error saving to cache:', error);
            throw new Error(`Failed to save to cache: ${error.message}`);
        }
    }

    /**
     * Main public method: Compile and cache
     */
    async compileAndCache(slug: string): Promise<FullInvitationContent> {
        console.log(`Compiling invitation data for slug: ${slug}`);
        const compiled = await this.compileInvitation(slug);
        await this.saveToCache(slug, compiled);
        console.log(`Successfully compiled and cached: ${slug}`);
        return compiled;
    }

    /**
     * Invalidate cache (force recompile on next read)
     */
    async invalidateCache(slug: string): Promise<void> {
        const supabase = getSupabaseClient();

        await supabase
            .from('invitation_contents')
            .update({ updated_at: new Date(0).toISOString() }) // Set to epoch
            .eq('slug', slug);
    }

    // ========== TRANSFORMATION HELPER METHODS ==========

    private async buildClientProfile(registration: WeddingRegistration, themeKey: string): Promise<any> {
        // For now, return a basic client profile
        // TODO: Fetch actual client data from clients table
        return {
            theme: themeKey,
            name: `${registration.bride_name} & ${registration.groom_name}`,
            slug: registration.slug,
        };
    }

    private buildBrideContent(reg: WeddingRegistration): BrideContent {
        return {
            name: reg.bride_name,
            fullName: reg.bride_full_name,
            fatherName: reg.bride_father_name || '',
            motherName: reg.bride_mother_name || '',
            instagram: reg.bride_instagram || '',
        };
    }

    private buildGroomContent(reg: WeddingRegistration): GroomContent {
        return {
            name: reg.groom_name,
            fullName: reg.groom_full_name,
            fatherName: reg.groom_father_name || '',
            motherName: reg.groom_mother_name || '',
            instagram: reg.groom_instagram || '',
        };
    }

    private buildEventContent(reg: WeddingRegistration): EventContent {
        const eventDate = reg.event2_same_date ? reg.event1_date : (reg.event2_date || reg.event1_date);
        const fullDateLabel = this.formatDateToIndonesian(eventDate);

        return {
            fullDateLabel,
            isoDate: eventDate,
            countdownDateTime: this.buildCountdownDateTime(reg),
            calendarLink: this.buildCalendarLink(reg),
        };
    }

    private buildCloudsContent(greetings: any[]): CloudsContent {
        const clouds: CloudsContent = {};

        greetings.forEach((greeting) => {
            clouds[greeting.section_type] = {
                title: greeting.title || '',
                subtitle: greeting.subtitle || '',
                brideText: greeting.bride_text,
                groomText: greeting.groom_text,
            };
        });

        return clouds;
    }

    private buildEventCloudContent(reg: WeddingRegistration): EventCloudContent {
        const event1Label = this.getEventLabel(reg, 1);
        const event2Label = this.getEventLabel(reg, 2);

        return {
            holyMatrimony: {
                title: event1Label,
                dateLabel: this.formatDateToIndonesian(reg.event1_date),
                timeLabel: this.formatTimeRange(reg.event1_time, reg.event1_end_time, reg.timezone),
                venueName: reg.event1_venue_name || '',
                venueAddress: this.formatVenueAddress(
                    reg.event1_venue_address,
                    reg.event1_venue_city,
                    reg.event1_venue_province
                ),
                mapsUrl: reg.event1_maps_url || '',
                mapsLabel: 'Lihat Lokasi',
            },
            reception: {
                title: event2Label,
                dateLabel: reg.event2_same_date
                    ? this.formatDateToIndonesian(reg.event1_date)
                    : this.formatDateToIndonesian(reg.event2_date || reg.event1_date),
                timeLabel: this.formatTimeRange(reg.event2_time, reg.event2_end_time, reg.timezone),
                venueName: reg.event2_same_venue ? reg.event1_venue_name || '' : reg.event2_venue_name || '',
                venueAddress: reg.event2_same_venue
                    ? this.formatVenueAddress(reg.event1_venue_address, reg.event1_venue_city, reg.event1_venue_province)
                    : this.formatVenueAddress(reg.event2_venue_address, reg.event2_venue_city, reg.event2_venue_province),
                mapsUrl: reg.event2_same_venue ? reg.event1_maps_url || '' : reg.event2_maps_url || '',
                mapsLabel: 'Lihat Lokasi',
            },
            streaming: {
                description: 'Saksikan upacara kami secara langsung',
                url: '',
                buttonLabel: 'Tonton Live Streaming',
            },
        };
    }

    private buildLoveStoryContent(settings: any, blocks: any[]): LoveStoryContent {
        if (!settings || !settings.is_enabled) {
            return {
                mainTitle: 'Cerita Cinta Kami',
                backgroundImage: '',
                overlayOpacity: 0.3,
                blocks: [],
            };
        }

        return {
            mainTitle: settings.main_title,
            backgroundImage: settings.background_image_url || '',
            overlayOpacity: settings.overlay_opacity,
            blocks: blocks.map((block) => ({
                title: block.title,
                body: block.body_text,
            })),
        };
    }

    private buildGalleryContent(settings: any): GalleryContent {
        if (!settings || !settings.is_enabled) {
            return {
                mainTitle: 'Galeri',
                backgroundColor: '#f5f5f5',
                topRowImages: [],
                middleImages: [],
                bottomGridImages: [],
                showYoutube: false,
            };
        }

        return {
            mainTitle: settings.main_title,
            backgroundColor: settings.background_color,
            topRowImages: (settings.top_row_images || []).map((src: string) => ({ src, alt: 'Gallery Image' })),
            middleImages: (settings.middle_images || []).map((src: string) => ({ src, alt: 'Gallery Image' })),
            bottomGridImages: (settings.bottom_grid_images || []).map((src: string) => ({ src, alt: 'Gallery Image' })),
            youtubeEmbedUrl: settings.youtube_embed_url,
            showYoutube: settings.show_youtube,
        };
    }

    private buildWeddingGiftContent(settings: any, bankAccounts: any[]): WeddingGiftContent {
        if (!settings || !settings.is_enabled) {
            return {
                title: 'Amplop Digital',
                subtitle: 'Kirimkan hadiah untuk kami',
                buttonLabel: 'Kirim Hadiah',
                giftImageSrc: '',
                backgroundOverlayOpacity: 0.5,
                bankAccounts: [],
                physicalGift: {
                    recipientName: '',
                    addressLines: [],
                },
            };
        }

        return {
            title: settings.title,
            subtitle: settings.subtitle,
            buttonLabel: settings.button_label,
            giftImageSrc: settings.gift_image_url || '',
            backgroundOverlayOpacity: settings.background_overlay_opacity,
            bankAccounts: bankAccounts.map((account) => ({
                templateId: account.bank_name.toLowerCase(),
                accountNumber: account.account_number,
                accountName: account.account_holder_name,
            })),
            physicalGift: {
                recipientName: settings.recipient_name || '',
                phone: settings.recipient_phone,
                addressLines: [
                    settings.recipient_address_line1,
                    settings.recipient_address_line2,
                    settings.recipient_address_line3,
                ].filter(Boolean),
            },
        };
    }

    private buildClosingContent(settings: any): ClosingContent {
        if (!settings || !settings.is_enabled) {
            return {
                backgroundColor: '#f5f5f5',
                photoSrc: '',
                photoAlt: 'Closing Photo',
                namesScript: '',
                messageLines: [],
            };
        }

        return {
            backgroundColor: settings.background_color,
            photoSrc: settings.photo_url || '',
            photoAlt: settings.photo_alt || 'Closing Photo',
            namesScript: settings.names_script,
            messageLines: [
                settings.message_line1,
                settings.message_line2,
                settings.message_line3,
            ].filter(Boolean),
        };
    }

    private buildMusicContent(settings: any): BackgroundMusicContent | undefined {
        if (!settings || !settings.is_enabled) {
            return undefined;
        }

        return {
            src: settings.audio_url,
            title: settings.title,
            artist: settings.artist,
            loop: settings.loop,
            registerAsBackgroundAudio: settings.register_as_background_audio,
        };
    }

    // ========== UTILITY METHODS ==========

    private getEventLabel(reg: WeddingRegistration, eventNumber: 1 | 2): string {
        const EVENT_TYPES = {
            islam: eventNumber === 1 ? 'Akad Nikah' : 'Resepsi',
            kristen: eventNumber === 1 ? 'Holy Matrimony' : 'Reception',
            katolik: eventNumber === 1 ? 'Holy Matrimony' : 'Reception',
            hindu: eventNumber === 1 ? 'Upacara Adat' : 'Resepsi',
            buddha: eventNumber === 1 ? 'Upacara Pernikahan' : 'Resepsi',
            custom: eventNumber === 1 ? reg.custom_event1_label || 'Acara 1' : reg.custom_event2_label || 'Acara 2',
        };

        return EVENT_TYPES[reg.event_type] || 'Acara';
    }

    private formatDateToIndonesian(isoDate: string): string {
        const date = new Date(isoDate);
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        };
        return date.toLocaleDateString('id-ID', options);
    }

    private formatTimeRange(startTime?: string, endTime?: string, timezone?: string): string {
        if (!startTime) return '';

        const tz = timezone || 'WIB';
        if (!endTime) {
            return `${startTime} ${tz} - Selesai`;
        }

        return `${startTime} - ${endTime} ${tz}`;
    }

    private formatVenueAddress(address?: string, city?: string, province?: string): string {
        const parts = [address, city, province].filter(Boolean);
        return parts.join(', ');
    }

    private buildCountdownDateTime(reg: WeddingRegistration): string {
        // Countdown to event 1
        const date = new Date(reg.event1_date);
        const [hours, minutes] = (reg.event1_time || '00:00').split(':');
        date.setHours(parseInt(hours), parseInt(minutes));
        return date.toISOString();
    }

    private buildCalendarLink(reg: WeddingRegistration): string {
        // Generate Google Calendar link
        const title = `Pernikahan ${reg.bride_name} & ${reg.groom_name}`;
        const startDate = new Date(reg.event1_date);
        const [hours, minutes] = (reg.event1_time || '00:00').split(':');
        startDate.setHours(parseInt(hours), parseInt(minutes));

        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + 3); // Default 3 hours duration

        const formatGoogleDate = (date: Date) => {
            return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };

        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: title,
            dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
            details: `Acara pernikahan ${reg.bride_name} dan ${reg.groom_name}`,
            location: reg.event1_venue_name || '',
        });

        return `https://calendar.google.com/calendar/render?${params.toString()}`;
    }
}

// Export singleton instance
export const invitationCompiler = new InvitationCompilerService();
