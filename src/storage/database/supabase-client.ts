import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Support both Coze sandbox and Vercel/standard environments
function getEnvVar(name: string): string | undefined {
  return process.env[name];
}

function getSupabaseUrl(): string | undefined {
  return getEnvVar('COZE_SUPABASE_URL') || getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
}

function getSupabaseAnonKey(): string | undefined {
  return getEnvVar('COZE_SUPABASE_ANON_KEY') || getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

function getSupabaseServiceRoleKey(): string | undefined {
  return getEnvVar('COZE_SUPABASE_SERVICE_ROLE_KEY') || getEnvVar('SUPABASE_SERVICE_ROLE_KEY');
}

function getSupabaseClient(token?: string): SupabaseClient | null {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey) {
    // Supabase not configured, return null
    return null;
  }

  let key: string;
  if (token) {
    key = anonKey;
  } else {
    const serviceRoleKey = getSupabaseServiceRoleKey();
    key = serviceRoleKey ?? anonKey;
  }

  return createClient(url, key, {
    db: {
      timeout: 60000,
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export { getSupabaseUrl, getSupabaseAnonKey, getSupabaseServiceRoleKey, getSupabaseClient };
