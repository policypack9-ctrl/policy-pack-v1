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
  planSelection: string;
  selectedPages: string[];
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
  id: "about-us" | "contact-us" | "privacy-policy" | "cookie-policy" | "terms-of-service" | "legal-disclaimer" | "refund-policy";
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
  planSelection: "",
  selectedPages: [],
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
  planSelection: "premium",
  selectedPages: ["about-us", "contact-us", "privacy-policy", "cookie-policy", "terms-of-service", "legal-disclaimer", "refund-policy"],
  businessName: "Example SaaS",
  websiteUrl: "https://example.com",
  productDescription:
    "We help founders manage their online software service efficiently.",
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
  const preferredDocumentId = "privacy-policy";

  const documents: DashboardDocument[] = [
    {
      id: "about-us",
      title: "About Us",
      summary: `A summary of ${getProductName(normalizedAnswers)} and its mission.`,
      status: "Up to Date",
      refreshedAt: generatedAt,
      lastAuditLabel: generatedAt,
      downloadFileName: "about-us.pdf",
      clauses: [
        `Company background and core mission.`,
        `Team and values.`,
      ],
    },
    {
      id: "contact-us",
      title: "Contact Us",
      summary: `Contact information and support channels for your users.`,
      status: "Up to Date",
      refreshedAt: generatedAt,
      lastAuditLabel: generatedAt,
      downloadFileName: "contact-us.pdf",
      clauses: [
        `Support email and response times.`,
        `Physical address if applicable.`,
      ],
    },
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
      isPrimary: true,
    },
    {
      id: "cookie-policy",
      title: "Cookies Policy",
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
      id: "legal-disclaimer",
      title: "Legal Disclaimer",
      summary: `Limits your liability regarding the use of your service or information provided.`,
      status: "Up to Date",
      refreshedAt: generatedAt,
      lastAuditLabel: generatedAt,
      downloadFileName: "legal-disclaimer.pdf",
      clauses: [
        `General information disclaimer.`,
        `No professional advice disclaimer.`,
        `Limitation of liability.`,
      ],
    },
    {
      id: "refund-policy",
      title: "Refund Policy",
      summary: `Rules and conditions for customer refunds and cancellations.`,
      status: "Up to Date",
      refreshedAt: generatedAt,
      lastAuditLabel: generatedAt,
      downloadFileName: "refund-policy.pdf",
      clauses: [
        `Eligibility for refunds.`,
        `Cancellation process.`,
        `Exceptions and non-refundable items.`,
      ],
    },
  ];

  const selectedDocumentIds = normalizedAnswers.selectedPages?.length > 0
    ? normalizedAnswers.selectedPages
    : ["about-us", "contact-us", "privacy-policy", "cookie-policy", "terms-of-service", "legal-disclaimer", "refund-policy"];

  const filteredDocuments = documents.filter((doc) => selectedDocumentIds.includes(doc.id));

  return {
    businessName: getProductName(normalizedAnswers),
    websiteUrl: normalizedAnswers.websiteUrl || "https://your-website.com",
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
    documents: sortDocumentsWithPrimaryFirst(filteredDocuments, preferredDocumentId),
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
  return answers.businessName.trim() || "The Service";
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
    planSelection: typeof value?.planSelection === "string" ? value.planSelection : "",
    selectedPages: Array.isArray(value?.selectedPages) ? value.selectedPages : [],
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

export function formatAnswerList(items: string[], fallback: string) {
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

// ---------------------------------------------------------------------------
// Page-specific question mapping
// Defines which OnboardingAnswers fields are relevant for each document type.
// The wizard uses this to show only questions needed for the selected pages.
// ---------------------------------------------------------------------------

export type OnboardingQuestionId = keyof Omit<OnboardingAnswers, "selectedPages">;

export const PAGE_QUESTION_MAP: Record<DashboardDocument["id"], OnboardingQuestionId[]> = {
  "about-us": [
    "businessName",
    "websiteUrl",
    "productDescription",
    "companyLocation",
  ],
  "contact-us": [
    "businessName",
    "websiteUrl",
    "companyLocation",
  ],
  "privacy-policy": [
    "businessName",
    "websiteUrl",
    "productDescription",
    "companyLocation",
    "customerRegions",
    "collectedData",
    "vendors",
    "outreachChannels",
    "aiTransparencyLevel",
    "userAccounts",
    "acceptsPayments",
  ],
  "cookie-policy": [
    "businessName",
    "websiteUrl",
    "outreachChannels",
    "vendors",
    "customerRegions",
  ],
  "terms-of-service": [
    "businessName",
    "websiteUrl",
    "productDescription",
    "companyLocation",
    "customerRegions",
    "userAccounts",
    "acceptsPayments",
    "aiTransparencyLevel",
  ],
  "legal-disclaimer": [
    "businessName",
    "websiteUrl",
    "productDescription",
    "aiTransparencyLevel",
  ],
  "refund-policy": [
    "businessName",
    "websiteUrl",
    "acceptsPayments",
  ],
};

/**
 * Returns the deduplicated set of question IDs needed
 * for the given array of selected page IDs.
 * Order is preserved based on a canonical question priority list.
 */
const CANONICAL_QUESTION_ORDER: OnboardingQuestionId[] = [
  "businessName",
  "websiteUrl",
  "productDescription",
  "companyLocation",
  "customerRegions",
  "collectedData",
  "vendors",
  "userAccounts",
  "acceptsPayments",
  "outreachChannels",
  "aiTransparencyLevel",
];

export function getQuestionsForSelectedPages(
  selectedPageIds: DashboardDocument["id"][],
): OnboardingQuestionId[] {
  const needed = new Set<OnboardingQuestionId>();
  for (const pageId of selectedPageIds) {
    for (const q of PAGE_QUESTION_MAP[pageId] ?? []) {
      needed.add(q);
    }
  }
  return CANONICAL_QUESTION_ORDER.filter((q) => needed.has(q));
}
