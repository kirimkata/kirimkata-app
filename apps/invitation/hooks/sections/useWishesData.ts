/**
 * Reusable hook for fetching wishes/messages data
 * Can be used across different theme designs
 */

import { useState, useEffect } from 'react';

export interface WishMessage {
    id: string;
    name: string;
    message: string;
    attendance: 'hadir' | 'tidak-hadir' | 'ragu';
    createdAt: string;
}

export interface UseWishesDataReturn {
    wishes: WishMessage[];
    isLoading: boolean;
    error: string | null;
    totalCount: number;
    refetch: () => Promise<void>;
}

export function useWishesData(invitationSlug: string): UseWishesDataReturn {
    const [wishes, setWishes] = useState<WishMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);

    const fetchWishes = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch(`/api/wishes/${invitationSlug}`);

            if (!response.ok) {
                throw new Error('Failed to fetch wishes');
            }

            const data = await response.json();
            setWishes(data.wishes || []);
            setTotalCount(data.total || 0);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            console.error('Error fetching wishes:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (invitationSlug) {
            fetchWishes();
        }
    }, [invitationSlug]);

    return {
        wishes,
        isLoading,
        error,
        totalCount,
        refetch: fetchWishes,
    };
}
