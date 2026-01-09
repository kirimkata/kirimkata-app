import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Env } from './types';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Get Supabase client instance (singleton pattern)
 * Uses service role key for server-side operations
 */
export function getSupabaseClient(env: Env): SupabaseClient {
    if (!supabaseInstance) {
        supabaseInstance = createClient(
            env.SUPABASE_URL,
            env.SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        );
    }
    return supabaseInstance;
}

/**
 * Reset Supabase instance (useful for testing)
 */
export function resetSupabaseInstance() {
    supabaseInstance = null;
}
