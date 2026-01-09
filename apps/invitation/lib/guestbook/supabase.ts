import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseServiceClient: SupabaseClient | null = null;

/**
 * Get Supabase service role client (server-side only)
 * This client bypasses RLS and should only be used in API routes
 */
export function getSupabaseServiceClient(): SupabaseClient {
  if (supabaseServiceClient) {
    return supabaseServiceClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  supabaseServiceClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseServiceClient;
}
