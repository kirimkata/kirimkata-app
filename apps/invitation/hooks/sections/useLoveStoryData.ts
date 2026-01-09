/**
 * Reusable hook for fetching love story data
 * Can be used across different theme designs
 */

import { useInvitationContent } from '@/lib/contexts/InvitationContentContext';

export interface LoveStoryItem {
    title: string;
    date?: string;
    description: string;
    image?: string;
}

export interface UseLoveStoryDataReturn {
    stories: LoveStoryItem[];
    isLoading: boolean;
    hasStories: boolean;
}

export function useLoveStoryData(): UseLoveStoryDataReturn {
    const invitationContent = useInvitationContent();

    const stories: LoveStoryItem[] = invitationContent?.loveStory?.blocks?.map((block: any) => ({
        title: block.title,
        description: block.body,
    })) || [];

    return {
        stories,
        isLoading: false,
        hasStories: stories.length > 0,
    };
}
