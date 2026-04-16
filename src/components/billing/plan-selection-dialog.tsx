"use client";

import { useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BadgeCheck, CircleX, Sparkles } from "lucide-react";

import { type BillingPlanId } from "@/lib/billing-plans";
import { normalizeDiscountCode } from "@/lib/billing-discounts";
import { Button } from "@/components/ui/button";

type PlanSelectionDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (planId: BillingPlanId, discountCode?: string) => void;
  onDiscountCodeChange?: (discountCode: string) => void;
  isSubmitting?: boolean;
  title?: string;
  description?: string;
  promoActive?: boolean;
  onSelectFree?: () => void;
  onSelectPromo?: () => void;
  initialDiscountCode?: string;
  discountError?: string;
};

type PlanCard = {
  id: string;
  label: string;
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  badge?: string;
  highlight?: boolean;
  promoBadge?: boolean;
};

const PLAN_CARDS: PlanCard[] = [
  {
    id: "promo",
    label: "LAUNCH OFFER",
    name: "Free Promo",
    price: "Free",
    cadence: "limited time",
    description: "Claim your complimentary slot before the promotional period ends.",
    features: [
      "Choose up to 4 pages from all 7",
      "Full AI-generated legal documents",
      "Available while promo is active",
      "No credit card required",
    ],
    promoBadge: true,
  },
  {
    id: "free",
    label: "FREE",
    name: "Free Plan",
    price: "Free",
    cadence: "forever",
    description: "Basic pages for simple sites or early-stage projects.",
    features: [
      "Choose up to 2 basic pages",
      "About Us, Contact Us, Cookies Policy",
      "One-time generation",
      "No credit card required",
    ],
  },
  {
    id: "starter",
    label: "STARTER",
    name: "Starter Pages",
    price: "$39",
    cadence: "once",
    description: "Three core legal pages for a clean launch without ongoing monitoring.",
    features: [
      "Pick any 3 core legal pages",
      "Terms, Privacy, Disclaimer, Refund",
      "One-time document setup",
      "Best for simple launches",
    ],
  },
  {
    id: "premium",
    label: "PREMIUM",
    name: "Premium Workspace",
    price: "$29",
    cadence: "/mo",
    description: "Full document coverage, ongoing alerts, and a workspace built for SaaS.",
    features: [
      "All 7 legal and compliance pages",
      "Ongoing monitoring and update alerts",
      "Version history and policy refreshes",
      "Built for SaaS products with billing",
    ],
    badge: "Best for SaaS",
    highlight: true,
  },
];

export function PlanSelectionDialog({
  isOpen,
  onClose,
  onSelectPlan,
  onDiscountCodeChange,
  isSubmitting = false,
  title = "Choose the package for this workspace",
  description = "Select the one-time starter pack or the full workspace before continuing.",
  promoActive = false,
  onSelectFree,
  onSelectPromo,
  initialDiscountCode = "",
  discountError = "",
}: PlanSelectionDialogProps) {
  const shouldReduceMotion = Boolean(useReducedMotion());
  const visiblePlans = PLAN_CARDS.filter((p) =>
    p.id === "promo" ? promoActive : true,
  );

  return (
    <AnimatePresence>
      {isOpen ? (
        <PlanSelectionDialogContent
          key={initialDiscountCode}
          shouldReduceMotion={shouldReduceMotion}
          visiblePlans={visiblePlans}
          onClose={onClose}
          onSelectPlan={onSelectPlan}
          onDiscountCodeChange={onDiscountCodeChange}
          isSubmitting={isSubmitting}
          title={title}
          description={description}
          onSelectFree={onSelectFree}
          onSelectPromo={onSelectPromo}
          initialDiscountCode={initialDiscountCode}
          discountError={discountError}
        />
      ) : null}
    </AnimatePresence>
  );
}

type PlanSelectionDialogContentProps = {
  shouldReduceMotion: boolean;
  visiblePlans: PlanCard[];
  onClose: () => void;
  onSelectPlan: (planId: BillingPlanId, discountCode?: string) => void;
  onDiscountCodeChange?: (discountCode: string) => void;
  isSubmitting: boolean;
  title: string;
  description: string;
  onSelectFree?: () => void;
  onSelectPromo?: () => void;
  initialDiscountCode: string;
  discountError: string;
};

function PlanSelectionDialogContent({
  shouldReduceMotion,
  visiblePlans,
  onClose,
  onSelectPlan,
  onDiscountCodeChange,
  isSubmitting,
  title,
  description,
  onSelectFree,
  onSelectPromo,
  initialDiscountCode,
  discountError,
}: PlanSelectionDialogContentProps) {
  const [discountCode, setDiscountCode] = useState(initialDiscountCode);
  const normalizedDiscountCode = normalizeDiscountCode(discountCode);

  function handleDiscountCodeChange(value: string) {
    const normalizedInput = value.toUpperCase();
    setDiscountCode(normalizedInput);
    onDiscountCodeChange?.(normalizedInput);
  }

  function handleSelect(planId: string) {
    if (planId === "free") { onSelectFree?.(); onClose(); return; }
    if (planId === "promo") { onSelectPromo?.(); onClose(); return; }
    onSelectPlan(
      planId as BillingPlanId,
      normalizedDiscountCode ?? undefined,
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.18 }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/76 px-4 backdrop-blur-md overflow-y-auto py-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16, scale: shouldReduceMotion ? 1 : 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: shouldReduceMotion ? 0 : 10, scale: shouldReduceMotion ? 1 : 0.98 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.26, ease: [0.22, 1, 0.36, 1] }}
        className="soft-panel w-full max-w-5xl rounded-[32px] p-5 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-teal-200/72">Choose Your Package</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-white/58">{description}</p>
          </div>
          <button type="button" onClick={onClose}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-white/62 transition-colors hover:text-white">
            <CircleX className="size-4" />
          </button>
        </div>

        <div className={`mt-6 grid gap-4 ${visiblePlans.length === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : visiblePlans.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          {visiblePlans.map((plan) => (
            <div key={plan.id}
              className={`flex flex-col rounded-[24px] border p-5 ${
                plan.highlight ? "border-teal-300/20 bg-teal-300/[0.06]"
                : plan.promoBadge ? "border-emerald-400/20 bg-emerald-400/[0.06]"
                : "border-white/[0.08] bg-white/[0.02]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className={`text-[10px] font-medium uppercase tracking-[0.26em] ${
                  plan.highlight ? "text-teal-200/70" : plan.promoBadge ? "text-emerald-200/70" : "text-white/40"
                }`}>{plan.label}</p>
                {plan.badge && (
                  <span className="rounded-full border border-teal-300/20 bg-teal-300/10 px-2 py-0.5 text-[10px] font-medium text-teal-200">{plan.badge}</span>
                )}
                {plan.promoBadge && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-200">
                    <Sparkles className="size-3" />Active
                  </span>
                )}
              </div>
              <h4 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">{plan.name}</h4>
              <div className="mt-1 flex items-end gap-1">
                <span className="text-2xl font-semibold text-white">{plan.price}</span>
                <span className="pb-0.5 text-xs text-white/46">{plan.cadence}</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-white/52">{plan.description}</p>
              <div className="mt-4 flex-1 space-y-2">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-2 text-xs text-white/66">
                    <BadgeCheck className="mt-0.5 size-3.5 shrink-0 text-teal-300/70" />
                    {f}
                  </div>
                ))}
              </div>
              <button type="button" disabled={isSubmitting} onClick={() => handleSelect(plan.id)}
                className={`mt-5 inline-flex h-10 items-center justify-center rounded-[14px] px-4 text-sm font-medium transition-colors disabled:opacity-60 ${
                  plan.highlight ? "bg-teal-400 text-[#0A0A0A] hover:bg-teal-300"
                  : plan.promoBadge ? "bg-emerald-400 text-[#0A0A0A] hover:bg-emerald-300"
                  : "border border-white/[0.10] bg-white/[0.04] text-white hover:bg-white/[0.08]"
                }`}>
                {plan.id === "promo" ? "Claim Free Slot" : plan.id === "free" ? "Continue Free" : `Choose ${plan.label.charAt(0) + plan.label.slice(1).toLowerCase()}`}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-4">
          <label className="mb-2 block text-[11px] uppercase tracking-[0.22em] text-white/42">
            Discount Code
          </label>
          <input
            type="text"
            value={discountCode}
            onChange={(event) => handleDiscountCodeChange(event.target.value)}
            placeholder="Optional coupon, e.g. Z93W4KXOXO"
            className="soft-input h-11 w-full rounded-[16px] px-4 text-sm"
          />
          {discountError ? (
            <p className="mt-2 text-xs text-amber-200/90">
              {discountError}
            </p>
          ) : isSubmitting && normalizedDiscountCode ? (
            <p className="mt-2 text-xs text-teal-100/80">
              Checking your code and preparing checkout...
            </p>
          ) : (
            <p className="mt-2 text-xs text-white/42">
              Have a discount code? Enter it here before checkout.
            </p>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <Button type="button" variant="ghost" onClick={onClose}
            className="h-10 rounded-[14px] border border-white/[0.08] bg-white/[0.02] px-4 text-sm text-white/58 hover:text-white">
            Not now
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
