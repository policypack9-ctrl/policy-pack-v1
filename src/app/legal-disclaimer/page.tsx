import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import {
  getLegalDisclaimerMarkdown,
  SITE_LEGAL_LAST_UPDATED,
} from "@/lib/site-page-content";

export const metadata: Metadata = {
  title: "Legal Disclaimer",
  description: "Important notice explaining that PolicyPack outputs are not legal advice.",
  alternates: {
    canonical: "/legal-disclaimer",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LegalDisclaimerPage() {
  return (
    <LegalPageShell
      eyebrow="PolicyPack Legal"
      title="Legal Disclaimer"
      description="A clear notice describing the professional boundary between AI-generated documents and licensed legal advice."
      markdown={getLegalDisclaimerMarkdown()}
      lastUpdated={SITE_LEGAL_LAST_UPDATED}
    />
  );
}
