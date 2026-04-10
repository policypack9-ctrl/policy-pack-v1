import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import {
  getCookiePolicyMarkdown,
  SITE_LEGAL_LAST_UPDATED,
} from "@/lib/site-page-content";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "PolicyPack's cookie, analytics, and tracking technology disclosures.",
  alternates: {
    canonical: "/cookie-policy",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function CookiePolicyPage() {
  return (
    <LegalPageShell
      eyebrow="PolicyPack Legal"
      title="Cookie Policy"
      description="How PolicyPack uses cookies, analytics technologies, and similar tools across the website and product."
      markdown={getCookiePolicyMarkdown()}
      lastUpdated={SITE_LEGAL_LAST_UPDATED}
    />
  );
}
