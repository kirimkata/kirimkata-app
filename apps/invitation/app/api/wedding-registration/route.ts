import { NextRequest, NextResponse } from 'next/server';
import { weddingRegistrationRepo } from '@/lib/repositories/weddingRegistrationRepository';
import { greetingSectionRepo } from '@/lib/repositories/greetingSectionRepository';
import { loveStoryRepo } from '@/lib/repositories/loveStoryRepository';
import { galleryRepo } from '@/lib/repositories/galleryRepository';
import { weddingGiftRepo } from '@/lib/repositories/weddingGiftRepository';
import { closingRepo } from '@/lib/repositories/closingRepository';
import { backgroundMusicRepo } from '@/lib/repositories/backgroundMusicRepository';
import { themeSettingsRepo } from '@/lib/repositories/themeSettingsRepository';
import { invitationCompiler } from '@/lib/services/invitationCompilerService';

// Raw data type dari form (updated with new fields)
interface RawWeddingData {
    slug: string;
    eventType: 'islam' | 'kristen' | 'katolik' | 'hindu' | 'buddha' | 'custom';
    customEvent1Label?: string;
    customEvent2Label?: string;
    brideName: string;
    brideFullName: string;
    brideFatherName?: string;
    brideMotherName?: string;
    brideInstagram?: string;
    groomName: string;
    groomFullName: string;
    groomFatherName?: string;
    groomMotherName?: string;
    groomInstagram?: string;
    event1Date: string;
    event2SameDate: boolean;
    event2Date?: string;
    timezone: 'WIB' | 'WITA' | 'WIT';
    event1Time: string;
    event1EndTime?: string;
    event1VenueName?: string;
    event1VenueAddress?: string;
    event1VenueCity?: string;
    event1VenueProvince?: string;
    event1MapsUrl?: string;
    event2SameVenue: boolean;
    event2Time?: string;
    event2EndTime?: string;
    event2VenueName?: string;
    event2VenueAddress?: string;
    event2VenueCity?: string;
    event2VenueProvince?: string;
    event2MapsUrl?: string;
}

/**
 * Create default settings for all modules
 */
async function createDefaultSettings(registrationId: string, rawData: RawWeddingData) {
    const coupleNames = `${rawData.brideName} & ${rawData.groomName}`;

    await Promise.all([
        // Default greeting sections
        greetingSectionRepo.bulkCreate([
            {
                registration_id: registrationId,
                section_type: 'opening_verse',
                title: 'Bismillahirrahmanirrahim',
                subtitle: 'Dengan memohon rahmat dan ridho Allah SWT',
                display_order: 0,
            },
            {
                registration_id: registrationId,
                section_type: 'main_greeting',
                title: 'Undangan Pernikahan',
                subtitle: `Turut mengundang Bapak/Ibu/Saudara/i dalam acara pernikahan kami`,
                bride_text: rawData.brideName,
                groom_text: rawData.groomName,
                display_order: 1,
            },
            {
                registration_id: registrationId,
                section_type: 'countdown_title',
                title: 'Menghitung Hari',
                subtitle: 'Hari yang ditunggu akan segera tiba',
                display_order: 2,
            },
        ]),

        // Default love story settings
        loveStoryRepo.upsertSettings({
            registration_id: registrationId,
            main_title: 'Cerita Cinta Kami',
            overlay_opacity: 0.3,
            is_enabled: false,
        }),

        // Default gallery settings
        galleryRepo.upsertSettings({
            registration_id: registrationId,
            main_title: 'Galeri Foto',
            background_color: '#f5f5f5',
            top_row_images: [],
            middle_images: [],
            bottom_grid_images: [],
            show_youtube: false,
            is_enabled: false,
        }),

        // Default wedding gift settings
        weddingGiftRepo.upsertSettings({
            registration_id: registrationId,
            title: 'Amplop Digital',
            subtitle: 'Doa restu Anda adalah hadiah terindah. Namun jika ingin memberi hadiah:',
            button_label: 'Kirim Hadiah',
            background_overlay_opacity: 0.5,
            is_enabled: false,
        }),

        // Default closing settings
        closingRepo.upsertSettings({
            registration_id: registrationId,
            background_color: '#ffffff',
            names_script: coupleNames,
            message_line1: 'Merupakan suatu kehormatan dan kebahagiaan bagi kami',
            message_line2: 'apabila Bapak/Ibu/Saudara/i berkenan hadir',
            message_line3: 'untuk memberikan doa restu kepada kami',
            is_enabled: true,
        }),

        // Default background music settings
        backgroundMusicRepo.upsertSettings({
            registration_id: registrationId,
            audio_url: '',
            loop: true,
            register_as_background_audio: true,
            is_enabled: false,
        }),

        // Default theme settings
        themeSettingsRepo.upsertSettings({
            registration_id: registrationId,
            theme_key: 'simple2',
            enable_gallery: false,
            enable_love_story: false,
            enable_wedding_gift: false,
            enable_wishes: true,
            enable_closing: true,
        }),
    ]);
}

export async function POST(request: NextRequest) {
    try {
        const rawData: RawWeddingData = await request.json();

        // Validate required fields
        if (
            !rawData.slug ||
            !rawData.brideName ||
            !rawData.brideFullName ||
            !rawData.groomName ||
            !rawData.groomFullName ||
            !rawData.event1Date
        ) {
            return NextResponse.json(
                { success: false, error: 'Data wajib tidak lengkap' },
                { status: 400 }
            );
        }

        // Check if slug is available
        const slugAvailable = await weddingRegistrationRepo.isSlugAvailable(rawData.slug);
        if (!slugAvailable) {
            return NextResponse.json(
                { success: false, error: 'URL sudah digunakan. Silakan pilih URL lain.' },
                { status: 409 }
            );
        }

        // 1. Save to wedding_registrations table
        // TODO: Get client_id from authentication
        const clientId = '00000000-0000-0000-0000-000000000000'; // Temporary, should come from auth

        const registration = await weddingRegistrationRepo.create({
            client_id: clientId,
            slug: rawData.slug,
            event_type: rawData.eventType,
            custom_event1_label: rawData.customEvent1Label,
            custom_event2_label: rawData.customEvent2Label,
            bride_name: rawData.brideName,
            bride_full_name: rawData.brideFullName,
            bride_father_name: rawData.brideFatherName,
            bride_mother_name: rawData.brideMotherName,
            bride_instagram: rawData.brideInstagram,
            groom_name: rawData.groomName,
            groom_full_name: rawData.groomFullName,
            groom_father_name: rawData.groomFatherName,
            groom_mother_name: rawData.groomMotherName,
            groom_instagram: rawData.groomInstagram,
            event1_date: rawData.event1Date,
            event2_same_date: rawData.event2SameDate,
            event2_date: rawData.event2Date,
            timezone: rawData.timezone,
            event1_time: rawData.event1Time,
            event1_end_time: rawData.event1EndTime,
            event1_venue_name: rawData.event1VenueName,
            event1_venue_address: rawData.event1VenueAddress,
            event1_venue_city: rawData.event1VenueCity,
            event1_venue_province: rawData.event1VenueProvince,
            event1_maps_url: rawData.event1MapsUrl,
            event2_same_venue: rawData.event2SameVenue,
            event2_time: rawData.event2Time,
            event2_end_time: rawData.event2EndTime,
            event2_venue_name: rawData.event2VenueName,
            event2_venue_address: rawData.event2VenueAddress,
            event2_venue_city: rawData.event2VenueCity,
            event2_venue_province: rawData.event2VenueProvince,
            event2_maps_url: rawData.event2MapsUrl,
        });

        console.log('✅ Wedding registration created:', registration.id);

        // 2. Create default settings for all modules
        await createDefaultSettings(registration.id, rawData);
        console.log('✅ Default settings created');

        // 3. Compile to JSON cache
        const compiledData = await invitationCompiler.compileAndCache(rawData.slug);
        console.log('✅ Invitation compiled and cached');

        return NextResponse.json({
            success: true,
            message: 'Undangan berhasil dibuat!',
            data: {
                slug: rawData.slug,
                registrationId: registration.id,
                previewUrl: `/${rawData.slug}`,
            },
        });
    } catch (error: any) {
        console.error('❌ Error creating wedding registration:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Terjadi kesalahan. Silakan coba lagi.' },
            { status: 500 }
        );
    }
}
