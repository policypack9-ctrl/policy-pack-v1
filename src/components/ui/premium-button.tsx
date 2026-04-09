"use client";

import * as React from "react";
import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PremiumButtonProps = React.ComponentProps<typeof Button> & {
  icon?: React.ReactNode;
};

export function PremiumButton({
  className,
  children,
  icon = <ArrowUpRight className="size-4" />,
  render,
  nativeButton,
  type,
  ...props
}: PremiumButtonProps) {
  const shouldReduceMotion = useReducedMotion();
  const resolvedType = render ? type : (type ?? "button");

  return (
    <motion.div
      whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.01 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
      className="group relative inline-flex"
    >
      <span
        aria-hidden
        className="absolute inset-0 -z-10 rounded-[20px] bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.34),rgba(110,231,183,0.22)_42%,transparent_72%)] opacity-80 blur-xl transition-opacity duration-500 group-hover:opacity-100"
      />
      <Button
        type={resolvedType}
        render={render}
        nativeButton={nativeButton}
        size="lg"
        className={cn(
          "relative h-12 overflow-hidden rounded-[20px] border border-white/15 bg-white/10 px-5 text-[0.95rem] font-medium tracking-[-0.02em] text-white shadow-[0_24px_60px_-30px_rgba(6,11,20,0.95)] backdrop-blur-xl before:absolute before:inset-0 before:bg-[linear-gradient(135deg,rgba(45,212,191,0.3),rgba(110,231,183,0.24),rgba(255,255,255,0.08))] before:content-[''] after:absolute after:inset-px after:rounded-[calc(20px-1px)] after:bg-[linear-gradient(180deg,rgba(13,17,17,0.95),rgba(6,10,10,0.9))] after:content-[''] hover:shadow-[0_28px_60px_-28px_rgba(45,212,191,0.45)]",
          className,
        )}
        {...props}
      >
        <span className="relative z-10 flex items-center gap-3">
          <span>{children}</span>
          <span className="inline-flex size-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] transition-transform duration-300 group-hover/button:-translate-y-0.5 group-hover/button:translate-x-0.5">
            {icon}
          </span>
        </span>
      </Button>
    </motion.div>
  );
}
