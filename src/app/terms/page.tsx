import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import {
  getTermsAndGdprMarkdown,
  SITE_LEGAL_LAST_UPDATED,
} from "@/lib/site-page-content";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "PolicyPack's Terms of Service and global privacy appendix for platform operations.",
  alternates: {
    canonical: "/terms",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="PolicyPack Legal"
      title="Terms of Service & Global Privacy Appendix"
      description="PolicyPack's platform terms, commercial rules, and international privacy handling commitments."
      markdown={getTermsAndGdprMarkdown()}
      lastUpdated={SITE_LEGAL_LAST_UPDATED}
    />
  );
}
