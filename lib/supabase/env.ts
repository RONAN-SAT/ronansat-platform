function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getSupabaseUrl() {
  return getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabaseAnonKey() {
  return getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function getSupabaseServiceRoleKey() {
  return getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
}

export const SUPABASE_BROWSER_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";

export const SUPABASE_BROWSER_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";

export function getSupabaseBrowserEnv() {
  if (!SUPABASE_BROWSER_URL || !SUPABASE_BROWSER_ANON_KEY) {
    throw new Error("Missing required Supabase browser environment variables.");
  }

  return {
    url: SUPABASE_BROWSER_URL,
    anonKey: SUPABASE_BROWSER_ANON_KEY,
  };
}
