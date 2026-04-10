import generatedSiteContent from "@/lib/site-page-content.generated.json";
import { COMPANY_SUPPORT_EMAIL } from "@/lib/company";

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

const privacyPolicyMarkdown = normalizeGeneratedMarkdown(
  generatedSiteContent.pages.privacyPolicy,
  [
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

const termsAndGdprMarkdown = normalizeGeneratedMarkdown(
  generatedSiteContent.pages.termsAndGdpr,
  [
    [
      "All references to \"we,\" \"us,\" or \"our\" refer to Superlinear Technology Pte. Ltd. trading as PolicyPack. All references to \"you\" or \"your\" refer to the individual or entity accessing or using the service.",
      'All references to "we," "us," or "our" refer to Superlinear Technology Pte. Ltd. trading as PolicyPack. All references to "you" or "your" refer to the individual or entity accessing or using the service.',
    ],
    [
      "Premium features include export formats, version tracking, and update notifications when regulations or platform policies change.",
      "Premium features may include export formats, version tracking, update notifications, and related workspace capabilities as described on the site at the time of purchase.",
    ],
  ],
);

const cookiePolicyMarkdown = normalizeGeneratedMarkdown(
  generatedSiteContent.pages.cookiePolicy,
);

const refundPolicyMarkdown = normalizeGeneratedMarkdown(
  generatedSiteContent.pages.refundPolicy,
  [
    [
      "All sales are final once the digital product has been delivered or the subscription term has commenced, except where applicable law provides a mandatory right of withdrawal or refund.",
      "All sales are generally final once the digital product has been delivered or premium workspace access has been provisioned, except where applicable law provides a mandatory right of withdrawal or refund.",
    ],
  ],
);

const contactUsMarkdown = normalizeGeneratedMarkdown(
  generatedSiteContent.pages.contactUs,
);

const aboutUsMarkdown = normalizeGeneratedMarkdown(
  generatedSiteContent.pages.aboutUs,
  [
    [
      "The system works by collecting structured information about your service - what data you collect, how you process payments, which platforms you operate on, where your users are located - and producing publication-ready legal documents that reflect current requirements under GDPR, UK GDPR, CCPA, CPRA, ePrivacy Directive, and platform-specific policies enforced by Apple App Store, Google Play, Stripe, Paddle, and PayPal.",
      "The system works by collecting structured information about your service, such as what data you collect, how you process payments, which platforms you operate on, and where your users are located, then producing publication-ready legal documents that reflect current requirements under major privacy and platform frameworks.",
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
