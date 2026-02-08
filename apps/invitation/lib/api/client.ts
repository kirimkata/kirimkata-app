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

    // ============ GUESTS ============

    static async getGuests(token: string) {
        const res = await fetch(`${API_BASE_URL}/v1/guests`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        return res.json();
    }

    static async saveGuests(guests: any[], token: string) {
        const res = await fetch(`${API_BASE_URL}/v1/guests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ guests }),
        });
        return res.json();
    }

    // ============ CLIENT SETTINGS & PROFILE ============

    static async getClientProfile(token: string) {
        const res = await fetch(`${API_BASE_URL}/v1/client/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        return res.json();
    }

    static async updateClientSettings(data: { email?: string; currentPassword?: string; newPassword?: string }, token: string) {
        const res = await fetch(`${API_BASE_URL}/v1/client/settings`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
        return res.json();
    }

    static async getMessageTemplate(token: string) {
        const res = await fetch(`${API_BASE_URL}/v1/client/template`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        return res.json();
    }

    static async saveMessageTemplate(template: string, token: string) {
        const res = await fetch(`${API_BASE_URL}/v1/client/template`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ template }),
        });
        return res.json();
    }

    // ============ CUSTOM IMAGES ============

    static async getCustomImages(token: string) {
        const res = await fetch(`${API_BASE_URL}/v1/media/custom-images`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        return res.json();
    }

    static async saveCustomImages(custom_images: any, token: string) {
        const res = await fetch(`${API_BASE_URL}/v1/media/custom-images`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ custom_images }),
        });
        return res.json();
    }

    // ============ INVITATION CONTENT ============

    static async getInvitationContent(token: string) {
        const res = await fetch(`${API_BASE_URL}/v1/client/invitation-content`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        return res.json();
    }

    static async saveInvitationContent(data: any, token: string) {
        const res = await fetch(`${API_BASE_URL}/v1/client/invitation-content`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
        return res.json();
    }
    static async getMessages(token: string) {
        const res = await fetch(`${API_BASE_URL}/v1/client/messages`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        return res.json();
    }

    // ============ MEDIA LIBRARY ============

    static async getMediaList(token: string, type?: 'photo' | 'music' | 'video' | 'all') {
        const url = new URL(`${API_BASE_URL}/v1/media/list`);
        if (type) {
            url.searchParams.append('type', type);
        }
        const res = await fetch(url.toString(), {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        return res.json();
    }

    static async uploadMedia(token: string, file: File, type: 'photo' | 'music' | 'video') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        const res = await fetch(`${API_BASE_URL}/v1/media/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });
        return res.json();
    }

    static async deleteMedia(token: string, fileId: string) {
        const res = await fetch(`${API_BASE_URL}/v1/media/delete`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ fileId }),
        });
        return res.json();
    }

    static async getMediaQuota(token: string) {
        const res = await fetch(`${API_BASE_URL}/v1/media/quota`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        return res.json();
    }

    // ============ GUESTBOOK - STAFF ============

    static async getGuestbookStaff(token: string, eventId: string) {
        const res = await fetch(`${API_BASE_URL}/v1/guestbook/staff?event_id=${eventId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        return res.json();
    }

    static async createGuestbookStaff(token: string, data: any) {
        const res = await fetch(`${API_BASE_URL}/v1/guestbook/staff`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
        return res.json();
    }

    static async updateGuestbookStaff(token: string, staffId: string, data: any) {
        const res = await fetch(`${API_BASE_URL}/v1/guestbook/staff/${staffId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
        return res.json();
    }

    static async deleteGuestbookStaff(token: string, staffId: string) {
        const res = await fetch(`${API_BASE_URL}/v1/guestbook/staff/${staffId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        return res.json();
    }

    // ============ GUESTBOOK - GUESTS ============

    static async getGuestbookGuests(token: string, eventId: string) {
        const res = await fetch(`${API_BASE_URL}/v1/guestbook/guests?event_id=${eventId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        return res.json();
    }

    static async createGuestbookGuest(token: string, data: any) {
        const res = await fetch(`${API_BASE_URL}/v1/guestbook/guests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
        return res.json();
    }

    static async updateGuestbookGuest(token: string, guestId: string, data: any) {
        const res = await fetch(`${API_BASE_URL}/v1/guestbook/guests/${guestId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
        return res.json();
    }

    static async deleteGuestbookGuest(token: string, guestId: string) {
        const res = await fetch(`${API_BASE_URL}/v1/guestbook/guests/${guestId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        return res.json();
    }

    // ============ GUESTBOOK - SEATING ============

    static async getGuestbookSeating(token: string, eventId: string) {
        const res = await fetch(`${API_BASE_URL}/v1/guestbook/seating?event_id=${eventId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        return res.json();
    }

    static async createGuestbookSeating(token: string, data: any) {
        const res = await fetch(`${API_BASE_URL}/v1/guestbook/seating`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
        return res.json();
    }

    static async updateGuestbookSeating(token: string, configId: string, data: any) {
        const res = await fetch(`${API_BASE_URL}/v1/guestbook/seating/${configId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
        return res.json();
    }

    static async deleteGuestbookSeating(token: string, configId: string) {
        const res = await fetch(`${API_BASE_URL}/v1/guestbook/seating/${configId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        return res.json();
    }

    static async getGuestbookSeatingStats(token: string, eventId: string) {
        const res = await fetch(`${API_BASE_URL}/v1/guestbook/seating/stats?event_id=${eventId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        return res.json();
    }

    // ============ GUESTBOOK - CHECKIN & BENEFITS ============

    static async getGuestbookCheckinStats(token: string, eventId: string) {
        const res = await fetch(`${API_BASE_URL}/v1/guestbook/checkin/stats?event_id=${eventId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        return res.json();
    }

    static async getGuestbookCheckinLogs(token: string, eventId: string) {
        const res = await fetch(`${API_BASE_URL}/v1/guestbook/checkin/logs?event_id=${eventId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        return res.json();
    }

    static async getGuestbookRedemptionLogs(token: string, eventId: string) {
        const res = await fetch(`${API_BASE_URL}/v1/shared/redeem?event_id=${eventId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        return res.json();
    }

    static async getGuestbookBenefits(token: string) {
        const res = await fetch(`${API_BASE_URL}/v1/guestbook/benefits`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        return res.json();
    }

}
