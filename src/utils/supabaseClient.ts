import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client instance for use across the application
 * Uses the anon key for client-side operations
 * Initialized using environment variables from .env file
 */
export const supabaseClient: SupabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

/**
 * Admin client for server-side operations
 * Uses service role key for admin operations
 */
export const supabaseAdmin: SupabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
