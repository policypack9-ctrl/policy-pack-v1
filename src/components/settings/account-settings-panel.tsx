"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  CreditCard,
  LoaderCircle,
  LockKeyhole,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { PremiumButton } from "@/components/ui/premium-button";
import { clearPolicyWorkspace } from "@/lib/db";
import { formatDisplayDateTime } from "@/lib/policy-engine";

type AccountSettingsPanelProps = {
  displayName: string;
  email: string;
  planId: string;
  isPremium: boolean;
  billingStatus: string;
  premiumUnlockedAt: string | null;
  currentPeriodEndsAt: string | null;
  createdAt: string | null;
  signInMethods: Array<"password" | "google">;
  canChangePassword: boolean;
};

const signInMethodLabels = {
  password: "Email & Password",
  google: "Google",
} as const;

function getPlanLabel(planId: string) {
  if (planId === "starter") return "Starter";
  if (planId === "premium") return "Premium";
  return "Free";
}

function getBillingLabel(billingStatus: string, isPremium: boolean) {
  switch (billingStatus) {
    case "one_time":
      return "One-time access active";
    case "active":
      return "Subscription active";
    case "trialing":
      return "Trial active";
    case "canceled":
      return isPremium ? "Access active until period end" : "Subscription canceled";
    case "past_due":
      return "Payment past due";
    case "paused":
      return "Subscription paused";
    case "refunded":
      return "Refunded";
    case "chargeback":
      return "Chargeback";
    default:
      return isPremium ? "Access active" : "Free access";
  }
}

export function AccountSettingsPanel({
  displayName,
  email,
  planId,
  isPremium,
  billingStatus,
  premiumUnlockedAt,
  currentPeriodEndsAt,
  createdAt,
  signInMethods,
  canChangePassword,
}: AccountSettingsPanelProps) {
  const router = useRouter();
  const { update } = useSession();
  const shouldReduceMotion = Boolean(useReducedMotion());
  const [name, setName] = useState(displayName);
  const [profileNotice, setProfileNotice] = useState("");
  const [profileError, setProfileError] = useState("");
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordNotice, setPasswordNotice] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const planLabel = getPlanLabel(planId);
  const billingLabel = getBillingLabel(billingStatus, isPremium);

  async function handleProfileSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileNotice("");
    setProfileError("");
    setIsProfileSaving(true);

    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: name,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; message?: string; profile?: { name?: string } }
        | null;

      if (!response.ok) {
        setProfileError(payload?.error ?? "Unable to save your changes right now.");
        return;
      }

      const nextName = payload?.profile?.name?.trim() || name.trim();
      setName(nextName);
      await update({ name: nextName });
      router.refresh();
      setProfileNotice(payload?.message ?? "Your changes have been saved.");
    } finally {
      setIsProfileSaving(false);
    }
  }

  async function handlePasswordSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordNotice("");
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Your new passwords do not match.");
      return;
    }

    setIsPasswordSaving(true);

    try {
      const response = await fetch("/api/account/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;

      if (!response.ok) {
        setPasswordError(payload?.error ?? "Unable to update your password.");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordNotice(payload?.message ?? "Your password has been updated.");
    } finally {
      setIsPasswordSaving(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteError("");

    if (deletePhrase.trim().toUpperCase() !== "DELETE") {
      setDeleteError("Type DELETE to confirm account removal.");
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setDeleteError(payload?.error ?? "Unable to delete your account.");
        return;
      }

      clearPolicyWorkspace();
      await signOut({ redirectTo: "/" });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-8 sm:px-10 sm:py-10 lg:px-12">
      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-5xl"
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
                Settings
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
                Manage your account
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">
                Update your profile, review your plan, and control the information
                stored in your personal workspace.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <div
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium ${
                  isPremium
                    ? "border border-emerald-400/14 bg-emerald-400/10 text-emerald-100"
                    : "border border-white/[0.08] bg-white/[0.03] text-white/72"
                }`}
              >
                {isPremium ? (
                  <BadgeCheck className="size-4" />
                ) : (
                  <LockKeyhole className="size-4" />
                )}
                {`Plan: ${planLabel}`}
              </div>
              <p className="text-xs uppercase tracking-[0.22em] text-white/34">
                Member since {formatDisplayDateTime(createdAt ?? new Date().toISOString())}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.85fr)]">
          <section className="soft-panel rounded-[32px] p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-11 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-teal-200">
                <UserRound className="size-5" />
              </span>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/44">
                  Profile Information
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
                  Your public account details
                </h2>
              </div>
            </div>

            <form onSubmit={handleProfileSave} className="mt-8 space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-medium uppercase tracking-[0.22em] text-white/46">
                  Display name
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="soft-input h-12 w-full rounded-[18px] px-4 text-sm"
                  placeholder="Your team name"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-medium uppercase tracking-[0.22em] text-white/46">
                  Email
                </span>
                <input
                  type="email"
                  value={email}
                  disabled
                  readOnly
                  className="soft-input h-12 w-full rounded-[18px] px-4 text-sm text-white/54"
                />
              </label>

              <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/42">
                  Sign-in methods
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {signInMethods.map((method) => (
                    <span
                      key={method}
                      className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-sm text-white/72"
                    >
                      {signInMethodLabels[method]}
                    </span>
                  ))}
                </div>
              </div>

              {profileError ? (
                <div className="rounded-[18px] border border-amber-300/14 bg-amber-300/[0.06] px-4 py-3 text-sm text-amber-50/90">
                  {profileError}
                </div>
              ) : null}
              {profileNotice ? (
                <div className="rounded-[18px] border border-emerald-300/14 bg-emerald-300/[0.08] px-4 py-3 text-sm text-emerald-50/88">
                  {profileNotice}
                </div>
              ) : null}

              <PremiumButton
                type="submit"
                disabled={isProfileSaving}
                className="h-11 px-5 text-sm"
                icon={
                  isProfileSaving ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <UserRound className="size-4" />
                  )
                }
              >
                {isProfileSaving ? "Saving..." : "Save changes"}
              </PremiumButton>
            </form>
          </section>

          <div className="space-y-6">
            <section className="soft-panel rounded-[32px] p-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/44">
                Subscription Management
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
                Your current plan
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/60">
                {isPremium
                  ? `${planLabel} access is active and document downloads are available now.`
                  : "You can review and save your documents now, then unlock downloads any time from the dashboard."}
              </p>

              <div className="mt-5 rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/72">
                  {isPremium ? (
                    <BadgeCheck className="size-4 text-emerald-200" />
                  ) : (
                    <CreditCard className="size-4 text-teal-200" />
                  )}
                  {billingLabel}
                </div>
                <p className="mt-4 text-sm text-white/58">
                  {billingStatus === "canceled" && currentPeriodEndsAt
                    ? `Access remains available until ${formatDisplayDateTime(currentPeriodEndsAt)}`
                    : isPremium && premiumUnlockedAt
                      ? `Unlocked on ${formatDisplayDateTime(premiumUnlockedAt)}`
                      : "Manage upgrades and document downloads from your dashboard."}
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push("/dashboard")}
                className="mt-5 h-11 rounded-[18px] border border-white/[0.08] bg-white/[0.02] px-4 text-sm text-white/72 hover:bg-white/[0.05] hover:text-white"
              >
                {isPremium ? "Back to documents" : "Manage plan on dashboard"}
              </Button>
            </section>

            {canChangePassword ? (
              <section className="soft-panel rounded-[32px] p-6">
                <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/44">
                  Security
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
                  Change password
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/60">
                  Keep your account secure with a fresh password whenever your team
                  needs it.
                </p>

                <form onSubmit={handlePasswordSave} className="mt-6 space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-xs font-medium uppercase tracking-[0.22em] text-white/46">
                      Current password
                    </span>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      className="soft-input h-12 w-full rounded-[18px] px-4 text-sm"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-medium uppercase tracking-[0.22em] text-white/46">
                      New password
                    </span>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      className="soft-input h-12 w-full rounded-[18px] px-4 text-sm"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-medium uppercase tracking-[0.22em] text-white/46">
                      Confirm new password
                    </span>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className="soft-input h-12 w-full rounded-[18px] px-4 text-sm"
                    />
                  </label>

                  {passwordError ? (
                    <div className="rounded-[18px] border border-amber-300/14 bg-amber-300/[0.06] px-4 py-3 text-sm text-amber-50/90">
                      {passwordError}
                    </div>
                  ) : null}
                  {passwordNotice ? (
                    <div className="rounded-[18px] border border-emerald-300/14 bg-emerald-300/[0.08] px-4 py-3 text-sm text-emerald-50/88">
                      {passwordNotice}
                    </div>
                  ) : null}

                  <PremiumButton
                    type="submit"
                    disabled={isPasswordSaving}
                    className="h-11 px-5 text-sm"
                    icon={
                      isPasswordSaving ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <LockKeyhole className="size-4" />
                      )
                    }
                  >
                    {isPasswordSaving ? "Updating..." : "Update password"}
                  </PremiumButton>
                </form>
              </section>
            ) : null}

            <section className="soft-panel rounded-[32px] p-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-amber-100/64">
                Danger Zone
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
                Delete account
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/60">
                This permanently removes your profile, saved documents, and billing
                access from PolicyPack.
              </p>

              <label className="mt-5 block">
                <span className="mb-2 block text-xs font-medium uppercase tracking-[0.22em] text-white/46">
                  Type DELETE to confirm
                </span>
                <input
                  type="text"
                  value={deletePhrase}
                  onChange={(event) => setDeletePhrase(event.target.value)}
                  className="soft-input h-12 w-full rounded-[18px] px-4 text-sm"
                  placeholder="DELETE"
                />
              </label>

              {deleteError ? (
                <div className="mt-4 rounded-[18px] border border-amber-300/14 bg-amber-300/[0.06] px-4 py-3 text-sm text-amber-50/90">
                  {deleteError}
                </div>
              ) : null}

              <Button
                type="button"
                variant="ghost"
                onClick={() => void handleDeleteAccount()}
                disabled={isDeleting}
                className="mt-5 h-11 rounded-[18px] border border-amber-300/14 bg-amber-300/[0.08] px-4 text-sm text-amber-50 hover:bg-amber-300/[0.12] hover:text-white disabled:opacity-70"
              >
                {isDeleting ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <ShieldAlert className="size-4" />
                )}
                {isDeleting ? "Deleting..." : "Delete account"}
              </Button>
            </section>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
