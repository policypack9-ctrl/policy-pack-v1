"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BadgeCheck,
  CalendarClock,
  CirclePlay,
  CircleX,
  Clock3,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import type { LaunchCampaignSnapshot } from "@/lib/launch-campaign";
import { AuthAwarePremiumButton } from "@/components/auth/auth-aware-premium-button";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Button } from "@/components/ui/button";

const proofPoints = [
  "Privacy Policy + Terms",
  "Review-ready drafts",
  "Founder-friendly setup",
];

type HeroSectionProps = {
  launchSnapshot: LaunchCampaignSnapshot;
};

export function HeroSection({ launchSnapshot }: HeroSectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isDemoOpen, setIsDemoOpen] = React.useState(false);
  const bannerToneClassName =
    launchSnapshot.bannerTone === "closed"
      ? "border-amber-200/18 bg-[linear-gradient(135deg,rgba(251,191,36,0.16),rgba(251,191,36,0.08))] text-amber-50"
      : launchSnapshot.bannerTone === "urgency"
        ? "border-amber-200/18 bg-[linear-gradient(135deg,rgba(251,191,36,0.16),rgba(245,158,11,0.08))] text-amber-50"
        : "border-teal-300/18 bg-[linear-gradient(135deg,rgba(45,212,191,0.18),rgba(45,212,191,0.07),rgba(255,255,255,0.04))] text-teal-100";
  const BannerIcon =
    launchSnapshot.bannerTone === "launch"
      ? Sparkles
      : launchSnapshot.bannerTone === "closed"
        ? LockKeyhole
        : TriangleAlert;
  const primaryCtaLabel = launchSnapshot.freeGenerationClosed
    ? "Unlock PolicyPack"
    : "Generate My Policy Pack";

  return (
    <AuroraBackground className="border-b border-white/10">
      <section
        id="hero"
        className="mx-auto max-w-7xl scroll-mt-28 px-6 py-16 sm:px-10 sm:py-20 lg:px-12 lg:py-24"
      >
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.78fr)] lg:gap-12">
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className={`inline-flex max-w-full items-center gap-3 rounded-[20px] border px-4 py-3 text-left shadow-[0_18px_48px_-28px_rgba(0,0,0,0.88)] ${bannerToneClassName}`}
            >
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 ${
                  launchSnapshot.bannerTone === "launch"
                    ? "bg-teal-300/10 text-teal-100"
                    : "bg-amber-300/10 text-amber-100"
                }`}
              >
                <BannerIcon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] uppercase tracking-[0.28em] text-white/56">
                  Limited launch offer
                </span>
                <span className="mt-1 block text-sm font-medium tracking-[0.02em] text-current sm:text-[15px]">
                  {launchSnapshot.bannerText}
                </span>
              </span>
            </div>

            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[0.98] tracking-[-0.06em] text-white sm:text-5xl lg:text-6xl">
              <span className="bg-[linear-gradient(135deg,#ffffff_0%,#e8fef9_58%,#89ecd8_100%)] bg-clip-text text-transparent">
                Your Legal Documents. Ready in Minutes.
              </span>
            </h1>

            <p className="text-balance mt-5 max-w-2xl text-base leading-7 text-white/68 sm:text-lg">
              Skip the $3,000 lawyer bill. Expert-guided Privacy Policy and Terms
              of Service drafts tailored to your product, billing flow, and target
              markets.
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/54">
              {launchSnapshot.bannerDescription}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <AuthAwarePremiumButton
                authenticatedHref="/dashboard"
                preferSavedWorkspaceHref="/dashboard"
                callbackHref="/dashboard"
                className="h-12 px-5 text-sm sm:text-base"
              >
                {primaryCtaLabel}
              </AuthAwarePremiumButton>

              <Button
                type="button"
                variant="ghost"
                size="lg"
                onClick={() => setIsDemoOpen(true)}
                className="h-12 rounded-[18px] border border-white/10 bg-white/[0.02] px-5 text-sm font-medium text-white/78 hover:bg-white/[0.06] hover:text-white"
              >
                <CirclePlay className="size-4" />
                Watch Demo
              </Button>
            </div>

            <div className="mt-7 flex flex-wrap gap-2.5">
              {proofPoints.map((point, index) => (
                <motion.div
                  key={point}
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.45,
                    delay: 0.14 + index * 0.06,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-sm text-white/66"
                >
                  {point}
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.45,
                  delay: 0.14 + proofPoints.length * 0.06,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-sm text-white/66"
              >
                {launchSnapshot.calloutLabel}
              </motion.div>
            </div>
          </motion.div>

          <DocumentPreview />
        </div>
      </section>

      <WatchDemoDialog
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
      />
    </AuroraBackground>
  );
}

function DocumentPreview() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-[24rem] lg:ml-auto"
    >
      <motion.div
        animate={shouldReduceMotion ? undefined : { y: [0, -6, 0] }}
        transition={
          shouldReduceMotion
            ? undefined
            : {
                duration: 5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }
        }
        className="relative"
      >
        <div className="absolute inset-x-8 top-0 h-28 rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.14),transparent_72%)] blur-3xl" />

        <div className="glass-panel relative overflow-hidden rounded-[26px] border border-white/10 p-4 shadow-[0_24px_60px_-34px_rgba(0,0,0,0.9)]">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_30%)]" />

          <div className="relative rounded-[20px] border border-white/10 bg-[#111111] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-teal-200/70">
                  Document Preview
                </p>
                <h2 className="mt-2 text-lg font-semibold tracking-[-0.04em] text-white">
                  Policy Pack
                </h2>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-100">
                <BadgeCheck className="size-4" />
                Compliant
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-3 rounded-full bg-white/8"
                  style={{
                    width: `${index === 3 ? 56 : 100 - index * 8}%`,
                    filter: "blur(0.8px)",
                  }}
                />
              ))}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <ShieldCheck className="size-4 text-teal-200" />
                  Guided review
                </div>
                <p className="mt-2 text-sm leading-6 text-white/58">
                  Highlights the areas your team should review before publishing.
                </p>
              </div>

              <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <Clock3 className="size-4 text-teal-200" />
                  Latest draft
                </div>
                <p className="mt-2 text-sm leading-6 text-white/58">
                  Generated from your saved workspace inputs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function WatchDemoDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/72 px-6 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16, scale: shouldReduceMotion ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: shouldReduceMotion ? 0 : 12, scale: shouldReduceMotion ? 1 : 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            onClick={(event) => event.stopPropagation()}
            className="soft-panel w-full max-w-3xl rounded-[32px] p-5 sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-xl">
                <p className="text-[11px] uppercase tracking-[0.24em] text-teal-200/72">
                  Demo Preview
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
                  Product walkthrough coming soon
                </h3>
                <p className="mt-3 text-sm leading-6 text-white/62">
                  We are preparing a short guided demo that shows the onboarding
                  flow, approval-ready document generation, and the compliance
                  dashboard in one pass.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex size-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-white/62 transition-colors hover:bg-white/[0.06] hover:text-white"
                aria-label="Close demo dialog"
              >
                <CircleX className="size-4" />
              </button>
            </div>

            <div className="mt-6 overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#111111]">
              <div className="aspect-video bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-5 sm:p-7">
                <div className="flex h-full flex-col justify-between rounded-[24px] border border-white/[0.08] bg-black/20 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">
                        Video Placeholder
                      </p>
                      <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">
                        90-second guided walkthrough
                      </p>
                    </div>
                    <span className="inline-flex size-12 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.05] text-teal-200">
                      <CirclePlay className="size-5" />
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      "See the onboarding flow",
                      "Watch the policy engine work",
                      "Preview the compliance dashboard",
                    ].map((item) => (
                      <div
                        key={item}
                        className="rounded-[18px] border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white/72"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-xs text-white/58">
                <CalendarClock className="size-4 text-teal-200" />
                Video coming soon
              </div>
              <p className="text-sm text-white/48">
                Until the video is live, the best next step is to create an
                account and run the product yourself.
              </p>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
