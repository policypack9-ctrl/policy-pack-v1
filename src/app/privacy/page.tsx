import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal/legal-page-shell";

const PRIVACY_MARKDOWN = String.raw`# Privacy Policy

Paste the generated Privacy Policy Markdown here.

## 1. Draft Status
1. Replace this placeholder with the final generated privacy policy before launch.
2. Keep the document in Markdown so it renders correctly through the shared legal page renderer.
`;

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
      description="This static page is ready for your final generated privacy policy Markdown."
      markdown={PRIVACY_MARKDOWN}
    />
  );
}
