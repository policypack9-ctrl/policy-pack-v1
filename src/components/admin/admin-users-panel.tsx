"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, AlertTriangle, CheckCircle2, LoaderCircle, Power, RefreshCcw, ShieldAlert, Trash2, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { PremiumButton } from "@/components/ui/premium-button";

export type AdminUserView = {
  userId: string;
  name: string;
  email: string;
  planId: string;
  isPremium: boolean;
  createdAt: string | null;
  signInMethods: Array<"password" | "google">;
};

type AdminUsersPanelProps = {
  initialUsers: AdminUserView[];
  adminEmail: string;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatPlanLabel(planId: string, isPremium: boolean) {
  if (isPremium && planId === "premium") return "Premium";
  if (planId === "starter") return "Starter";
  if (!isPremium) return "Free";
  return "Paid";
}

function formatPlanBadgeColor(planId: string, isPremium: boolean) {
  if (isPremium && planId === "premium")
    return "border-teal-300/20 bg-teal-400/[0.08] text-teal-100/80";
  if (planId === "starter")
    return "border-amber-300/20 bg-amber-400/[0.08] text-amber-100/80";
  return "border-white/[0.08] bg-white/[0.03] text-white/50";
}

export function AdminUsersPanel({ initialUsers, adminEmail }: AdminUsersPanelProps) {
  const router = useRouter();
  const shouldReduceMotion = Boolean(useReducedMotion());
  const [users, setUsers] = useState<AdminUserView[]>(initialUsers);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingDeleteUserId, setPendingDeleteUserId] = useState<string | null>(null);
  const [deleteConfirmEmailByUserId, setDeleteConfirmEmailByUserId] = useState<
    Record<string, string>
  >({});
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");


  // Promo management state
  type PromoStatus = { promoActive: boolean; latestArchive: null | { id: string; endedAt: string; endedBy: string; affectedUsers: number; notifiedUsers: number; canRollback: boolean; rolledBackAt: string | null } };
  const [promoStatus, setPromoStatus] = useState<PromoStatus | null>(null);
  const [isEndingPromo, setIsEndingPromo] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [promoNotice, setPromoNotice] = useState("");
  const [promoError, setPromoError] = useState("");

  useEffect(() => {
    void fetch("/api/admin/promo/status").then(r => r.json()).then((data: PromoStatus) => setPromoStatus(data)).catch(() => null);
  }, []);
  const sortedUsers = useMemo(
    () =>
      [...users].sort((first, second) =>
        first.email.toLowerCase().localeCompare(second.email.toLowerCase()),
      ),
    [users],
  );

  async function refreshUsers() {
    setIsRefreshing(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "GET",
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => null)) as
        | { users?: AdminUserView[]; error?: string }
        | null;

      if (!response.ok) {
        setError(payload?.error ?? "Unable to refresh users.");
        return;
      }

      setUsers(payload?.users ?? []);
      setNotice("User list refreshed.");
    } finally {
      setIsRefreshing(false);
    }
  }

  async function endPromo() {
    setPromoError(""); setPromoNotice(""); setIsEndingPromo(true);
    try {
      const r = await fetch("/api/admin/promo/end", { method: "POST" });
      const data = (await r.json()) as { ok?: boolean; error?: string; archiveId?: string; report?: { affectedUsers: number; notifiedUsers: number; durationMs: number } };
      if (!r.ok) { setPromoError(data.error ?? "Failed to end promo."); return; }
      setPromoNotice(`Promo ended. ${data.report?.affectedUsers ?? 0} users affected, ${data.report?.notifiedUsers ?? 0} notified. Archive: ${data.archiveId ?? ""}`);
      const status = await fetch("/api/admin/promo/status").then(res => res.json()) as typeof promoStatus;
      setPromoStatus(status);
    } finally { setIsEndingPromo(false); }
  }

  async function rollbackPromoAction(archiveId: string) {
    setPromoError(""); setPromoNotice(""); setIsRollingBack(true);
    try {
      const r = await fetch("/api/admin/promo/rollback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ archiveId }) });
      const data = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok) { setPromoError(data.error ?? "Rollback failed."); return; }
      setPromoNotice("Promo re-enabled successfully.");
      const status = await fetch("/api/admin/promo/status").then(res => res.json()) as typeof promoStatus;
      setPromoStatus(status);
    } finally { setIsRollingBack(false); }
  }

  async function deleteUser(user: AdminUserView) {
    setError("");
    setNotice("");

    const confirmationInput = (deleteConfirmEmailByUserId[user.userId] ?? "")
      .trim()
      .toLowerCase();

    if (confirmationInput !== user.email.trim().toLowerCase()) {
      setError("Type the exact user email before deletion.");
      return;
    }

    setPendingDeleteUserId(user.userId);

    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(user.userId)}`, {
        method: "DELETE",
        headers: {
          "x-admin-intent": "delete-user",
        },
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setError(payload?.error ?? "Unable to delete user.");
        return;
      }

      setUsers((current) => current.filter((item) => item.userId !== user.userId));
      setDeleteConfirmEmailByUserId((current) => {
        const next = { ...current };
        delete next[user.userId];
        return next;
      });
      setNotice(`User ${user.email} has been deleted.`);
      
      // Refresh the page data from the server to ensure consistency
      router.refresh();
    } finally {
      setPendingDeleteUserId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-8 sm:px-10 sm:py-10 lg:px-12">
      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-6xl"
      >
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-white/58 transition-colors hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Link>

        <section className="soft-panel mt-6 rounded-[32px] p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-teal-200/72">
                Admin Control
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
                User management
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">
                This page is restricted by server-side allowlist, authenticated session checks,
                and protected deletion endpoints.
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.22em] text-white/34">
                Signed in as {adminEmail}
              </p>
            </div>

            <PremiumButton
              type="button"
              onClick={() => void refreshUsers()}
              disabled={isRefreshing}
              className="h-12 px-5 text-sm"
              icon={
                isRefreshing ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <RefreshCcw className="size-4" />
                )
              }
            >
              {isRefreshing ? "Refreshing..." : "Refresh users"}
            </PremiumButton>
          </div>

          {notice ? (
            <p className="mt-4 rounded-[16px] border border-emerald-300/18 bg-emerald-400/[0.08] px-4 py-3 text-sm text-emerald-100/90">
              {notice}
            </p>
          ) : null}
          {error ? (
            <p className="mt-4 rounded-[16px] border border-amber-300/18 bg-amber-400/[0.08] px-4 py-3 text-sm text-amber-100/90">
              {error}
            </p>
          ) : null}
        </section>

        {/* ── Promo Management ────────────────────────────────────── */}
        <section className="soft-panel mt-6 rounded-[32px] p-6 sm:p-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-teal-200/72">Launch Campaign</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">Promotional Period</h2>
          <div className="mt-4 flex items-center gap-3">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${promoStatus?.promoActive ? "border-teal-300/20 bg-teal-400/10 text-teal-100" : "border-red-300/20 bg-red-400/10 text-red-100"}`}>
              {promoStatus?.promoActive ? <CheckCircle2 className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
              {promoStatus === null ? "Loading..." : promoStatus.promoActive ? "Active" : "Ended"}
            </span>
          </div>

          {promoNotice && <p className="mt-4 rounded-[14px] border border-emerald-300/18 bg-emerald-400/[0.08] px-4 py-3 text-sm text-emerald-100/90">{promoNotice}</p>}
          {promoError && <p className="mt-4 rounded-[14px] border border-amber-300/18 bg-amber-400/[0.08] px-4 py-3 text-sm text-amber-100/90">{promoError}</p>}

          {promoStatus?.latestArchive && (
            <div className="mt-4 rounded-[18px] border border-white/[0.07] bg-white/[0.02] p-4 text-sm text-white/70 space-y-1">
              <p><span className="text-white/40">Ended at:</span> {new Date(promoStatus.latestArchive.endedAt).toLocaleString()}</p>
              <p><span className="text-white/40">Ended by:</span> {promoStatus.latestArchive.endedBy}</p>
              <p><span className="text-white/40">Affected users:</span> {promoStatus.latestArchive.affectedUsers}</p>
              <p><span className="text-white/40">Notified:</span> {promoStatus.latestArchive.notifiedUsers}</p>
              {promoStatus.latestArchive.rolledBackAt && <p className="text-teal-300/80">Rolled back at: {new Date(promoStatus.latestArchive.rolledBackAt).toLocaleString()}</p>}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            {promoStatus?.promoActive && (
              <Button type="button" variant="ghost" onClick={() => void endPromo()} disabled={isEndingPromo}
                className="h-11 rounded-[14px] border border-red-300/22 bg-red-400/[0.08] px-5 text-sm text-red-100 hover:bg-red-400/[0.12]">
                {isEndingPromo ? <LoaderCircle className="size-4 animate-spin" /> : <Power className="size-4" />}
                {isEndingPromo ? "Ending..." : "End Promo"}
              </Button>
            )}
            {promoStatus?.latestArchive?.canRollback && (
              <Button type="button" variant="ghost" onClick={() => void rollbackPromoAction(promoStatus!.latestArchive!.id)} disabled={isRollingBack}
                className="h-11 rounded-[14px] border border-teal-300/22 bg-teal-400/[0.06] px-5 text-sm text-teal-100 hover:bg-teal-400/[0.10]">
                {isRollingBack ? <LoaderCircle className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
                {isRollingBack ? "Rolling back..." : "Rollback (within 24h)"}
              </Button>
            )}
          </div>
        </section>

        <section className="soft-panel mt-6 rounded-[32px] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-teal-200/72">
                Accounts
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
                Registered users ({sortedUsers.length})
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-300/16 bg-red-400/[0.08] px-3 py-1.5 text-xs font-medium text-red-100/86">
              <ShieldAlert className="size-4" />
              High-risk action zone
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {sortedUsers.map((user) => {
              const isDeleting = pendingDeleteUserId === user.userId;
              const planLabel = formatPlanLabel(user.planId, user.isPremium);

              return (
                <div
                  key={user.userId}
                  className="rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-white/72">
                        <UserRound className="size-4" />
                        {user.name}
                      </div>
                      <p className="text-sm text-white/82">{user.email}</p>
                      <p className="text-xs text-white/48">
                        Created: {formatDate(user.createdAt)} &middot; <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${formatPlanBadgeColor(user.planId, user.isPremium)}`}>{planLabel}</span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {user.signInMethods.length > 0 ? (
                          user.signInMethods.map((method) => (
                            <span
                              key={`${user.userId}-${method}`}
                              className="rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1 text-xs text-white/66"
                            >
                              {method === "google" ? "Google" : "Password"}
                            </span>
                          ))
                        ) : (
                          <span className="rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1 text-xs text-white/66">
                            Unknown method
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="w-full max-w-md space-y-3 rounded-[18px] border border-white/[0.08] bg-black/25 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/38">
                        Deletion confirmation
                      </p>
                      <p className="text-xs text-white/54">
                        Type this user email exactly to enable deletion.
                      </p>
                      <input
                        type="text"
                        value={deleteConfirmEmailByUserId[user.userId] ?? ""}
                        onChange={(event) =>
                          setDeleteConfirmEmailByUserId((current) => ({
                            ...current,
                            [user.userId]: event.target.value,
                          }))
                        }
                        className="soft-input h-11 w-full rounded-[14px] px-4 text-sm"
                        placeholder={user.email}
                        autoComplete="off"
                        spellCheck={false}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => void deleteUser(user)}
                        disabled={isDeleting}
                        className="h-11 w-full rounded-[14px] border border-red-300/22 bg-red-400/[0.08] px-4 text-sm text-red-100 hover:bg-red-400/[0.12] hover:text-red-50"
                      >
                        {isDeleting ? (
                          <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                        {isDeleting ? "Deleting..." : "Delete user"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </motion.div>
    </main>
  );
}
