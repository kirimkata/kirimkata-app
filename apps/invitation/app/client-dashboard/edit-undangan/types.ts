// Shared types for invitation editor
export interface BrideGroomData {
    bride: PersonData;
    groom: PersonData;
}

export interface PersonData {
    name: string;
    fullName: string;
    fatherName: string;
    motherName: string;
    instagram: string;
}

export interface EventData {
    fullDateLabel: string;
    isoDate: string;
    countdownDateTime: string;
    holyMatrimony: EventDetails;
    reception: EventDetails;
}

export interface EventDetails {
    title: string;
    dateLabel: string;
    timeLabel: string;
    venueName: string;
    venueAddress: string;
    mapsUrl: string;
}

export interface LoveStoryData {
    mainTitle: string;
    blocks: LoveStoryBlock[];
}

export interface LoveStoryBlock {
    title: string;
    body: string;
}

export interface GalleryData {
    mainTitle: string;
    middleImages: GalleryImage[];
    youtubeEmbedUrl?: string;
    showYoutube: boolean;
}

export interface GalleryImage {
    src: string;
    alt: string;
}

export interface WeddingGiftData {
    title: string;
    subtitle: string;
    buttonLabel: string;
    bankAccounts: BankAccount[];
    physicalGift: PhysicalGift;
}

export interface BankAccount {
    templateId: string;
    accountNumber: string;
    accountName: string;
}

export interface PhysicalGift {
    recipientName: string;
    phone: string;
    addressLines: string[];
}

export interface BackgroundMusicData {
    src: string;
    title: string;
    artist: string;
}

export interface ClosingData {
    photoSrc: string;
    namesScript: string;
    messageLines: string[];
}

export interface InvitationFormData {
    bride: PersonData;
    groom: PersonData;
    event: EventData;
    loveStory: LoveStoryData;
    gallery: GalleryData;
    weddingGift: WeddingGiftData;
    backgroundMusic: BackgroundMusicData;
    closing: ClosingData;
}
