import { NextResponse } from "next/server";

import { buildLegalPrintHtml } from "@/lib/legal-document";
import { PRODUCTION_APP_URL } from "@/lib/site-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
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

    const html = buildLegalPrintHtml(body.markdown, {
      title: body.title,
      productName: body.productName ?? "PolicyPack",
      websiteUrl: body.websiteUrl ?? PRODUCTION_APP_URL,
      generatedAt: body.generatedAt ?? new Date().toISOString(),
    });
    const htmlBuffer = Buffer.from(html, "utf-8");

    return new NextResponse(htmlBuffer, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Length": String(htmlBuffer.byteLength),
        "Cache-Control": "no-store, max-age=0",
        "Content-Disposition": `inline; filename="${body.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || "policy-document"}.html"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to render policy HTML.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
