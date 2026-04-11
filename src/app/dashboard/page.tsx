import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ComplianceDashboard } from "@/components/dashboard/compliance-dashboard";
import {
  getAppUserProfileById,
  getLaunchCampaignSnapshot,
  listGeneratedDocumentsForUser,
} from "@/lib/auth-data";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ _ptxn?: string }>;
}) {
  const session = await auth();
  const resolvedSearchParams = (await searchParams) ?? {};

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const [profile, generatedDocuments, launchSnapshot] = await Promise.all([
    getAppUserProfileById(session.user.id),
    listGeneratedDocumentsForUser(session.user.id),
    getLaunchCampaignSnapshot(session.user.id),
  ]);

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
