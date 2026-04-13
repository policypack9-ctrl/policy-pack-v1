import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { buildAuthRedirectHref } from "@/lib/auth-routing";
import { getAppUserProfileById, getLaunchCampaignSnapshot } from "@/lib/auth-data";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect(buildAuthRedirectHref("register", "/onboarding"));
  }

  const [profile, launchSnapshot] = await Promise.all([
    getAppUserProfileById(session.user.id),
    getLaunchCampaignSnapshot(session.user.id),
  ]);

  const planId = profile?.planId ?? "free";

  return (
    <OnboardingWizard
      planId={planId}
      isPremium={profile?.isPremium ?? false}
      launchSnapshot={launchSnapshot}
    />
  );
}
