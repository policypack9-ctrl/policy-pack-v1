import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminEmailAllowed } from "@/lib/auth-env";
import { rollbackPromo } from "@/lib/promo-settings";
import { sendAdminNotification } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  const adminEmail = session?.user?.email ?? "";
  if (!session?.user?.id || !isAdminEmailAllowed(adminEmail)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { archiveId?: string } | null;
  const archiveId = body?.archiveId ?? "";
  if (!archiveId) {
    return NextResponse.json({ error: "archiveId is required." }, { status: 400 });
  }

  const result = await rollbackPromo(archiveId, adminEmail);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await sendAdminNotification({
    kind: "payment",
    subject: "PolicyPack - Promo Rollback Executed",
    summary: `The promotional campaign was re-enabled by ${adminEmail}.`,
    details: [
      { label: "Rolled Back By", value: adminEmail },
      { label: "Archive ID", value: archiveId },
      { label: "Rolled Back At", value: new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }) },
    ],
  });

  return NextResponse.json({ ok: true });
}
