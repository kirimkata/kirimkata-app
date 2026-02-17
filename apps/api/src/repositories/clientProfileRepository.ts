
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { invitationContents } from '../db/schema';
import type { Env } from '../lib/types';

// Define ClientProfile interface locally  
interface ClientProfile {
    theme: string;
    name: string;
    slug: string;
    custom_images?: any;
}

export class ClientProfileRepository {
    private getDb(env: Env) {
        const client = postgres(env.DATABASE_URL);
        return drizzle(client);
    }

    /**
     * Fetch client profile and theme from database
     * Returns null if not found or error occurs
     */
    async fetchClientProfileFromDB(slug: string, env: Env): Promise<{ profile: ClientProfile; themeKey?: string } | null> {
        const db = this.getDb(env);

        try {
            const result = await db.select({
                slug: invitationContents.slug,
                profile: invitationContents.profile,
                themeKey: invitationContents.themeKey,
            })
                .from(invitationContents)
                .where(eq(invitationContents.slug, slug))
                .limit(1);

            if (result.length === 0) {
                return null;
            }

            const row = result[0];

            // Map 'profile' from DB to 'ClientProfile' structure expected by the app
            // Note: The app expected 'client_profile' from Supabase query, but schema has 'profile'.
            // Accessing 'profile' column content.
            if (!row.profile) {
                return null;
            }

            return {
                profile: row.profile as unknown as ClientProfile,
                themeKey: row.themeKey || undefined,
            };
        } catch (clientError) {
            console.warn('Database error fetching client profile', clientError);
            return null;
        }
    }
}

export const clientProfileRepository = new ClientProfileRepository();
