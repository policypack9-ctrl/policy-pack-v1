"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

type AuroraBackgroundProps = React.HTMLAttributes<HTMLDivElement>;

const orbs = [
  {
    className: "-top-20 left-[12%] h-52 w-52",
    background:
      "radial-gradient(circle, rgba(45, 212, 191, 0.22) 0%, rgba(45, 212, 191, 0) 72%)",
    animate: { x: [0, 12, 0], y: [0, 14, 0], scale: [1, 1.04, 1] },
    duration: 18,
  },
  {
    className: "right-[10%] top-[10%] h-60 w-60",
    background:
      "radial-gradient(circle, rgba(110, 231, 183, 0.16) 0%, rgba(110, 231, 183, 0) 72%)",
    animate: { x: [0, -16, 0], y: [0, 12, 0], scale: [1, 1.06, 1] },
    duration: 20,
  },
];

export function AuroraBackground({
  className,
  children,
  ...props
}: AuroraBackgroundProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className={cn("relative isolate overflow-hidden bg-[#0A0A0A]", className)}
      {...props}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_28%)]" />

      {orbs.map((orb) => (
        <motion.div
          key={orb.className}
          aria-hidden
          className={cn(
            "pointer-events-none absolute rounded-full blur-3xl",
            orb.className,
          )}
          style={{ background: orb.background }}
          animate={shouldReduceMotion ? undefined : orb.animate}
          transition={
            shouldReduceMotion
              ? undefined
              : {
                  duration: orb.duration,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }
          }
        />
      ))}

      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-y-[-20%] left-1/2 w-[22rem] -translate-x-1/2 bg-[linear-gradient(180deg,rgba(45,212,191,0.12),rgba(45,212,191,0))] blur-3xl"
        animate={
          shouldReduceMotion ? undefined : { opacity: [0.2, 0.4, 0.2], y: [0, 8, 0] }
        }
        transition={
          shouldReduceMotion
            ? undefined
            : {
                duration: 14,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }
        }
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}
