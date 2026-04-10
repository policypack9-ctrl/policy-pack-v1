import { getLaunchCampaignSnapshot } from "@/lib/auth-data";
import { Navbar } from "@/components/layout/navbar";
import { FaqSection } from "@/components/sections/faq";
import { FeaturesSection } from "@/components/sections/features";
import { HeroSection } from "@/components/sections/hero";
import { PricingSection } from "@/components/sections/pricing";
import { buildDefaultLaunchCampaignSnapshot } from "@/lib/launch-campaign";

export const dynamic = "force-dynamic";

export default async function Home() {
  const launchSnapshot = await getLaunchCampaignSnapshot().catch(() =>
    buildDefaultLaunchCampaignSnapshot(),
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      <HeroSection launchSnapshot={launchSnapshot} />
      <FeaturesSection />
      <PricingSection launchSnapshot={launchSnapshot} />
      <FaqSection />
    </div>
  );
}
