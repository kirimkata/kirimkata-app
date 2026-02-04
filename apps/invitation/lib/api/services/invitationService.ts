/**
 * API Services for Invitation Data
 * High-level service functions that call API endpoints and transform data
 */

import { InvitationAPI } from '@/lib/api/client';
import {
    snakeToCamel,
    type RegistrationData,
    type LoveStoryData,
    type GalleryData,
    type WeddingGiftData,
    type ClosingData,
    type MusicData,
    type ThemeData,
    type GreetingsData,
} from '@/lib/api/transformers';

/**
 * Get wedding registration data by slug
 */
export async function getRegistrationBySlug(slug: string): Promise<RegistrationData | null> {
    try {
        const response = await InvitationAPI.getRegistration(slug);

        if (!response.success || !response.data) {
            return null;
        }

        return snakeToCamel<RegistrationData>(response.data);
    } catch (error) {
        console.error('Error fetching registration:', error);
        return null;
    }
}

/**
 * Get love story data
 */
export async function getLoveStory(slug: string): Promise<LoveStoryData | null> {
    try {
        const response = await InvitationAPI.getLoveStory(slug);

        if (!response.success || !response.data) {
            return { settings: {}, blocks: [] };
        }

        return snakeToCamel<LoveStoryData>(response.data);
    } catch (error) {
        console.error('Error fetching love story:', error);
        return { settings: {}, blocks: [] };
    }
}

/**
 * Get gallery data
 */
export async function getGallery(slug: string): Promise<GalleryData | null> {
    try {
        const response = await InvitationAPI.getGallery(slug);

        if (!response.success || !response.data) {
            return { settings: {} };
        }

        return snakeToCamel<GalleryData>(response.data);
    } catch (error) {
        console.error('Error fetching gallery:', error);
        return { settings: {} };
    }
}

/**
 * Get wedding gift data
 */
export async function getWeddingGift(slug: string): Promise<WeddingGiftData | null> {
    try {
        const response = await InvitationAPI.getWeddingGift(slug);

        if (!response.success || !response.data) {
            return { settings: {}, bankAccounts: [] };
        }

        return snakeToCamel<WeddingGiftData>(response.data);
    } catch (error) {
        console.error('Error fetching wedding gift:', error);
        return { settings: {}, bankAccounts: [] };
    }
}

/**
 * Get closing section data
 */
export async function getClosing(slug: string): Promise<ClosingData | null> {
    try {
        const response = await InvitationAPI.getClosing(slug);

        if (!response.success || !response.data) {
            return { settings: {} };
        }

        return snakeToCamel<ClosingData>(response.data);
    } catch (error) {
        console.error('Error fetching closing:', error);
        return { settings: {} };
    }
}

/**
 * Get background music data
 */
export async function getMusic(slug: string): Promise<MusicData | null> {
    try {
        const response = await InvitationAPI.getMusic(slug);

        if (!response.success || !response.data) {
            return { settings: {} };
        }

        return snakeToCamel<MusicData>(response.data);
    } catch (error) {
        console.error('Error fetching music:', error);
        return { settings: {} };
    }
}

/**
 * Get theme settings
 */
export async function getTheme(slug: string): Promise<ThemeData | null> {
    try {
        const response = await InvitationAPI.getTheme(slug);

        if (!response.success || !response.data) {
            return { settings: {} };
        }

        return snakeToCamel<ThemeData>(response.data);
    } catch (error) {
        console.error('Error fetching theme:', error);
        return { settings: {} };
    }
}

/**
 * Get greeting sections
 */
export async function getGreetings(slug: string): Promise<GreetingsData | null> {
    try {
        const response = await InvitationAPI.getGreetings(slug);

        if (!response.success || !response.data) {
            return { greetings: [] };
        }

        return snakeToCamel<GreetingsData>(response.data);
    } catch (error) {
        console.error('Error fetching greetings:', error);
        return { greetings: [] };
    }
}

/**
 * Fetch all invitation data in parallel
 */
export async function fetchAllInvitationData(slug: string) {
    const [
        registration,
        loveStory,
        gallery,
        weddingGift,
        closing,
        music,
        theme,
        greetings,
    ] = await Promise.all([
        getRegistrationBySlug(slug),
        getLoveStory(slug),
        getGallery(slug),
        getWeddingGift(slug),
        getClosing(slug),
        getMusic(slug),
        getTheme(slug),
        getGreetings(slug),
    ]);

    return {
        registration,
        loveStory,
        gallery,
        weddingGift,
        closing,
        music,
        theme,
        greetings,
    };
}
