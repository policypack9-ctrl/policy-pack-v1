import { NextResponse } from "next/server";

import { buildLegalPrintHtml } from "@/lib/legal-document";
import { PRODUCTION_APP_URL } from "@/lib/site-config";

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

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
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
