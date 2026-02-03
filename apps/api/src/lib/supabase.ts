import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Env } from './types';

let supabaseInstance: SupabaseClient | null = null;
let globalEnv: Env | null = null;

/**
 * Initialize global env (called from main index.ts)
 */
export function initEnv(env: Env) {
    globalEnv = env;
}

/**
 * Get Supabase client instance (singleton pattern)
 * Uses service role key for server-side operations
 */
export function getSupabaseClient(env?: Env): SupabaseClient {
    const actualEnv = env || globalEnv;
    if (!actualEnv) {
        throw new Error('Env not initialized. Call initEnv() first or pass env parameter.');
    }

    if (!supabaseInstance) {
        supabaseInstance = createClient(
            actualEnv.SUPABASE_URL,
            actualEnv.SUPABASE_SERVICE_ROLE_KEY,
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

/**
 * Alias for compatibility with migrated Next.js repositories
 * In Workers, we always use service role key, so this is the same as getSupabaseClient
 */
export const getSupabaseServiceClient = getSupabaseClient;
