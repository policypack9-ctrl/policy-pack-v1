import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminEmailAllowed } from "@/lib/auth-env";
import { isPromoActiveFromDB, getLatestPromoArchive } from "@/lib/promo-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const adminEmail = session?.user?.email ?? "";
  if (!session?.user?.id || !isAdminEmailAllowed(adminEmail)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const [promoActive, latestArchive] = await Promise.all([
    isPromoActiveFromDB(),
    getLatestPromoArchive(),
  ]);

  return NextResponse.json({
    promoActive,
    latestArchive: latestArchive
      ? {
          id: latestArchive.id,
          endedAt: latestArchive.ended_at,
          endedBy: latestArchive.ended_by,
          affectedUsers: latestArchive.affected_users,
          notifiedUsers: latestArchive.notified_users,
          rolledBackAt: latestArchive.rolled_back_at ?? null,
          canRollback:
            !latestArchive.rolled_back_at &&
            Date.now() - new Date(latestArchive.ended_at).getTime() < 86_400_000,
          report: latestArchive.report,
        }
      : null,
  });
}
