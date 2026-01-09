/**
 * Centralized Font Bank
 * 
 * This module provides a centralized registry of all available fonts
 * that can be used across all invitation themes.
 */

export interface FontConfig {
    name: string;           // Display name of the font
    src: string;            // Path relative to /public
    family: string;         // CSS font-family name
    weight?: string | number; // Font weight
    style?: string;         // Font style (normal, italic)
}

/**
 * Font Bank Registry
 * All available fonts from /public folder
 */
export const fontBank: Record<string, FontConfig> = {
    // Serif Fonts
    ebGaramond: {
        name: 'EB Garamond',
        src: '/ebgaramond.woff2',
        family: 'EB Garamond',
        weight: 400,
    },
    cormorant: {
        name: 'Cormorant',
        src: '/cormorant.woff2',
        family: 'Cormorant',
        weight: 400,
    },
    cormorant2: {
        name: 'Cormorant Alternate',
        src: '/cormorant2.woff2',
        family: 'Cormorant',
        weight: 400,
    },
    belgianoSerif: {
        name: 'Belgiano Serif',
        src: '/8543Belgiano-Serif.woff2',
        family: 'Belgiano-Serif',
        weight: 400,
    },
    bitter: {
        name: 'Bitter',
        src: '/bitter.woff2',
        family: 'Bitter',
        weight: 400,
    },
    rasa: {
        name: 'Rasa',
        src: '/rasa.woff2',
        family: 'Rasa',
        weight: 400,
    },

    // Script/Decorative Fonts
    satisfy: {
        name: 'Satisfy',
        src: '/3203Satisfy.woff2',
        family: 'Satisfy',
        weight: 400,
    },
    kuinta: {
        name: 'Kuinta',
        src: '/4398KUINCA.woff2',
        family: 'KUINCA',
        weight: 400,
    },
    bohemeFloral: {
        name: 'Boheme Floral',
        src: '/BohemeFloral-Webfont.woff2',
        family: 'BohemeFloral',
        weight: 400,
    },
    ganthe: {
        name: 'Ganthe',
        src: '/Ganthe.ttf',
        family: 'Ganthe',
        weight: 400,
    },
    margharita: {
        name: 'Margharita',
        src: '/Margharita.ttf',
        family: 'Margharita',
        weight: 400,
        style: 'normal',
    },
    margharitaItalic: {
        name: 'Margharita Italic',
        src: '/Margharita-Italic.ttf',
        family: 'Margharita',
        weight: 400,
        style: 'italic',
    },

    // Cultural/Traditional Fonts
    gethukJawa: {
        name: 'Gethuk Jawa',
        src: '/Gethuk Jawa.otf',
        family: 'Gethuk Jawa',
        weight: 400,
    },
    jawaPalsu: {
        name: 'Jawa Palsu',
        src: '/JAWAPALSU.TTF',
        family: 'Jawa Palsu',
        weight: 400,
    },

    // Sans-serif Fonts
    louisGeorgeCafe: {
        name: 'Louis George Cafe',
        src: '/Louis-George-Cafe-Webfont.woff2',
        family: 'Louis-George-Cafe',
        weight: 400,
    },
    pretendard: {
        name: 'Pretendard',
        src: '/Pretendard-Regular.otf',
        family: 'Pretendard',
        weight: 400,
    },
    segoeUI: {
        name: 'Segoe UI',
        src: '/SegoeUI.ttf',
        family: 'Segoe UI',
        weight: 400,
    },
    segoeUILight: {
        name: 'Segoe UI Light',
        src: '/SegoeUILight.ttf',
        family: 'Segoe UI',
        weight: 300,
    },
    segoeUISemilight: {
        name: 'Segoe UI Semilight',
        src: '/SegoeUISemilight.ttf',
        family: 'Segoe UI',
        weight: 350,
    },
    segoeUISemibold: {
        name: 'Segoe UI Semibold',
        src: '/SegoeUISemibold.ttf',
        family: 'Segoe UI',
        weight: 600,
    },
    segoeUIBold: {
        name: 'Segoe UI Bold',
        src: '/SegoeUIBold.ttf',
        family: 'Segoe UI',
        weight: 700,
    },
    segoeUIBlack: {
        name: 'Segoe UI Black',
        src: '/SegoeUIBlack.ttf',
        family: 'Segoe UI',
        weight: 900,
    },
};

/**
 * Font key type for type-safe font selection
 */
export type FontKey = keyof typeof fontBank;

/**
 * Get font configuration by key
 */
export function getFontConfig(fontKey: FontKey): FontConfig | null {
    return fontBank[fontKey] || null;
}

/**
 * Get CSS font-family string for a font key
 */
export function getFontFamily(fontKey: FontKey, fallback?: string): string {
    const font = getFontConfig(fontKey);
    if (!font) return fallback || 'system-ui, sans-serif';

    const baseFallback = fallback || 'system-ui, sans-serif';
    return `'${font.family}', ${baseFallback}`;
}

/**
 * Generate @font-face CSS declaration for a font
 */
export function generateFontFace(fontKey: FontKey): string {
    const font = getFontConfig(fontKey);
    if (!font) return '';

    return `
@font-face {
  font-family: '${font.family}';
  src: url('${font.src}') format('woff2');
  font-weight: ${font.weight || 400};
  font-style: ${font.style || 'normal'};
  font-display: swap;
}`.trim();
}

/**
 * Generate multiple @font-face declarations
 */
export function generateFontFaces(fontKeys: FontKey[]): string {
    return fontKeys
        .map(key => generateFontFace(key))
        .filter(Boolean)
        .join('\n\n');
}

/**
 * Get inline style object for a font
 */
export function getFontStyle(
    fontKey: FontKey,
    options?: {
        fontSize?: string;
        fontWeight?: string | number;
        lineHeight?: string | number;
        letterSpacing?: string;
        textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
        color?: string;
    }
): React.CSSProperties {
    const font = getFontConfig(fontKey);
    const style: React.CSSProperties = {};

    if (font) {
        style.fontFamily = `'${font.family}', system-ui, sans-serif`;
        style.fontWeight = font.weight || 400;
        style.fontStyle = font.style || 'normal';
    }

    if (options) {
        if (options.fontSize) style.fontSize = options.fontSize;
        if (options.fontWeight) style.fontWeight = options.fontWeight;
        if (options.lineHeight) style.lineHeight = options.lineHeight;
        if (options.letterSpacing) style.letterSpacing = options.letterSpacing;
        if (options.textTransform) style.textTransform = options.textTransform;
        if (options.color) style.color = options.color;
    }

    return style;
}
