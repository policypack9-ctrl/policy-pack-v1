"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  CreditCard,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { PremiumButton } from "@/components/ui/premium-button";
import { PlanSelectionDialog } from "@/components/billing/plan-selection-dialog";
import { loadStoredPolicySession } from "@/lib/db";
import { type BillingPlanId } from "@/lib/billing-plans";
import type { LaunchCampaignSnapshot } from "@/lib/launch-campaign";
import {
  normalizeAnswers,
  resolvePrimaryRegion,
  type StoredPolicySession,
} from "@/lib/policy-engine";

type GenerationResultProps = {
  initialLaunchSnapshot: LaunchCampaignSnapshot;
};

export function GenerationResult({
  initialLaunchSnapshot,
}: GenerationResultProps) {
  const router = useRouter();
  const shouldReduceMotion = Boolean(useReducedMotion());
  const { data: session, status, update } = useSession();
  const [storedSession, setStoredSession] = useState<StoredPolicySession | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockLabel, setUnlockLabel] = useState<string>(
    "Your package choices are ready for this account.",
  );
  const [isPremium, setIsPremium] = useState(false);
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);

  useEffect(() => {
    setStoredSession(loadStoredPolicySession());
  }, []);

  useEffect(() => {
    setIsPremium(Boolean(session?.user?.isPremium));
  }, [session?.user?.isPremium]);

  const answers = useMemo(
    () => normalizeAnswers(storedSession?.answers),
    [storedSession],
  );
  const productName = answers.businessName || "PolicyPack";
  const region = resolvePrimaryRegion(answers);
  const canClaimComplimentaryDocument =
    !isPremium && initialLaunchSnapshot.canGenerateComplimentaryDocument;
  const unlockHeading = canClaimComplimentaryDocument
    ? "Your launch access is still available."
    : initialLaunchSnapshot.freeGenerationClosed
      ? "Complimentary launch access is closed."
      : "Your complimentary draft has already been used.";
  const unlockSummary = canClaimComplimentaryDocument
    ? "This account is inside the launch cohort and can still generate one complimentary document before billing becomes required."
    : initialLaunchSnapshot.freeGenerationClosed
      ? "The first 50 complimentary launch accounts have been claimed. New workspaces now choose a package before generation starts."
      : "Your account already used its complimentary launch document. Choose a package to unlock the rest of the legal stack.";

  async function handleUnlock(planId?: BillingPlanId) {
    if (status === "loading") {
      return;
    }

    if (!session?.user) {
      router.push("/register?callbackUrl=/dashboard");
      return;
    }

    if (isPremium || canClaimComplimentaryDocument) {
      router.push("/dashboard");
      return;
    }

    if (!planId) {
      setIsPlanDialogOpen(true);
      return;
    }

    setIsUnlocking(true);

    try {
      const response = await fetch("/api/checkout/paddle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: session.user.email ?? null,
          productName,
          planId,
        }),
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as
          | { error?: string; details?: string }
          | null;
        setUnlockLabel(
          errorPayload?.error ??
            errorPayload?.details ??
            "Unable to initialize billing.",
        );
        return;
      }

      const payload = (await response.json()) as {
        checkoutUrl?: string | null;
        message?: string;
        premiumUnlocked?: boolean;
      };

      setUnlockLabel(payload.message ?? "Policy unlocked");
      setIsPlanDialogOpen(false);
      if (payload.checkoutUrl) {
        window.location.assign(payload.checkoutUrl);
        return;
      }

      if (payload.premiumUnlocked) {
        setIsPremium(true);
        await update();
        router.push("/dashboard");
      }
    } finally {
      setIsUnlocking(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-8 sm:px-10 sm:py-10 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-white/58 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-4" />
            Back to landing page
          </Link>
          <div className="text-sm text-white/44">Generation Result</div>
        </div>

        <motion.section
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.42,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="soft-panel rounded-[32px] p-6 sm:p-8"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-teal-200/72">
                PolicyPack Ready
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
                Your legal stack for {productName} is prepared.
              </h1>
              <p className="mt-4 text-sm leading-7 text-white/62">
                The first draft is ready for {region}. Continue to the dashboard to
                review document status, save your workspace, and unlock exports when
                needed.
              </p>
            </div>

            <div className="rounded-[26px] border border-white/[0.08] bg-white/[0.02] p-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/14 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.24em] text-emerald-100">
                <BadgeCheck className="size-4" />
                Draft complete
              </div>
              <p className="mt-4 text-sm leading-7 text-white/60">
                {isPremium
                  ? "This account already has download access."
                  : canClaimComplimentaryDocument
                    ? unlockSummary
                    : unlockLabel}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
              <p className="text-[11px] uppercase tracking-[0.26em] text-white/42">
                What unlocks
              </p>
              <div className="mt-4 space-y-3">
                  {[
                    canClaimComplimentaryDocument
                      ? "One complimentary launch document is still available on this account"
                      : "Choose a package before new document generation begins",
                    "A personal dashboard with live document viewing and saved workspace history",
                    "Polished PDF downloads unlock right after payment",
                  ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[20px] border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white/70"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
              <div className="inline-flex size-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-teal-200">
                {canClaimComplimentaryDocument ? (
                  <ShieldCheck className="size-5" />
                ) : (
                  <LockKeyhole className="size-5" />
                )}
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-white">
                {unlockHeading}
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/60">
                {unlockSummary}
              </p>

              <div className="mt-6 space-y-3">
                <PremiumButton
                  type="button"
                  onClick={() => void handleUnlock()}
                  disabled={isUnlocking}
                  className="w-full justify-center"
                  icon={
                    isUnlocking ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : !session?.user ? (
                      <ShieldCheck className="size-4" />
                    ) : isPremium ? (
                      <ShieldCheck className="size-4" />
                    ) : canClaimComplimentaryDocument ? (
                      <BadgeCheck className="size-4" />
                    ) : (
                      <CreditCard className="size-4" />
                    )
                  }
                >
                    {isUnlocking
                    ? "Opening billing..."
                    : !session?.user
                      ? initialLaunchSnapshot.freeGenerationClosed
                        ? "Create Account to Continue"
                        : "Create Account to Claim Free Spot"
                      : isPremium
                        ? "Go to Dashboard"
                        : canClaimComplimentaryDocument
                          ? "Open My Complimentary Document"
                          : "Choose a Package"}
                </PremiumButton>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    session?.user
                      ? router.push("/dashboard")
                      : router.push("/login?callbackUrl=/dashboard")
                  }
                  className="h-12 w-full rounded-[18px] border border-white/[0.08] bg-white/[0.02] px-5 text-sm text-white/72 hover:bg-white/[0.05] hover:text-white"
                >
                  <ShieldCheck className="size-4" />
                  {session?.user ? "Continue to Dashboard" : "Login Instead"}
                </Button>
              </div>
            </div>
          </div>
        </motion.section>
      </div>

      <PlanSelectionDialog
        isOpen={isPlanDialogOpen}
        onClose={() => setIsPlanDialogOpen(false)}
        onSelectPlan={(planId) => void handleUnlock(planId)}
        isSubmitting={isUnlocking}
        title="Choose the package you want to unlock"
        description="Pick the simpler one-time pack or the full workspace before continuing to billing."
      />
    </main>
  );
}
