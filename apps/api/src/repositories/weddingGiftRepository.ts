import { getDb } from '@/db';
import { weddingGiftSettings, weddingGiftBankAccounts } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import type { Env } from '@/lib/types';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export type WeddingGiftSettings = InferSelectModel<typeof weddingGiftSettings>;
export type WeddingGiftBankAccount = InferSelectModel<typeof weddingGiftBankAccounts>;

export type UpsertWeddingGiftSettingsInput = InferInsertModel<typeof weddingGiftSettings>;
export type CreateWeddingGiftBankAccountInput = InferInsertModel<typeof weddingGiftBankAccounts>;
export type UpdateWeddingGiftBankAccountInput = Partial<CreateWeddingGiftBankAccountInput>;

export type CreateWeddingGiftBankAccountInputOmit = Omit<CreateWeddingGiftBankAccountInput, 'id' | 'createdAt' | 'updatedAt'>;

class WeddingGiftRepository {
    /**
     * Get wedding gift settings
     */
    async getSettings(env: Env, registrationId: string): Promise<WeddingGiftSettings | null> {
        const db = getDb(env);

        const [result] = await db
            .select()
            .from(weddingGiftSettings)
            .where(eq(weddingGiftSettings.registrationId, registrationId))
            .limit(1);

        return result || null;
    }

    /**
     * Upsert wedding gift settings
     */
    async upsertSettings(env: Env, data: UpsertWeddingGiftSettingsInput): Promise<WeddingGiftSettings> {
        const db = getDb(env);

        const [result] = await db
            .insert(weddingGiftSettings)
            .values({
                ...data,
                updatedAt: new Date().toISOString(),
            })
            .onConflictDoUpdate({
                target: weddingGiftSettings.registrationId,
                set: {
                    ...data,
                    updatedAt: new Date().toISOString(),
                }
            })
            .returning();

        return result;
    }

    /**
     * Get all bank accounts
     */
    async getBankAccounts(env: Env, registrationId: string): Promise<WeddingGiftBankAccount[]> {
        const db = getDb(env);

        const results = await db
            .select()
            .from(weddingGiftBankAccounts)
            .where(eq(weddingGiftBankAccounts.registrationId, registrationId))
            .orderBy(asc(weddingGiftBankAccounts.displayOrder));

        return results;
    }

    /**
     * Create bank account
     */
    async createBankAccount(env: Env, account: CreateWeddingGiftBankAccountInputOmit): Promise<WeddingGiftBankAccount> {
        const db = getDb(env);

        const [result] = await db
            .insert(weddingGiftBankAccounts)
            .values({
                ...account,
                // updatedAt? Schema doesn't have updatedAt for accounts?
                // Wait, checking schema in step 2460:
                // createdAt is there. updatedAt is missing in schema view 471-479?
                // Line 479: `},`. It just has createdAt.
                // Ah, line 479 ends the table fields definition.
                // So no updatedAt for bank accounts in schema provided.
                // But CreateWeddingGiftBankAccountInput inferred from schema should match.
                // So I won't add updatedAt.
            })
            .returning();

        return result;
    }

    /**
     * Update bank account
     */
    async updateBankAccount(env: Env, id: string, updates: UpdateWeddingGiftBankAccountInput): Promise<WeddingGiftBankAccount> {
        const db = getDb(env);

        const [result] = await db
            .update(weddingGiftBankAccounts)
            .set(updates)
            .where(eq(weddingGiftBankAccounts.id, id))
            .returning();

        if (!result) {
            throw new Error('Failed to update bank account: Record not found');
        }

        return result;
    }

    /**
     * Delete bank account
     */
    async deleteBankAccount(env: Env, id: string): Promise<void> {
        const db = getDb(env);

        await db
            .delete(weddingGiftBankAccounts)
            .where(eq(weddingGiftBankAccounts.id, id));
    }

    /**
     * Reorder bank accounts
     */
    async reorderBankAccounts(env: Env, registrationId: string, accountIds: string[]): Promise<void> {
        const db = getDb(env);

        await db.transaction(async (tx) => {
            const updatePromises = accountIds.map((id, index) =>
                tx.update(weddingGiftBankAccounts)
                    .set({ displayOrder: index })
                    .where(eq(weddingGiftBankAccounts.id, id))
            );
            await Promise.all(updatePromises);
        });
    }

    /**
     * Delete all bank accounts for a registration
     */
    async deleteAllBankAccounts(env: Env, registrationId: string): Promise<void> {
        const db = getDb(env);

        await db
            .delete(weddingGiftBankAccounts)
            .where(eq(weddingGiftBankAccounts.registrationId, registrationId));
    }
}

// Export singleton instance
export const weddingGiftRepo = new WeddingGiftRepository();

