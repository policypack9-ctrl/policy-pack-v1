import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal/legal-page-shell";

const TERMS_MARKDOWN = String.raw`# Terms of Service

## 1. Acceptance
1. These Terms of Service govern access to and use of PolicyPack.
2. By using https://policypack.org, users agree to be bound by these terms.

## 2. Eligibility and Accounts
1. Account creation status: Yes.
2. Users are responsible for maintaining accurate account information and keeping credentials secure when accounts are enabled.

## 3. Billing and Subscriptions
1. Paid access status: Yes.
2. Where paid plans apply, fees, billing cycles, and refund rules are governed by the plan selected by the customer.

## 4. Acceptable Use
1. Users may not misuse the service, interfere with operations, or attempt unauthorized access.
2. Users remain responsible for content, prompts, or data submitted through the platform.

## 5. Intellectual Property
1. PolicyPack and its related materials remain the property of the service owner and licensors.
2. Customers retain rights to their own content, subject to the permissions needed to operate the service.

## 6. Service Availability
1. We may update, improve, suspend, or discontinue parts of the service as operational needs require.
2. We aim to maintain a reliable service but do not guarantee uninterrupted availability.

## 7. Termination
1. We may suspend or terminate access for violations of these terms, security risks, or legal requirements.
2. Users may stop using the service at any time, subject to any outstanding billing commitments.

## 8. Governing Law and Contact
1. These terms are interpreted with reference to the laws applicable to Egypt.
2. Questions about these terms may be directed through the contact details published on https://policypack.org.

# GDPR Compliance Document

## 1. Scope
1. This addendum supplements the legal terms for PolicyPack and addresses privacy and data processing obligations relevant to global audiences.
2. It applies to the processing of customer and end-user data handled through https://policypack.org.

## 2. Processing Roles
1. PolicyPack acts in the role appropriate to the service relationship and the nature of the personal data processed.
2. Roles and responsibilities may vary depending on whether customer instructions or direct consumer interactions are involved.

## 3. Processing Activities
1. Covered activities include account administration, service delivery, support, analytics, security, and vendor coordination.
2. Data categories involved include email, full name, billing address, payment details, IP address, and cookies.

## 4. Subprocessors and Vendors
1. Authorized subprocessors and core vendors currently include secure automated data processors.
2. Vendors are expected to apply security and confidentiality measures appropriate to the services they perform.

## 5. Transfers and Rights
1. Where required, we support the rights and notice obligations relevant to users in Egypt and global markets.
2. Cross-border transfers are handled using safeguards and contractual terms appropriate to the affected jurisdiction.

## 6. Security and Incidents
1. We maintain administrative, technical, and organizational measures designed to protect personal information.
2. Material incidents are handled through documented security and notification procedures.

## 7. Updates
1. This addendum may be refreshed to reflect regulatory changes, vendor updates, or platform changes.
2. The latest version will be maintained through https://policypack.org.
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
      title="Terms of Service & GDPR Compliance"
      description="PolicyPack's platform terms plus the GDPR compliance addendum extracted from the approved PDF exports."
      markdown={TERMS_MARKDOWN}
    />
  );
}
