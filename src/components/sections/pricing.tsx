"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BadgeCheck, ShieldCheck, Sparkles } from "lucide-react";

import { AuthAwarePremiumButton } from "@/components/auth/auth-aware-premium-button";
import type { LaunchCampaignSnapshot } from "@/lib/launch-campaign";

const planFeatures = [
  "Privacy Policy + Terms of Service",
  "Automatic legal update monitoring",
  "Version history and policy refreshes",
  "Publish-ready documents for SaaS products",
];

type PricingSectionProps = {
  launchSnapshot: LaunchCampaignSnapshot;
};

export function PricingSection({ launchSnapshot }: PricingSectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const pricingSupportCopy = launchSnapshot.freeGenerationClosed
    ? "The complimentary launch batch has closed. New accounts unlock full document generation through premium checkout."
    : `${launchSnapshot.freeSpotsRemaining} complimentary launch spot${launchSnapshot.freeSpotsRemaining === 1 ? "" : "s"} remain for first-time accounts, then premium starts at $29/mo.`;
  const pricingCtaLabel = launchSnapshot.freeGenerationClosed
    ? "Unlock PolicyPack"
    : "Claim Launch Access";

  return (
    <section id="pricing" className="scroll-mt-24 bg-zinc-950 py-24 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-teal-200/70">
            Pricing
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
            One plan. Everything needed to stay compliant.
          </h2>
          <p className="mt-4 text-base leading-7 text-white/62">
            A simple monthly subscription for founders and product teams that
            need legal documents without hiring outside counsel for every update.
          </p>
          <p className="mt-3 text-sm leading-7 text-white/48">
            {pricingSupportCopy}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="soft-panel mx-auto mt-14 max-w-xl rounded-[28px] p-6 sm:p-8"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-[11px] font-medium uppercase tracking-[0.28em] text-teal-100/76">
              <Sparkles className="size-4 text-teal-200" />
              Core plan
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-100">
              <ShieldCheck className="size-4" />
              Cancel anytime
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-end justify-center gap-2 sm:justify-start">
              <span className="text-5xl font-semibold tracking-[-0.06em] text-white">
                $29
              </span>
              <span className="pb-1 text-base text-white/58">/mo</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-white/58">
              Built for one product team that wants clean, up-to-date legal
              documents without heavy legal overhead.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {planFeatures.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-3 rounded-[18px] border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white/74"
              >
                <BadgeCheck className="size-4 shrink-0 text-teal-200" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 sm:items-start">
            <AuthAwarePremiumButton
              authenticatedHref="/onboarding"
              callbackHref="/onboarding"
              className="h-12 px-5 text-sm sm:text-base"
            >
              {pricingCtaLabel}
            </AuthAwarePremiumButton>
            <p className="text-sm text-white/48">
              {launchSnapshot.freeGenerationClosed
                ? "No setup fee. No annual contract required."
                : "One complimentary draft for launch users. No annual contract required."}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
