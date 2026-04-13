import { NextResponse } from "next/server";

import { auth } from "@/auth";
import {
  getAppUserProfileById,
  getLaunchCampaignSnapshot,
  saveGeneratedDocumentForUser,
  listGeneratedDocumentsForUser,
} from "@/lib/auth-data";
import {
  generatePolicyDocument,
  type PolicyDocumentType,
} from "@/lib/policy-generator";
import { normalizeAnswers } from "@/lib/policy-engine";
import { getUserTier, isPageAvailableForTier } from "@/lib/tier-pages";

export const maxDuration = 60;

const VALID_DOCUMENT_TYPES: PolicyDocumentType[] = [
  "about-us",
  "contact-us",
  "privacy-policy",
  "cookie-policy",
  "terms-of-service",
  "legal-disclaimer",
  "refund-policy",
];

const TIER_MAX: Record<string, number> = {
  promo: 4,
  free: 2,
  starter: 3,
  premium: 7,
};

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must sign in before generating a document." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as {
      documentType?: PolicyDocumentType;
      answers?: unknown;
    };

    if (!body.documentType || !VALID_DOCUMENT_TYPES.includes(body.documentType)) {
      return NextResponse.json({ error: "Invalid documentType." }, { status: 400 });
    }

    const [profile, launchSnapshot, generatedDocs] = await Promise.all([
      getAppUserProfileById(session.user.id),
      getLaunchCampaignSnapshot(session.user.id),
      listGeneratedDocumentsForUser(session.user.id),
    ]);

    const planId = profile?.planId ?? "free";
    const isPremium = profile?.isPremium ?? false;

    const userTier = getUserTier({
      isPremium,
      planId,
      isEligibleLaunchUser: launchSnapshot?.isEligibleLaunchUser ?? false,
    });

    // Enforce page-level access for this tier
    if (!isPageAvailableForTier(body.documentType, userTier)) {
      return NextResponse.json(
        {
          error: `"${body.documentType}" is not available on your current plan. Upgrade to access it.`,
          requiresCheckout: true,
          userTier,
        },
        { status: 403 },
      );
    }

    // Count UNIQUE documents excluding the current type (re-generation is always allowed)
    const existingOtherDocs = generatedDocs.filter(
      (doc) => doc.id !== body.documentType,
    );
    const maxAllowed = TIER_MAX[userTier] ?? 2;

    if (existingOtherDocs.length >= maxAllowed) {
      return NextResponse.json(
        {
          error: "You have reached the maximum number of documents for your current plan.",
          requiresCheckout: userTier !== "premium",
          userTier,
          launchSnapshot,
        },
        { status: 402 },
      );
    }

    const generationTier = isPremium ? "premium" : "free";
    const generated = await generatePolicyDocument({
      documentType: body.documentType,
      answers: normalizeAnswers(body.answers as object | undefined),
      generationTier,
    });

    await saveGeneratedDocumentForUser(session.user.id, body.documentType, generated);

    return NextResponse.json(generated);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to generate policy document.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
