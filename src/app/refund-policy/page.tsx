import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import {
  getRefundPolicyMarkdown,
  SITE_LEGAL_LAST_UPDATED,
} from "@/lib/site-page-content";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "PolicyPack's refund terms for digital legal document purchases.",
  alternates: {
    canonical: "/refund-policy",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RefundPolicyPage() {
  return (
    <LegalPageShell
      eyebrow="PolicyPack Legal"
      title="Refund Policy"
      description="PolicyPack's refund terms for digital legal documents and payment exceptions."
      markdown={getRefundPolicyMarkdown()}
      lastUpdated={SITE_LEGAL_LAST_UPDATED}
    />
  );
}
