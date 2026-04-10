import {
  COMPANY_BRAND_NAME,
  COMPANY_JURISDICTION,
  COMPANY_LEGAL_NAME,
  COMPANY_PRIMARY_URL,
  COMPANY_PUBLIC_NAME,
  COMPANY_SUPPORT_EMAIL,
} from "@/lib/company";

export const SITE_LEGAL_LAST_UPDATED = "April 10, 2026";

export function getPrivacyPolicyMarkdown() {
  return String.raw`# Privacy Policy

**Operator:** ${COMPANY_PUBLIC_NAME}  
**Website:** ${COMPANY_PRIMARY_URL}  
**Support:** ${COMPANY_SUPPORT_EMAIL}  
**Last Updated:** ${SITE_LEGAL_LAST_UPDATED}

## 1. Scope and Application
1. This Privacy Policy explains how ${COMPANY_PUBLIC_NAME} collects, uses, stores, shares, and protects personal information when individuals visit ${COMPANY_PRIMARY_URL}, create accounts, request policy documents, or communicate with ${COMPANY_BRAND_NAME}.
2. This Privacy Policy applies to website visitors, prospective customers, registered users, paying subscribers, and business contacts whose information is processed in connection with our AI-powered legal automation platform.
3. Where local law grants additional rights, those local rights supplement this Privacy Policy and prevail to the extent required by law.

## 2. Personal Information We Collect
### 2.1 Information you provide directly
1. We may collect identifying and commercial information such as your name, work email address, company name, billing details, country, support request details, and the onboarding information you provide when generating legal documents.
2. We also collect the text, business context, regulatory preferences, and product descriptions that you intentionally submit through our onboarding flows, document requests, or support conversations.

### 2.2 Information collected automatically
1. We may automatically collect technical and usage information such as IP address, approximate location, browser type, device identifiers, session logs, referring pages, product interaction data, and cookie-related analytics signals.
2. This information helps us secure the service, detect abuse, understand product performance, and improve document quality over time.

### 2.3 Information from service providers and payment flows
- Transaction status and subscription metadata from our payment provider.
- Infrastructure, error-monitoring, and hosting telemetry from our secure processors.
- Authentication and session details required to maintain your personal workspace.

## 3. How We Use Personal Information
1. We use personal information to operate ${COMPANY_BRAND_NAME}, generate requested legal materials, maintain account access, authenticate users, process payments, respond to support requests, and monitor service quality.
2. We may also use personal information to prevent fraud, enforce our terms, investigate misuse, comply with legal obligations, and communicate important product, billing, or compliance updates.
3. We do not sell personal information in the ordinary course of operating ${COMPANY_BRAND_NAME}.

## 4. Legal Bases and Regional Rights
1. Where applicable, we rely on legal bases such as performance of a contract, legitimate interests, consent, and compliance with legal obligations.
2. Depending on your jurisdiction, you may have rights to request access, correction, deletion, portability, restriction, objection, or appeal regarding certain personal information.
3. We review privacy requests in a commercially reasonable manner and may require identity verification before fulfilling sensitive requests.

## 5. How We Share Information
1. We share information only where necessary to operate the platform, complete transactions, comply with law, or protect our rights and users.
2. Categories of recipients may include:
- **Infrastructure and hosting providers** used to run the application securely.
- **Payment and merchant-of-record providers** used to process transactions and invoices.
- **Secure automated data processors** used to help deliver document automation features.
- **Professional advisers or authorities** where disclosure is legally required or reasonably necessary.
3. We require processors to handle personal information under appropriate confidentiality and security obligations.

## 6. Cookies, Analytics, and Similar Technologies
1. ${COMPANY_BRAND_NAME} uses cookies and comparable technologies to keep sessions active, remember preferences, understand traffic, measure product adoption, and secure the service.
2. Some cookies are strictly necessary for account access, fraud prevention, and core application performance.
3. Additional analytics or marketing-related technologies, where used, are disclosed in our separate Cookie Policy.

## 7. Data Retention
1. We retain personal information for as long as reasonably necessary to provide the service, maintain customer records, comply with financial and legal requirements, resolve disputes, and enforce contractual rights.
2. Retention periods vary depending on the nature of the information, the account status, and applicable regulatory obligations.

## 8. International Data Transfers
1. ${COMPANY_LEGAL_NAME} is based in ${COMPANY_JURISDICTION}, and your information may be processed in ${COMPANY_JURISDICTION} or other countries where our processors operate.
2. Where cross-border transfers occur, we use contractual, organizational, or technical safeguards appropriate to the applicable legal framework.

## 9. Security
1. We use administrative, technical, and organizational safeguards designed to protect personal information against unauthorized access, loss, misuse, or alteration.
2. No online platform can guarantee absolute security, but we work to maintain a level of protection appropriate to the sensitivity of the information processed through ${COMPANY_BRAND_NAME}.

## 10. Children
1. ${COMPANY_BRAND_NAME} is designed for business users and is not directed to children.
2. If we become aware that personal information from a child has been submitted unlawfully, we will take reasonable steps to delete it.

## 11. Changes to This Privacy Policy
1. We may update this Privacy Policy to reflect changes in the service, our processors, legal requirements, or privacy practices.
2. When we make material changes, we will publish the updated version on ${COMPANY_PRIMARY_URL} and update the Last Updated date above.

## 12. Contact Us
1. Privacy questions, access requests, deletion requests, and regulatory concerns may be sent to **${COMPANY_SUPPORT_EMAIL}**.
2. Business correspondence may also reference **${COMPANY_LEGAL_NAME}**, operating ${COMPANY_BRAND_NAME} from **${COMPANY_JURISDICTION}**.`;
}

export function getTermsAndGdprMarkdown() {
  return String.raw`# Terms of Service

**Service Provider:** ${COMPANY_PUBLIC_NAME}  
**Website:** ${COMPANY_PRIMARY_URL}  
**Support:** ${COMPANY_SUPPORT_EMAIL}  
**Last Updated:** ${SITE_LEGAL_LAST_UPDATED}

## 1. Acceptance of These Terms
1. These Terms of Service govern access to and use of ${COMPANY_BRAND_NAME}, including the website, dashboard, onboarding experience, generated legal materials, and related subscription features.
2. By accessing or using ${COMPANY_PRIMARY_URL}, you agree to be bound by these Terms of Service and our related policies.

## 2. Eligibility and Business Use
1. ${COMPANY_BRAND_NAME} is intended for founders, operators, and teams using the service for lawful business purposes.
2. You represent that you have authority to act on behalf of your business or organization when submitting company information, policy instructions, or payment details.

## 3. Accounts and Access
1. You are responsible for maintaining accurate registration details, safeguarding account credentials, and controlling access to your workspace.
2. You must promptly notify us if you suspect unauthorized access, credential compromise, or misuse involving your account.

## 4. Subscription, Billing, and Complimentary Access
1. We may offer limited complimentary access, trial access, or launch promotions at our sole discretion.
2. Paid features, premium exports, and continuing access are billed according to the pricing displayed at checkout.
3. Billing, taxes, invoicing, renewals, and payment processing may be handled by our merchant-of-record and payment providers.

## 5. Refunds
1. Refund handling is governed by our published Refund Policy and any mandatory rights that apply under law.
2. Digital legal outputs, once generated and delivered, may not be refundable except where a verified technical defect cannot be resolved within a reasonable support window.

## 6. Service Scope
1. ${COMPANY_BRAND_NAME} provides AI-assisted document automation, compliance drafting workflows, policy generation tools, and related document management features.
2. The service is designed to accelerate legal operations, but it does not replace a licensed lawyer reviewing your specific facts, risk profile, or regulated obligations.

## 7. Customer Responsibilities
1. You are responsible for the accuracy, legality, and completeness of the information, prompts, business details, and instructions that you submit through the service.
2. You are also responsible for reviewing generated outputs before publication, especially where your business operates in regulated industries or multiple jurisdictions.

## 8. Acceptable Use
1. You may not use ${COMPANY_BRAND_NAME} to violate law, infringe rights, distribute harmful code, abuse automated systems, or attempt unauthorized access to the platform or third-party systems.
2. You may not misrepresent the generated materials as custom legal advice delivered by a licensed attorney unless such review has actually occurred outside the platform.

## 9. AI Outputs and Professional Boundaries
1. Generated documents are produced from the business information you provide, the workflow settings you choose, and the service logic we operate.
2. Outputs are intended to support operational compliance readiness, but they are not guaranteed to be exhaustive, error-free, or sufficient for every jurisdiction or fact pattern.
3. You remain responsible for determining whether independent legal review is necessary for your business.

## 10. Intellectual Property
1. We retain all rights in ${COMPANY_BRAND_NAME}, including the platform, code, visual design, prompts, workflows, templates, brand assets, and related intellectual property.
2. Subject to these Terms, you may use the generated document outputs for your internal business operations and website compliance needs.
3. You retain ownership of the business information and original inputs you provide to the service.

## 11. Third-Party Services
1. The platform may depend on hosting providers, payment services, authentication tools, analytics systems, and secure automated data processors.
2. We are not responsible for third-party products or services except to the extent required by law or expressly stated in a separate agreement.

## 12. Service Changes and Availability
1. We may improve, modify, suspend, or discontinue any part of the service at any time, including pricing, features, templates, integrations, or generation workflows.
2. While we aim for reliable uptime, we do not guarantee uninterrupted availability or error-free performance.

## 13. Disclaimers
1. ${COMPANY_BRAND_NAME} is provided on an **as available** and **as is** basis to the fullest extent permitted by law.
2. We disclaim implied warranties, including merchantability, fitness for a particular purpose, and non-infringement, except where such disclaimers are not permitted.

## 14. Limitation of Liability
1. To the fullest extent permitted by law, ${COMPANY_LEGAL_NAME} will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages arising out of or related to your use of the service.
2. Our aggregate liability for claims arising from the service will be limited to the amount you paid to us for the relevant service period giving rise to the claim, unless a greater minimum is required by law.

## 15. Indemnity
1. You agree to defend, indemnify, and hold harmless ${COMPANY_LEGAL_NAME} from claims, liabilities, damages, and expenses arising from your misuse of the service, your uploaded content, or your violation of law or these Terms.

## 16. Suspension and Termination
1. We may suspend or terminate access where we reasonably believe there is abuse, non-payment, security risk, fraud, legal exposure, or a material breach of these Terms.
2. You may stop using the service at any time, but outstanding fees and accrued obligations remain payable.

## 17. Governing Law and Dispute Handling
1. These Terms are governed by the laws of ${COMPANY_JURISDICTION}, excluding its conflict-of-law rules, unless mandatory local consumer law requires otherwise.
2. Before filing formal proceedings, the parties agree to attempt good-faith resolution through written notice sent to ${COMPANY_SUPPORT_EMAIL}.

## 18. Contact
1. Questions about these Terms may be sent to **${COMPANY_SUPPORT_EMAIL}**.
2. Notices may reference **${COMPANY_LEGAL_NAME}**, operating as **${COMPANY_BRAND_NAME}** via **${COMPANY_PRIMARY_URL}**.

# GDPR Compliance Document

**Controller / Service Operator:** ${COMPANY_PUBLIC_NAME}

## 1. Purpose of This Addendum
1. This GDPR Compliance Document summarizes the baseline data protection commitments relevant to the operation of ${COMPANY_BRAND_NAME} where the General Data Protection Regulation or parallel data protection requirements apply.
2. It supplements our Terms of Service and Privacy Policy and should be read alongside those documents.

## 2. Processing Context
1. ${COMPANY_BRAND_NAME} processes account, usage, onboarding, support, and transaction-related information to provide legal automation services.
2. Depending on the context, ${COMPANY_LEGAL_NAME} may act as a controller, joint controller, or processor for different categories of personal data.

## 3. Data Categories
- Account registration information
- Business and onboarding details submitted by customers
- Billing and transaction metadata
- Technical logs, session data, and security telemetry
- Support and communication records

## 4. Security and Confidentiality
1. We implement technical and organizational measures reasonably designed to protect personal data, limit access, preserve confidentiality, and detect misuse.
2. Access to personal data is restricted to personnel, contractors, and processors with a legitimate operational need.

## 5. Sub-Processors and International Transfers
1. We may engage carefully selected processors for hosting, analytics, AI-assisted automation, payment operations, authentication, and support workflows.
2. Where personal data is transferred across borders, we rely on safeguards appropriate to the relevant transfer mechanism and jurisdiction.

## 6. Data Subject Rights
1. Where applicable, we support requests for access, rectification, erasure, restriction, portability, and objection.
2. We may require sufficient detail to identify the requester, confirm the relevant account, and evaluate the scope of the request.

## 7. Incident Response
1. We maintain procedures for identifying, investigating, documenting, and responding to security incidents.
2. Where required by law, we will support notifications, risk assessments, or communications related to reportable incidents.

## 8. Contact
1. Data protection or GDPR-related questions may be sent to **${COMPANY_SUPPORT_EMAIL}**.`;
}

export function getCookiePolicyMarkdown() {
  return String.raw`# Cookie Policy

**Operator:** ${COMPANY_PUBLIC_NAME}  
**Website:** ${COMPANY_PRIMARY_URL}  
**Support:** ${COMPANY_SUPPORT_EMAIL}  
**Last Updated:** ${SITE_LEGAL_LAST_UPDATED}

## 1. What This Policy Covers
1. This Cookie Policy explains how ${COMPANY_BRAND_NAME} uses cookies, pixels, local storage, and similar technologies when you visit ${COMPANY_PRIMARY_URL} or interact with our services.
2. This Cookie Policy should be read together with our Privacy Policy.

## 2. Why We Use Cookies
1. We use essential technologies to keep sessions active, secure accounts, remember preferences, and support reliable product performance.
2. We may also use analytics-related technologies to understand traffic, product adoption, and general service performance.

## 3. Categories of Cookies
- **Strictly necessary cookies** used for login state, security, and core website functionality.
- **Performance cookies** used to understand how visitors navigate our pages and where product friction occurs.
- **Preference cookies** used to remember selections, interface choices, and similar settings.
- **Communication and attribution technologies** used where lawful to measure campaign or product engagement.

## 4. Third-Party Technologies
1. Some cookies or comparable technologies may be set or supported by service providers that help us operate hosting, analytics, payments, authentication, or automated workflows.
2. Those third parties may maintain their own notices and policies governing the data they receive.

## 5. Your Choices
1. You can manage cookies through your browser settings, device controls, and any consent management tools we make available.
2. Blocking certain cookies may reduce site functionality, affect sign-in persistence, or limit parts of the service experience.

## 6. Updates
1. We may update this Cookie Policy to reflect changes in our technology stack, legal requirements, or product operations.
2. The latest version will always be available on ${COMPANY_PRIMARY_URL}.

## 7. Contact
1. Questions about cookies or related tracking technologies may be sent to **${COMPANY_SUPPORT_EMAIL}**.`;
}

export function getRefundPolicyMarkdown() {
  return String.raw`# Refund Policy

**Operator:** ${COMPANY_PUBLIC_NAME}  
**Website:** ${COMPANY_PRIMARY_URL}  
**Support:** ${COMPANY_SUPPORT_EMAIL}  
**Last Updated:** ${SITE_LEGAL_LAST_UPDATED}

## 1. Digital Products
1. ${COMPANY_BRAND_NAME} provides non-tangible, irrevocable digital goods and subscription-based legal automation outputs, including downloadable legal documents and related compliance materials.
2. Because generated outputs are digital and made available immediately after purchase or generation, refunds are not generally available once the order is confirmed and the document or premium access has been delivered.

## 2. Exceptions
1. We may review a refund request where there is a verified technical defect in the generation or delivery process and our support team cannot resolve that issue within 72 hours after receiving complete information.
2. Refunds may also be considered where required by mandatory law or where a duplicate or clearly erroneous charge is confirmed.

## 3. Request Process
1. Refund requests must be submitted to **${COMPANY_SUPPORT_EMAIL}** within 14 days of purchase unless a longer period is required by applicable law.
2. Requests should include the account email, order details, transaction context, and a concise description of the issue so the case can be reviewed efficiently.

## 4. Review and Outcome
1. We assess refund requests in good faith and may request additional technical details, screenshots, or order references before making a decision.
2. If a refund is approved, it will be processed through the original payment channel or the method supported by our merchant-of-record.`;
}

export function getAboutUsMarkdown() {
  return String.raw`# About Us

**Company:** ${COMPANY_LEGAL_NAME}  
**Headquarters:** ${COMPANY_JURISDICTION}  
**Brand:** ${COMPANY_BRAND_NAME}

## 1. Who We Are
1. ${COMPANY_LEGAL_NAME} is a ${COMPANY_JURISDICTION}-based technology company building practical AI systems for legal operations, compliance workflows, and document automation.
2. Through ${COMPANY_BRAND_NAME}, we help modern software teams replace slow, fragmented legal drafting processes with faster, more structured, and more operationally useful workflows.

## 2. What We Build
1. ${COMPANY_BRAND_NAME} focuses on AI-assisted legal automation for SaaS companies that need clear Privacy Policies, Terms of Service, cookie disclosures, and supporting compliance materials.
2. Our goal is to make legal readiness feel operational instead of overwhelming: faster launches, clearer clauses, better update cycles, and a cleaner handoff to legal review when needed.

## 3. How We Think About AI Legal Automation
1. We believe AI should reduce friction, not create false certainty. That is why our platform is designed to produce structured legal drafts, surface compliance context, and keep businesses moving without pretending to replace licensed legal counsel.
2. We combine product context, jurisdiction signals, document structure, and continuously evolving regulatory expectations to make legal drafting more practical for internet businesses.

## 4. Why We Exist
1. Founders and lean product teams often delay compliance work because it feels expensive, slow, or inaccessible. ${COMPANY_BRAND_NAME} exists to close that gap.
2. We are building a category-defining legal automation product that helps teams launch with more confidence and maintain legal documents with less operational drag.

## 5. Contact
1. For partnerships, product inquiries, or media requests, contact **${COMPANY_SUPPORT_EMAIL}**.`;
}

export function getContactUsMarkdown() {
  return String.raw`# Contact Us

**Business Name:** ${COMPANY_LEGAL_NAME}  
**Brand:** ${COMPANY_BRAND_NAME}  
**Website:** ${COMPANY_PRIMARY_URL}

## 1. General Support
1. For account issues, billing questions, document access requests, or product support, email **${COMPANY_SUPPORT_EMAIL}**.
2. Please include the email address associated with your account and a short description of the issue so we can respond efficiently.

## 2. Compliance and Legal Requests
1. Privacy requests, data rights questions, and legal communications may also be directed to **${COMPANY_SUPPORT_EMAIL}**.
2. If your request concerns a generated document, please identify the relevant workspace or transaction context where possible.

## 3. Commercial Inquiries
1. For enterprise partnerships, reseller conversations, or strategic collaboration opportunities, use **${COMPANY_SUPPORT_EMAIL}** with the subject line **Commercial Inquiry**.

## 4. Expected Response Window
1. We aim to respond to standard support requests within a commercially reasonable timeframe.
2. More complex technical, billing, or compliance matters may require additional verification or follow-up before final resolution.`;
}

export function getLegalDisclaimerMarkdown() {
  return String.raw`# Legal Disclaimer

**Important:** ${COMPANY_BRAND_NAME} provides AI-assisted legal document generation tools. It does **not** provide legal advice, legal representation, or law-firm services.

## 1. No Legal Advice
1. Information, templates, generated clauses, and compliance outputs made available through ${COMPANY_PRIMARY_URL} are provided for general informational and operational support purposes only.
2. The platform does not create an attorney-client relationship between you and ${COMPANY_LEGAL_NAME}, ${COMPANY_BRAND_NAME}, or any person associated with the service.

## 2. Professional Review May Still Be Required
1. Generated documents may not address every legal risk, jurisdictional nuance, sector-specific rule, or factual scenario relevant to your business.
2. You should seek advice from a qualified licensed lawyer before relying on any generated material for high-risk, regulated, cross-border, or dispute-sensitive matters.

## 3. Customer Responsibility
1. You remain responsible for reviewing and approving every document before publication, signature, or commercial use.
2. You are also responsible for ensuring that the information you submit to the platform is accurate and complete.

## 4. No Guarantee of Regulatory Sufficiency
1. While ${COMPANY_BRAND_NAME} is designed to support compliance readiness, we do not guarantee that any generated output will satisfy every legal requirement applicable to your business.
2. Laws change, facts change, and enforcement expectations differ across industries and jurisdictions.

## 5. Contact
1. Questions about this disclaimer may be sent to **${COMPANY_SUPPORT_EMAIL}**.`;
}
