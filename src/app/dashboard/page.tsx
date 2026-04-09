import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ComplianceDashboard } from "@/components/dashboard/compliance-dashboard";
import {
  getAppUserProfileById,
  listGeneratedDocumentsForUser,
} from "@/lib/auth-data";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const [profile, generatedDocuments] = await Promise.all([
    getAppUserProfileById(session.user.id),
    listGeneratedDocumentsForUser(session.user.id),
  ]);

  return (
    <ComplianceDashboard
      initialIsPremium={profile?.isPremium ?? false}
      initialPremiumUnlockedAt={profile?.premiumUnlockedAt ?? null}
      initialGeneratedDocuments={generatedDocuments}
      authenticatedEmail={session.user.email ?? null}
    />
  );
}
