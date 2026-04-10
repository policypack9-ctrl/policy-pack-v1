export type BillingPlanId = "starter" | "premium";

export type BillingPlan = {
  id: BillingPlanId;
  name: string;
  shortLabel: string;
  description: string;
  priceLabel: string;
  cadenceLabel: string;
  ctaLabel: string;
  features: string[];
};

export const BILLING_PLANS: Record<BillingPlanId, BillingPlan> = {
  starter: {
    id: "starter",
    name: "Starter Pages",
    shortLabel: "Starter",
    description:
      "Three core pages for a clean launch without ongoing monitoring or recurring refreshes.",
    priceLabel: "$39",
    cadenceLabel: "once",
    ctaLabel: "Choose Starter",
    features: [
      "Pick any 3 essential pages",
      "One-time document setup",
      "Best for simple launches and brochure sites",
    ],
  },
  premium: {
    id: "premium",
    name: "Premium Workspace",
    shortLabel: "Premium",
    description:
      "Full document coverage, ongoing alerts, and a workspace built for SaaS growth.",
    priceLabel: "$29",
    cadenceLabel: "/mo",
    ctaLabel: "Choose Premium",
    features: [
      "All core legal and compliance pages",
      "Ongoing monitoring and update alerts",
      "Best for products with billing, accounts, and scaling needs",
    ],
  },
};

export function getBillingPlan(planId: BillingPlanId) {
  return BILLING_PLANS[planId];
}
