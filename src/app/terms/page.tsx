import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal/legal-page-shell";

const TERMS_MARKDOWN = String.raw`# Terms of Service

Effective Date: April 9, 2026

## 1. Acceptance
1. These Terms of Service govern your access to and use of PolicyPack, including the website located at https://policypack.org and any related software, dashboards, document generation workflows, and compliance monitoring features we make available.
2. By accessing or using PolicyPack, you agree to be bound by these Terms. If you are using the Service on behalf of a company or other legal entity, you represent that you have authority to bind that entity to these Terms.
3. If you do not agree to these Terms, you must not access or use the Service.

## 2. Eligibility and Accounts
1. You must be legally capable of entering into a binding agreement in order to use the Service.
2. You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account.
3. You agree to provide accurate, current, and complete account information and to promptly update it if it changes.
4. We may suspend or restrict access if we reasonably believe your account is being used in an unauthorized, fraudulent, or harmful way.

## 3. The Service
1. PolicyPack provides tools that help businesses prepare, maintain, organize, and export legal and compliance-related documentation, including Privacy Policies, Terms of Service, Cookie Policies, and related notices or addenda.
2. The Service may use secure automated data processors, third-party infrastructure, and configuration inputs to generate draft documents and compliance recommendations.
3. You acknowledge that generated documents are based on the information you provide and that incomplete or inaccurate inputs may produce incomplete or inaccurate outputs.

## 4. Not Legal Advice
1. PolicyPack is a software product and does not provide legal advice, legal representation, or legal opinions.
2. Content generated through the Service is intended to support internal workflows and drafting efficiency. It does not replace review by qualified counsel where legal review is necessary or appropriate.
3. You remain solely responsible for determining whether any generated content is appropriate for your business, users, jurisdictions, and regulatory obligations.

## 5. Customer Responsibilities
1. You are responsible for all content, instructions, answers, onboarding data, business descriptions, URLs, vendor details, and legal preferences you submit through the Service.
2. You must ensure that you have the rights and permissions necessary to submit any content or data you provide to PolicyPack.
3. You agree not to use the Service to generate unlawful, deceptive, infringing, abusive, or misleading content.
4. You are responsible for reviewing exported policies before publishing or distributing them to end users.

## 6. Fees, Billing, and Renewals
1. Paid features may be offered on a subscription or recurring billing basis.
2. If you purchase a subscription, you authorize us and our payment processors to charge the applicable fees, taxes, and any renewal charges using your selected payment method.
3. Unless otherwise stated, subscriptions automatically renew for the same billing term until canceled.
4. You may cancel renewal at any time before the start of the next billing period. Fees already paid are non-refundable except where required by law or expressly stated by us in writing.

## 7. Acceptable Use
1. You may not misuse the Service, interfere with its normal operation, attempt unauthorized access, reverse engineer protected parts of the platform except where prohibited by law, or use the Service to violate applicable laws or the rights of others.
2. You may not use automated means to scrape, overload, probe, or disrupt the Service in a way that creates security, availability, or performance risks.
3. You may not use PolicyPack to build or distribute spam, fraudulent workflows, unlawful surveillance systems, or deceptive compliance claims.

## 8. Intellectual Property
1. PolicyPack and all related software, branding, interfaces, workflows, designs, and platform content are owned by PolicyPack or its licensors and are protected by intellectual property laws.
2. Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, revocable right to access and use the Service for your internal business purposes.
3. You retain ownership of the content and business information you submit to the Service, subject to the rights you grant us to host, process, store, transmit, and transform that information as needed to operate and improve the Service.
4. We may use aggregated and de-identified usage data to improve the Service, provided that such data does not identify you or your end users.

## 9. Third-Party Services
1. The Service may integrate with or depend on third-party vendors for hosting, analytics, security, communications, payment processing, and automated processing infrastructure.
2. Your use of third-party products or services may be subject to separate terms and privacy policies provided by those third parties.
3. We are not responsible for third-party services except to the extent required by applicable law.

## 10. Availability, Updates, and Changes
1. We may modify, improve, replace, suspend, or discontinue any part of the Service at any time.
2. We do not guarantee that the Service will be uninterrupted, error-free, or suitable for every legal or compliance use case.
3. We may release new features, beta functionality, or updated workflows, and such changes may be subject to additional conditions or notices.

## 11. Suspension and Termination
1. We may suspend or terminate your access to the Service if you breach these Terms, create security or legal risk, fail to pay applicable fees, or use the Service in a manner that may harm PolicyPack, other customers, or third parties.
2. You may stop using the Service at any time.
3. Upon termination, your right to access the Service will end, but provisions that by their nature should survive termination will remain in effect, including provisions relating to intellectual property, disclaimers, limitations of liability, payment obligations accrued before termination, and dispute terms.

## 12. Disclaimers
1. The Service is provided on an "as is" and "as available" basis to the fullest extent permitted by law.
2. We disclaim all warranties, whether express, implied, statutory, or otherwise, including implied warranties of merchantability, fitness for a particular purpose, non-infringement, and any warranty that generated outputs will satisfy legal, regulatory, or commercial requirements.
3. We do not warrant that outputs generated through the Service will be complete, current, enforceable, or appropriate for your specific circumstances.

## 13. Limitation of Liability
1. To the fullest extent permitted by law, PolicyPack and its affiliates, officers, employees, contractors, and licensors will not be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages, or for any loss of profits, revenue, goodwill, data, business opportunity, or business interruption arising out of or related to the Service.
2. To the fullest extent permitted by law, our total aggregate liability arising out of or related to the Service and these Terms will not exceed the amount you paid to PolicyPack for the Service during the twelve months immediately preceding the event giving rise to the claim.
3. The limitations in this section apply regardless of the legal theory asserted and even if a limited remedy fails of its essential purpose.

## 14. Indemnification
1. You agree to defend, indemnify, and hold harmless PolicyPack and its affiliates, officers, employees, contractors, and licensors from and against any claims, liabilities, damages, judgments, losses, costs, and expenses, including reasonable legal fees, arising out of or related to your content, your use of the Service, your violation of these Terms, or your violation of applicable law or the rights of another party.

## 15. Governing Law and Disputes
1. These Terms are governed by and construed in accordance with the laws applicable in the jurisdiction from which PolicyPack operates, without regard to conflict-of-laws principles.
2. You agree that any dispute, claim, or controversy arising out of or relating to these Terms or the Service will be resolved in the courts that have competent jurisdiction over PolicyPack, unless applicable law requires otherwise.

## 16. Changes to These Terms
1. We may update these Terms from time to time to reflect changes in the Service, the law, billing practices, or operational requirements.
2. When we make material changes, we may update the effective date above and provide additional notice where appropriate.
3. Your continued use of the Service after updated Terms become effective constitutes acceptance of the revised Terms.

## 17. Contact
1. Questions about these Terms may be sent through the contact channels published on https://policypack.org.
2. If you require a business or legal contact for contractual matters, use the latest contact information made available through the Service or on our website.
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
      description="These Terms govern access to PolicyPack's document generation and compliance workflow platform."
      markdown={TERMS_MARKDOWN}
    />
  );
}
