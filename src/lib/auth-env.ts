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

export type AuthEnvStatus = {
  isConfigured: boolean;
  missingKeys: string[];
};

export function getAuthSecret() {
  return readEnvValue("AUTH_SECRET", "NEXTAUTH_SECRET");
}

export function getAuthBaseUrl() {
  const configured = readEnvValue("AUTH_URL", "NEXTAUTH_URL", "NEXT_PUBLIC_APP_URL");

  if (configured) {
    return configured;
  }

  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_APP_URL;
  }

  return getPublicAppUrl() || PRODUCTION_APP_URL;
}

export function getSupabaseUrl() {
  return readEnvValue("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabaseAnonKey() {
  return readEnvValue("SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function getSupabaseServiceRoleKey() {
  return readEnvValue("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_KEY");
}

export function getSupabaseConfigStatus(): AuthEnvStatus {
  const missingKeys: string[] = [];

  if (!getSupabaseUrl()) {
    missingKeys.push("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!getSupabaseServiceRoleKey()) {
    missingKeys.push("SUPABASE_SERVICE_ROLE_KEY");
  }

  return {
    isConfigured: missingKeys.length === 0,
    missingKeys,
  };
}

export function isSupabaseConfigured() {
  return getSupabaseConfigStatus().isConfigured;
}

export function getGoogleAuthConfig() {
  const clientId = readEnvValue("AUTH_GOOGLE_ID", "GOOGLE_CLIENT_ID");
  const clientSecret = readEnvValue(
    "AUTH_GOOGLE_SECRET",
    "GOOGLE_CLIENT_SECRET",
  );

  return {
    clientId,
    clientSecret,
  };
}

export function isGoogleAuthConfigured() {
  const config = getGoogleAuthConfig();
  return Boolean(config.clientId && config.clientSecret);
}

export function getAuthSecretStatus(): AuthEnvStatus {
  const missingKeys = getAuthSecret()
    ? []
    : ["AUTH_SECRET or NEXTAUTH_SECRET"];

  return {
    isConfigured: missingKeys.length === 0,
    missingKeys,
  };
}
