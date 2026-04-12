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

    if (
      body.documentType !== "about-us" &&
      body.documentType !== "contact-us" &&
      body.documentType !== "privacy-policy" &&
      body.documentType !== "cookie-policy" &&
      body.documentType !== "terms-of-service" &&
      body.documentType !== "legal-disclaimer" &&
      body.documentType !== "refund-policy"
    ) {
      return NextResponse.json(
        { error: "Invalid documentType." },
        { status: 400 },
      );
    }

    const [profile, launchSnapshot, generatedDocs] = await Promise.all([
      getAppUserProfileById(session.user.id),
      getLaunchCampaignSnapshot(session.user.id),
      listGeneratedDocumentsForUser(session.user.id), // We need this function
    ]);

    const generationTier = profile?.isPremium ? "premium" : "free";
    const planId = profile?.planId ?? "free";

    // Resolve tier and enforce page access rules
    const userTier = getUserTier({
      isPremium: profile?.isPremium ?? false,
      planId,
      isEligibleLaunchUser: launchSnapshot?.isEligibleLaunchUser ?? false,
    });

    // Check if this page type is allowed for the tier
    if (!isPageAvailableForTier(body.documentType, userTier)) {
      return NextResponse.json(
        {
          error: `The "${body.documentType}" page is not available on your current plan. Upgrade to access it.`,
          requiresCheckout: true,
          userTier,
        },
        { status: 403 },
      );
    }

    const hasGeneratedCurrentType = generatedDocs.some(doc => doc.id === body.documentType);
    const documentCount = hasGeneratedCurrentType ? generatedDocs.length - 1 : generatedDocs.length;
    const maxAllowed = { promo: 4, free: 2, starter: 3, premium: 7 }[userTier];

    if (documentCount >= maxAllowed) {
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

    const generated = await generatePolicyDocument({
      documentType: body.documentType,
      answers: normalizeAnswers(body.answers as object | undefined),
      generationTier,
    });

    await saveGeneratedDocumentForUser(
      session.user.id,
      body.documentType,
      generated,
    );

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


