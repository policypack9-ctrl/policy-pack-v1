import { getPublicAppUrl, PRODUCTION_APP_URL } from "@/lib/site-config";

function readEnvValue(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) {
      return value;
    }
  }

  return "";
}

export function getAuthSecret() {
  return readEnvValue("AUTH_SECRET", "NEXTAUTH_SECRET");
}

export function getAuthBaseUrl() {
  return (
    readEnvValue("AUTH_URL", "NEXTAUTH_URL", "NEXT_PUBLIC_APP_URL") ||
    getPublicAppUrl() ||
    PRODUCTION_APP_URL
  );
}

export function getSupabaseUrl() {
  return readEnvValue("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabaseAnonKey() {
  return readEnvValue("SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function getSupabaseServiceRoleKey() {
  return readEnvValue("SUPABASE_SERVICE_ROLE_KEY", "NEXTAUTH_SECRET");
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseUrl() && getSupabaseServiceRoleKey());
}

export function isGoogleAuthConfigured() {
  return Boolean(
    readEnvValue("AUTH_GOOGLE_ID", "GOOGLE_CLIENT_ID") &&
      readEnvValue("AUTH_GOOGLE_SECRET", "GOOGLE_CLIENT_SECRET"),
  );
}

