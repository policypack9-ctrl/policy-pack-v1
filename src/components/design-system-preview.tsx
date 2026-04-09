"use client";

import {
  CheckCircle2,
  Layers3,
  LucideIcon,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { AuroraBackground } from "@/components/ui/aurora-background";
import { GradientCard } from "@/components/ui/gradient-card";
import { PremiumButton } from "@/components/ui/premium-button";

const stackBadges = [
  "Next.js App Router",
  "Tailwind CSS v4",
  "Framer Motion",
  "Lucide React",
  "clsx + tailwind-merge",
  "shadcn/ui",
];

const pillars: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    title: "Aceternity-inspired motion",
    description: "Aurora glows, spotlight beams, and staggered entry transitions are built in.",
    icon: Sparkles,
  },
  {
    title: "Modern bento structure",
    description: "The composition is already set up for asymmetric showcases instead of flat rows.",
    icon: Layers3,
  },
  {
    title: "Glassmorphism surfaces",
    description: "Blurred layers, luminous borders, and depth-first shadows establish the baseline.",
    icon: WandSparkles,
  },
];

export function DesignSystemPreview() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <AuroraBackground className="min-h-screen">
      <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 py-20 sm:px-10 lg:px-12">
        <section className="grid w-full gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="glass-panel surface-grid relative overflow-hidden rounded-[36px] p-8 sm:p-10 lg:p-12"
          >
            <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <div className="absolute -right-16 top-8 size-48 rounded-full bg-sky-300/20 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-amber-300/15 blur-3xl" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.32em] text-slate-200/75">
                <CheckCircle2 className="size-4 text-sky-200" />
                Design DNA Ready
              </div>

              <h1 className="mt-6 max-w-2xl text-5xl font-semibold leading-[0.95] tracking-[-0.06em] text-white sm:text-6xl">
                PolicyPack starts with a premium interface baseline.
              </h1>

              <p className="text-balance mt-6 max-w-xl text-lg leading-8 text-slate-300">
                Next.js App Router, Tailwind CSS, Framer Motion, Lucide,
                class utilities, and shadcn/ui are integrated into a
                motion-first system built around glass surfaces, aurora
                lighting, and bento composition.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {stackBadges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-slate-200/85 backdrop-blur-xl"
                  >
                    {badge}
                  </span>
                ))}
              </div>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <PremiumButton type="button">
                  Launch Premium Sections
                </PremiumButton>
                <p className="max-w-xs text-sm leading-6 text-slate-400">
                  Reusable primitives now live under `src/components/ui` and
                  already carry the motion and surface language.
                </p>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {pillars.map((pillar, index) => {
                  const Icon = pillar.icon;

                  return (
                    <motion.div
                      key={pillar.title}
                      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 22 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.7,
                        delay: 0.18 + index * 0.08,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="glass-panel rounded-[24px] p-5"
                    >
                      <div className="inline-flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] text-sky-100">
                        <Icon className="size-4" />
                      </div>
                      <h2 className="mt-4 text-base font-medium tracking-[-0.03em] text-white">
                        {pillar.title}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {pillar.description}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          <div className="grid gap-4">
            <GradientCard
              eyebrow="Gradient Border Card"
              title="A polished interaction layer is already in place."
              description="This preview card ships with animated entry, a luminous gradient frame, blurred glass internals, and a hover lift calibrated for premium landing sections."
              metrics={[
                { label: "Motion", value: "Stagger + hover" },
                { label: "Surface", value: "24px glass blur" },
                { label: "Layout", value: "Bento-ready" },
              ]}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: "Motion-ready primitives",
                  copy: "Buttons and showcase cards are set up as reusable client components with Framer Motion.",
                },
                {
                  title: "Tokenized visual language",
                  copy: "Inter typography, sky and amber accents, and border-white/10 surfaces are now the baseline.",
                },
              ].map((panel, index) => (
                <motion.div
                  key={panel.title}
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.7,
                    delay: 0.28 + index * 0.08,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="glass-panel rounded-[28px] p-6"
                >
                  <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">
                    {panel.title}
                  </p>
                  <p className="mt-4 text-base leading-7 text-slate-200">
                    {panel.copy}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </AuroraBackground>
  );
}
