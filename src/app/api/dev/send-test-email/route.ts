import { NextResponse } from "next/server";

import { sendPaymentReceiptEmail, sendWelcomeEmail } from "@/lib/notifications";
import { sendOutreachTestEmail } from "@/lib/outreach";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  let body: {
    email?: string;
    type?: "welcome" | "payment" | "outreach";
    name?: string;
    plan?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const type = body.type ?? "welcome";

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  if (type === "payment") {
    const result = await sendPaymentReceiptEmail(
      email,
      body.plan?.trim() || "Starter",
    );

    return NextResponse.json({
      ok: result.ok,
      skipped: result.skipped,
      type,
      email,
    });
  }

  if (type === "outreach") {
    const result = await sendOutreachTestEmail(email);

    return NextResponse.json({
      ok: result.ok,
      skipped: result.skipped,
      type,
      email,
    });
  }

  const result = await sendWelcomeEmail(
    email,
    body.name?.trim() || "PolicyPack Test User",
  );

  return NextResponse.json({
    ok: result.ok,
    skipped: result.skipped,
    type: "welcome",
    email,
  });
}
