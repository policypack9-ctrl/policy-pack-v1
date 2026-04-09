import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ComplianceDashboard } from "@/components/dashboard/compliance-dashboard";
import {
  getAppUserProfileById,
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
      initialPaddleTransactionId={resolvedSearchParams._ptxn ?? null}
    />
  );
}
