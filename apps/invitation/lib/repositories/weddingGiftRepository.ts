import { getSupabaseClient } from '@/lib/supabaseClient';

export interface WeddingGiftSettings {
    registration_id: string;
    title: string;
    subtitle: string;
    button_label: string;
    gift_image_url?: string;
    background_overlay_opacity: number;
    recipient_name?: string;
    recipient_phone?: string;
    recipient_address_line1?: string;
    recipient_address_line2?: string;
    recipient_address_line3?: string;
    is_enabled: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface WeddingGiftBankAccount {
    id: string;
    registration_id: string;
    bank_name: string;
    account_number: string;
    account_holder_name: string;
    display_order: number;
    created_at?: string;
    updated_at?: string;
}

export type CreateWeddingGiftBankAccountInput = Omit<WeddingGiftBankAccount, 'id' | 'created_at' | 'updated_at'>;
export type UpdateWeddingGiftBankAccountInput = Partial<Omit<WeddingGiftBankAccount, 'id' | 'registration_id' | 'created_at' | 'updated_at'>>;

class WeddingGiftRepository {
    /**
     * Get wedding gift settings
     */
    async getSettings(registrationId: string): Promise<WeddingGiftSettings | null> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from('wedding_gift_settings')
            .select('*')
            .eq('registration_id', registrationId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            console.error('Error getting wedding gift settings:', error);
            throw new Error(`Failed to get wedding gift settings: ${error.message}`);
        }

        return data;
    }

    /**
     * Upsert wedding gift settings
     */
    async upsertSettings(data: WeddingGiftSettings): Promise<WeddingGiftSettings> {
        const supabase = getSupabaseClient();

        const { data: result, error } = await supabase
            .from('wedding_gift_settings')
            .upsert(data, { onConflict: 'registration_id' })
            .select()
            .single();

        if (error) {
            console.error('Error upserting wedding gift settings:', error);
            throw new Error(`Failed to upsert wedding gift settings: ${error.message}`);
        }

        return result;
    }

    /**
     * Get all bank accounts
     */
    async getBankAccounts(registrationId: string): Promise<WeddingGiftBankAccount[]> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from('wedding_gift_bank_accounts')
            .select('*')
            .eq('registration_id', registrationId)
            .order('display_order', { ascending: true });

        if (error) {
            console.error('Error getting bank accounts:', error);
            throw new Error(`Failed to get bank accounts: ${error.message}`);
        }

        return data || [];
    }

    /**
     * Create bank account
     */
    async createBankAccount(account: CreateWeddingGiftBankAccountInput): Promise<WeddingGiftBankAccount> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from('wedding_gift_bank_accounts')
            .insert(account)
            .select()
            .single();

        if (error) {
            console.error('Error creating bank account:', error);
            throw new Error(`Failed to create bank account: ${error.message}`);
        }

        return data;
    }

    /**
     * Update bank account
     */
    async updateBankAccount(id: string, updates: UpdateWeddingGiftBankAccountInput): Promise<WeddingGiftBankAccount> {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from('wedding_gift_bank_accounts')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating bank account:', error);
            throw new Error(`Failed to update bank account: ${error.message}`);
        }

        return data;
    }

    /**
     * Delete bank account
     */
    async deleteBankAccount(id: string): Promise<void> {
        const supabase = getSupabaseClient();

        const { error } = await supabase
            .from('wedding_gift_bank_accounts')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting bank account:', error);
            throw new Error(`Failed to delete bank account: ${error.message}`);
        }
    }

    /**
     * Reorder bank accounts
     */
    async reorderBankAccounts(registrationId: string, accountIds: string[]): Promise<void> {
        const supabase = getSupabaseClient();

        const updates = accountIds.map((id, index) => ({
            id,
            display_order: index,
        }));

        const { error } = await supabase
            .from('wedding_gift_bank_accounts')
            .upsert(updates);

        if (error) {
            console.error('Error reordering bank accounts:', error);
            throw new Error(`Failed to reorder bank accounts: ${error.message}`);
        }
    }

    /**
     * Delete all bank accounts for a registration
     */
    async deleteAllBankAccounts(registrationId: string): Promise<void> {
        const supabase = getSupabaseClient();

        const { error } = await supabase
            .from('wedding_gift_bank_accounts')
            .delete()
            .eq('registration_id', registrationId);

        if (error) {
            console.error('Error deleting all bank accounts:', error);
            throw new Error(`Failed to delete bank accounts: ${error.message}`);
        }
    }
}

// Export singleton instance
export const weddingGiftRepo = new WeddingGiftRepository();
