export interface FontConfig {
  name: string; // Nama font untuk display
  src: string; // Path relatif dari /public
  family?: string; // Font family name jika berbeda
  weight?: string | number; // Default weight
}

export const fontBank: Record<string, FontConfig> = {
  satisfy: {
    name: 'Satisfy',
    src: '/3203Satisfy.woff2',
    family: 'Satisfy',
  },
  kuinta: {
    name: 'Kuinta',
    src: '/4398KUINCA.woff2',
    family: 'KUINCA',
  },
  belgianoSerif: {
    name: 'Belgiano Serif',
    src: '/8543Belgiano-Serif.woff2',
    family: 'Belgiano-Serif',
  },
  bohemeFloral: {
    name: 'Boheme Floral',
    src: '/BohemeFloral-Webfont.woff2',
    family: 'BohemeFloral',
  },
  ganthe: {
    name: 'Ganthe',
    src: '/Ganthe.ttf',
    family: 'Ganthe',
  },
  gethukJawa: {
    name: 'Gethuk Jawa',
    src: '/Gethuk Jawa.otf',
    family: 'Gethuk Jawa',
  },
  jawaPalsu: {
    name: 'Jawa Palsu',
    src: '/JAWAPALSU.TTF',
    family: 'Jawa Palsu',
  },
  louisGeorgeCafe: {
    name: 'Louis George Cafe',
    src: '/Louis-George-Cafe-Webfont.woff2',
    family: 'Louis-George-Cafe',
  },
  margharita: {
    name: 'Margharita',
    src: '/Margharita.ttf',
    family: 'Margharita',
  },
  margharitaItalic: {
    name: 'Margharita Italic',
    src: '/Margharita-Italic.ttf',
    family: 'Margharita',
    weight: 'italic',
  },
  cormorant: {
    name: 'Cormorant',
    src: '/cormorant.woff2',
    family: 'Cormorant',
  },
  cormorantAlternate: {
    name: 'Cormorant Alternate',
    src: '/cormorant2.woff2',
    family: 'Cormorant',
  },
  segoeUI: {
    name: 'Segoe UI',
    src: '/SegoeUI.ttf',
    family:
      '"Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI Emoji", "Segoe UI Symbol", sans-serif',
  },
  pretendard: {
    name: 'Pretendard',
    src: '/Pretendard-Regular.otf',
    family: 'Pretendard',
  },
  systemSans: {
    name: 'System UI Sans',
    src: '',
    family: 'system-ui',
  },
};

export function getFontConfig(fontKey: string): FontConfig | null {
  return fontBank[fontKey] || null;
}

export function getFontStyle(fontKey: string): React.CSSProperties {
  const font = getFontConfig(fontKey);
  if (!font) return {};

  return {
    fontFamily: font.family || font.name,
    fontWeight: font.weight,
  };
}

export type FontKey = keyof typeof fontBank;

export interface TypographyStyleConfig {
  fontKey: FontKey;
  fontSize?: string;
  lineHeight?: string | number;
  letterSpacing?: string;
  fontWeight?: string | number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  color?: string;
}

export interface SectionTypographyConfig {
  title: TypographyStyleConfig;
  subtitle?: TypographyStyleConfig;
  body?: TypographyStyleConfig;
  coverInfo?: TypographyStyleConfig;  // Group 1: Wedding info (The Wedding Of + Names + Date)
  guestInfo?: TypographyStyleConfig;  // Group 2: Guest invitation (Kepada Yth + Guest + Invitation text)
  guestName?: TypographyStyleConfig;
  theWeddingOf?: TypographyStyleConfig;
  brideGroom?: TypographyStyleConfig;
  button?: TypographyStyleConfig;
  giftButton?: TypographyStyleConfig;
  cardText?: TypographyStyleConfig;
  cardButton?: TypographyStyleConfig;
}

export interface InvitationTypographyConfig {
  animation: {
    section0: SectionTypographyConfig;
    section1: SectionTypographyConfig;
    section2: SectionTypographyConfig;
    section3: SectionTypographyConfig;
    section4: SectionTypographyConfig;
    section5: SectionTypographyConfig;
    section6: SectionTypographyConfig;
  };
  scrollable: {
    saveTheDate: SectionTypographyConfig;
    loveStory: SectionTypographyConfig;
    gallery: SectionTypographyConfig;
    weddingGift: SectionTypographyConfig;
    wishes: SectionTypographyConfig;
    rsvp: SectionTypographyConfig;
    closing: SectionTypographyConfig;
    footer: SectionTypographyConfig;
  };
}

export const typographyConfig: InvitationTypographyConfig = {
  animation: {
    section0: {
      title: {
        fontKey: 'pretendard',
        fontSize: '34px',
        letterSpacing: '0em',
        lineHeight: 1.6,
        textTransform: 'uppercase',
        color: '#1f2937', // dark name text
      },
      subtitle: {
        fontKey: 'pretendard',
        fontSize: '18px',
        lineHeight: 1.6,
        color: '#1f2937', // smaller gray text
      },
      // Group 1: Wedding Information (16px) - "The Wedding Of" + Names + Date
      coverInfo: {
        fontKey: 'pretendard',
        fontSize: '16px',
        lineHeight: 1.6,
        color: '#4b5563',
      },
      // Group 2: Guest Invitation (12px) - "Kepada Yth" + Guest Name + Invitation Text
      guestInfo: {
        fontKey: 'pretendard',
        fontSize: '12px',
        lineHeight: 1.2,
        color: '#4b5563',
      },
      body: {
        fontKey: 'pretendard',
        fontSize: '14px',
        lineHeight: 1.6,
        color: '#374151',
      },
    },
    section1: {
      title: {
        fontKey: 'pretendard',
        fontSize: '40px',
        // letterSpacing: '0.08em',
        lineHeight: 1.6,
        color: '#ffffff',
      },
      subtitle: {
        fontKey: 'pretendard',
        fontSize: '22px',
        lineHeight: 1.6,
        color: '#ffffff',
      },
      body: {
        fontKey: 'pretendard',
        fontSize: '14px',
        lineHeight: 1.6,
        color: '#374151',
      },
      theWeddingOf: {
        fontKey: 'pretendard',
        fontSize: '14px',
        lineHeight: 1,
        color: '#ffffff',
      },
      brideGroom: {
        fontKey: 'pretendard',
        fontSize: '32px',
        letterSpacing: '0.08em',
        lineHeight: 1.6,
        color: '#ffffff',
      },
    },
    section2: {
      title: {
        fontKey: 'pretendard',
        fontSize: '32px',
        letterSpacing: '0.08em',
        lineHeight: 1.6,
        color: '#ffffff',
      },
      subtitle: {
        fontKey: 'pretendard',
        fontSize: '14px',
        lineHeight: 1.6,
        color: '#ffffff',
      },
      body: {
        fontKey: 'pretendard',
        fontSize: '14px',
        lineHeight: 1.6,
        color: '#ffffff',
      },
    },
    section3: {
      title: {
        fontKey: 'pretendard',
        fontSize: '32px',
        letterSpacing: '0.08em',
        color: '#ffffff',
      },
      subtitle: {
        fontKey: 'pretendard',
        fontSize: '14px',
        lineHeight: 1.6,
        color: '#ffffff',
      },
      body: {
        fontKey: 'pretendard',
        fontSize: '14px',
        lineHeight: 1.6,
        color: '#ffffff',
      },
    },
    section4: {
      title: {
        fontKey: 'pretendard',
        fontSize: '32px',
        letterSpacing: '0em',
        color: '#7b5a45',
      },
      subtitle: {
        fontKey: 'pretendard',
        fontSize: '14px',
        lineHeight: 1.6,
        color: '#4b5563',
      },
      body: {
        fontKey: 'pretendard',
        fontSize: '14px',
        lineHeight: 1.6,
        color: '#374151',
      },
    },
    section5: {
      title: {
        fontKey: 'pretendard',
        fontSize: '32px',
        letterSpacing: '0.08em',
        color: '#1f2937',
      },
      subtitle: {
        fontKey: 'pretendard',
        fontSize: '14px',
        lineHeight: 1.6,
        color: '#4b5563',
      },
      body: {
        fontKey: 'pretendard',
        fontSize: '14px',
        lineHeight: 1.6,
        color: '#374151',
      },
    },
    section6: {
      title: {
        fontKey: 'pretendard',
        fontSize: '32px',
        letterSpacing: '0.08em',
        color: '#1f2937',
      },
      subtitle: {
        fontKey: 'pretendard',
        fontSize: '14px',
        lineHeight: 1.6,
        color: '#4b5563',
      },
      body: {
        fontKey: 'pretendard',
        fontSize: '14px',
        lineHeight: 1.6,
        color: '#374151',
      },
    },
  },
  scrollable: {
    saveTheDate: {
      title: {
        fontKey: 'pretendard',
        fontSize: '2.3rem',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: '#ffffff',
      },
      subtitle: {
        fontKey: 'pretendard',
        fontSize: '14px',
        lineHeight: 1.6,
        color: 'rgba(255,255,255,0.9)',
      },
      body: {
        fontKey: 'pretendard',
        fontSize: '14px',
        lineHeight: 1.6,
        color: 'rgba(255,255,255,0.9)',
      },
    },
    loveStory: {
      title: {
        fontKey: 'pretendard',
        fontSize: '2.3rem',
        letterSpacing: '0.08em',
        color: '#ffffff',
      },
      subtitle: {
        fontKey: 'pretendard',
        fontSize: '20px',
        lineHeight: 1.6,
        color: 'rgba(255,255,255,0.9)',
      },
      body: {
        fontKey: 'pretendard',
        fontSize: '14px',
        lineHeight: 1.6,
        color: 'rgba(255,255,255,0.9)',
      },
    },
    gallery: {
      title: {
        fontKey: 'pretendard',
        fontSize: '2.3rem',
        letterSpacing: '0.08em',
        color: '#4f4a3f',
      },
      body: {
        fontKey: 'pretendard',
        fontSize: '14px',
        lineHeight: 1.6,
        color: '#e5e7eb',
      },
    },
    weddingGift: {
      title: {
        fontKey: 'pretendard',
        fontSize: '2.3rem',
        letterSpacing: '0.08em',
        color: '#ffffff',
      },
      subtitle: {
        fontKey: 'pretendard',
        fontSize: '14px',
        lineHeight: 1.6,
        color: '#ffffff',
      },
      giftButton: {
        fontKey: 'pretendard',
        fontSize: '12px',
        lineHeight: 1.6,
        letterSpacing: '0.22em',
        fontWeight: 600,
        textTransform: 'uppercase',
        color: '#4a4640',
      },
      cardText: {
        fontKey: 'pretendard',
        fontSize: '14px',
        lineHeight: 1.6,
        color: '#3a4255',
      },
      cardButton: {
        fontKey: 'pretendard',
        fontSize: '12px',
        lineHeight: 1.6,
        letterSpacing: '0.08em',
        fontWeight: 600,
        textTransform: 'uppercase',
        color: '#ffffff',
      },
    },
    wishes: {
      title: {
        fontKey: 'pretendard',
        fontSize: '2.3rem',
        letterSpacing: '0em',
        color: '#4f4a3f',
      },
      subtitle: {
        fontKey: 'pretendard',
        fontSize: '14px',
        lineHeight: 1.6,
        color: '#4f4a3f',
      },
      body: {
        fontKey: 'pretendard',
        fontSize: '14px',
        lineHeight: 1.6,
        color: '#333843',
      },
      guestName: {
        fontKey: 'pretendard',
        fontSize: '14px',
        lineHeight: 1.6,
        fontWeight: 600,
        color: '#4f4a3f',
      },
      button: {
        fontKey: 'pretendard',
        fontSize: '13px',
        lineHeight: 1.6,
        letterSpacing: '0.22em',
        fontWeight: 600,
        textTransform: 'uppercase',
        color: '#ffffff',
      },
    },
    rsvp: {
      title: {
        fontKey: 'pretendard',
        fontSize: '3rem',
        letterSpacing: '0.08em',
        color: '#ffffff',
      },
      body: {
        fontKey: 'pretendard',
        fontSize: '14px',
        lineHeight: 1.6,
        color: '#ffffff',
      },
    },
    closing: {
      title: {
        fontKey: 'pretendard',
        fontSize: '1.8rem',
        letterSpacing: '0em',
        color: '#4f4a3f',
      },
      body: {
        fontKey: 'pretendard',
        fontSize: '14px',
        lineHeight: 1.6,
        color: '#4f4a3f',
      },
    },
    footer: {
      title: {
        fontKey: 'pretendard',
        fontSize: '14px',
        letterSpacing: '0em',
        textTransform: 'none',
        color: '#4f4a3f',
      },
      body: {
        fontKey: 'pretendard',
        fontSize: '12px',
        lineHeight: 1.6,
        color: '#4f4a3f',
      },
    },
  },
};

export function getTypographyStyle(config: TypographyStyleConfig): React.CSSProperties {
  const base = getFontStyle(config.fontKey);
  const style: React.CSSProperties = { ...base };

  if (config.fontSize !== undefined) {
    style.fontSize = config.fontSize;
  }
  if (config.lineHeight !== undefined) {
    style.lineHeight = config.lineHeight;
  }
  if (config.letterSpacing !== undefined) {
    style.letterSpacing = config.letterSpacing;
  }
  if (config.fontWeight !== undefined) {
    style.fontWeight = config.fontWeight;
  }
  if (config.textTransform !== undefined) {
    style.textTransform = config.textTransform;
  }

  if (config.color !== undefined) {
    style.color = config.color;
  }

  return style;
}
