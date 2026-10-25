import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl: string = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
if (!rawUrl && typeof window === 'undefined') {
  console.warn('[SupabaseAdmin] Warning: NEXT_PUBLIC_SUPABASE_URL is not set');
}
const supabaseUrl: string = rawUrl
  ? rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')
  : 'https://placeholder.supabase.co';
const supabaseServiceRoleKey: string = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  },
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        cache: 'no-store'
      });
    }
  }
});
