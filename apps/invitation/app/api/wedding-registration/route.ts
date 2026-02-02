import { NextRequest, NextResponse } from 'next/server';

// Raw data type dari form
interface RawWeddingData {
    slug: string;
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
    weddingDate: string;
    timezone: 'WIB' | 'WITA' | 'WIT';
    akadTime: string;
    akadEndTime?: string;
    akadVenueName?: string;
    akadVenueAddress?: string;
    akadVenueCity?: string;
    akadVenueProvince?: string;
    akadMapsUrl?: string;
    receptionSameVenue: boolean;
    receptionDate?: string;
    receptionTime?: string;
    receptionEndTime?: string;
    receptionVenueName?: string;
    receptionVenueAddress?: string;
    receptionVenueCity?: string;
    receptionVenueProvince?: string;
    receptionMapsUrl?: string;
}

// Helper: Format tanggal ke Indonesia
function formatDateToIndonesian(isoDate: string): string {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const date = new Date(isoDate);
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${dayName}, ${day} ${month} ${year}`;
}

// Helper: Format waktu
function formatTimeLabel(time: string, endTime: string | undefined, timezone: string): string {
    const [hour, minute] = time.split(':');
    const formattedStart = `${hour}.${minute}`;
    const formattedEnd = endTime ? endTime.replace(':', '.') : 'Selesai';

    if (endTime) {
        return `${formattedStart} - ${formattedEnd} ${timezone}`;
    }
    return `${formattedStart} ${timezone} - Selesai`;
}

// Helper: Get timezone offset
function getTimezoneOffset(timezone: string): string {
    const offsets: Record<string, string> = {
        'WIB': '+07:00',
        'WITA': '+08:00',
        'WIT': '+09:00'
    };
    return offsets[timezone] || '+07:00';
}

// Helper: Generate countdown datetime
function generateCountdownDateTime(date: string, time: string, timezone: string): string {
    return `${date}T${time}:00${getTimezoneOffset(timezone)}`;
}

// Transform raw data ke format template
function transformRawDataToTemplateFormat(raw: RawWeddingData) {
    // Auto-generate dari raw data
    const coupleNames = `${raw.brideName} & ${raw.groomName}`;
    const fullDateLabel = formatDateToIndonesian(raw.weddingDate);
    const countdownDateTime = generateCountdownDateTime(raw.weddingDate, raw.akadTime, raw.timezone);

    // Reception venue: sama atau beda?
    const receptionVenue = raw.receptionSameVenue ? {
        venueName: raw.akadVenueName || '',
        venueAddress: raw.akadVenueAddress || '',
        mapsUrl: raw.akadMapsUrl || '',
    } : {
        venueName: raw.receptionVenueName || '',
        venueAddress: raw.receptionVenueAddress || '',
        mapsUrl: raw.receptionMapsUrl || '',
    };

    // Build full address (with city & province)
    const akadFullAddress = [
        raw.akadVenueAddress,
        raw.akadVenueCity,
        raw.akadVenueProvince
    ].filter(Boolean).join(', ');

    const receptionFullAddress = raw.receptionSameVenue
        ? akadFullAddress
        : [
            raw.receptionVenueAddress,
            raw.receptionVenueCity,
            raw.receptionVenueProvince
        ].filter(Boolean).join(', ');

    // Format waktu
    const akadTimeLabel = formatTimeLabel(raw.akadTime, raw.akadEndTime, raw.timezone);
    const receptionTimeLabel = formatTimeLabel(
        raw.receptionTime || '12:00',
        raw.receptionEndTime,
        raw.timezone
    );

    // Location label untuk metadata
    const locationLabel = raw.akadVenueCity && raw.akadVenueProvince
        ? `${raw.akadVenueCity}, ${raw.akadVenueProvince}`
        : '';

    return {
        // Client Profile (untuk SEO & metadata)
        client_profile: {
            slug: raw.slug,
            coupleNames,
            weddingDateLabel: fullDateLabel,
            locationLabel,
            shortDescription: `Undangan Pernikahan ${raw.brideFullName} dan ${raw.groomFullName}.`,
            metaTitle: `Wedding ${coupleNames}`,
            metaDescription: `Undangan digital pernikahan ${raw.brideFullName} & ${raw.groomFullName} — ${fullDateLabel}${locationLabel ? ', ' + locationLabel : ''}.`,
        },

        // Bride data
        bride: {
            name: raw.brideName,
            fullName: raw.brideFullName,
            fatherName: raw.brideFatherName || '',
            motherName: raw.brideMotherName || '',
            instagram: raw.brideInstagram || '',
        },

        // Groom data
        groom: {
            name: raw.groomName,
            fullName: raw.groomFullName,
            fatherName: raw.groomFatherName || '',
            motherName: raw.groomMotherName || '',
            instagram: raw.groomInstagram || '',
        },

        // Event data
        event: {
            fullDateLabel,
            isoDate: raw.weddingDate,
            countdownDateTime,
            eventTitle: `The Wedding of ${coupleNames}`,
        },

        // Event Cloud (detail acara)
        event_cloud: {
            holyMatrimony: {
                title: 'Akad',
                dateLabel: fullDateLabel,
                timeLabel: akadTimeLabel,
                venueName: raw.akadVenueName || '',
                venueAddress: akadFullAddress,
                mapsUrl: raw.akadMapsUrl || '',
                mapsLabel: 'Google Maps',
            },
            reception: {
                title: 'Resepsi',
                dateLabel: raw.receptionDate ? formatDateToIndonesian(raw.receptionDate) : fullDateLabel,
                timeLabel: receptionTimeLabel,
                venueName: receptionVenue.venueName,
                venueAddress: receptionFullAddress,
                mapsUrl: receptionVenue.mapsUrl,
                mapsLabel: 'Google Maps',
            },
        },

        // Closing (auto-generate)
        closing: {
            photoSrc: '', // Will be filled later from gallery
            namesScript: coupleNames,
            messageLines: [
                'Kami sangat menantikan kehadiran Anda untuk berbagi kebahagiaan di hari istimewa kami.',
                'Kehadiran dan doa restu Anda merupakan kebahagiaan bagi kami.',
            ],
        },

        // Initialize empty sections (to be filled later)
        love_story: {
            mainTitle: 'Our Love Story',
            blocks: [],
        },
        gallery: {
            mainTitle: 'Our Moments',
            middleImages: [],
            youtubeEmbedUrl: '',
            showYoutube: false,
        },
        wedding_gift: {
            title: 'Wedding Gift',
            subtitle: 'Doa restu Anda adalah hadiah terindah bagi kami. Namun jika ingin memberi hadiah, dapat melalui:',
            buttonLabel: 'Kirim Hadiah',
            bankAccounts: [],
            physicalGift: {
                recipientName: '',
                phone: '',
                addressLines: [],
            },
        },
        background_music: {
            src: '',
            title: '',
            artist: '',
        },
    };
}

export async function POST(request: NextRequest) {
    try {
        const rawData: RawWeddingData = await request.json();

        // Validate required fields
        if (!rawData.slug || !rawData.brideName || !rawData.brideFullName ||
            !rawData.groomName || !rawData.groomFullName || !rawData.weddingDate) {
            return NextResponse.json(
                { success: false, error: 'Data wajib tidak lengkap' },
                { status: 400 }
            );
        }

        // Transform raw data to template format
        const templateData = transformRawDataToTemplateFormat(rawData);

        // TODO: Save to database
        // const supabase = createClient();
        // await supabase.from('invitation_contents').insert({
        //   slug: templateData.client_profile.slug,
        //   client_profile: templateData.client_profile,
        //   bride: templateData.bride,
        //   groom: templateData.groom,
        //   event: templateData.event,
        //   event_cloud: templateData.event_cloud,
        //   love_story: templateData.love_story,
        //   gallery: templateData.gallery,
        //   wedding_gift: templateData.wedding_gift,
        //   closing: templateData.closing,
        //   background_music: templateData.background_music,
        // });

        // For now, just log and return success
        console.log('Raw Data:', rawData);
        console.log('Transformed Data:', JSON.stringify(templateData, null, 2));

        return NextResponse.json({
            success: true,
            message: 'Data berhasil disimpan',
            data: {
                slug: rawData.slug,
                transformedData: templateData,
            }
        });

    } catch (error: any) {
        console.error('Error saving wedding data:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
