import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { COMPANY_PUBLIC_NAME } from "@/lib/company";
import {
  getAboutUsMarkdown,
  SITE_LEGAL_LAST_UPDATED,
} from "@/lib/site-page-content";

export const metadata: Metadata = {
  title: "About Us",
  description: `Learn about ${COMPANY_PUBLIC_NAME} and the vision behind PolicyPack.`,
  alternates: {
    canonical: "/about-us",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function AboutUsPage() {
  return (
    <LegalPageShell
      eyebrow="PolicyPack Company"
      title="About Us"
      description="The company story behind PolicyPack and our focus on expert-guided legal document generation."
      markdown={getAboutUsMarkdown()}
      lastUpdated={SITE_LEGAL_LAST_UPDATED}
    />
  );
}
