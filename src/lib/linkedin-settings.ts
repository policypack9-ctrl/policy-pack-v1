import "server-only";

import { createClient } from "@supabase/supabase-js";

import {
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "@/lib/auth-env";

const LINKEDIN_CONNECTION_KEY = "linkedin_connection";

export type StoredLinkedInConnection = {
  accessToken: string;
  expiresAt: number;
  memberSub: string;
  memberName: string;
  updatedBy: string | null;
  connectedAt: string;
};

function getClient() {
  if (!isSupabaseConfigured()) return null;

  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function assertSucceeded(error: { message: string } | null, fallbackMessage: string) {
  if (error) {
    throw new Error(error.message || fallbackMessage);
  }
}

export async function getStoredLinkedInConnection(): Promise<StoredLinkedInConnection | null> {
  const supabase = getClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", LINKEDIN_CONNECTION_KEY)
    .maybeSingle();

  assertSucceeded(error, "Unable to load LinkedIn connection.");

  if (!data?.value) {
    return null;
  }

  try {
    const parsed = JSON.parse(data.value) as StoredLinkedInConnection;

    if (!parsed?.accessToken || !parsed?.memberSub) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function saveLinkedInConnection(
  input: StoredLinkedInConnection,
): Promise<void> {
  const supabase = getClient();
  if (!supabase) throw new Error("Supabase not configured.");

  const { error } = await supabase.from("app_settings").upsert(
    {
      key: LINKEDIN_CONNECTION_KEY,
      value: JSON.stringify(input),
      updated_at: new Date().toISOString(),
      updated_by: input.updatedBy,
    },
    { onConflict: "key" },
  );

  assertSucceeded(error, "Unable to save LinkedIn connection.");
}
