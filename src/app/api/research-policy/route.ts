import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAppUserProfileById, getLaunchCampaignSnapshot } from "@/lib/auth-data";
import { normalizeAnswers } from "@/lib/policy-engine";
import { getOpenRouterConfig, type OpenRouterGenerationTier } from "@/lib/ai-config";
import {
  runResearchStage,
  buildEnrichedResearchContextPublic,
  type PolicyDocumentType,
} from "@/lib/policy-generator";
import { getUserTier, isPageAvailableForTier } from "@/lib/tier-pages";

export const maxDuration = 55;

const VALID_TYPES: PolicyDocumentType[] = [
  "about-us", "contact-us", "privacy-policy", "cookie-policy",
  "terms-of-service", "legal-disclaimer", "refund-policy",
];

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = (await request.json()) as {
    documentType?: PolicyDocumentType;
    answers?: unknown;
  };

  if (!body.documentType || !VALID_TYPES.includes(body.documentType)) {
    return NextResponse.json({ error: "Invalid documentType." }, { status: 400 });
  }

  const [profile, launchSnapshot] = await Promise.all([
    getAppUserProfileById(session.user.id),
    getLaunchCampaignSnapshot(session.user.id),
  ]);

  const isPremium = profile?.isPremium ?? false;
  const planId = profile?.planId ?? "free";

  const userTier = getUserTier({
    isPremium,
    planId,
    isEligibleLaunchUser: launchSnapshot?.isEligibleLaunchUser ?? false,
  });

  if (!isPageAvailableForTier(body.documentType, userTier)) {
    return NextResponse.json(
      { error: "Page not available on your plan.", requiresCheckout: true },
      { status: 403 },
    );
  }

  const generationTier: OpenRouterGenerationTier = isPremium ? "premium" : "free";
  const config = getOpenRouterConfig(generationTier);
  const answers = normalizeAnswers(body.answers as object | undefined);

  // No API key — return enriched static context so draft stage still works
  if (!config.apiKey) {
    return NextResponse.json({
      ok: true,
      researchSummary: buildEnrichedResearchContextPublic(body.documentType, answers, generationTier),
      researchModel: "built-in-regulations",
      liveSearch: false,
    });
  }

  try {
    const result = await runResearchStage({
      answers,
      documentType: body.documentType,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      siteName: config.siteName,
      siteUrl: config.siteUrl,
      model: config.researchModel,
    });

    return NextResponse.json({
      ok: true,
      researchSummary: result.content,
      researchModel: result.model,
      liveSearch: true,
    });
  } catch (err) {
    // Fallback to enriched static context if live search fails
    return NextResponse.json({
      ok: true,
      researchSummary: buildEnrichedResearchContextPublic(body.documentType, answers, generationTier),
      researchModel: "built-in-regulations",
      liveSearch: false,
      fallbackReason: err instanceof Error ? err.message : "unknown",
    });
  }
}
