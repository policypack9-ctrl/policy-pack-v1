import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import {
  getContactUsMarkdown,
  SITE_LEGAL_LAST_UPDATED,
} from "@/lib/site-page-content";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with PolicyPack support, compliance, or commercial teams.",
  alternates: {
    canonical: "/contact-us",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ContactUsPage() {
  return (
    <LegalPageShell
      eyebrow="PolicyPack Company"
      title="Contact Us"
      description="Support, compliance, and commercial contact details for PolicyPack."
      markdown={getContactUsMarkdown()}
      lastUpdated={SITE_LEGAL_LAST_UPDATED}
    />
  );
}
