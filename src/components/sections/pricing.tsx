"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BadgeCheck, Coins, ShieldCheck, Sparkles } from "lucide-react";

import { AuthAwarePremiumButton } from "@/components/auth/auth-aware-premium-button";
import type { LaunchCampaignSnapshot } from "@/lib/launch-campaign";

const starterPlanFeatures = [
  "Choose any 3 core pages",
  "One-time generation only",
  "No recurring updates or monitoring",
  "Best for basic launches or simple brochure sites",
];

const premiumPlanFeatures = [
  "All core legal and compliance pages",
  "Automatic legal update monitoring",
  "Version history and policy refreshes",
  "Built for SaaS products, billing, and growth",
];

type PricingSectionProps = {
  launchSnapshot: LaunchCampaignSnapshot;
};

export function PricingSection({ launchSnapshot }: PricingSectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const pricingSupportCopy = launchSnapshot.freeGenerationClosed
    ? "Research benchmark: low-end policy tools cluster around $8-$15/mo, while one-time policy pricing often stacks quickly per document. We position PolicyPack with a simpler one-time starter and a higher-trust premium plan."
    : `${launchSnapshot.freeSpotsRemaining} complimentary launch spot${launchSnapshot.freeSpotsRemaining === 1 ? "" : "s"} remain for first-time accounts. After that, pick a one-time starter pack or the full premium workspace.`;

  return (
    <section
      id="pricing"
      className="scroll-mt-24 border-y border-white/10 bg-zinc-950 py-16 sm:py-20"
    >
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
            Choose simple one-time pages or the full compliance layer.
          </h2>
          <p className="mt-4 text-base leading-7 text-white/62">
            Founders who only need the basics should not be forced into ongoing
            monitoring, while serious SaaS teams still need the full approval-ready stack.
          </p>
          <p className="mt-3 text-sm leading-7 text-white/48">
            {pricingSupportCopy}
          </p>
        </motion.div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="soft-panel flex h-full flex-col rounded-[28px] p-6 sm:p-8"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-[11px] font-medium uppercase tracking-[0.28em] text-white/76">
                <Coins className="size-4 text-white/72" />
                Starter pages
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-white/64">
                One-time
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-end gap-2">
                <span className="text-5xl font-semibold tracking-[-0.06em] text-white">
                  $39
                </span>
                <span className="pb-1 text-base text-white/58">once</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/58">
                For founders who just need a clean launch with the three most
                important pages and do not need ongoing monitoring.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {starterPlanFeatures.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-3 rounded-[18px] border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white/74"
                >
                  <BadgeCheck className="size-4 shrink-0 text-white/72" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-1 flex-col justify-end gap-3">
              <AuthAwarePremiumButton
                authenticatedHref="/dashboard"
                callbackHref="/dashboard"
                className="h-12 px-5 text-sm sm:text-base"
              >
                Get 3 pages
              </AuthAwarePremiumButton>
              <p className="text-sm text-white/48">
                Good fit for simple sites, waitlists, and early launches.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="soft-panel flex h-full flex-col rounded-[28px] border border-teal-300/18 p-6 shadow-[0_24px_60px_-34px_rgba(45,212,191,0.28)] sm:p-8"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-300/18 bg-teal-300/10 px-3.5 py-2 text-[11px] font-medium uppercase tracking-[0.28em] text-teal-100/80">
                <Sparkles className="size-4 text-teal-200" />
                Premium workspace
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-100">
                <ShieldCheck className="size-4" />
                Best for SaaS
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-end gap-2">
                <span className="text-5xl font-semibold tracking-[-0.06em] text-white">
                  $29
                </span>
                <span className="pb-1 text-base text-white/58">/mo</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/58">
                For teams that need all pages, better launch readiness, and
                ongoing alerts when platform rules or privacy requirements shift.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {premiumPlanFeatures.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-3 rounded-[18px] border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white/74"
                >
                  <BadgeCheck className="size-4 shrink-0 text-teal-200" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-1 flex-col justify-end gap-3">
              <AuthAwarePremiumButton
                authenticatedHref="/dashboard"
                callbackHref="/dashboard"
                className="h-12 px-5 text-sm sm:text-base"
              >
                {launchSnapshot.freeGenerationClosed
                  ? "Unlock premium"
                  : "Claim premium access"}
              </AuthAwarePremiumButton>
              <p className="text-sm text-white/48">
                {launchSnapshot.freeGenerationClosed
                  ? "No setup fee. No annual contract required."
                  : "Launch users still claim the free slot first, then continue on premium if needed."}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
