import { getDb } from '../db';
import { invitationPages } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { Env } from '../lib/types';
import { weddingRegistrationRepo, type WeddingRegistration } from '../repositories/weddingRegistrationRepository';
import { greetingSectionRepo, type GreetingSection } from '../repositories/greetingSectionRepository';
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
    async compileInvitation(env: Env, slug: string): Promise<FullInvitationContent> {
        // 1. Get wedding registration (core data)
        const registration = await weddingRegistrationRepo.findBySlug(env, slug);
        if (!registration) {
            throw new Error(`Registration not found for slug: ${slug}`);
        }

        // 2. Get theme settings to check which modules are enabled
        const themeSettings = await themeSettingsRepo.getSettings(env, registration.id);

        // 3. Get all related data in parallel
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
            greetingSectionRepo.findByRegistrationId(env, registration.id),
            loveStoryRepo.getSettings(env, registration.id),
            loveStoryRepo.getBlocks(env, registration.id),
            galleryRepo.getSettings(env, registration.id),
            weddingGiftRepo.getSettings(env, registration.id),
            weddingGiftRepo.getBankAccounts(env, registration.id),
            closingRepo.getSettings(env, registration.id),
            backgroundMusicRepo.getSettings(env, registration.id),
        ]);

        // 4. Transform to JSONB format (new structure)
        const compiled: FullInvitationContent = {
            slug: registration.slug,
            profile: await this.buildClientProfile(registration, themeSettings?.themeKey || 'simple2'),
            bride: this.buildBrideContent(registration),
            groom: this.buildGroomContent(registration),
            event: this.buildEventContent(registration),
            greetings: this.buildCloudsContent(greetings, registration),
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
     * Save compiled data to invitation_pages (cache)
     */
    async saveToCache(env: Env, slug: string, compiled: FullInvitationContent): Promise<void> {
        const db = getDb(env);

        await db
            .insert(invitationPages)
            .values({
                slug,
                clientId: undefined, // Optional in schema? Validation might fail if not nullable? Schema says: references clients.id. But insert might not need it if only updating cache?
                // Wait, Schema says: clientId: uuid("client_id").references(...). 
                // But is it NOT NULL? Line 66: .references(...). It doesn't say .notNull().
                // So it is nullable.
                profile: compiled.profile,
                bride: compiled.bride,
                groom: compiled.groom,
                event: compiled.event,
                greetings: compiled.greetings,
                eventDetails: compiled.eventDetails,
                loveStory: compiled.loveStory,
                gallery: compiled.gallery,
                weddingGift: compiled.weddingGift,
                closing: compiled.closing,
                musicSettings: compiled.musicSettings,
                themeKey: compiled.profile.theme,
                updatedAt: new Date().toISOString(),
            })
            .onConflictDoUpdate({
                target: invitationPages.slug,
                set: {
                    profile: compiled.profile,
                    bride: compiled.bride,
                    groom: compiled.groom,
                    event: compiled.event,
                    greetings: compiled.greetings,
                    eventDetails: compiled.eventDetails,
                    loveStory: compiled.loveStory,
                    gallery: compiled.gallery,
                    weddingGift: compiled.weddingGift,
                    closing: compiled.closing,
                    musicSettings: compiled.musicSettings,
                    themeKey: compiled.profile.theme,
                    updatedAt: new Date().toISOString(),
                }
            });
    }

    /**
     * Main public method: Compile and cache
     */
    async compileAndCache(env: Env, slug: string): Promise<FullInvitationContent> {
        console.log(`Compiling invitation data for slug: ${slug}`);
        const compiled = await this.compileInvitation(env, slug);
        await this.saveToCache(env, slug, compiled);
        console.log(`Successfully compiled and cached: ${slug}`);
        return compiled;
    }

    /**
     * Invalidate cache (force recompile on next read)
     */
    async invalidateCache(env: Env, slug: string): Promise<void> {
        const db = getDb(env);

        await db
            .update(invitationPages)
            .set({ updatedAt: new Date(0).toISOString() }) // Set to epoch
            .where(eq(invitationPages.slug, slug));
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

    private buildCloudsContent(greetings: GreetingSection[], reg: WeddingRegistration): CloudsContent {
        const clouds: CloudsContent = {};

        greetings.forEach((greeting) => {
            // Map legacy fields or new fields
            // New schema uses showBrideName/showGroomName booleans

            let brideText = '';
            let groomText = '';

            if (greeting.showBrideName) {
                brideText = reg.bride_name;
            }

            if (greeting.showGroomName) {
                groomText = reg.groom_name;
            }

            clouds[greeting.sectionKey] = {
                title: greeting.title || '',
                subtitle: greeting.subtitle || '',
                brideText: brideText,
                groomText: groomText,
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
        if (!settings || !settings.isEnabled) {
            return {
                mainTitle: 'Cerita Cinta Kami',
                backgroundImage: '',
                overlayOpacity: 0.3,
                blocks: [],
            };
        }

        return {
            mainTitle: settings.mainTitle,
            backgroundImage: settings.backgroundImageUrl || '',
            overlayOpacity: typeof settings.overlayOpacity === 'string' ? parseFloat(settings.overlayOpacity) : settings.overlayOpacity,
            blocks: blocks.map((block: any) => ({
                title: block.title,
                body: block.bodyText,
            })),
        };
    }

    private buildGalleryContent(settings: any): GalleryContent {
        if (!settings || !settings.isEnabled) {
            return {
                mainTitle: 'Galeri',
                backgroundColor: '#f5f5f5',
                topRowImages: [],
                middleImages: [],
                bottomGridImages: [],
                showYoutube: false,
            };
        }

        const images = settings.images || [];
        // Helper to map string array to object array
        // Note: Logic for splitting images into rows is missing here compared to what might be expected if the repo did it,
        // but the previous code mapped settings.top_row_images. 
        // Wait, standard Gallery Repo in Supabase had 'images' array?
        // Let's check previous code of galleryRepository.ts (Supabase version)
        // It had `images: string[]`.
        // But `invitationCompilerService.ts` (Supabase version) accessed `settings.top_row_images`.
        // This implies `settings` object from Supabase had `top_row_images`.
        // BUT `GallerySettings` interface in `galleryRepository.ts` ONLY had `images`.
        // If the DB table has `top_row_images`, my interface was incomplet or the interface I saw was wrong?
        // Or maybe `images` column is JSONB/Array and Service manually splits it?

        // Let's look at schema for `gallerySettings`. It has `images: text("images").array()`.
        // It DOES NOT have `top_row_images`, `middle_images`, `bottom_grid_images`.
        // So the OLD `invitationCompilerService.ts` access to `settings.top_row_images` suggests that 
        // EITHER the previous repo returned a transformed object, OR the DB schema I see now is different from what Supabase returned?

        // OLD invitationCompilerService.ts:
        // topRowImages: (settings.top_row_images || []).map(...)

        // If the new schema only has `images` array, I need to implement logic to distribute these images into rows?
        // Or strictly strictly speaking I should fix the logic.
        // For now, I will just put all images in `bottomGridImages` or distribute them?
        // Or assume `settings` has these fields?

        // If I migrated to Drizzle using CURRENT schema, I only get `images`.
        // So I must distribute them.

        // Simple distribution logic:
        // All to bottom grid for now? Or split?
        // Let's put first 3 in top, next 3 in middle, rest in bottom?

        // Actually, let's verify if I missed columns in Schema.
        // Schema line 467: `images: text("images").default('RRAY[').array(),`
        // No other image columns.

        // So I will distribute them.

        const topRow = images.slice(0, 3);
        const middle = images.slice(3, 6);
        const bottom = images.slice(6);

        return {
            mainTitle: settings.mainTitle,
            backgroundColor: settings.backgroundColor,
            topRowImages: topRow.map((src: string) => ({ src, alt: 'Gallery Image' })),
            middleImages: middle.map((src: string) => ({ src, alt: 'Gallery Image' })),
            bottomGridImages: bottom.map((src: string) => ({ src, alt: 'Gallery Image' })),
            youtubeEmbedUrl: settings.youtubeEmbedUrl,
            showYoutube: settings.showYoutube,
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
            buttonLabel: settings.buttonLabel,
            giftImageSrc: settings.giftImageUrl || '',
            backgroundOverlayOpacity: typeof settings.backgroundOverlayOpacity === 'string' ? parseFloat(settings.backgroundOverlayOpacity) : settings.backgroundOverlayOpacity,
            bankAccounts: bankAccounts.map((account) => ({
                templateId: account.bankName.toLowerCase(),
                accountNumber: account.accountNumber,
                accountName: account.accountHolderName,
            })),
            physicalGift: {
                recipientName: settings.recipientName || '',
                phone: settings.recipientPhone,
                addressLines: [
                    settings.recipientAddressLine1,
                    settings.recipientAddressLine2,
                    settings.recipientAddressLine3,
                ].filter(Boolean),
            },
        };
    }

    private buildClosingContent(settings: any): ClosingContent {
        if (!settings || !settings.isEnabled) {
            return {
                backgroundColor: '#f5f5f5',
                photoSrc: '',
                photoAlt: 'Closing Photo',
                namesScript: 'Terima Kasih',
                messageLines: [],
            };
        }

        return {
            backgroundColor: settings.backgroundColor,
            photoSrc: settings.photoUrl || '',
            photoAlt: settings.photoAlt || '',
            namesScript: settings.namesDisplay || settings.names_script || '', // Handle change from names_script to namesDisplay
            messageLines: [
                settings.messageLine1,
                settings.messageLine2,
                settings.messageLine3,
            ].filter(Boolean),
        };
    }

    private buildMusicContent(settings: any): BackgroundMusicContent | undefined {
        if (!settings || !settings.isEnabled) {
            return undefined;
        }

        return {
            src: settings.audioUrl,
            title: settings.title,
            artist: settings.artist,
            loop: settings.loop,
            registerAsBackgroundAudio: settings.registerAsBackgroundAudio,
        };
    }

    // ========== UTILITY METHODS ==========

    private getEventLabel(reg: WeddingRegistration, eventNumber: 1 | 2): string {
        const EVENT_TYPES: any = {
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
