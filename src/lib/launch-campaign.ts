export const FREE_GENERATION_USER_LIMIT = 50;
export const URGENCY_SWITCH_THRESHOLD = 10;

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
  complimentaryDocumentsRemaining: 0 | 1;
  canGenerateComplimentaryDocument: boolean;
  requiresPaymentWall: boolean;
};

type BuildLaunchCampaignSnapshotInput = {
  registeredUsers: number;
  eligibleUserIds?: string[];
  userId?: string | null;
  generatedDocumentCount?: number;
};

export function buildDefaultLaunchCampaignSnapshot(
  userId?: string | null,
): LaunchCampaignSnapshot {
  return buildLaunchCampaignSnapshot({
    registeredUsers: 0,
    eligibleUserIds: [],
    userId,
    generatedDocumentCount: 0,
  });
}

export function buildLaunchCampaignSnapshot({
  registeredUsers,
  eligibleUserIds = [],
  userId = null,
  generatedDocumentCount = 0,
}: BuildLaunchCampaignSnapshotInput): LaunchCampaignSnapshot {
  const safeRegisteredUsers = Math.max(0, Math.floor(registeredUsers));
  const freeSpotsRemaining = Math.max(
    0,
    FREE_GENERATION_USER_LIMIT - safeRegisteredUsers,
  );
  const freeGenerationClosed = freeSpotsRemaining === 0;
  const showUrgencyBanner =
    safeRegisteredUsers >= URGENCY_SWITCH_THRESHOLD && !freeGenerationClosed;
  const eligibleIndex =
    userId && eligibleUserIds.length > 0 ? eligibleUserIds.indexOf(userId) : -1;
  const userRank = eligibleIndex >= 0 ? eligibleIndex + 1 : null;
  const isEligibleLaunchUser = eligibleIndex >= 0;
  const hasUsedComplimentaryDocument = generatedDocumentCount > 0;
  const canGenerateComplimentaryDocument =
    isEligibleLaunchUser && !hasUsedComplimentaryDocument;
  const complimentaryDocumentsRemaining =
    canGenerateComplimentaryDocument ? 1 : 0;
  const requiresPaymentWall = !canGenerateComplimentaryDocument;

  let bannerTone: LaunchBannerTone = "launch";
  let bannerText = `Free generation for the first ${FREE_GENERATION_USER_LIMIT} users`;
  let bannerDescription =
    "Each eligible launch account can generate one complimentary legal document before package selection unlocks the full document suite.";
  let calloutLabel = "One complimentary document per verified account";

  if (showUrgencyBanner) {
    bannerTone = "urgency";
    bannerText =
      freeSpotsRemaining <= 5
        ? `Due to high demand, only ${freeSpotsRemaining} free generation spot${freeSpotsRemaining === 1 ? "" : "s"} remaining. Act now.`
        : `Due to high demand, ${freeSpotsRemaining} complimentary launch spots remain.`;
    bannerDescription =
      "Launch access is moving quickly. Verified accounts inside the first 50 registrations still receive one complimentary draft before package selection becomes mandatory.";
    calloutLabel = `${freeSpotsRemaining} complimentary launch spots left`;
  }

  if (freeGenerationClosed) {
    bannerTone = "closed";
    bannerText =
      "The complimentary launch batch is now full. Choose a package to unlock PolicyPack immediately.";
    bannerDescription =
      "All new accounts now choose a package before any document generation begins. Existing launch users keep their single complimentary draft until it is used.";
    calloutLabel = "Launch batch closed";
  }

  return {
    registeredUsers: safeRegisteredUsers,
    freeUserLimit: FREE_GENERATION_USER_LIMIT,
    freeSpotsRemaining,
    freeGenerationClosed,
    showUrgencyBanner,
    bannerTone,
    bannerText,
    bannerDescription,
    calloutLabel,
    userRank,
    isEligibleLaunchUser,
    hasUsedComplimentaryDocument,
    complimentaryDocumentsRemaining,
    canGenerateComplimentaryDocument,
    requiresPaymentWall,
  };
}
