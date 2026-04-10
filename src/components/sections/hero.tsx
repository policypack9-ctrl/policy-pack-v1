"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  BadgeCheck,
  CirclePlay,
  Clock3,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import type { LaunchCampaignSnapshot } from "@/lib/launch-campaign";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Button } from "@/components/ui/button";
import { PremiumButton } from "@/components/ui/premium-button";

const proofPoints = [
  "Privacy Policy + Terms",
  "Auto-updates when laws change",
  "Founder-friendly setup",
];

type HeroSectionProps = {
  launchSnapshot: LaunchCampaignSnapshot;
};

export function HeroSection({ launchSnapshot }: HeroSectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const bannerToneClassName =
    launchSnapshot.bannerTone === "closed"
      ? "border-amber-200/16 bg-amber-200/10 text-amber-50"
      : launchSnapshot.bannerTone === "urgency"
        ? "border-amber-200/16 bg-amber-200/10 text-amber-50"
        : "border-white/10 bg-white/[0.04] text-teal-100/78";
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
        className="mx-auto max-w-7xl scroll-mt-28 px-6 py-16 sm:px-10 sm:py-20 lg:px-12"
      >
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.78fr)] lg:gap-12">
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className={`inline-flex max-w-full items-center gap-2 rounded-full px-3.5 py-2 text-[11px] font-medium uppercase tracking-[0.24em] ${bannerToneClassName}`}
            >
              <BannerIcon
                className={`size-4 ${launchSnapshot.bannerTone === "launch" ? "text-teal-200" : "text-amber-100"}`}
              />
              <span className="truncate">{launchSnapshot.bannerText}</span>
            </div>

            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[0.98] tracking-[-0.06em] text-white sm:text-5xl lg:text-6xl">
              <span className="bg-[linear-gradient(135deg,#ffffff_0%,#e8fef9_58%,#89ecd8_100%)] bg-clip-text text-transparent">
                Your Legal Documents. Done in 10 Minutes. Always Up to Date.
              </span>
            </h1>

            <p className="text-balance mt-5 max-w-2xl text-base leading-7 text-white/68 sm:text-lg">
              Skip the $3,000 lawyer. AI-generated Privacy Policy and Terms of
              Service that update automatically when laws change.
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/54">
              {launchSnapshot.bannerDescription}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <PremiumButton
                render={<Link href="/onboarding" />}
                nativeButton={false}
                className="h-12 px-5 text-sm sm:text-base"
              >
                {primaryCtaLabel}
              </PremiumButton>

              <Button
                render={<Link href="#faq" />}
                nativeButton={false}
                variant="ghost"
                size="lg"
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
                  Auto-monitoring
                </div>
                <p className="mt-2 text-sm leading-6 text-white/58">
                  Watches policy-related law changes for you.
                </p>
              </div>

              <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <Clock3 className="size-4 text-teal-200" />
                  Last refresh
                </div>
                <p className="mt-2 text-sm leading-6 text-white/58">
                  Updated automatically 4 minutes ago.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
