"use client";

import * as React from "react";
import {
  ArrowUpRight,
  type LucideIcon,
  ScanSearch,
  Sparkles,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type GradientCardMetric = {
  label: string;
  value: string;
};

type GradientCardProps = {
  eyebrow?: string;
  title: string;
  description: string;
  metrics?: GradientCardMetric[];
  icon?: LucideIcon;
  visual?: React.ReactNode;
  footerLabel?: string;
  footerValue?: string;
  footerIcon?: React.ReactNode;
  footerContent?: React.ReactNode;
  showFooter?: boolean;
  delay?: number;
  className?: string;
  headerClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  contentClassName?: string;
  metricsClassName?: string;
};

export function GradientCard({
  eyebrow,
  title,
  description,
  metrics = [],
  icon: Icon = Sparkles,
  visual,
  footerLabel = "View details",
  footerValue = "More",
  footerIcon = <ScanSearch className="size-4 text-teal-200" />,
  footerContent,
  showFooter = true,
  delay = 0,
  className,
  headerClassName,
  titleClassName,
  descriptionClassName,
  contentClassName,
  metricsClassName,
}: GradientCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const metricsGridClassName =
    metrics.length <= 1
      ? "grid-cols-1"
      : metrics.length === 2
        ? "sm:grid-cols-2"
        : "sm:grid-cols-3";

  return (
    <motion.article
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={shouldReduceMotion ? undefined : { y: -4 }}
      transition={{
        duration: 0.55,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn("relative", className)}
    >
      <div
        aria-hidden
        className="absolute inset-0 rounded-[26px] bg-[linear-gradient(135deg,rgba(45,212,191,0.12),rgba(255,255,255,0.04),rgba(45,212,191,0.05))] opacity-70"
      />

      <Card className="relative flex h-full gap-0 rounded-[26px] border border-white/[0.08] bg-[#111111] py-0 shadow-[0_18px_40px_-26px_rgba(0,0,0,0.75)] ring-0">
        <CardHeader
          className={cn(
            "relative flex flex-row items-start gap-4 px-5 pt-5 sm:px-6 sm:pt-6",
            headerClassName,
          )}
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-teal-200">
            <Icon className="size-5" />
          </div>

          <div className="min-w-0">
            {eyebrow ? (
              <div className="text-[11px] font-medium uppercase tracking-[0.28em] text-teal-200/72">
                {eyebrow}
              </div>
            ) : null}

            <CardTitle
              className={cn(
                "mt-2 text-xl font-semibold tracking-[-0.04em] text-white sm:text-[1.4rem]",
                titleClassName,
              )}
            >
              {title}
            </CardTitle>
            <CardDescription
              className={cn(
                "mt-3 max-w-xl text-sm leading-6 text-white/62",
                descriptionClassName,
              )}
            >
              {description}
            </CardDescription>
          </div>
        </CardHeader>

        {(visual || metrics.length > 0) && (
          <CardContent
            className={cn(
              "relative flex flex-1 flex-col gap-4 px-5 pb-5 sm:px-6 sm:pb-6",
              contentClassName,
            )}
          >
            {visual ? <div className="relative">{visual}</div> : null}

            {metrics.length > 0 ? (
              <div
                className={cn(
                  "grid gap-3",
                  metricsGridClassName,
                  metricsClassName,
                )}
              >
                {metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-[18px] border border-white/[0.08] bg-white/[0.02] p-3"
                  >
                    <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">
                      {metric.label}
                    </p>
                    <p className="mt-2 text-sm font-medium text-white">
                      {metric.value}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        )}

        {showFooter ? (
          <CardFooter className="relative flex items-center justify-between border-t border-white/[0.08] bg-white/[0.02] px-5 py-4 text-sm text-white/70 sm:px-6">
            {footerContent ? (
              footerContent
            ) : (
              <>
                <span className="flex items-center gap-2">
                  {footerIcon}
                  {footerLabel}
                </span>
                <span className="inline-flex items-center gap-2 text-white/72">
                  {footerValue}
                  <ArrowUpRight className="size-4" />
                </span>
              </>
            )}
          </CardFooter>
        ) : null}
      </Card>
    </motion.article>
  );
}
