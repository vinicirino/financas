import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Checks if Supabase credentials have been provided via environment variables.
 */
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your-anon')
);

if (!isSupabaseConfigured) {
  console.warn(
    '[FinanControl Supabase] Variáveis de ambiente VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não configuradas.\n' +
    'Para persistência online e sincronização entre computadores e celulares, preencha as variáveis no arquivo .env ou no painel da Vercel.'
  );
}

/**
 * Official Supabase Client with browser persistence for auth sessions.
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'financontrol_supabase_auth_session',
    },
  }
);
