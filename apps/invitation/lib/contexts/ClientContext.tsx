'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { InvitationAPI } from '@/lib/api/client';

interface Event {
    id: string;
    name: string;
    event_date: string;
    location?: string;
    slug?: string;
    has_invitation: boolean;
    has_guestbook: boolean;
    is_active: boolean;
    created_at: string;
}

interface ClientContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    clientData: any;
    events: Event[];
    selectedEvent: Event | null;
    setSelectedEvent: (event: Event | null) => void;
    fetchEvents: () => Promise<void>;
    login: (token: string, user: any) => void;
    logout: () => void;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [clientData, setClientData] = useState<any>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

    const logout = useCallback(() => {
        localStorage.removeItem('client_user');
        localStorage.removeItem('client_token');
        localStorage.removeItem('selected_event_id');
        setIsAuthenticated(false);
        setClientData(null);
        setEvents([]);
        setSelectedEvent(null);
        router.push('/client-dashboard/login');
    }, [router]);

    const fetchEvents = useCallback(async () => {
        const token = localStorage.getItem('client_token');
        if (!token) return;

        try {
            const data = await InvitationAPI.getEvents(token);
            if (data.success && data.data) {
                setEvents(data.data);

                // Handle selected event
                const savedEventId = localStorage.getItem('selected_event_id');
                const eventToSelect = savedEventId
                    ? data.data.find((e: Event) => e.id === savedEventId) || data.data[0]
                    : data.data[0];

                if (eventToSelect) {
                    setSelectedEvent(eventToSelect);
                    localStorage.setItem('selected_event_id', eventToSelect.id);
                }
            } else if (data.error === 'Unauthorized' || data.error === 'Invalid token') {
                logout();
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    }, [logout]);

    const login = useCallback(async (token: string, user: any) => {
        setIsLoading(true);
        localStorage.setItem('client_token', token);
        localStorage.setItem('client_user', JSON.stringify(user));
        setClientData(user);
        setIsAuthenticated(true);

        // Fetch events immediately upon login
        await fetchEvents();

        setIsLoading(false);
        router.push('/client-dashboard');
    }, [router, fetchEvents]);

    useEffect(() => {
        const token = localStorage.getItem('client_token');
        const user = localStorage.getItem('client_user');

        // If no credentials, just set loading to false
        if (!token || !user || user === 'undefined') {
            setIsLoading(false);
            return;
        }

        try {
            const parsedUser = JSON.parse(user);
            setClientData(parsedUser);
            // Set authenticated IMMEDIATELY before async operations
            setIsAuthenticated(true);

            // Then fetch events (async)
            fetchEvents().finally(() => setIsLoading(false));
        } catch (e) {
            console.error('Error parsing client_user:', e);
            setIsLoading(false);
        }
    }, [fetchEvents]); // Removed pathname and logout from dependencies

    return (
        <ClientContext.Provider value={{
            isAuthenticated,
            isLoading,
            clientData,
            events,
            selectedEvent,
            setSelectedEvent: (event) => {
                setSelectedEvent(event);
                if (event) localStorage.setItem('selected_event_id', event.id);
                else localStorage.removeItem('selected_event_id');
            },
            fetchEvents,
            login,
            logout
        }}>
            {children}
        </ClientContext.Provider>
    );
}

export function useClient() {
    const context = useContext(ClientContext);
    if (context === undefined) {
        throw new Error('useClient must be used within a ClientProvider');
    }
    return context;
}
