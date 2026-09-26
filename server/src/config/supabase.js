import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';

if (!config.supabaseUrl) {
  console.warn('⚠️ Supabase URL is not configured. Database operations will fail until valid credentials are provided.');
}

// Administrative Supabase client using Service Role Key (strictly server-side)
// Falls back to anon key if service role key is not yet set
const masterKey = config.supabaseServiceRoleKey || config.supabaseAnonKey || 'dummy-key';
export const supabaseAdmin = createClient(
  config.supabaseUrl || 'https://placeholder.supabase.co',
  masterKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Creates a scoped Supabase client with the caller's JWT token
 * to guarantee that all queries strictly inherit the user's RLS policies.
 */
export function getScopedSupabaseClient(jwtToken) {
  return createClient(
    config.supabaseUrl || 'https://placeholder.supabase.co',
    config.supabaseAnonKey || 'dummy-key',
    {
      global: {
        headers: {
          Authorization: `Bearer ${jwtToken}`
        }
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
