import generatedSiteContent from "@/lib/site-page-content.generated.json";
import {
  COMPANY_BRAND_NAME,
  COMPANY_LEGAL_NAME,
  COMPANY_PUBLIC_NAME,
  COMPANY_SUPPORT_EMAIL,
} from "@/lib/company";

export const SITE_LEGAL_LAST_UPDATED = generatedSiteContent.lastUpdated;

function normalizeGeneratedMarkdown(
  markdown: string,
  replacements: Array<[string, string]> = [],
) {
  let value = markdown
    .replace(/\r\n/g, "\n")
    .replaceAll("Ã¢â‚¬â„¢", "'")
    .replaceAll("Ã¢â‚¬â€œ", "-")
    .replaceAll("Ã¢â‚¬â€", "-")
    .replaceAll("Ã¢â‚¬Å“", '"')
    .replaceAll("Ã¢â‚¬\u009d", '"')
    .replaceAll("â€™", "'")
    .replaceAll("â€“", "-")
    .replaceAll("â€”", "-")
    .replaceAll("â€œ", '"')
    .replaceAll("â€\u009d", '"')
    .replaceAll("’", "'")
    .replaceAll("–", "-")
    .replaceAll("—", "-")
    .replaceAll("“", '"')
    .replaceAll("”", '"')
    .replaceAll(
      "[support@policypack.org](mailto:support@policypack.org)",
      "support@policypack.org",
    )
    .replace(/\n---\n/g, "\n")
    .replace(/\n---\s*/g, "\n")
    .trim();

  for (const [source, target] of replacements) {
    value = value.replaceAll(source, target);
  }

  return value.trim();
}

function enforceStrictPolicyPackRefundPolicy(markdown: string) {
  const strictRefundBlock = [
    "## 4. No Exceptions After Access or Generation",
    "",
    `4.1. ${COMPANY_BRAND_NAME} does not provide refunds once the AI generation process has been initiated or once any generated document pack has been accessed, generated, exported, delivered, or downloaded.`,
    "",
    "4.2. This rule applies to one-time purchases, premium exports, subscription-backed document access, and any related digital deliverable made available through policypack.org.",
    "",
    "4.3. If you have a billing question before generation begins or before you access any deliverable, contact support@policypack.org before using the service.",
    "",
    "## 5. Subscription Cancellations",
    "",
    "5.1. You may cancel a recurring subscription at any time through your account settings or by contacting support@policypack.org.",
    "",
    "5.2. Cancellation stops future billing cycles only. It does not create a refund for the current billing period or for any document generation already initiated or accessed.",
    "",
    "## 6. Payment Processing",
    "",
    "6.1. Payments may be processed through approved third-party payment providers or a merchant-of-record arrangement used for PolicyPack.",
    "",
    "6.2. Billing questions should be sent to support@policypack.org before initiating chargebacks or payment reversals.",
    "",
    "## 7. Contact Information",
    "",
    `7.1. For billing questions relating to ${COMPANY_BRAND_NAME}, contact support@policypack.org.`,
    "",
    "7.2. Please include your account email and order details in any billing communication.",
    "",
    "## 8. Governing Law",
    "",
    "8.1. This Refund Policy is governed by the laws of Singapore.",
  ].join("\n");

  return markdown.replace(
    /## 4\.[\s\S]*?(?=## 9\.|$)/,
    `${strictRefundBlock}\n\n`,
  );
}

function enforcePolicyPackTermsRefundLanguage(markdown: string) {
  return markdown
    .replace(
      /3\.4\.\s\*\*Refunds\*\*[\s\S]*?(?=3\.5\.)/,
      [
        "3.4. **Refunds**.",
        "",
        "3.4.1. Refunds are not provided once the AI generation process has been initiated or once any generated document pack has been accessed, generated, exported, delivered, or downloaded.",
        "",
        "3.4.2. Subscription cancellation stops future billing cycles only and does not create a refund for the current billing period or for any digital deliverable already accessed through PolicyPack.",
        "",
      ].join("\n"),
    )
    .replace(
      "constitute a legally binding agreement between you and Superlinear Technology Pte. Ltd., a company incorporated in Singapore, trading as PolicyPack",
      `constitute a legally binding agreement between you and ${COMPANY_PUBLIC_NAME}, a Singapore company`,
    );
}

const privacyPolicyMarkdown = normalizeGeneratedMarkdown(
  generatedSiteContent.pages.privacyPolicy,
  [
    [
      `This Privacy Policy describes how ${COMPANY_LEGAL_NAME}, trading as ${COMPANY_BRAND_NAME} ("${COMPANY_BRAND_NAME}," "we," "us," or "our"), collects, uses, discloses, and protects personal information when you access or use the ${COMPANY_BRAND_NAME} platform at https://policypack.org (the "Service"). This policy applies to all users, including visitors, registered account holders, and subscribers, regardless of geographic location.`,
      `This Privacy Policy describes how ${COMPANY_PUBLIC_NAME} collects, uses, discloses, and protects personal information when you access or use the ${COMPANY_BRAND_NAME} platform at https://policypack.org (the "Service"). This policy applies to all users, including visitors, registered account holders, and subscribers, regardless of geographic location.`,
    ],
    [
      "We maintain a public list of subprocessors at https://policypack.org/subprocessors. We will update this list before engaging new subprocessors and provide notice of material changes.",
      "We may maintain and update information about key subprocessors and service categories used to operate PolicyPack. Material changes will be reflected in our legal or operational notices when appropriate.",
    ],
    [
      "Data submitted for document generation is processed securely and is not used to train or improve third-party models without your explicit consent.",
      "Data submitted for document generation is processed securely to deliver the requested service and is handled according to the controls described in this Privacy Policy.",
    ],
  ],
);

const termsAndGdprMarkdown = enforcePolicyPackTermsRefundLanguage(
  normalizeGeneratedMarkdown(generatedSiteContent.pages.termsAndGdpr, [
    [
      `These Terms of Service govern access to and use of ${COMPANY_BRAND_NAME}, operated by ${COMPANY_PUBLIC_NAME}.`,
      `These Terms of Service govern access to and use of ${COMPANY_BRAND_NAME}, the trading name of ${COMPANY_LEGAL_NAME}, a Singapore company operating at https://policypack.org.`,
    ],
    [
      "All references to \"we,\" \"us,\" or \"our\" refer to Superlinear Technology Pte. Ltd. trading as PolicyPack. All references to \"you\" or \"your\" refer to the individual or entity accessing or using the service.",
      'All references to "we," "us," or "our" refer to Superlinear Technology Pte. Ltd. trading as PolicyPack. All references to "you" or "your" refer to the individual or entity accessing or using the service.',
    ],
    [
      "Premium features include export formats, version tracking, and update notifications when regulations or platform policies change.",
      "Premium features may include export formats and related workspace capabilities as described on the site at the time of purchase.",
    ],
  ]),
);

const cookiePolicyMarkdown = normalizeGeneratedMarkdown(
  generatedSiteContent.pages.cookiePolicy,
);

const refundPolicyMarkdown = enforceStrictPolicyPackRefundPolicy(
  normalizeGeneratedMarkdown(generatedSiteContent.pages.refundPolicy, [
    [
      `PolicyPack is the trading name of ${COMPANY_LEGAL_NAME}, a Singapore company. This Refund Policy applies to purchases made through policypack.org and any related checkout flow used for PolicyPack products and services.`,
      `${COMPANY_BRAND_NAME} is the trading name of ${COMPANY_LEGAL_NAME}, a Singapore company. This Refund Policy applies to purchases made through policypack.org and any related checkout flow used for ${COMPANY_BRAND_NAME} products and services.`,
    ],
    [
      "All sales are generally final once the digital product has been delivered or premium workspace access has been provisioned, except where applicable law provides a mandatory right of withdrawal or refund.",
      "Refunds are not provided once the AI generation process has been initiated or once any generated document pack has been accessed, generated, exported, delivered, or downloaded.",
    ],
    [
      "All sales are final once the digital product has been delivered or the subscription term has commenced, except where applicable law provides a mandatory right of withdrawal or refund.",
      "Refunds are not provided once the AI generation process has been initiated or once any generated document pack has been accessed, generated, exported, delivered, or downloaded.",
    ],
    [
      "d) Compliance monitoring and updates",
      "d) Workspace access and related compliance support tools",
    ],
  ]),
);

const contactUsMarkdown = normalizeGeneratedMarkdown(
  generatedSiteContent.pages.contactUs,
);

const aboutUsMarkdown = normalizeGeneratedMarkdown(
  generatedSiteContent.pages.aboutUs,
  [
    [
      "PolicyPack helps SaaS founders and digital businesses generate, publish, and maintain essential legal documents that meet the requirements of multiple jurisdictions simultaneously.",
      "PolicyPack helps SaaS founders and digital businesses generate and publish essential legal documents that address common multi-jurisdiction launch requirements.",
    ],
    [
      "What sets PolicyPack apart is our focus on dynamic policy management. We recognize that static, one-time legal documents quickly become outdated as your business evolves, new integrations are added, or regulations change. Our platform helps you maintain compliance through these changes with intelligent updates and notifications.",
      "What sets PolicyPack apart is our focus on structured, repeatable legal drafting. As your business evolves, your team can return to the workspace, update inputs, and generate a stronger next draft without starting from scratch.",
    ],
    [
      "The system works by collecting structured information about your service - what data you collect, how you process payments, which platforms you operate on, where your users are located - and producing publication-ready legal documents that reflect current requirements under GDPR, UK GDPR, CCPA, CPRA, ePrivacy Directive, and platform-specific policies enforced by Apple App Store, Google Play, Stripe, Paddle, and PayPal.",
      "The system works by collecting structured information about your service, such as what data you collect, how you process payments, which platforms you operate on, and where your users are located, then producing publication-ready legal documents that reflect current requirements under major privacy and platform frameworks.",
    ],
    [
      "3. **Current** - updated as regulations evolve",
      "3. **Current** - easier to revisit as your product and disclosures evolve",
    ],
    [
      "We utilize secure automated data processors to enhance the quality, consistency, and adaptability of our compliance solutions. Our AI systems are designed to augment human expertise, not replace it. All outputs undergo rigorous validation against current legal standards before being made available to our customers.",
      "We utilize secure automated data processors to enhance the quality, consistency, and adaptability of our compliance solutions. Our AI systems are designed to augment human expertise, not replace it. Outputs should still be reviewed by your team and, when needed, by qualified counsel before publication.",
    ],
    [
      "We do not train AI models on customer data. We do not share your service details with third parties for marketing or analytics purposes. The information you provide to PolicyPack is used solely to generate your compliance documents.",
      "We treat customer-provided service details as operational inputs for document generation and account support, and we do not use those details as public marketing material.",
    ],
  ],
);

const legalDisclaimerMarkdown = normalizeGeneratedMarkdown(
  generatedSiteContent.pages.legalDisclaimer,
  [
    [
      "PolicyPack does not monitor your use of generated documents. We do not notify you of legal changes that may affect your published policies. You must establish your own compliance monitoring and policy update procedures.",
      "You remain responsible for reviewing generated documents, publishing updates, and ensuring that your live policies continue to match your actual business practices.",
    ],
  ],
);

export function getPrivacyPolicyMarkdown() {
  return privacyPolicyMarkdown;
}

export function getTermsAndGdprMarkdown() {
  return termsAndGdprMarkdown;
}

export function getCookiePolicyMarkdown() {
  return cookiePolicyMarkdown;
}

export function getRefundPolicyMarkdown() {
  return refundPolicyMarkdown;
}

export function getAboutUsMarkdown() {
  return aboutUsMarkdown;
}

export function getContactUsMarkdown() {
  return contactUsMarkdown;
}

export function getLegalDisclaimerMarkdown() {
  return legalDisclaimerMarkdown;
}

export function getSupportEmailForSiteLegal() {
  return COMPANY_SUPPORT_EMAIL;
}
