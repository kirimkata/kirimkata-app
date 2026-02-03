import { getSupabaseClient } from '../lib/supabase';

// Define ClientProfile interface locally  
interface ClientProfile {
    theme: string;
    name: string;
    slug: string;
    custom_images?: any;
}

const TABLE_NAME = 'invitation_contents';

interface InvitationContentRow {
    slug: string;
    client_profile: ClientProfile;
    theme_key?: string;
}

/**
 * Fetch client profile and theme from database
 * Returns null if not found or error occurs
 */
export async function fetchClientProfileFromDB(slug: string): Promise<{ profile: ClientProfile; themeKey?: string } | null> {
    try {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('slug, client_profile, theme_key')
            .eq('slug', slug)
            .limit(1);

        if (error) {
            console.error('Error fetching client profile from Supabase', error);
            return null;
        }

        const row = (data && data[0]) as InvitationContentRow | undefined;
        if (!row || !row.client_profile) {
            return null;
        }

        return {
            profile: row.client_profile,
            themeKey: row.theme_key,
        };
    } catch (clientError) {
        console.warn('Supabase client is not available or misconfigured', clientError);
        return null;
    }
}
