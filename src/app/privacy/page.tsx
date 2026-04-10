import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import {
  getPrivacyPolicyMarkdown,
  SITE_LEGAL_LAST_UPDATED,
} from "@/lib/site-page-content";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "PolicyPack's Privacy Policy and data handling disclosures.",
  alternates: {
    canonical: "/privacy",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPage() {
  return (
    <LegalPageShell
      eyebrow="PolicyPack Legal"
      title="Privacy Policy"
      description="PolicyPack's privacy disclosures, processing practices, and personal data handling standards."
      markdown={getPrivacyPolicyMarkdown()}
      lastUpdated={SITE_LEGAL_LAST_UPDATED}
    />
  );
}
