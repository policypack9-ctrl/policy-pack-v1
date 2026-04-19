import { NextResponse } from "next/server";

import { sendOutreachPreviewEmail } from "@/lib/outreach";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const configuredSecret = process.env.HEALTHCHECK_SECRET?.trim() ?? "";

  if (!configuredSecret) {
    return false;
  }

  const headerSecret = request.headers.get("x-healthcheck-secret")?.trim() ?? "";
  return headerSecret === configuredSecret;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { email?: string } = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const email = body.email?.trim().toLowerCase() || "a.a.pay2017@gmail.com";
  const result = await sendOutreachPreviewEmail(email);

  return NextResponse.json({
    ok: result.ok,
    skipped: result.skipped,
    email,
  });
}
