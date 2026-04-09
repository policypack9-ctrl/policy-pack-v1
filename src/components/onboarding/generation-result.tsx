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
import {
  loadStoredPolicySession,
  loadUnlockState,
  saveUnlockState,
} from "@/lib/db";
import {
  normalizeAnswers,
  resolvePrimaryRegion,
  type StoredPolicySession,
} from "@/lib/policy-engine";

export function GenerationResult() {
  const router = useRouter();
  const shouldReduceMotion = Boolean(useReducedMotion());
  const { data: session } = useSession();
  const [storedSession, setStoredSession] = useState<StoredPolicySession | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockLabel, setUnlockLabel] = useState<string>("Simulated Paddle checkout");

  useEffect(() => {
    setStoredSession(loadStoredPolicySession());
  }, []);

  const answers = useMemo(
    () => normalizeAnswers(storedSession?.answers),
    [storedSession],
  );
  const unlockState = useMemo(() => loadUnlockState(), []);
  const productName = answers.businessName || "PolicyPack";
  const region = resolvePrimaryRegion(answers);

  async function handleUnlock() {
    setIsUnlocking(true);

    try {
      const response = await fetch("/api/checkout/paddle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: session?.user?.email ?? null,
          productName,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to initialize Paddle checkout.");
      }

      const payload = (await response.json()) as {
        providerMode?: string;
        message?: string;
      };

      saveUnlockState("simulated-paddle");
      setUnlockLabel(payload.message ?? "Policy unlocked");
      router.push(session?.user ? "/dashboard" : "/login?callbackUrl=/dashboard");
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
          transition={{ duration: shouldReduceMotion ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
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
                The first draft is ready for {region}. Unlock the dashboard to review
                documents, save your workspace, and export the final PDF bundle.
              </p>
            </div>

            <div className="rounded-[26px] border border-white/[0.08] bg-white/[0.02] p-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/14 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.24em] text-emerald-100">
                <BadgeCheck className="size-4" />
                Draft complete
              </div>
              <p className="mt-4 text-sm leading-7 text-white/60">
                {unlockState?.unlocked
                  ? "This browser already has an unlocked checkout simulation."
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
                  "Privacy Policy, Terms of Service, Cookie Policy, and GDPR addendum workspace",
                  "Authenticated dashboard access with live document viewing",
                  "Formal PDF export flow through the production print renderer",
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
                <LockKeyhole className="size-5" />
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-white">
                Pay to Unlock
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/60">
                Paddle is wired in placeholder mode. This button simulates the production
                checkout architecture so the launch flow is ready for real pricing.
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
                    ) : (
                      <CreditCard className="size-4" />
                    )
                  }
                >
                  {isUnlocking ? "Launching checkout..." : "Pay to Unlock"}
                </PremiumButton>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push("/dashboard")}
                  className="h-12 w-full rounded-[18px] border border-white/[0.08] bg-white/[0.02] px-5 text-sm text-white/72 hover:bg-white/[0.05] hover:text-white"
                >
                  <ShieldCheck className="size-4" />
                  Continue to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
