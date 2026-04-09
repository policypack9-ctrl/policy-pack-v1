import { Navbar } from "@/components/layout/navbar";
import { FaqSection } from "@/components/sections/faq";
import { FeaturesSection } from "@/components/sections/features";
import { HeroSection } from "@/components/sections/hero";
import { PricingSection } from "@/components/sections/pricing";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <FaqSection />
    </div>
  );
}
