/**
 * API Configuration for Invitation App
 * Centralized configuration for API endpoints
 */

// API Base URL - use environment variable or default to production
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.kirimkata.com';

// For local development, you can set NEXT_PUBLIC_API_URL=http://localhost:8787 in .env.local

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
    // Auth
    auth: {
        clientLogin: `${API_BASE_URL}/v1/auth/client/login`,
        clientVerify: `${API_BASE_URL}/v1/auth/client/verify`,
        staffLogin: `${API_BASE_URL}/v1/auth/staff/login`,
        adminLogin: `${API_BASE_URL}/v1/auth/admin/login`,
    },

    // Client
    client: {
        profile: `${API_BASE_URL}/v1/client/profile`,
        settings: `${API_BASE_URL}/v1/client/settings`,
        template: `${API_BASE_URL}/v1/client/template`,
        invitationContent: `${API_BASE_URL}/v1/client/invitation-content`,
        messages: `${API_BASE_URL}/v1/client/messages`,
    },

    // Media
    media: {
        upload: `${API_BASE_URL}/v1/media/upload`,
        list: `${API_BASE_URL}/v1/media/list`,
        delete: `${API_BASE_URL}/v1/media/delete`,
        quota: `${API_BASE_URL}/v1/media/quota`,
        customImages: `${API_BASE_URL}/v1/media/custom-images`,
    },

    // Guestbook
    guestbook: {
        events: `${API_BASE_URL}/v1/guestbook/events`,
        guestTypes: `${API_BASE_URL}/v1/guestbook/guest-types`,
        guests: `${API_BASE_URL}/v1/guestbook/guests`,
        benefits: `${API_BASE_URL}/v1/guestbook/benefits`,
        seating: `${API_BASE_URL}/v1/guestbook/seating`,
        checkin: `${API_BASE_URL}/v1/guestbook/checkin`,
    },

    // Admin
    admin: {
        clients: `${API_BASE_URL}/v1/admin/clients`,
        invitations: `${API_BASE_URL}/v1/admin/invitations`,
        slugs: `${API_BASE_URL}/v1/admin/slugs`,
        settings: `${API_BASE_URL}/v1/admin/settings`,
    },

    // Shared
    shared: {
        redeem: `${API_BASE_URL}/v1/shared/redeem`,
        seating: `${API_BASE_URL}/v1/shared/seating`,
        staff: `${API_BASE_URL}/v1/shared/staff`,
        guestStats: `${API_BASE_URL}/v1/shared/guests/stats`,
    },

    // Registration
    registration: {
        create: `${API_BASE_URL}/v1/registration`,
        get: (slug: string) => `${API_BASE_URL}/v1/registration/${slug}`,
        update: (slug: string) => `${API_BASE_URL}/v1/registration/${slug}`,
    },

    // Invitations
    invitations: {
        compile: (slug: string) => `${API_BASE_URL}/v1/invitations/${slug}/compile`,
        loveStory: (slug: string) => `${API_BASE_URL}/v1/invitations/${slug}/love-story`,
        gallery: (slug: string) => `${API_BASE_URL}/v1/invitations/${slug}/gallery`,
        weddingGift: (slug: string) => `${API_BASE_URL}/v1/invitations/${slug}/wedding-gift`,
        closing: (slug: string) => `${API_BASE_URL}/v1/invitations/${slug}/closing`,
        music: (slug: string) => `${API_BASE_URL}/v1/invitations/${slug}/music`,
        theme: (slug: string) => `${API_BASE_URL}/v1/invitations/${slug}/theme`,
        greetings: (slug: string) => `${API_BASE_URL}/v1/invitations/${slug}/greetings`,
    },

    // Wishes (public endpoint)
    wishes: {
        list: (slug: string) => `${API_BASE_URL}/v1/wishes/${slug}`,
        submit: (slug: string) => `${API_BASE_URL}/v1/wishes/${slug}`,
    },
};

/**
 * Helper function to make authenticated API calls
 */
export async function apiCall(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const token = localStorage.getItem('client_token');

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(url, {
        ...options,
        headers,
    });
}

/**
 * Helper to get auth token from localStorage
 */
export function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('client_token');
}

/**
 * Helper to set auth token to localStorage
 */
export function setAuthToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('client_token', token);
}

/**
 * Helper to remove auth token from localStorage
 */
export function removeAuthToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('client_token');
}
