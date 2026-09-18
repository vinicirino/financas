import { createClient } from '@supabase/supabase-js';

// Clean and sanitize environment variables
let rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
let rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// Remove accidental quotes from .env or Vercel settings (e.g. "https://..." or 'https://...')
if ((rawUrl.startsWith('"') && rawUrl.endsWith('"')) || (rawUrl.startsWith("'") && rawUrl.endsWith("'"))) {
  rawUrl = rawUrl.slice(1, -1).trim();
}
if ((rawKey.startsWith('"') && rawKey.endsWith('"')) || (rawKey.startsWith("'") && rawKey.endsWith("'"))) {
  rawKey = rawKey.slice(1, -1).trim();
}

// Auto-prefix https:// if user provided domain without protocol
if (rawUrl && !rawUrl.startsWith('http://') && !rawUrl.startsWith('https://') && rawUrl.includes('.')) {
  rawUrl = `https://${rawUrl}`;
}

// Validate URL format
let isValidUrl = false;
try {
  if (rawUrl && rawUrl !== 'undefined' && rawUrl !== 'null') {
    const parsed = new URL(rawUrl);
    isValidUrl = parsed.protocol === 'http:' || parsed.protocol === 'https:';
  }
} catch {
  isValidUrl = false;
}

/**
 * Checks if Supabase credentials have been provided and are valid.
 */
export const isSupabaseConfigured = Boolean(
  isValidUrl && 
  rawKey && 
  rawKey !== 'undefined' &&
  rawKey !== 'null' &&
  !rawUrl.includes('your-project') &&
  !rawKey.includes('your-anon')
);

if (!isSupabaseConfigured) {
  console.warn(
    '[FinanControl Supabase] Supabase não configurado ou credenciais incompletas no ambiente.\n' +
    'Para persistência online e sincronização entre dispositivos, preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'
  );
}

// Safe fallback URL that is guaranteed to be a valid HTTP/HTTPS URL so createClient never throws at startup
const safeUrl = isSupabaseConfigured && isValidUrl ? rawUrl : 'https://placeholder.supabase.co';
const safeKey = isSupabaseConfigured && rawKey ? rawKey : 'placeholder-anon-key';

/**
 * Official Supabase Client with browser persistence for auth sessions.
 */
export const supabase = createClient(
  safeUrl,
  safeKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: isSupabaseConfigured,
      detectSessionInUrl: isSupabaseConfigured,
      storageKey: 'financontrol_supabase_auth_session',
    },
  }
);

