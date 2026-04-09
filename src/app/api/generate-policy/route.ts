import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { saveGeneratedDocumentForUser } from "@/lib/auth-data";
import {
  generatePolicyDocument,
  type PolicyDocumentType,
} from "@/lib/policy-generator";
import { normalizeAnswers } from "@/lib/policy-engine";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
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

    const generated = await generatePolicyDocument({
      documentType: body.documentType,
      answers: normalizeAnswers(body.answers as object | undefined),
    });
    const session = await auth();

    if (session?.user?.id) {
      await saveGeneratedDocumentForUser(
        session.user.id,
        body.documentType,
        generated,
      );
    }

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
