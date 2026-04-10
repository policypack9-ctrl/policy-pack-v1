import { auth } from "@/auth";
import { GenerationResult } from "@/components/onboarding/generation-result";
import { getLaunchCampaignSnapshot } from "@/lib/auth-data";
import { buildDefaultLaunchCampaignSnapshot } from "@/lib/launch-campaign";

export default async function OnboardingResultPage() {
  const session = await auth();
  const launchSnapshot = await getLaunchCampaignSnapshot(session?.user?.id).catch(
    () => buildDefaultLaunchCampaignSnapshot(session?.user?.id),
  );

  return <GenerationResult initialLaunchSnapshot={launchSnapshot} />;
}
