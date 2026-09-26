import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://wvqqlgyowcaphywvzgof.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2cXFsZ3lvd2NhcGh5d3Z6Z29mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0MDUxMDAsImV4cCI6MjEwNTk4MTEwMH0.9sO8Y5S3Ob9p56yBJsi3Xq-CtZ6h250pE5D_4KifdVE';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://placeholder.supabase.co'
);

// Fallback to safe valid placeholder to guarantee createClient never throws on load
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'dummy-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

