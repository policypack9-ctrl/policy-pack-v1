"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BadgeCheck, CircleX } from "lucide-react";

import {
  BILLING_PLANS,
  type BillingPlanId,
} from "@/lib/billing-plans";
import { Button } from "@/components/ui/button";
import { PremiumButton } from "@/components/ui/premium-button";

type PlanSelectionDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (planId: BillingPlanId) => void;
  isSubmitting?: boolean;
  title?: string;
  description?: string;
};

export function PlanSelectionDialog({
  isOpen,
  onClose,
  onSelectPlan,
  isSubmitting = false,
  title = "Choose the package that fits this workspace",
  description = "Pick a one-time starter pack or the full workspace before continuing to billing.",
}: PlanSelectionDialogProps) {
  const shouldReduceMotion = Boolean(useReducedMotion());

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.18 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/76 px-6 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{
              opacity: 0,
              y: shouldReduceMotion ? 0 : 16,
              scale: shouldReduceMotion ? 1 : 0.98,
            }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: shouldReduceMotion ? 0 : 10,
              scale: shouldReduceMotion ? 1 : 0.98,
            }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="soft-panel w-full max-w-4xl rounded-[32px] p-5 sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-2xl">
                <p className="text-[11px] uppercase tracking-[0.28em] text-teal-200/72">
                  Choose Your Package
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-white/62">
                  {description}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex size-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-white/62 transition-colors hover:bg-white/[0.06] hover:text-white"
                aria-label="Close plan selection"
              >
                <CircleX className="size-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {Object.values(BILLING_PLANS).map((plan) => (
                <div
                  key={plan.id}
                  className={`rounded-[28px] border p-6 ${
                    plan.id === "premium"
                      ? "border-teal-300/18 bg-teal-300/[0.06]"
                      : "border-white/[0.08] bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.26em] text-white/44">
                        {plan.shortLabel}
                      </p>
                      <h4 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">
                        {plan.name}
                      </h4>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-semibold tracking-[-0.06em] text-white">
                        {plan.priceLabel}
                      </div>
                      <div className="text-sm text-white/52">{plan.cadenceLabel}</div>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-white/62">
                    {plan.description}
                  </p>

                  <div className="mt-5 space-y-3">
                    {plan.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-center gap-3 rounded-[18px] border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white/72"
                      >
                        <BadgeCheck className="size-4 shrink-0 text-teal-200" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <PremiumButton
                    type="button"
                    onClick={() => onSelectPlan(plan.id)}
                    disabled={isSubmitting}
                    className="mt-6 h-12 w-full justify-center px-5 text-sm"
                  >
                    {plan.ctaLabel}
                  </PremiumButton>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="h-11 rounded-[18px] border border-white/[0.08] bg-white/[0.02] px-4 text-sm text-white/72 hover:bg-white/[0.05] hover:text-white"
              >
                Not now
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
