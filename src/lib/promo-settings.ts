import "server-only";

import { createClient } from "@supabase/supabase-js";
import {
  getSupabaseUrl,
  getSupabaseServiceRoleKey,
  isSupabaseConfigured,
} from "@/lib/auth-env";

function getClient() {
  if (!isSupabaseConfigured()) return null;
  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function assertPromoQuerySucceeded(
  error: { message: string } | null,
  fallbackMessage: string,
) {
  if (error) {
    throw new Error(error.message || fallbackMessage);
  }
}

/** Read promo_active from DB, fallback to PROMO_ACTIVE env var */
export async function isPromoActiveFromDB(): Promise<boolean> {
  const supabase = getClient();
  if (!supabase) {
    return process.env.PROMO_ACTIVE?.trim().toLowerCase() !== "false";
  }
  try {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "promo_active")
      .maybeSingle();
    if (!data) return process.env.PROMO_ACTIVE?.trim().toLowerCase() !== "false";
    return data.value === "true";
  } catch {
    return process.env.PROMO_ACTIVE?.trim().toLowerCase() !== "false";
  }
}

/** Set promo_active in DB */
export async function setPromoActiveInDB(
  active: boolean,
  updatedBy: string,
): Promise<void> {
  const supabase = getClient();
  if (!supabase) throw new Error("Supabase not configured.");
  const { error } = await supabase.from("app_settings").upsert(
    { key: "promo_active", value: String(active), updated_at: new Date().toISOString(), updated_by: updatedBy },
    { onConflict: "key" },
  );
  assertPromoQuerySucceeded(error, "Unable to update promo_active.");
}

/** Get all promo-eligible users (registered before promo ended) */
export async function getPromoUsers(): Promise<
  Array<{ userId: string; email: string | null; name: string | null; createdAt: string | null }>
> {
  const supabase = getClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("user_profiles")
    .select("user_id, email, display_name, created_at")
    .eq("plan_id", "free")
    .eq("is_premium", false)
    .order("created_at", { ascending: true });
  assertPromoQuerySucceeded(error, "Unable to list promo users.");
  return (data ?? []).map((row) => ({
    userId: row.user_id,
    email: row.email ?? null,
    name: row.display_name ?? null,
    createdAt: row.created_at ?? null,
  }));
}

/** Log promo archive to DB */
export async function logPromoArchive(input: {
  endedBy: string;
  affectedUsers: number;
  notifiedUsers: number;
  report: Record<string, unknown>;
}): Promise<string> {
  const supabase = getClient();
  if (!supabase) throw new Error("Supabase not configured.");
  const { data, error } = await supabase
    .from("promo_archive_log")
    .insert({
      ended_by: input.endedBy,
      affected_users: input.affectedUsers,
      notified_users: input.notifiedUsers,
      report: input.report,
    })
    .select("id")
    .single();
  assertPromoQuerySucceeded(error, "Unable to write promo archive log.");
  return data?.id ?? "";
}

/** Get latest promo archive log */
export async function getLatestPromoArchive() {
  const supabase = getClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("promo_archive_log")
    .select("*")
    .order("ended_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  assertPromoQuerySucceeded(error, "Unable to load the latest promo archive.");
  return data ?? null;
}

/** Rollback promo (re-enable) within 24h */
export async function rollbackPromo(
  archiveId: string,
  rolledBackBy: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getClient();
  if (!supabase) return { ok: false, error: "Supabase not configured." };

  const { data: archive, error: archiveError } = await supabase
    .from("promo_archive_log")
    .select("ended_at, rolled_back_at")
    .eq("id", archiveId)
    .maybeSingle();
  if (archiveError) {
    return { ok: false, error: archiveError.message || "Unable to load the archive record." };
  }

  if (!archive) return { ok: false, error: "Archive record not found." };
  if (archive.rolled_back_at) return { ok: false, error: "Already rolled back." };

  const endedAt = new Date(archive.ended_at);
  const hoursElapsed = (Date.now() - endedAt.getTime()) / 3_600_000;
  if (hoursElapsed > 24) return { ok: false, error: "Rollback window (24h) has expired." };

  try {
    await setPromoActiveInDB(true, rolledBackBy);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to restore promo_active.",
    };
  }

  const { error: rollbackError } = await supabase
    .from("promo_archive_log")
    .update({ rolled_back_at: new Date().toISOString(), rolled_back_by: rolledBackBy })
    .eq("id", archiveId);
  if (rollbackError) {
    return {
      ok: false,
      error: rollbackError.message || "Unable to mark the archive as rolled back.",
    };
  }

  return { ok: true };
}
