import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getAppUserProfileById } from "@/lib/auth-data";
import { buildLegalPrintHtml } from "@/lib/legal-document";
import { PRODUCTION_APP_URL } from "@/lib/site-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sanitizeExportFilename(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "policy-document"
  );
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    let hasPremiumAccess = Boolean(session.user.isPremium);

    // Prefer the session claim to avoid hard-failing PDF export on transient DB issues.
    // Fall back to the DB only when the session does not yet reflect a fresh upgrade.
    if (!hasPremiumAccess && session.user.id) {
      try {
        const profile = await getAppUserProfileById(session.user.id);
        hasPremiumAccess = Boolean(profile?.isPremium);
      } catch (error) {
        console.error("render-policy-html premium lookup failed", error);
      }
    }

    if (!hasPremiumAccess) {
      return NextResponse.json(
        { error: "Premium access is required for PDF export." },
        { status: 402 },
      );
    }

    const body = (await request.json()) as {
      markdown?: string;
      title?: string;
      productName?: string;
      websiteUrl?: string;
      generatedAt?: string;
    };

    if (!body.markdown || !body.title) {
      return NextResponse.json(
        { error: "markdown and title are required." },
        { status: 400 },
      );
    }

    const safeTitle = String(body.title);
    const html = buildLegalPrintHtml(body.markdown, {
      title: safeTitle,
      productName: body.productName ?? "PolicyPack",
      websiteUrl: body.websiteUrl ?? PRODUCTION_APP_URL,
      generatedAt: body.generatedAt ?? new Date().toISOString(),
    });

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
        "Content-Disposition": `inline; filename="${sanitizeExportFilename(safeTitle)}.html"`,
      },
    });
  } catch (error) {
    console.error("render-policy-html failed", error);
    return NextResponse.json(
      {
        error: "Unable to render policy HTML.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
