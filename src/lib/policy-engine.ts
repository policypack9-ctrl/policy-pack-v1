import { PRODUCTION_APP_URL } from "@/lib/site-config";

export const POLICY_SESSION_STORAGE_KEY = "policypack:onboarding:v1";

export type OnboardingAnswers = {
  businessName: string;
  websiteUrl: string;
  productDescription: string;
  companyLocation: string;
  customerRegions: string[];
  collectedData: string[];
  vendors: string[];
  userAccounts: string;
  acceptsPayments: string;
  outreachChannels: string[];
};

export type StoredPolicySession = {
  answers: OnboardingAnswers;
  completedAt: string;
};

export type DashboardDocument = {
  id: "privacy-policy" | "terms-of-service" | "cookie-policy" | "gdpr-addendum";
  title: string;
  summary: string;
  status: "Up to Date";
  refreshedAt: string;
  lastAuditLabel: string;
  downloadFileName: string;
  clauses: string[];
  isPrimary?: boolean;
};

export type ComplianceSnapshot = {
  businessName: string;
  websiteUrl: string;
  primaryRegion: string;
  monitoredRegions: string[];
  generatedAt: string;
  healthScore: number;
  healthSummary: string;
  auditSummary: string;
  alertTitle: string;
  alertMessage: string;
  preferredDocumentId: DashboardDocument["id"];
  documents: DashboardDocument[];
};

export const emptyOnboardingAnswers: OnboardingAnswers = {
  businessName: "",
  websiteUrl: "",
  productDescription: "",
  companyLocation: "",
  customerRegions: [],
  collectedData: [],
  vendors: [],
  userAccounts: "",
  acceptsPayments: "",
  outreachChannels: [],
};

export const demoOnboardingAnswers: OnboardingAnswers = {
  businessName: "PolicyPack",
  websiteUrl: PRODUCTION_APP_URL,
  productDescription:
    "We help SaaS founders generate and maintain Privacy Policies and Terms of Service in minutes.",
  companyLocation: "United States",
  customerRegions: ["United States", "European Union"],
  collectedData: ["Names and emails", "Billing details", "Analytics and cookies"],
  vendors: ["Stripe", "OpenAI", "AWS or Vercel"],
  userAccounts: "Yes",
  acceptsPayments: "Yes",
  outreachChannels: ["Analytics cookies", "Product update emails"],
};

export function getGenerationMessages(answers: OnboardingAnswers) {
  const productName = getProductName(answers);
  const messages = [
    `Analyzing ${productName} data structures...`,
    "Mapping regulatory updates...",
  ];

  if (hasEuropeanCoverage(answers)) {
    messages.push("Matching GDPR Article 13 compliance protocols...");
  }

  if (hasUnitedStatesCoverage(answers)) {
    messages.push("Syncing CCPA & California Privacy requirements...");
  }

  if (collectsPaymentInfo(answers)) {
    messages.push("Verifying PCI-DSS data handling clauses...");
  }

  if (usesAiServices(answers)) {
    messages.push("Reviewing AI processor and model disclosure layers...");
  }

  messages.push(`Generating final PolicyPack for ${productName}...`);

  return messages;
}

export function buildComplianceSnapshot(
  answers: OnboardingAnswers,
  completedAt = new Date().toISOString(),
): ComplianceSnapshot {
  const normalizedAnswers = normalizeAnswers(answers);
  const monitoredRegions = resolveMonitoredRegions(normalizedAnswers);
  const primaryRegion = resolvePrimaryRegion(normalizedAnswers);
  const generatedAt = formatDisplayDateTime(completedAt);
  const collectedDataLabel = formatAnswerList(
    normalizedAnswers.collectedData,
    "core account and usage data",
  );
  const accountLabel =
    normalizedAnswers.userAccounts === "Yes"
      ? "account access terms"
      : "guest access terms";
  const paymentLabel =
    normalizedAnswers.acceptsPayments === "Yes"
      ? "billing and subscription rules"
      : "free-access usage rules";
  const vendorLabel = formatAnswerList(
    normalizedAnswers.vendors,
    "your hosting and billing stack",
  );
  const outreachLabel = formatAnswerList(
    normalizedAnswers.outreachChannels,
    "essential service communications",
  );
  const preferredDocumentId = "gdpr-addendum";

  const addendumTitle = hasEuropeanCoverage(normalizedAnswers)
    ? "GDPR Compliance Document"
    : hasUnitedStatesCoverage(normalizedAnswers)
      ? "CCPA Notice"
      : "GDPR/CCPA Addendum";
  const addendumSummary = hasEuropeanCoverage(normalizedAnswers)
    ? `Controller, transfer, and GDPR rights language prepared for ${primaryRegion}.`
    : hasUnitedStatesCoverage(normalizedAnswers)
      ? `California privacy notice and consumer rights language prepared for ${primaryRegion}.`
      : `Processor, transfer, and controller language prepared for ${primaryRegion}.`;

  const documents: DashboardDocument[] = [
    {
      id: "privacy-policy",
      title: "Privacy Policy",
      summary: `Covers ${collectedDataLabel} and user rights for ${monitoredRegions.join(", ")} visitors.`,
      status: "Up to Date",
      refreshedAt: generatedAt,
      lastAuditLabel: generatedAt,
      downloadFileName: "privacy-policy.pdf",
      clauses: [
        `Collected data: ${collectedDataLabel}.`,
        `Vendors disclosed: ${vendorLabel}.`,
        `User rights and retention language tailored for ${primaryRegion}.`,
      ],
    },
    {
      id: "terms-of-service",
      title: "Terms of Service",
      summary: `Defines ${accountLabel}, ${paymentLabel}, and product use boundaries.`,
      status: "Up to Date",
      refreshedAt: generatedAt,
      lastAuditLabel: generatedAt,
      downloadFileName: "terms-of-service.pdf",
      clauses: [
        normalizedAnswers.userAccounts === "Yes"
          ? "Users create and manage secure accounts."
          : "No customer accounts are created in the current flow.",
        normalizedAnswers.acceptsPayments === "Yes"
          ? "Paid plans, billing triggers, and refund language are active."
          : "No paid subscriptions are currently active.",
        `Service access and acceptable use aligned to ${normalizedAnswers.productDescription || "your SaaS product"}.`,
      ],
    },
    {
      id: "cookie-policy",
      title: "Cookie Policy",
      summary: `Maps analytics and outreach usage for ${outreachLabel}.`,
      status: "Up to Date",
      refreshedAt: generatedAt,
      lastAuditLabel: generatedAt,
      downloadFileName: "cookie-policy.pdf",
      clauses: [
        `Cookie and outreach channels: ${outreachLabel}.`,
        `Consent flows tuned for ${monitoredRegions.join(", ")} visitors.`,
        "Tracking disclosures aligned with analytics, marketing, and operational messaging.",
      ],
    },
    {
      id: "gdpr-addendum",
      title: addendumTitle,
      summary: addendumSummary,
      status: "Up to Date",
      refreshedAt: generatedAt,
      lastAuditLabel: generatedAt,
      downloadFileName:
        addendumTitle === "CCPA Notice"
          ? "ccpa-notice.pdf"
          : addendumTitle === "GDPR Compliance Document"
            ? "gdpr-compliance-document.pdf"
            : "gdpr-ccpa-addendum.pdf",
      clauses: [
        `Data processing addendum references ${vendorLabel}.`,
        hasUnitedStatesCoverage(normalizedAnswers)
          ? "California consumer rights, disclosures, and opt-out language are pre-mapped."
          : `Cross-border transfer language aligned with ${primaryRegion}.`,
        "Sub-processor, security, and breach notice obligations are pre-mapped.",
      ],
      isPrimary: true,
    },
  ];

  return {
    businessName: getProductName(normalizedAnswers),
    websiteUrl: normalizedAnswers.websiteUrl || PRODUCTION_APP_URL,
    primaryRegion,
    monitoredRegions,
    generatedAt,
    healthScore: 100,
    healthSummary: `100% of your core documents are synced for ${monitoredRegions.join(", ")} coverage.`,
    auditSummary: `Monitoring ${monitoredRegions.join(", ")} obligations plus processor language for ${vendorLabel}.`,
    alertTitle: "New Regulation Alert",
    alertMessage:
      "EU AI Act update detected. Your 'Data Processing' clause may need a refresh.",
    preferredDocumentId,
    documents: sortDocumentsWithPrimaryFirst(documents, preferredDocumentId),
  };
}

export function resolvePrimaryRegion(answers: OnboardingAnswers) {
  const candidate = answers.customerRegions[0] || answers.companyLocation;

  if (!candidate) {
    return "your market";
  }

  if (candidate === "Global") {
    return "global audiences";
  }

  return candidate;
}

export function getProductName(answers: OnboardingAnswers) {
  return answers.businessName.trim() || "PolicyPack";
}

export function normalizeAnswers(
  value?: Partial<OnboardingAnswers> | null,
): OnboardingAnswers {
  return {
    ...emptyOnboardingAnswers,
    ...value,
    customerRegions: Array.isArray(value?.customerRegions)
      ? value.customerRegions
      : [],
    collectedData: Array.isArray(value?.collectedData) ? value.collectedData : [],
    vendors: Array.isArray(value?.vendors) ? value.vendors : [],
    outreachChannels: Array.isArray(value?.outreachChannels)
      ? value.outreachChannels
      : [],
  };
}

export function parseStoredPolicySession(raw: string | null) {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredPolicySession>;
    return {
      answers: normalizeAnswers(parsed.answers),
      completedAt:
        typeof parsed.completedAt === "string"
          ? parsed.completedAt
          : new Date().toISOString(),
    } satisfies StoredPolicySession;
  } catch {
    return null;
  }
}

export function serializeDocumentPreview(
  document: DashboardDocument,
  snapshot: ComplianceSnapshot,
) {
  return [
    document.title,
    `Generated for ${snapshot.businessName}`,
    `Website: ${snapshot.websiteUrl}`,
    `Status: ${document.status}`,
    `Last refresh: ${document.refreshedAt}`,
    "",
    document.summary,
    "",
    ...document.clauses.map((clause, index) => `${index + 1}. ${clause}`),
  ].join("\n");
}

export function formatDisplayDateTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function resolveMonitoredRegions(answers: OnboardingAnswers) {
  const regions = new Set<string>();

  if (answers.companyLocation) {
    regions.add(answers.companyLocation);
  }

  for (const region of answers.customerRegions) {
    regions.add(region);
  }

  if (regions.size === 0) {
    regions.add("United States");
  }

  return Array.from(regions);
}

function formatAnswerList(items: string[], fallback: string) {
  if (items.length === 0) {
    return fallback;
  }

  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function hasEuropeanCoverage(answers: OnboardingAnswers) {
  return [answers.companyLocation, ...answers.customerRegions].some((region) =>
    ["European Union", "United Kingdom", "Global"].includes(region),
  );
}

function hasUnitedStatesCoverage(answers: OnboardingAnswers) {
  return [answers.companyLocation, ...answers.customerRegions].some((region) =>
    ["United States", "Global"].includes(region),
  );
}

function collectsPaymentInfo(answers: OnboardingAnswers) {
  return (
    answers.acceptsPayments === "Yes" ||
    answers.collectedData.includes("Billing details") ||
    answers.vendors.includes("Stripe")
  );
}

function usesAiServices(answers: OnboardingAnswers) {
  return answers.vendors.includes("OpenAI");
}

function sortDocumentsWithPrimaryFirst(
  documents: DashboardDocument[],
  preferredDocumentId: DashboardDocument["id"],
) {
  return [...documents].sort((left, right) => {
    if (left.id === preferredDocumentId) {
      return -1;
    }

    if (right.id === preferredDocumentId) {
      return 1;
    }

    return 0;
  });
}
