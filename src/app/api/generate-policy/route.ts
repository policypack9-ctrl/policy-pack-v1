import { NextResponse } from "next/server";

import { auth } from "@/auth";
import {
  getAppUserProfileById,
  getLaunchCampaignSnapshot,
  saveGeneratedDocumentForUser,
} from "@/lib/auth-data";
import {
  generatePolicyDocument,
  type PolicyDocumentType,
} from "@/lib/policy-generator";
import { normalizeAnswers } from "@/lib/policy-engine";

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
      body.documentType !== "privacy-policy" &&
      body.documentType !== "terms-of-service" &&
      body.documentType !== "cookie-policy" &&
      body.documentType !== "gdpr-addendum"
    ) {
      return NextResponse.json(
        { error: "Invalid documentType." },
        { status: 400 },
      );
    }

    const [profile, launchSnapshot] = await Promise.all([
      getAppUserProfileById(session.user.id),
      getLaunchCampaignSnapshot(session.user.id),
    ]);

    if (!profile?.isPremium && !launchSnapshot.canGenerateComplimentaryDocument) {
      const errorMessage = launchSnapshot.freeGenerationClosed
        ? "The complimentary launch batch is full. Secure checkout is now required before document generation."
        : "Your complimentary launch document has already been used. Upgrade with secure checkout to generate more documents.";

      return NextResponse.json(
        {
          error: errorMessage,
          requiresCheckout: true,
          launchSnapshot,
        },
        { status: 402 },
      );
    }

    const generated = await generatePolicyDocument({
      documentType: body.documentType,
      answers: normalizeAnswers(body.answers as object | undefined),
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
