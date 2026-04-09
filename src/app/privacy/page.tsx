import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal/legal-page-shell";

const PRIVACY_MARKDOWN = String.raw`# Privacy Policy

Generated for PolicyPack  
Website: https://policypack.org

## 1. Scope
1. This Privacy Policy explains how PolicyPack collects, uses, and protects information when users access https://policypack.org.
2. This policy applies to customers and visitors in Egypt and global markets.

## 2. Information We Collect
1. We collect email address, full name, billing address, payment details, IP address, and cookie-based usage information when users interact with the product.
2. We may also collect service usage, support, security, and diagnostic information where needed to operate the platform.

## 3. How We Use Information
1. We use personal information to provide, secure, improve, and support PolicyPack.
2. We use collected information to manage accounts, fulfill service obligations, process transactions, and communicate product updates.

## 4. Legal Bases and User Rights
1. For users in global audiences, we apply the rights and notice obligations required by the relevant privacy framework.
2. Users may request access, correction, deletion, or export of eligible personal data, subject to legal and operational limits.

## 5. Cookies and Analytics
1. PolicyPack uses transactional email, marketing email, and Google Analytics tracking to measure performance, secure the service, and support product communications.
2. Users can manage cookie choices through browser controls and any in-product consent interfaces that apply.

## 6. Vendors and Processors
1. We rely on secure automated data processors to host the service, process payments, analyze performance, and support core product functions.
2. These providers may process personal information on our behalf under contractual and security controls.

## 7. International Transfers
1. Where data moves across borders, we apply transfer safeguards appropriate to global audiences and other supported regions.
2. We review vendors and subprocessors to ensure a reasonable level of protection for transferred data.

## 8. Retention and Security
1. We retain information for as long as necessary to operate the service, comply with law, resolve disputes, and enforce agreements.
2. We use administrative, technical, and organizational controls designed to protect personal information from unauthorized access, loss, or misuse.

## 9. Contact and Updates
1. Users may contact PolicyPack with privacy requests, access requests, or complaints related to data handling.
2. We may update this Privacy Policy from time to time and will publish the latest version at https://policypack.org.

# Cookie Policy

## 1. Cookie Categories
1. PolicyPack uses cookies and similar technologies to operate the service, understand usage, and improve performance.
2. Current cookie and outreach categories include transactional email, marketing email, and Google Analytics tracking.

## 2. Why Cookies Are Used
1. We use cookies for authentication, analytics, performance, and product communications where applicable.
2. Some cookies are necessary for basic platform functionality and security.

## 3. Third-Party Tools
1. Third-party vendors such as secure automated data processors may set or rely on similar technologies as part of the services they provide.
2. These providers operate under their own privacy terms in addition to our disclosures.

## 4. User Controls
1. Users can manage cookie preferences in browser settings and through any consent controls we provide.
2. Disabling some cookies may affect the availability or functionality of parts of the service.

## 5. Updates
1. We may revise this Cookie Policy to reflect changes in vendors, product behavior, or law.
2. The latest version will be available through https://policypack.org.
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
      title="Privacy & Cookie Policy"
      description="PolicyPack's privacy disclosures, data handling terms, and cookie usage policies."
      markdown={PRIVACY_MARKDOWN}
    />
  );
}
