import { PRODUCTION_APP_URL } from "@/lib/site-config";

export const POLICY_SESSION_STORAGE_KEY = "policypack:onboarding:v1";
export const OTHER_OPTION_VALUE = "Other";

export const CUSTOM_INPUT_FIELDS = {
  companyLocation: "companyLocationOther",
  customerRegions: "customerRegionsOther",
  collectedData: "collectedDataOther",
  vendors: "vendorsOther",
  outreachChannels: "outreachChannelsOther",
} as const;

export const CUSTOM_MULTI_INPUT_FIELDS = {
  customerRegions: "customerRegionsOther",
  collectedData: "collectedDataOther",
  vendors: "vendorsOther",
  outreachChannels: "outreachChannelsOther",
} as const;

export type CustomizableQuestionId = keyof typeof CUSTOM_INPUT_FIELDS;
export type CustomInputField =
  (typeof CUSTOM_INPUT_FIELDS)[CustomizableQuestionId];
export type CustomMultiQuestionId = keyof typeof CUSTOM_MULTI_INPUT_FIELDS;
export type CustomMultiInputField =
  (typeof CUSTOM_MULTI_INPUT_FIELDS)[CustomMultiQuestionId];

export type OnboardingAnswers = {
  businessName: string;
  websiteUrl: string;
  productDescription: string;
  aiTransparencyLevel: string;
  companyLocation: string;
  companyLocationOther: string;
  customerRegions: string[];
  customerRegionsOther: string;
  collectedData: string[];
  collectedDataOther: string;
  vendors: string[];
  vendorsOther: string;
  userAccounts: string;
  acceptsPayments: string;
  outreachChannels: string[];
  outreachChannelsOther: string;
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
  aiTransparencyLevel: "Named Providers",
  companyLocation: "",
  companyLocationOther: "",
  customerRegions: [],
  customerRegionsOther: "",
  collectedData: [],
  collectedDataOther: "",
  vendors: [],
  vendorsOther: "",
  userAccounts: "",
  acceptsPayments: "",
  outreachChannels: [],
  outreachChannelsOther: "",
};

export const demoOnboardingAnswers: OnboardingAnswers = {
  businessName: "PolicyPack",
  websiteUrl: PRODUCTION_APP_URL,
  productDescription:
    "We help SaaS founders generate and maintain Privacy Policies and Terms of Service in minutes.",
  aiTransparencyLevel: "Named Providers",
  companyLocation: "United States",
  companyLocationOther: "",
  customerRegions: ["United States", "European Union"],
  customerRegionsOther: "",
  collectedData: ["Names and emails", "Billing details", "Analytics and cookies"],
  collectedDataOther: "",
  vendors: ["Stripe", "OpenAI", "AWS or Vercel"],
  vendorsOther: "",
  userAccounts: "Yes",
  acceptsPayments: "Yes",
  outreachChannels: ["Analytics cookies", "Product update emails"],
  outreachChannelsOther: "",
};

export function getGenerationMessages(answers: OnboardingAnswers) {
  const normalizedAnswers = normalizeAnswers(answers);
  const productName = getProductName(normalizedAnswers);
  const messages = [
    `Analyzing ${productName} data structures...`,
    "Mapping regulatory updates...",
  ];

  if (hasEuropeanCoverage(normalizedAnswers)) {
    messages.push("Matching GDPR Article 13 compliance protocols...");
  }

  if (hasUnitedStatesCoverage(normalizedAnswers)) {
    messages.push("Syncing CCPA & California Privacy requirements...");
  }

  if (collectsPaymentInfo(normalizedAnswers)) {
    messages.push("Verifying PCI-DSS data handling clauses...");
  }

  if (usesAiServices(normalizedAnswers)) {
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
  const normalizedAnswers = normalizeAnswers(answers);
  const candidate =
    normalizedAnswers.customerRegions[0] || normalizedAnswers.companyLocation;

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
  const companyLocationOther = readCustomFieldValue(
    value,
    CUSTOM_INPUT_FIELDS.companyLocation,
  );
  const customerRegionsOther = readCustomFieldValue(
    value,
    CUSTOM_MULTI_INPUT_FIELDS.customerRegions,
  );
  const collectedDataOther = readCustomFieldValue(
    value,
    CUSTOM_MULTI_INPUT_FIELDS.collectedData,
  );
  const vendorsOther = readCustomFieldValue(
    value,
    CUSTOM_MULTI_INPUT_FIELDS.vendors,
  );
  const outreachChannelsOther = readCustomFieldValue(
    value,
    CUSTOM_MULTI_INPUT_FIELDS.outreachChannels,
  );

  return {
    ...emptyOnboardingAnswers,
    ...value,
    businessName: typeof value?.businessName === "string" ? value.businessName : "",
    websiteUrl: typeof value?.websiteUrl === "string" ? value.websiteUrl : "",
    productDescription:
      typeof value?.productDescription === "string" ? value.productDescription : "",
    aiTransparencyLevel:
      typeof value?.aiTransparencyLevel === "string" &&
      value.aiTransparencyLevel.trim().length > 0
        ? value.aiTransparencyLevel
        : "Named Providers",
    companyLocation: resolveCompanyLocationValue(value),
    companyLocationOther,
    customerRegions: resolveMultiAnswerValues(
      value,
      "customerRegions",
      customerRegionsOther,
    ),
    customerRegionsOther,
    collectedData: resolveMultiAnswerValues(
      value,
      "collectedData",
      collectedDataOther,
    ),
    collectedDataOther,
    vendors: resolveMultiAnswerValues(value, "vendors", vendorsOther),
    vendorsOther,
    userAccounts: typeof value?.userAccounts === "string" ? value.userAccounts : "",
    acceptsPayments:
      typeof value?.acceptsPayments === "string" ? value.acceptsPayments : "",
    outreachChannels: resolveMultiAnswerValues(
      value,
      "outreachChannels",
      outreachChannelsOther,
    ),
    outreachChannelsOther,
  };
}

export function getResolvedCompanyLocation(
  answers: Partial<OnboardingAnswers> | OnboardingAnswers,
) {
  return resolveCompanyLocationValue(answers);
}

export function getResolvedMultiAnswerValues(
  answers: Partial<OnboardingAnswers> | OnboardingAnswers,
  questionId: CustomMultiQuestionId,
) {
  return resolveMultiAnswerValues(
    answers,
    questionId,
    readCustomFieldValue(answers, CUSTOM_MULTI_INPUT_FIELDS[questionId]),
  );
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

function resolveCompanyLocationValue(value?: Partial<OnboardingAnswers> | null) {
  const selectedValue =
    typeof value?.companyLocation === "string" ? value.companyLocation.trim() : "";

  if (selectedValue !== OTHER_OPTION_VALUE) {
    return selectedValue;
  }

  return readCustomFieldValue(value, CUSTOM_INPUT_FIELDS.companyLocation);
}

function resolveMultiAnswerValues(
  value: Partial<OnboardingAnswers> | null | undefined,
  questionId: CustomMultiQuestionId,
  customValue: string,
) {
  const rawValues = Array.isArray(value?.[questionId]) ? value[questionId] : [];
  const filteredValues = rawValues.filter(
    (item): item is string =>
      typeof item === "string" &&
      item.trim().length > 0 &&
      item !== OTHER_OPTION_VALUE,
  );

  if (!customValue) {
    return dedupeAnswerItems(filteredValues);
  }

  return dedupeAnswerItems([...filteredValues, customValue]);
}

function readCustomFieldValue(
  value: Partial<OnboardingAnswers> | null | undefined,
  field: CustomInputField | CustomMultiInputField,
) {
  const customValue = value?.[field];
  return typeof customValue === "string" ? customValue.trim() : "";
}

function dedupeAnswerItems(items: string[]) {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const item of items) {
    const normalized = item.trim();
    if (!normalized) {
      continue;
    }

    const key = normalized.toLocaleLowerCase("en-US");
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(normalized);
  }

  return deduped;
}
