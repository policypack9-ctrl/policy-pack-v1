"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Building2,
  FileCode2,
  GlobeLock,
  Languages,
  Radar,
} from "lucide-react";

import { GradientCard } from "@/components/ui/gradient-card";

const features = [
  {
    eyebrow: "Expert-Guided Generation",
    title: "Generate a complete policy pack from your product inputs.",
    description:
      "Turn your stack, data flows, and product behavior into publish-ready legal documents in minutes.",
    icon: FileCode2,
    className: "xl:col-span-2",
  },
  {
    eyebrow: "Auto-Monitoring",
    title: "Stay aligned when privacy rules shift.",
    description:
      "PolicyPack watches for relevant legal changes and prepares the next update before you fall behind.",
    icon: Radar,
  },
  {
    eyebrow: "Plain English",
    title: "Keep it readable without losing legal meaning.",
    description:
      "Your docs are easier for founders, operators, and customers to review with confidence.",
    icon: Languages,
  },
  {
    eyebrow: "GDPR / CCPA Ready",
    title: "Start with the major privacy frameworks covered.",
    description:
      "Common regional requirements are already reflected in the core document logic.",
    icon: GlobeLock,
  },
  {
    eyebrow: "Enterprise Trust",
    title: "Version history and approvals built in.",
    description:
      "See what changed, when it changed, and who approved it without legal process overhead.",
    icon: Building2,
  },
];

export function FeaturesSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      id="features"
      className="scroll-mt-24 border-t border-white/10 bg-black py-16 sm:py-20"
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-teal-200/70">
            Features
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
            Everything needed to ship trustworthy legal docs fast.
          </h2>
          <p className="mt-4 text-base leading-7 text-white/62">
            Clear outputs, automated updates, and a workflow that feels more
            like shipping product than managing paperwork.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:gap-5 xl:grid-cols-4 xl:auto-rows-[minmax(210px,1fr)] xl:gap-6">
          {features.map((feature, index) => (
            <GradientCard
              key={feature.title}
              delay={0.08 + index * 0.05}
              eyebrow={feature.eyebrow}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              showFooter={false}
              className={`h-full ${feature.className ?? ""}`}
              titleClassName="max-w-full text-[1.25rem] sm:text-[1.32rem]"
              descriptionClassName="max-w-full"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
