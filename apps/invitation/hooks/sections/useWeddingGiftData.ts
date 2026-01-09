/**
 * Reusable hook for fetching wedding gift/bank account data
 * Can be used across different theme designs
 */

import { useInvitationContent } from '@/lib/contexts/InvitationContentContext';

export interface BankAccount {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
}

export interface UseWeddingGiftDataReturn {
    accounts: BankAccount[];
    isLoading: boolean;
    hasAccounts: boolean;
    giftMessage?: string;
}

export function useWeddingGiftData(): UseWeddingGiftDataReturn {
    const invitationContent = useInvitationContent();

    const accounts: BankAccount[] = invitationContent?.weddingGift?.bankAccounts?.map((acc: any) => ({
        bankName: acc.templateId || 'Bank',
        accountNumber: acc.accountNumber,
        accountHolder: acc.accountName,
    })) || [];
    const giftMessage = invitationContent?.weddingGift?.subtitle;

    return {
        accounts,
        isLoading: false,
        hasAccounts: accounts.length > 0,
        giftMessage,
    };
}
