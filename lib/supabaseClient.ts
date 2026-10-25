import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl: string = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
if (!rawUrl && typeof window === 'undefined') {
  console.warn('[SupabaseClient] Warning: NEXT_PUBLIC_SUPABASE_URL is not set');
}
const supabaseUrl: string = rawUrl
  ? rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')
  : 'https://placeholder.supabase.co';
const supabaseAnonKey: string = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
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
