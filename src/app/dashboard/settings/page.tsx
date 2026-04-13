import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AccountSettingsPanel } from "@/components/settings/account-settings-panel";
import { getAccountSettingsSummary } from "@/lib/auth-data";

export default async function DashboardSettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard/settings");
  }

  const summary = await getAccountSettingsSummary(session.user.id);
  const profile = summary.profile;

  return (
    <AccountSettingsPanel
      displayName={profile?.name ?? session.user.name ?? "PolicyPack Team"}
      email={profile?.email ?? session.user.email ?? ""}
      planId={profile?.planId ?? "free"}
      isPremium={profile?.isPremium ?? session.user.isPremium ?? false}
      billingStatus={profile?.billingStatus ?? "inactive"}
      premiumUnlockedAt={profile?.premiumUnlockedAt ?? null}
      currentPeriodEndsAt={profile?.currentPeriodEndsAt ?? null}
      createdAt={profile?.createdAt ?? null}
      signInMethods={summary.signInMethods}
      canChangePassword={summary.canChangePassword}
    />
  );
}
