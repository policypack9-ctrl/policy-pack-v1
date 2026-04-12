import type { DashboardDocument } from "@/lib/policy-engine";

export type PageId = DashboardDocument["id"];

export type UserTier = "promo" | "free" | "starter" | "premium";

export type TierPageConfig = {
  tier: UserTier;
  availablePages: PageId[];
  maxSelectable: number;
  label: string;
  description: string;
};

export const ALL_PAGE_IDS: PageId[] = [
  "about-us",
  "contact-us",
  "privacy-policy",
  "cookie-policy",
  "terms-of-service",
  "legal-disclaimer",
  "refund-policy",
];

export const FREE_PAGE_IDS: PageId[] = [
  "about-us",
  "contact-us",
  "cookie-policy",
];

export const STARTER_PAGE_IDS: PageId[] = [
  "terms-of-service",
  "privacy-policy",
  "legal-disclaimer",
  "refund-policy",
];

export const TIER_PAGE_CONFIG: Record<UserTier, TierPageConfig> = {
  promo: {
    tier: "promo",
    availablePages: ALL_PAGE_IDS,
    maxSelectable: 4,
    label: "Launch Offer",
    description:
      "You have a complimentary launch slot. Choose up to 4 pages from all 7 available documents.",
  },
  free: {
    tier: "free",
    availablePages: FREE_PAGE_IDS,
    maxSelectable: 2,
    label: "Free",
    description:
      "Choose up to 2 pages from our basic document set. Upgrade to unlock legal and compliance pages.",
  },
  starter: {
    tier: "starter",
    availablePages: STARTER_PAGE_IDS,
    maxSelectable: 3,
    label: "Starter Pages",
    description:
      "Choose any 3 from your 4 core legal pages included in your Starter pack.",
  },
  premium: {
    tier: "premium",
    availablePages: ALL_PAGE_IDS,
    maxSelectable: 7,
    label: "Premium Workspace",
    description:
      "All 7 pages are available. Choose any combination you need.",
  },
};

export function getUserTier(params: {
  isPremium: boolean;
  planId: string;
  isEligibleLaunchUser: boolean;
}): UserTier {
  if (params.isPremium && params.planId === "premium") return "premium";
  if (params.planId === "starter") return "starter";
  if (params.isEligibleLaunchUser) return "promo";
  return "free";
}

export function getTierPageConfig(tier: UserTier): TierPageConfig {
  return TIER_PAGE_CONFIG[tier];
}

export function isPageAvailableForTier(pageId: PageId, tier: UserTier): boolean {
  return TIER_PAGE_CONFIG[tier].availablePages.includes(pageId);
}
