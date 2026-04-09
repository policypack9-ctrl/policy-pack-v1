import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal/legal-page-shell";

const TERMS_MARKDOWN = String.raw`# Terms of Service

Paste the generated Terms of Service Markdown here.

## 1. Draft Status
1. Replace this placeholder with the final generated Terms of Service before launch.
2. Keep clause numbering in Markdown so PDF export and browser rendering stay consistent.
`;

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "PolicyPack's Terms of Service and platform usage terms.",
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
      title="Terms of Service"
      description="This static page is ready for your final generated Terms of Service Markdown."
      markdown={TERMS_MARKDOWN}
    />
  );
}
