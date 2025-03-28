import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
  throw new Error('Invalid or missing VITE_SUPABASE_URL. Must be a valid URL starting with http:// or https://');
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

// Create Supabase client with enhanced session handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
    flowType: 'implicit'
  },
  global: {
    headers: {
      'x-application-name': 'lacantinax'
    }
  },
  // Add debug logging in development
  logger: import.meta.env.DEV ? console : undefined
});

// Initialize auth state
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    console.log('🔐 Initial auth session loaded');
  } else {
    console.log('🔓 No initial auth session');
  }
});

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('🔄 Auth state changed:', event, session ? 'Session exists' : 'No session');
});