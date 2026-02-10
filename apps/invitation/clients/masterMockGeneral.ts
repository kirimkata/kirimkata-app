// Centralized general mock config for invitations
// Used as fallback when DB content is missing or when a slug is configured
// to use mock content instead of the database.

export const masterMockGeneral = {
  clientProfile: {
    slug: 'general',
    coupleNames: 'Bride & Groom',
    weddingDateLabel: '[WEDDING_DATE]',
    locationLabel: '[LOCATION]',
    shortDescription:
      'Contoh teks undangan umum. Pastikan data di database sudah diisi untuk pasangan yang sebenarnya.',
    coverImage: '/cover_fadli.jpg',
    shareImage: '/cover_fadli.jpg',
    metaTitle: 'Wedding Invitation',
    metaDescription:
      'General wedding invitation preview. Please configure content in the database.',
    loadingDesign: 'general' as const, // 'general' or 'custom1'
  },

  // High level summary (not currently used by the theme, kept for completeness)
  invitationSummary: {
    clientNames: 'Bride & Groom',
    eventDateLabel: '[WEDDING_DATE]',
    locationLabel: '[LOCATION]',
    heroImage: '/cover_fadli.jpg',
    galleryImages: ['/cover_fadli.jpg'],
    additionalNotes:
      'General mock content. This usually means DB content is missing or not configured.',
  },

  // Bride & Groom detail
  bride: {
    name: 'Bride',
    fullName: 'Bride Full Name',
    fatherName: 'Nama Ayah Mempelai Wanita',
    motherName: 'Nama Ibu Mempelai Wanita',
    instagram: 'bride_instagram',
  },

  groom: {
    name: 'Groom',
    fullName: 'Groom Full Name',
    fatherName: 'Nama Ayah Mempelai Pria',
    motherName: 'Nama Ibu Mempelai Pria',
    instagram: 'groom_instagram',
  },

  // Main wedding date & save-the-date
  event: {
    fullDateLabel: '[HARI, TANGGAL BULAN TAHUN]',
    isoDate: '1970-01-01',
    countdownDateTime: '1970-01-01T00:00:00+07:00',
    eventTitle: 'The Wedding of Bride & Groom',
    calendarLink: undefined as string | undefined,
  },

  // Cloud texts used across animation sections
  clouds: {
    section0: {
      title: '',
      subtitle:
        'Tanpa mengurangi rasa hormat, kami mengundang\nAnda untuk menghadiri acara pernikahan kami.',
      brideText: 'Bride',
      groomText: 'Groom',
    },
    section4: {
      title: '',
      subtitle:
        'Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya. (QS. Ar-Rum: 21)',
    },
  },

  // Event details used in big cloud (Section 4)
  eventDetails: {
    holyMatrimony: {
      title: 'Akad',
      dateLabel: '[TANGGAL ACARA]',
      timeLabel: '[JAM ACARA]',
      venueName: '[NAMA TEMPAT ACARA]',
      venueAddress: '[ALAMAT LENGKAP TEMPAT ACARA]',
      mapsUrl: 'https://maps.app.goo.gl/',
      mapsLabel: 'Google Maps',
    },
    reception: {
      title: 'Resepsi',
      dateLabel: '[TANGGAL ACARA]',
      timeLabel: '[JAM ACARA]',
      venueName: '[NAMA TEMPAT ACARA]',
      venueAddress: '[ALAMAT LENGKAP TEMPAT ACARA]',
      mapsUrl: 'https://maps.app.goo.gl/',
      mapsLabel: 'Google Maps',
    },
    streaming: {
      description:
        'Untuk tamu yang berhalangan hadir, dapat menyaksikan acara melalui tautan berikut.',
      url: 'https://youtube.com',
      buttonLabel: 'Live Streaming',
    },
  },

  // Love Story section content
  loveStory: {
    mainTitle: 'Our Love Story',
    backgroundImage: '/foto1.jpeg',
    overlayOpacity: 0.6,
    blocks: [
      {
        title: 'Babak Awal',
        body:
          'Contoh teks cerita cinta. Silakan isi konten sebenarnya di database.',
      },
    ],
  },

  // Gallery section content
  gallery: {
    mainTitle: 'Our Moments',
    backgroundColor: '#d7d1c6',
    topRowImages: [
      { src: '/pengantin_fadli.png', alt: 'Top left moment' },
      { src: '/pengantin_fadli.png', alt: 'Top center moment' },
      { src: '/pengantin_fadli.png', alt: 'Top right moment' },
    ],
    middleImages: [],
    bottomGridImages: [],
    youtubeEmbedUrl: undefined,
    showYoutube: false,
  },

  // Wedding Gift section content
  weddingGift: {
    title: 'Wedding Gift',
    subtitle:
      'Kehadiran Anda sudah cukup menjadi hadiah. Namun bila ingin mengirimkan tanda kasih, silakan gunakan informasi berikut.',
    buttonLabel: 'Kirim Hadiah',
    giftImageSrc: '/gift_box.png',
    backgroundOverlayOpacity: 0.55,
    bankAccounts: [],
    physicalGift: {
      recipientName: 'Bride & Groom',
      phone: '',
      addressLines: ['[ALAMAT PENERIMA HADIAH]'],
    },
  },

  // Background music configuration
  backgroundMusic: {
    src: 'https://media.kirimkata.com/ladygaga-closetoyou.mp3',
    title: 'Close To You',
    artist: 'Lady Gaga',
    loop: true,
    registerAsBackgroundAudio: true,
  },

  // Closing section content
  closing: {
    backgroundColor: '#d7d1c6',
    photoSrc: '/foto1.jpeg',
    photoAlt: 'Closing portrait',
    namesScript: 'Bride & Groom',
    messageLines: [
      'Terima kasih atas perhatian, doa, dan restu Anda.',
      'Semoga Allah SWT senantiasa memberkahi kita semua.',
    ],
  },
} as const;

export type MasterMockGeneral = typeof masterMockGeneral;
