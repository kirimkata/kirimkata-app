/**
 * Text Configuration
 * Centralized generic text defaults for the theme.
 *
 * IMPORTANT: Invitation-specific copy must come from the database.
 * These values act only as neutral placeholders when DB content is missing.
 */

// Bride Configuration
interface BrideConfig {
  name: string;
  fullName: string;
  fatherName: string;
  motherName: string;
  instagram: string;
}

// Groom Configuration
interface GroomConfig {
  name: string;
  fullName: string;
  fatherName: string;
  motherName: string;
  instagram: string;
}

// Wedding Date Configuration
export interface WeddingDateConfig {
  fullDate: string;
  isoDate: string;
}

export interface SaveTheDateConfig {
  /** ISO date string used for countdown target (YYYY-MM-DD) */
  isoDate: string;
  /** Optional ISO date-time string (e.g. 2024-11-14T10:00:00+07:00) */
  countdownDateTime?: string;
  /** Optional calendar event title override */
  eventTitle?: string;
  /** Optional calendar link override */
  calendarLink?: string;
}

// Cloud Text Configuration
export interface CloudText {
  title: string;
  subtitle: string;
  brideText?: string;
  groomText?: string;
}

interface EventCloudSectionDetail {
  title: string;
  dateLabel: string;
  timeLabel: string;
  venueName: string;
  venueAddress: string;
  mapsUrl: string;
  mapsLabel: string;
}

interface EventCloudStreamingDetail {
  description: string;
  url: string;
  buttonLabel: string;
}

export interface EventCloudTextConfig {
  holyMatrimony: EventCloudSectionDetail;
  reception: EventCloudSectionDetail;
  streaming: EventCloudStreamingDetail;
}

// Default generic configurations (NOT client-specific)
const BRIDE_CONFIG: BrideConfig = {
  name: '[BRIDE_NAME]',
  fullName: '[BRIDE_FULL_NAME]',
  fatherName: '[BRIDE_FATHER_NAME]',
  motherName: '[BRIDE_MOTHER_NAME]',
  instagram: 'bride_instagram',
};

const GROOM_CONFIG: GroomConfig = {
  name: '[GROOM_NAME]',
  fullName: '[GROOM_FULL_NAME]',
  fatherName: '[GROOM_FATHER_NAME]',
  motherName: '[GROOM_MOTHER_NAME]',
  instagram: 'groom_instagram',
};

export const weddingDateConfig: WeddingDateConfig = {
  fullDate: '[WEDDING_DATE]',
  // Use a fixed, neutral ISO date so countdown logic still works, but clearly wrong
  isoDate: '1970-01-01',
};

export const saveTheDateConfig: SaveTheDateConfig = {
  isoDate: weddingDateConfig.isoDate,
  countdownDateTime: undefined,
  eventTitle: '[EVENT_TITLE]',
  calendarLink: undefined,
};

// Cloud texts for different sections (keys like section0, section4, etc.)
// Keep empty; getCloudText will fall back to a generic welcome message.
const CLOUD_TEXTS: Record<string, CloudText> = {};

const EVENT_CLOUD_TEXT: EventCloudTextConfig = {
  holyMatrimony: {
    title: '[CEREMONY_TITLE]',
    dateLabel: '[CEREMONY_DATE]',
    timeLabel: '[CEREMONY_TIME]',
    venueName: '[CEREMONY_VENUE]',
    venueAddress: '[CEREMONY_ADDRESS]',
    mapsUrl: '#',
    mapsLabel: 'Maps',
  },
  reception: {
    title: '[RECEPTION_TITLE]',
    dateLabel: '[RECEPTION_DATE]',
    timeLabel: '[RECEPTION_TIME]',
    venueName: '[RECEPTION_VENUE]',
    venueAddress: '[RECEPTION_ADDRESS]',
    mapsUrl: '#',
    mapsLabel: 'Maps',
  },
  streaming: {
    description: '[STREAMING_DESCRIPTION]',
    url: '#',
    buttonLabel: 'Live Streaming',
  },
};

/**
 * Get bride configuration
 */
export function getBrideConfig(): BrideConfig {
  return BRIDE_CONFIG;
}

/**
 * Get groom configuration
 */
export function getGroomConfig(): GroomConfig {
  return GROOM_CONFIG;
}

/**
 * Get wedding date configuration
 */
export function getWeddingDateConfig(): WeddingDateConfig {
  return weddingDateConfig;
}

export function getSaveTheDateConfig(): SaveTheDateConfig {
  return saveTheDateConfig;
}

/**
 * Get cloud text for section
 * @param section - Section key (section0, section1, section3, etc.)
 */
export function getCloudText(section: string): CloudText {
  return CLOUD_TEXTS[section] || {
    title: 'Welcome',
    subtitle: 'To Our Wedding',
  };
}

export function getEventCloudText(): EventCloudTextConfig {
  return EVENT_CLOUD_TEXT;
}

/**
 * Get cloud text for section 4 (specific function used in CoupleFullSection4)
 */
export function getCloudTextSection4(type: 'oldCloud' | 'newCloud'): CloudText {
  if (type === 'oldCloud') {
    return {
      title: 'Thank You',
      subtitle: 'For Your Presence',
    };
  }
  return {
    title: 'See You',
    subtitle: 'At The Wedding',
  };
}

export interface ThemeTextConfigSnapshot {
  bride: BrideConfig;
  groom: GroomConfig;
  weddingDate: WeddingDateConfig;
  saveTheDate: SaveTheDateConfig;
  cloudTexts: Record<string, CloudText>;
  eventCloud: EventCloudTextConfig;
}

export function getThemeTextConfig(): ThemeTextConfigSnapshot {
  return {
    bride: getBrideConfig(),
    groom: getGroomConfig(),
    weddingDate: getWeddingDateConfig(),
    saveTheDate: getSaveTheDateConfig(),
    cloudTexts: CLOUD_TEXTS,
    eventCloud: getEventCloudText(),
  };
}

