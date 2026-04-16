/**
 * Launch campaign logic.
 *
 * PROMO_ACTIVE (env flag):
 *   - "true" or unset  -> promotional period is ON  -> registered users can receive complimentary drafts
 *   - "false"          -> promotional period is OFF -> no new users are eligible
 *
 * Change PROMO_ACTIVE=false in your .env / Vercel environment to end the promo instantly.
 */

export const COMPLIMENTARY_DOCUMENT_LIMIT = 4;
export const URGENCY_THRESHOLD_USERS = 10;

export type LaunchBannerTone = "launch" | "urgency" | "closed";

export type LaunchCampaignSnapshot = {
  registeredUsers: number;
  freeUserLimit: number;
  freeSpotsRemaining: number;
  freeGenerationClosed: boolean;
  showUrgencyBanner: boolean;
  bannerTone: LaunchBannerTone;
  bannerText: string;
  bannerDescription: string;
  calloutLabel: string;
  userRank: number | null;
  isEligibleLaunchUser: boolean;
  hasUsedComplimentaryDocument: boolean;
  complimentaryDocumentsRemaining: number;
  canGenerateComplimentaryDocument: boolean;
  requiresPaymentWall: boolean;
  promoActive: boolean;
};

type BuildLaunchCampaignSnapshotInput = {
  registeredUsers: number;
  userId?: string | null;
  generatedDocumentCount?: number;
  promoActive: boolean;
};

export function buildDefaultLaunchCampaignSnapshot(
  userId?: string | null,
): LaunchCampaignSnapshot {
  return buildLaunchCampaignSnapshot({
    registeredUsers: 0,
    userId,
    generatedDocumentCount: 0,
    promoActive: true,
  });
}

export function buildLaunchCampaignSnapshot({
  registeredUsers,
  userId = null,
  generatedDocumentCount = 0,
  promoActive,
}: BuildLaunchCampaignSnapshotInput): LaunchCampaignSnapshot {
  const safeRegisteredUsers = Math.max(0, Math.floor(registeredUsers));

  const isEligibleLaunchUser = promoActive && Boolean(userId);

  const freeUserLimit = 0;
  const freeSpotsRemaining = 0;
  const freeGenerationClosed = !promoActive;
  const showUrgencyBanner =
    promoActive && safeRegisteredUsers >= URGENCY_THRESHOLD_USERS;

  const hasUsedComplimentaryDocument =
    generatedDocumentCount >= COMPLIMENTARY_DOCUMENT_LIMIT;
  const canGenerateComplimentaryDocument =
    isEligibleLaunchUser && !hasUsedComplimentaryDocument;
  const complimentaryDocumentsRemaining = isEligibleLaunchUser
    ? Math.max(0, COMPLIMENTARY_DOCUMENT_LIMIT - generatedDocumentCount)
    : 0;
  const requiresPaymentWall =
    !canGenerateComplimentaryDocument && generatedDocumentCount >= 2;

  let bannerTone: LaunchBannerTone = "launch";
  let bannerText = "Free generation for a limited time";
  let bannerDescription =
    "Each eligible launch account can generate up to 4 complimentary legal documents before package selection unlocks the full document suite.";
  let calloutLabel = "4 complimentary documents per verified account";

  if (showUrgencyBanner) {
    bannerTone = "urgency";
    bannerText = "Due to high demand, this limited time offer is ending soon. Act now.";
    bannerDescription =
      "Launch access is moving quickly. Verified accounts registered during this period receive up to 4 complimentary drafts before package selection becomes mandatory.";
    calloutLabel = "Limited time offer ending soon";
  }

  if (freeGenerationClosed) {
    bannerTone = "closed";
    bannerText =
      "The complimentary launch period has ended. Choose a package to unlock PolicyPack immediately.";
    bannerDescription =
      "All new accounts now choose a package before any document generation begins. Existing launch users keep their complimentary drafts until they are used.";
    calloutLabel = "Launch offer closed";
  }

  return {
    registeredUsers: safeRegisteredUsers,
    freeUserLimit,
    freeSpotsRemaining,
    freeGenerationClosed,
    showUrgencyBanner,
    bannerTone,
    bannerText,
    bannerDescription,
    calloutLabel,
    userRank: null,
    isEligibleLaunchUser,
    hasUsedComplimentaryDocument,
    complimentaryDocumentsRemaining,
    canGenerateComplimentaryDocument,
    requiresPaymentWall,
    promoActive,
  };
}
