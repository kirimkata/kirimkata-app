const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

/**
 * API Client for Wedding Invitation Operations
 * Calls Cloudflare Workers API endpoints
 */
export class InvitationAPI {
    // ============ EVENTS ============

    static async createEvent(data: { name: string; event_date: string; location?: string; slug?: string }, token: string) {
        const res = await fetch(`${API_BASE_URL}/v1/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
        return res.json();
    }

    static async getEvents(token: string) {
        const res = await fetch(`${API_BASE_URL}/v1/events`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        return res.json();
    }

    static async getEvent(id: string, token: string) {
        const res = await fetch(`${API_BASE_URL}/v1/events/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        return res.json();
    }

    static async updateEvent(id: string, data: any, token: string) {
        const res = await fetch(`${API_BASE_URL}/v1/events/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
        return res.json();
    }

    static async deleteEvent(id: string, token: string) {
        const res = await fetch(`${API_BASE_URL}/v1/events/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        return res.json();
    }

    // ============ REGISTRATION ============

    static async createRegistration(data: any) {
        const res = await fetch(`${API_BASE_URL}/v1/registration`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    }

    static async getRegistration(slug: string) {
        const res = await fetch(`${API_BASE_URL}/v1/registration/${slug}`);
        return res.json();
    }

    static async updateRegistration(slug: string, data: any) {
        const res = await fetch(`${API_BASE_URL}/v1/registration/${slug}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    }

    // ============ LOVE STORY ============

    static async getLoveStory(slug: string) {
        const res = await fetch(`${API_BASE_URL}/v1/invitations/${slug}/love-story`);
        return res.json();
    }

    static async updateLoveStory(slug: string, data: { settings?: any; blocks?: any[] }) {
        const res = await fetch(`${API_BASE_URL}/v1/invitations/${slug}/love-story`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    }

    // ============ GALLERY ============

    static async getGallery(slug: string) {
        const res = await fetch(`${API_BASE_URL}/v1/invitations/${slug}/gallery`);
        return res.json();
    }

    static async updateGallery(slug: string, data: { settings: any }) {
        const res = await fetch(`${API_BASE_URL}/v1/invitations/${slug}/gallery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    }

    // ============ WEDDING GIFT ============

    static async getWeddingGift(slug: string) {
        const res = await fetch(`${API_BASE_URL}/v1/invitations/${slug}/wedding-gift`);
        return res.json();
    }

    static async updateWeddingGift(slug: string, data: { settings?: any; bankAccounts?: any[] }) {
        const res = await fetch(`${API_BASE_URL}/v1/invitations/${slug}/wedding-gift`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    }

    // ============ CLOSING ============

    static async getClosing(slug: string) {
        const res = await fetch(`${API_BASE_URL}/v1/invitations/${slug}/closing`);
        return res.json();
    }

    static async updateClosing(slug: string, data: { settings: any }) {
        const res = await fetch(`${API_BASE_URL}/v1/invitations/${slug}/closing`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    }

    // ============ BACKGROUND MUSIC ============

    static async getMusic(slug: string) {
        const res = await fetch(`${API_BASE_URL}/v1/invitations/${slug}/music`);
        return res.json();
    }

    static async updateMusic(slug: string, data: { settings: any }) {
        const res = await fetch(`${API_BASE_URL}/v1/invitations/${slug}/music`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    }

    // ============ THEME ============

    static async getTheme(slug: string) {
        const res = await fetch(`${API_BASE_URL}/v1/invitations/${slug}/theme`);
        return res.json();
    }

    static async updateTheme(slug: string, data: { settings: any }) {
        const res = await fetch(`${API_BASE_URL}/v1/invitations/${slug}/theme`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    }

    // ============ GREETINGSECTIONS ============

    static async getGreetings(slug: string) {
        const res = await fetch(`${API_BASE_URL}/v1/invitations/${slug}/greetings`);
        return res.json();
    }

    static async updateGreetings(slug: string, data: { greetings: any[] }) {
        const res = await fetch(`${API_BASE_URL}/v1/invitations/${slug}/greetings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    }

    // ============ COMPILE ============

    static async compileInvitation(slug: string) {
        const res = await fetch(`${API_BASE_URL}/v1/invitations/${slug}/compile`, {
            method: 'POST',
        });
        return res.json();
    }
}
