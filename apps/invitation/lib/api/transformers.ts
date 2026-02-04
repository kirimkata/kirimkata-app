/**
 * Data Transformers
 * Convert between snake_case (API) and camelCase (Frontend)
 */

type CamelCase<S extends string> = S extends `${infer P1}_${infer P2}${infer P3}`
    ? `${Lowercase<P1>}${Uppercase<P2>}${CamelCase<P3>}`
    : Lowercase<S>;

type SnakeCase<S extends string> = S extends `${infer T}${infer U}`
    ? `${T extends Capitalize<T> ? '_' : ''}${Lowercase<T>}${SnakeCase<U>}`
    : S;

/**
 * Convert snake_case object keys to camelCase
 */
export function snakeToCamel<T = any>(obj: any): T {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => snakeToCamel(item)) as any;
    }

    if (typeof obj === 'object' && obj.constructor === Object) {
        const result: any = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
                result[camelKey] = snakeToCamel(obj[key]);
            }
        }
        return result;
    }

    return obj;
}

/**
 * Convert camelCase object keys to snake_case
 */
export function camelToSnake<T = any>(obj: any): T {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => camelToSnake(item)) as any;
    }

    if (typeof obj === 'object' && obj.constructor === Object) {
        const result: any = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
                result[snakeKey] = camelToSnake(obj[key]);
            }
        }
        return result;
    }

    return obj;
}

// Type definitions for API responses
export interface RegistrationData {
    id: string;
    clientId: string;
    slug: string;
    eventType: string;
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
    event1Time: string;
    event1EndTime?: string;
    event1VenueName?: string;
    event1VenueAddress?: string;
    event1VenueCity?: string;
    event1VenueProvince?: string;
    event1MapsUrl?: string;
    event2Date?: string;
    event2Time?: string;
    event2EndTime?: string;
    event2VenueName?: string;
    event2VenueAddress?: string;
    event2VenueCity?: string;
    event2VenueProvince?: string;
    event2MapsUrl?: string;
    timezone: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface LoveStoryBlock {
    id?: string;
    blockTitle: string;
    blockBody: string;
    storyDate?: string;
    displayOrder: number;
}

export interface LoveStoryData {
    settings: {
        mainTitle?: string;
        backgroundImageUrl?: string;
        overlayOpacity?: number;
    };
    blocks: LoveStoryBlock[];
}

export interface GalleryData {
    settings: {
        mainTitle?: string;
        backgroundColor?: string;
        showYoutube?: boolean;
        youtubeEmbedUrl?: string;
        imageUrls?: string[];
    };
}

export interface WeddingGiftBankAccount {
    id?: string;
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    displayOrder: number;
}

export interface WeddingGiftData {
    settings: {
        title?: string;
        subtitle?: string;
        buttonLabel?: string;
        giftImageUrl?: string;
        backgroundOverlayOpacity?: number;
    };
    bankAccounts: WeddingGiftBankAccount[];
}

export interface ClosingData {
    settings: {
        backgroundColor?: string;
        photoUrl?: string;
        namesDisplay?: string;
        messageLine1?: string;
        messageLine2?: string;
    };
}

export interface MusicData {
    settings: {
        mediaId?: number;
        title?: string;
        artist?: string;
        loopEnabled?: boolean;
        musicUrl?: string;
    };
}

export interface ThemeData {
    settings: {
        themeKey?: string;
        customImages?: Record<string, any>;
    };
}

export interface GreetingSection {
    id?: string;
    sectionKey: string;
    displayOrder: number;
    title?: string;
    subtitle?: string;
    showBrideName?: boolean;
    showGroomName?: boolean;
}

export interface GreetingsData {
    greetings: GreetingSection[];
}
