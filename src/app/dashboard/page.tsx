import { redirect } from "next/navigation";
import type { Session } from "next-auth";

import { auth } from "@/auth";
import { ComplianceDashboard } from "@/components/dashboard/compliance-dashboard";
import {
  getAppUserProfileById,
  getLaunchCampaignSnapshot,
  listGeneratedDocumentsForUser,
} from "@/lib/auth-data";
import { buildDefaultLaunchCampaignSnapshot } from "@/lib/launch-campaign";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ _ptxn?: string }>;
}) {
  let session: Session | null = null;

  try {
    session = await auth();
  } catch (error) {
    console.error("dashboard auth failed", error);
    redirect("/login?callbackUrl=/dashboard");
  }

  const resolvedSearchParams = (await searchParams) ?? {};

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const [profileResult, generatedDocumentsResult, launchSnapshotResult] =
    await Promise.allSettled([
      getAppUserProfileById(session.user.id),
      listGeneratedDocumentsForUser(session.user.id),
      getLaunchCampaignSnapshot(session.user.id),
    ]);

  const profile =
    profileResult.status === "fulfilled" ? profileResult.value : null;
  const generatedDocuments =
    generatedDocumentsResult.status === "fulfilled"
      ? generatedDocumentsResult.value
      : [];
  const launchSnapshot =
    launchSnapshotResult.status === "fulfilled"
      ? launchSnapshotResult.value
      : buildDefaultLaunchCampaignSnapshot(session.user.id);

  if (profileResult.status === "rejected") {
    console.error("dashboard profile load failed", profileResult.reason);
  }

  if (generatedDocumentsResult.status === "rejected") {
    console.error(
      "dashboard generated documents load failed",
      generatedDocumentsResult.reason,
    );
  }

  if (launchSnapshotResult.status === "rejected") {
    console.error(
      "dashboard launch snapshot load failed",
      launchSnapshotResult.reason,
    );
  }

  return (
    <ComplianceDashboard
      initialIsPremium={profile?.isPremium ?? false}
      planId={profile?.planId ?? "free"}
      initialPremiumUnlockedAt={profile?.premiumUnlockedAt ?? null}
      initialGeneratedDocuments={generatedDocuments}
      authenticatedEmail={session.user.email ?? null}
      initialPaddleTransactionId={resolvedSearchParams._ptxn ?? null}
      launchSnapshot={launchSnapshot}
    />
  );
}
