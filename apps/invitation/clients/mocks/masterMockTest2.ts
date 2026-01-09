// Centralized master mock config for Test-2 invitation (custom_2 template)
// Modified from Poppy & Fadli for testing new template architecture

import { flushAllTraces } from "next/dist/trace";

export const masterMockTest2 = {
  clientProfile: {
    slug: 'test-2',
    coupleNames: 'Sarah & Ahmad',
    weddingDateLabel: 'Minggu, 15 Juni 2025',
    locationLabel: 'Jakarta, Indonesia',
    shortDescription:
      'Undangan Pernikahan Sarah Amelia dan Ahmad Fauzi.',
    coverImage: 'https://media.kirimkata.com/poppy_fadli-cover_fadli.jpg',
    shareImage: 'https://media.kirimkata.com/poppy_fadli-cover_fadli_small.jpg',
    metaTitle: 'Wedding Sarah & Ahmad',
    metaDescription:
      'Undangan digital pernikahan Sarah Amelia & Ahmad Fauzi — Minggu, 15 Juni 2025, Jakarta.',
  },

  // High level summary used by InvitationRepository
  invitationSummary: {
    clientNames: 'Sarah & Ahmad',
    eventDateLabel: 'Minggu, 15 Juni 2025',
    locationLabel: 'Jakarta, Indonesia',
    heroImage: 'https://media.kirimkata.com/poppy_fadli-cover_fadli.jpg',
    galleryImages: ['https://media.kirimkata.com/poppy_fadli-cover_fadli.jpg'],
    additionalNotes: 'Test data for custom_2 template.',
  },

  // Bride & Groom detail
  bride: {
    name: 'Sarah',
    fullName: 'Sarah Amelia Putri',
    fatherName: 'Bapak Budi Santoso',
    motherName: 'Ibu Siti Nurhaliza',
    instagram: 'sarahamelia',
  },

  groom: {
    name: 'Ahmad',
    fullName: 'Ahmad Fauzi Rahman',
    fatherName: 'Bapak Fauzi Abdullah',
    motherName: 'Ibu Aminah Zahra',
    instagram: 'ahmadfauzi',
  },

  // Main wedding date & save-the-date
  event: {
    fullDateLabel: 'Minggu, 15 Juni 2025',
    isoDate: '2025-06-15',
    countdownDateTime: '2025-06-15T10:00:00+07:00',
    eventTitle: 'The Wedding of Sarah & Ahmad',
    calendarLink: undefined as string | undefined,
  },

  // Cloud texts used across animation sections
  clouds: {
    "section0": {
      "title": "اَلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ",
      "subtitle": "Dengan izin Allah SWT\nkami mengundang Bapak/Ibu/Saudara/i\nmenghadiri pernikahan kami",
      "brideText": "Sarah",
      "groomText": "Ahmad"
    },
    "section4": {
      "title": "",
      "subtitle": "“Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antara kamu rasa kasih dan sayang.” (QS. Ar-Rum: 21)"
    }
  },

  // Event details used in big cloud (Section 4)
  eventCloud: {
    holyMatrimony: {
      title: 'Akad',
      dateLabel: 'Sabtu, 27 Desember 2025',
      timeLabel: '08.00 WIB - Selesai',
      venueName: 'Masjid Agung Al Mabrur Kabupaten Semarang',
      venueAddress:
        'Jl. Ahmad Yani, Desa Sidomulyo,\nKec. Ungaran Timur, Kab. Semarang, Jawa Tengah',
      mapsUrl: 'https://maps.app.goo.gl/qw7nVXBNJmSaTbN86',
      mapsLabel: 'Google Maps',
    },
    reception: {
      title: 'Resepsi',
      dateLabel: 'Sabtu, 27 Desember 2025',
      timeLabel: '12.00 WIB - Selesai',
      venueName: 'Masjid Agung Al Mabrur Kabupaten Semarang',
      venueAddress:
        'Jl. Ahmad Yani, Desa Sidomulyo,\nKec. Ungaran Timur, Kab. Semarang, Jawa Tengah',
      mapsUrl: 'https://maps.app.goo.gl/qw7nVXBNJmSaTbN86',
      mapsLabel: 'Google Maps',
    },
    streaming: {
      description:
        'For guests who are unable to attend, you can watch the event\nthrough the link below.',
      url: 'https://youtube.com',
      buttonLabel: 'Live Streaming',
    },
  },

  // Love Story section content
  loveStory: {
    mainTitle: 'Our Love Story',
    backgroundImage: 'https://media.kirimkata.com/poppy_fadli-foto1.jpeg',
    overlayOpacity: 0.6,
    blocks: [
      {
        title: 'The Beginning',
        body:
          "Our story began like a quiet song unexpected yet comforting. We met at just the right time, when life was still figuring itself out. What started as casual conversations turned into deep connections, shared dreams, and a sense of home in each other's presence.",
      },
      {
        title: 'Growing Love',
        body:
          "As time passed, we grew not just as individuals, but as a team. We've celebrated wins, braved challenges, and found countless reasons to laugh along the way.",
      },
      {
        title: 'A Promise for Forever',
        body:
          "Now, with joyful hearts and hopeful eyes, we're stepping into the next chapter. This wedding isn't just a celebration of a day it's a celebration of a journey, a promise, and the love we're lucky enough to call our own.",
      },
      {
        title: 'Last but not least',
        body:
          "We're so grateful for you being a part of our lives. We hope you'll join us in celebrating this special day with us.",
      },
    ],
  },

  // Gallery section content
  gallery: {
    mainTitle: 'Our Moments',
    backgroundColor: '#d7d1c6',
    middleImages: [
      {
        src: 'https://media.kirimkata.com/poppy_fadli-foto1.jpeg',
        alt: 'Middle moment 1',
      },
      {
        src: 'https://media.kirimkata.com/poppy_fadli-foto4.jpeg',
        alt: 'Middle moment 2',
      },
      {
        src: 'https://media.kirimkata.com/poppy_fadli-foto3.jpeg',
        alt: 'Middle moment 3',
      },
      {
        src: 'https://media.kirimkata.com/poppy_fadli-foto2.jpeg',
        alt: 'Middle moment 4',
      },
      {
        src: 'https://media.kirimkata.com/poppy_fadli-foto5.jpeg',
        alt: 'Middle moment 5',
      },
      {
        src: 'https://media.kirimkata.com/poppy_fadli-foto6.jpeg',
        alt: 'Middle moment 6',
      },
    ],

    youtubeEmbedUrl: 'https://www.youtube.com/embed/VIDEO_ID',
    showYoutube: false,
  },

  // Wedding Gift section content
  weddingGift: {
    title: 'Wedding Gift',
    subtitle:
      "We're so grateful for your love and support any gift you share means the world to us.",
    buttonLabel: 'Kirim Hadiah',
    giftImageSrc: '/gift_box.png',
    backgroundOverlayOpacity: 0.55,
    bankAccounts: [
      {
        templateId: 'mandiri' as const,
        accountNumber: '1360016477744',
        accountName: 'Poppy Senorita Setyowati',
      },
      {
        templateId: 'bca' as const,
        accountNumber: '5465071670',
        accountName: 'Fadli Perdana',
      },
    ],
    physicalGift: {
      recipientName: 'Fadli Perdana',
      phone: '0812341234',
      addressLines: ['Tebet Timur Dalam IX E No 19'],
    },
  },

  // Background music configuration
  backgroundMusic: {
    src: 'https://media.kirimkata.com/ladygaga-closetoyou.mp3',
    title: 'Close To You',
    artist: 'Lady Gaga',
    loop: false,
    registerAsBackgroundAudio: true,
  },

  // Closing section content
  closing: {
    backgroundColor: '#d7d1c6',
    photoSrc: 'https://media.kirimkata.com/poppy_fadli-foto1.jpeg',
    photoAlt: 'Closing portrait',
    namesScript: 'Poppy & Fadli',
    messageLines: [
      "We can\u2019t wait to share this special moment with you.",
      'Your presence will make our day even more meaningful.',
    ],
  },
} as const;

export type MasterMockTest2 = typeof masterMockTest2;
