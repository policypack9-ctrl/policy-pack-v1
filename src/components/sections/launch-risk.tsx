"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  AppWindow,
  ArrowRight,
  BadgeCheck,
  BellRing,
  CreditCard,
  FileCheck2,
  Globe2,
  LockKeyhole,
  Radar,
  ShieldAlert,
  ShieldCheck,
  Store,
  WalletCards,
} from "lucide-react";

import { AuthAwarePremiumButton } from "@/components/auth/auth-aware-premium-button";
import { Button } from "@/components/ui/button";
import type { LaunchCampaignSnapshot } from "@/lib/launch-campaign";
import { cn } from "@/lib/utils";

type PlatformKey =
  | "stripe"
  | "paddle"
  | "paypal"
  | "apple"
  | "googlePlay"
  | "website";
type MarketKey = "us" | "eu" | "uk" | "global";

const problemCards = [
  {
    title: "Payments can slow down or stop",
    description:
      "Missing legal pages can create friction during website verification, domain review, and payment onboarding.",
    icon: WalletCards,
    tag: "Stripe, Paddle, PayPal",
  },
  {
    title: "App launches can get rejected",
    description:
      "Apple and Google Play both expect public privacy disclosures before your app looks ready for distribution.",
    icon: AppWindow,
    tag: "Apple & Google Play",
  },
  {
    title: "Compliance risk compounds over time",
    description:
      "Privacy, cookie, and disclosure gaps do not stay harmless. They become risk the moment your product starts collecting data.",
    icon: ShieldAlert,
    tag: "GDPR, CCPA, Cookies",
  },
] as const;

const proofMetrics = [
  {
    label: "Payments",
    value: "Payouts can be paused",
  },
  {
    label: "App Stores",
    value: "Privacy Policy required",
  },
  {
    label: "UK GDPR",
    value: "Up to £17.5M / 4%",
  },
  {
    label: "CCPA",
    value: "Up to $7,988 intentional violation",
  },
] as const;

const platformOptions = {
  stripe: {
    label: "Stripe",
    icon: CreditCard,
    baseScore: 66,
    pages: [
      "Privacy Policy",
      "Terms of Service",
      "Refund Policy",
      "Contact / Support page",
    ],
    summary:
      "Verification friction increases when your website looks incomplete or hard to trust during onboarding.",
  },
  paddle: {
    label: "Paddle",
    icon: WalletCards,
    baseScore: 78,
    pages: [
      "Privacy Policy",
      "Terms of Service",
      "Refund Policy",
      "Contact / Support page",
    ],
    summary:
      "Paddle domain reviews expect clear legal and support information before billing feels trustworthy.",
  },
  paypal: {
    label: "PayPal",
    icon: CreditCard,
    baseScore: 72,
    pages: [
      "Privacy Policy",
      "Terms of Service",
      "Refund / Cancellation Policy",
      "Contact / Support page",
    ],
    summary:
      "Payment acceptance becomes harder when core legal and support pages are missing or hard to find.",
  },
  apple: {
    label: "Apple App Store",
    icon: Store,
    baseScore: 82,
    pages: [
      "Privacy Policy",
      "Contact / Support page",
      "Terms of Service",
    ],
    summary:
      "App review can stall if your privacy disclosures are incomplete or not clearly accessible to users.",
  },
  googlePlay: {
    label: "Google Play",
    icon: AppWindow,
    baseScore: 80,
    pages: [
      "Privacy Policy",
      "Contact / Support page",
      "Terms of Service",
    ],
    summary:
      "Google Play expects a public, active privacy policy and clearer user-data disclosures before distribution feels compliant.",
  },
  website: {
    label: "Website / SaaS Only",
    icon: Globe2,
    baseScore: 58,
    pages: [
      "Privacy Policy",
      "Terms of Service",
      "Contact / Support page",
    ],
    summary:
      "Even without app stores, missing legal pages weaken trust, due diligence readiness, and buyer confidence.",
  },
} as const;

const marketOptions = {
  us: {
    label: "United States",
    modifier: 10,
    pages: ["California / US privacy disclosures", "Refund Policy"],
    summary:
      "US launches need clearer privacy notice language, especially around California-style rights and disclosures.",
  },
  eu: {
    label: "European Union",
    modifier: 16,
    pages: [
      "Cookie Policy",
      "GDPR rights language",
      "International transfer disclosures",
    ],
    summary:
      "EU-facing products need stronger transparency around personal data use, cookies, and cross-border processing.",
  },
  uk: {
    label: "United Kingdom",
    modifier: 14,
    pages: [
      "Cookie Policy",
      "UK GDPR rights language",
      "International transfer disclosures",
    ],
    summary:
      "UK launches still need strong privacy, cookie, and rights language to avoid a weak compliance posture.",
  },
  global: {
    label: "Global",
    modifier: 18,
    pages: [
      "Cookie Policy",
      "Regional privacy rights disclosures",
      "International transfer disclosures",
    ],
    summary:
      "Global distribution compounds platform review and privacy disclosure complexity across multiple regions at once.",
  },
} as const;

type LaunchRiskSectionProps = {
  launchSnapshot: LaunchCampaignSnapshot;
};

export function LaunchRiskSection({
  launchSnapshot,
}: LaunchRiskSectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const primaryCtaLabel = launchSnapshot.freeGenerationClosed
    ? "Unlock Approval-Ready Pack"
    : "Generate My Approval-Ready Pack";

  return (
    <section
      id="launch-risk"
      className="scroll-mt-24 border-b border-white/[0.08] bg-[#0A0A0A] py-16 sm:py-20"
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-teal-200/70">
            Launch Risk
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
            The Hidden Cost of Missing Legal Pages
          </h2>
          <p className="mt-4 text-base leading-7 text-white/62 sm:text-lg">
            One missing Privacy Policy or Terms page can stall payouts, delay
            app approvals, and expose your startup to avoidable compliance
            risk.
          </p>
        </motion.div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {proofMetrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.45,
                delay: 0.05 + index * 0.04,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="rounded-[22px] border border-white/[0.08] bg-white/[0.02] px-4 py-4"
            >
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">
                {metric.label}
              </p>
              <p className="mt-2 text-sm font-medium leading-6 text-white">
                {metric.value}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <div className="grid gap-4">
            {problemCards.map((card, index) => {
              const Icon = card.icon;

              return (
                <motion.article
                  key={card.title}
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.48,
                    delay: 0.08 + index * 0.05,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="soft-panel rounded-[26px] p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-teal-200">
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">
                        {card.tag}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">
                        {card.title}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-white/62">
                        {card.description}
                      </p>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>

          <BlockedDashboardMock />
        </div>

        <div className="mt-10 grid gap-4 xl:grid-cols-[minmax(0,1.06fr)_minmax(320px,0.94fr)]">
          <LaunchRiskCalculator />

          <div className="grid gap-4">
            <div className="soft-panel rounded-[28px] p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-teal-200">
                  <FileCheck2 className="size-5" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-teal-200/72">
                    Approval-Ready
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
                    Approval-Ready. Not Generic.
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-white/62">
                    PolicyPack generates Privacy Policies, Terms, Cookie
                    Policies, Refund Policies, and support disclosures built
                    around public platform requirements and the review signals
                    teams see during payment and app onboarding.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  "Tuned to Paddle domain review expectations",
                  "Structured for Stripe-style verification friction",
                  "Prepared for Apple and Google Play privacy checks",
                  "Tailored to your market, product flow, and billing model",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[18px] border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm leading-6 text-white/72"
                  >
                    <span className="flex items-start gap-2">
                      <BadgeCheck className="mt-0.5 size-4 shrink-0 text-teal-200" />
                      <span>{item}</span>
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-5 text-xs leading-6 text-white/42">
                Built around public platform requirements and common review
                signals. Final approval still depends on your actual business
                practices and each platform&apos;s decision.
              </p>
            </div>

            <div className="soft-panel rounded-[28px] p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-teal-200">
                  <Radar className="size-5" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-teal-200/72">
                    Never Outdated
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
                    Automatic Updates & Alerts
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-white/62">
                    PolicyPack tracks relevant privacy and platform changes,
                    then alerts you when your pages may need attention. That
                    turns the product from a one-time generator into a
                    compliance partner.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {[
                  "Rule change detected",
                  "Affected pages highlighted",
                  "Updated draft prepared",
                  "Publish in minutes",
                ].map((item, index) => (
                  <div
                    key={item}
                    className="flex items-center justify-between rounded-[18px] border border-white/[0.08] bg-white/[0.02] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-xs font-medium text-white/64">
                        {index + 1}
                      </span>
                      <span className="text-sm text-white/72">{item}</span>
                    </div>
                    <BellRing className="size-4 text-teal-200/76" />
                  </div>
                ))}
              </div>

              <p className="mt-5 text-sm leading-6 text-white/54">
                When rules shift, like the 2025 CCPA penalty update, you get a
                clear alert, a suggested revision, and a faster path to staying
                current.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <AuthAwarePremiumButton
            authenticatedHref="/onboarding"
            callbackHref="/onboarding"
            className="h-12 px-5 text-sm sm:text-base"
          >
            {primaryCtaLabel}
          </AuthAwarePremiumButton>

          <Button
            render={<Link href="#features" />}
            nativeButton={false}
            variant="ghost"
            size="lg"
            className="h-12 rounded-[18px] border border-white/[0.08] bg-white/[0.02] px-5 text-sm font-medium text-white/78 hover:bg-white/[0.05] hover:text-white"
          >
            See What&apos;s Included
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function BlockedDashboardMock() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="soft-panel relative overflow-hidden rounded-[30px] p-5 sm:p-6"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.08),transparent_40%)]" />
      <div className="relative">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">
              Launch Readiness
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
              Blocked launch dashboard
            </h3>
          </div>
          <div className="rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs text-white/54">
            Approval friction
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {[
            {
              title: "Payouts paused",
              description: "Website verification requires public legal pages.",
              tone:
                "border-rose-400/18 bg-rose-400/10 text-rose-50 icon-rose-300",
              icon: LockKeyhole,
            },
            {
              title: "App review rejected",
              description: "Missing Privacy Policy URL in the release checklist.",
              tone:
                "border-amber-300/18 bg-amber-300/10 text-amber-50 icon-amber-200",
              icon: Store,
            },
            {
              title: "Compliance exposure",
              description: "Cookie disclosure and regional rights language are incomplete.",
              tone:
                "border-orange-300/18 bg-orange-300/10 text-orange-50 icon-orange-200",
              icon: AlertTriangle,
            },
          ].map((alert) => {
            const Icon = alert.icon;

            return (
              <motion.div
                key={alert.title}
                initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  "rounded-[22px] border px-4 py-4",
                  alert.tone.split(" ").slice(0, 3).join(" "),
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/10">
                    <Icon
                      className={cn(
                        "size-4",
                        alert.tone.split(" ").find((token) =>
                          token.startsWith("icon-"),
                        )?.replace("icon-", "text-") ?? "text-white",
                      )}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-current">
                      {alert.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-current opacity-80">
                      {alert.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">
              Missing now
            </p>
            <div className="mt-3 space-y-2">
              {[
                "Privacy Policy",
                "Terms of Service",
                "Refund Policy",
                "Contact / Support",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white/62"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">
              With PolicyPack
            </p>
            <div className="mt-3 space-y-2">
              {[
                "Approval-ready legal pages",
                "Launch checklist mapped",
                "Update alerts enabled",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-full border border-emerald-300/18 bg-emerald-300/10 px-3 py-2 text-sm text-emerald-100"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 rounded-[22px] border border-emerald-300/18 bg-emerald-300/10 px-4 py-4 text-emerald-50"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-emerald-100/70">
                Fixed with PolicyPack
              </p>
              <h4 className="mt-2 text-lg font-semibold tracking-[-0.04em]">
                Privacy + Terms + Cookie + Refund ready
              </h4>
              <p className="mt-2 text-sm leading-6 text-emerald-50/78">
                The exact pages most founders discover too late become
                publish-ready before checkout, app submission, or due diligence
                begins.
              </p>
            </div>
            <ShieldCheck className="mt-1 size-5 shrink-0 text-emerald-100" />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function LaunchRiskCalculator() {
  const shouldReduceMotion = useReducedMotion();
  const [platform, setPlatform] = React.useState<PlatformKey>("paddle");
  const [market, setMarket] = React.useState<MarketKey>("global");

  const selectedPlatform = platformOptions[platform];
  const selectedMarket = marketOptions[market];
  const pages = Array.from(
    new Set([...selectedPlatform.pages, ...selectedMarket.pages]),
  );
  const complexityBonus = Math.min(
    10,
    Math.max(0, pages.length - 3) * 2 +
      (platform === "apple" || platform === "googlePlay" || platform === "paddle"
        ? 2
        : 0),
  );
  const riskScore = Math.min(
    100,
    selectedPlatform.baseScore + selectedMarket.modifier + complexityBonus,
  );
  const riskBand = getRiskBand(riskScore);
  const actionPlan = getActionPlan(platform, market, pages);
  const priorityPage = getPriorityPage(platform, market);
  const likelyBlocker = getLikelyBlocker(platform, market);

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="soft-panel rounded-[30px] p-5 sm:p-6"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-xl">
          <p className="text-[11px] uppercase tracking-[0.24em] text-teal-200/72">
            Launch Risk Calculator
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
            Check your launch risk in 10 seconds
          </h3>
          <p className="mt-3 text-sm leading-6 text-white/62">
            Choose your platform and target market to see which pages you
            should have live before approval friction starts.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start rounded-[22px] border border-white/[0.08] bg-white/[0.02] px-4 py-3">
          <RiskRing score={riskScore} color={riskBand.color} />
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">
              Risk Score
            </p>
            <p className="mt-1 text-lg font-semibold text-white">
              {riskBand.label}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <div className="space-y-5">
          <SelectorGroup
            title="Platform"
            items={platformOptions}
            value={platform}
            onChange={setPlatform}
          />
          <SelectorGroup
            title="Target market"
            items={marketOptions}
            value={market}
            onChange={setMarket}
          />
        </div>

        <div className="grid gap-4">
          <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">
                  Current read
                </p>
                <h4 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">
                  {selectedPlatform.label} + {selectedMarket.label}
                </h4>
              </div>
              <div
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium",
                  riskBand.badgeClassName,
                )}
              >
                {riskScore}/100
              </div>
            </div>

            <p className="mt-3 text-sm leading-6 text-white/62">
              {selectedPlatform.summary} {selectedMarket.summary}
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[18px] border border-white/[0.08] bg-white/[0.03] px-3.5 py-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/42">
                  Most likely blocker
                </p>
                <p className="mt-2 text-sm leading-6 text-white/76">
                  {likelyBlocker}
                </p>
              </div>
              <div className="rounded-[18px] border border-white/[0.08] bg-white/[0.03] px-3.5 py-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/42">
                  Publish first
                </p>
                <p className="mt-2 text-sm leading-6 text-white/76">
                  {priorityPage}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">
              Required before launch
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {pages.map((page) => (
                <motion.div
                  key={page}
                  layout
                  className="rounded-[18px] border border-white/[0.08] bg-white/[0.03] px-3.5 py-3 text-sm text-white/72"
                >
                  <span className="flex items-start gap-2">
                    <BadgeCheck className="mt-0.5 size-4 shrink-0 text-teal-200" />
                    <span>{page}</span>
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-teal-300/16 bg-teal-300/[0.07] p-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-teal-200/76">
              Action plan
            </p>
            <div className="mt-3 space-y-2.5">
              {actionPlan.map((step, index) => (
                <div
                  key={step}
                  className="flex items-start gap-3 rounded-[18px] border border-white/[0.08] bg-[#0D0D0D]/70 px-3.5 py-3"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-xs font-medium text-white/66">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-white/76">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs leading-6 text-white/42">
            Based on published platform requirements and common review signals.
            This calculator is an operational guide, not legal advice.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function SelectorGroup<T extends string>({
  title,
  items,
  value,
  onChange,
}: {
  title: string;
  items: Record<
    T,
    {
      label: string;
      icon?: React.ComponentType<{ className?: string }>;
    }
  >;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">
        {title}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {(
          Object.entries(items) as Array<
            [T, { label: string; icon?: React.ComponentType<{ className?: string }> }]
          >
        ).map(([key, item]) => {
          const Icon = item.icon;
          const active = value === key;

          return (
            <motion.button
              key={key}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange(key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition-colors",
                active
                  ? "border-teal-300/22 bg-teal-300/12 text-white"
                  : "border-white/[0.08] bg-white/[0.02] text-white/62 hover:bg-white/[0.05] hover:text-white",
              )}
            >
              {Icon ? <Icon className="size-4" /> : null}
              {item.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function RiskRing({ score, color }: { score: number; color: string }) {
  return (
    <div
      className="relative size-16 rounded-full p-[6px]"
      style={{
        background: `conic-gradient(${color} ${score * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
      }}
    >
      <div className="flex size-full items-center justify-center rounded-full bg-[#0D0D0D] text-sm font-semibold text-white">
        {score}
      </div>
    </div>
  );
}

function getRiskBand(score: number) {
  if (score >= 85) {
    return {
      label: "Critical",
      color: "rgba(251, 146, 60, 0.95)",
      badgeClassName: "border border-orange-300/18 bg-orange-300/10 text-orange-100",
    };
  }

  if (score >= 65) {
    return {
      label: "High",
      color: "rgba(245, 158, 11, 0.95)",
      badgeClassName: "border border-amber-300/18 bg-amber-300/10 text-amber-100",
    };
  }

  if (score >= 40) {
    return {
      label: "Moderate",
      color: "rgba(45, 212, 191, 0.95)",
      badgeClassName: "border border-teal-300/18 bg-teal-300/10 text-teal-100",
    };
  }

  return {
    label: "Low",
    color: "rgba(110, 231, 183, 0.95)",
    badgeClassName: "border border-emerald-300/18 bg-emerald-300/10 text-emerald-100",
  };
}

function getPriorityPage(platform: PlatformKey, market: MarketKey) {
  if (platform === "apple" || platform === "googlePlay") {
    return "Privacy Policy with visible app-store-ready disclosures.";
  }

  if (platform === "paddle" || platform === "paypal") {
    return "Refund Policy and public support details linked from your checkout path.";
  }

  if (market === "eu" || market === "uk" || market === "global") {
    return "Cookie Policy plus regional privacy-rights language before launch traffic starts.";
  }

  return "Privacy Policy and Terms of Service linked clearly in your site footer.";
}

function getLikelyBlocker(platform: PlatformKey, market: MarketKey) {
  if (platform === "paddle") {
    return "Domain review friction if legal and support links are missing or hard to find.";
  }

  if (platform === "apple") {
    return "Release review pressure around missing privacy disclosures and user-data transparency.";
  }

  if (platform === "googlePlay") {
    return "A public privacy policy mismatch between your app listing and your real data practices.";
  }

  if (platform === "stripe") {
    return "Website verification delays if the product looks incomplete or not trustworthy enough for payments.";
  }

  if (market === "global") {
    return "Regional rights and transfer disclosures becoming inconsistent across multiple launch regions.";
  }

  return "Weak public trust signals before checkout, buyer due diligence, or platform review.";
}

function getActionPlan(
  platform: PlatformKey,
  market: MarketKey,
  pages: string[],
) {
  const firstThreePages = pages.slice(0, 3).join(", ");
  const actions = [
    `Publish ${firstThreePages} first and link them clearly from your footer, checkout, or app listing.`,
  ];

  if (platform === "apple" || platform === "googlePlay") {
    actions.push(
      "Make sure your Privacy Policy is public, readable on mobile, and consistent with your in-app data collection flows.",
    );
  } else if (platform === "paddle" || platform === "paypal") {
    actions.push(
      "Add visible refund, billing, and support language before payment review or merchant onboarding begins.",
    );
  } else {
    actions.push(
      "Tighten your public legal pages before verification, diligence, or the first payment-provider review starts.",
    );
  }

  if (market === "eu" || market === "uk" || market === "global") {
    actions.push(
      "Add cookie, transfer, and privacy-rights disclosures that reflect cross-border data handling from day one.",
    );
  } else {
    actions.push(
      "Add US-facing privacy and refund language that matches how your product collects data and charges users.",
    );
  }

  return actions;
}

