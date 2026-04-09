import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal/legal-page-shell";

const REFUND_POLICY_MARKDOWN = String.raw`# Refund Policy

## 1. Digital Products
1. Since PolicyPack provides non-tangible, irrevocable digital goods, including PDF legal documents, we do not generally issue refunds once the order is confirmed and the product is generated, sent, or downloaded.

## 2. Exceptions
1. Refunds may be granted if there is a verified technical defect in the generation process and our support team cannot resolve that defect within 72 hours of the report being opened.

## 3. Request Process
1. Users must contact support at support@policypack.org within 14 days of purchase to request a refund review.
2. Each request should include the account email, order context, and a short description of the issue so the support team can investigate it efficiently.
`;

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
      markdown={REFUND_POLICY_MARKDOWN}
    />
  );
}

