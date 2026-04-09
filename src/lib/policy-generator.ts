import "server-only";

import {
  getOpenRouterConfig,
  type AIProvider,
} from "@/lib/ai-config";
import {
  buildComplianceSnapshot,
  getProductName,
  normalizeAnswers,
  resolvePrimaryRegion,
  type DashboardDocument,
  type OnboardingAnswers,
} from "@/lib/policy-engine";
import { PRODUCTION_APP_URL } from "@/lib/site-config";

export type PolicyDocumentType = DashboardDocument["id"];

export type GeneratedPolicyDocument = {
  markdown: string;
  provider: AIProvider;
  model: string;
  usedFallback: boolean;
  title: string;
  generatedAt: string;
  research: {
    model: string;
    summary: string;
  };
};

type GeneratePolicyInput = {
  answers: OnboardingAnswers;
  documentType: PolicyDocumentType;
};

const POLICY_PROMPT_VERSION = "policypack-openrouter-two-stage-v1";

export async function generatePolicyDocument({
  answers,
  documentType,
}: GeneratePolicyInput): Promise<GeneratedPolicyDocument> {
  const normalizedAnswers = normalizeAnswers(answers);
  const config = getOpenRouterConfig();
  const title = getDocumentTitle(documentType, normalizedAnswers);
  const generatedAt = new Date().toISOString();

  if (config.provider === "mock" || !config.apiKey) {
    return {
      markdown: buildFallbackPolicyMarkdown(documentType, normalizedAnswers),
      provider: "mock",
      model: "template-fallback",
      usedFallback: true,
      title,
      generatedAt,
      research: {
        model: "template-fallback",
        summary: buildFallbackResearchSummary(normalizedAnswers),
      },
    };
  }

  try {
    const researchSummary = await runResearchStage({
      answers: normalizedAnswers,
      documentType,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      siteName: config.siteName,
      siteUrl: config.siteUrl,
      model: config.researchModel,
    });
    const markdown = await runDraftingStage({
      answers: normalizedAnswers,
      documentType,
      researchSummary,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      siteName: config.siteName,
      siteUrl: config.siteUrl,
      model: config.draftingModel,
    });

    return {
      markdown: normalizeMarkdown(markdown, title),
      provider: "openrouter",
      model: config.draftingModel,
      usedFallback: false,
      title,
      generatedAt,
      research: {
        model: config.researchModel,
        summary: researchSummary,
      },
    };
  } catch {
    return {
      markdown: buildFallbackPolicyMarkdown(documentType, normalizedAnswers),
      provider: "mock",
      model: "template-fallback",
      usedFallback: true,
      title,
      generatedAt,
      research: {
        model: "template-fallback",
        summary: buildFallbackResearchSummary(normalizedAnswers),
      },
    };
  }
}

async function runResearchStage(input: {
  answers: OnboardingAnswers;
  documentType: PolicyDocumentType;
  apiKey: string;
  baseUrl: string | null;
  siteName: string;
  siteUrl: string;
  model: string;
}) {
  const systemPrompt = [
    "You are PolicyPack's legal research stage.",
    `Prompt version: ${POLICY_PROMPT_VERSION}.`,
    "Search the web and summarize only the most relevant legal clauses or disclosure changes from the last 12 months.",
    "Prioritize 2026-relevant guidance and law updates that affect the user's region, payment handling, tracking, AI usage, and SaaS operations.",
    "Return Markdown with these headings only: # Research Summary, ## Key Updates, ## Clauses To Include, ## Sources.",
    "Under ## Sources, include concise bullet links with source title and URL.",
    "Do not draft the full legal document in this stage.",
  ].join(" ");

  const userPrompt = buildResearchUserPrompt(input.documentType, input.answers);

  return callOpenRouterChat({
    apiKey: input.apiKey,
    baseUrl: input.baseUrl,
    siteName: input.siteName,
    siteUrl: input.siteUrl,
    model: input.model,
    systemPrompt,
    userPrompt,
    maxTokens: 1800,
    temperature: 0.1,
    plugins: [
      {
        id: "web",
        max_results: 5,
        search_prompt:
          "Find only the most relevant legal clauses for the user region that changed in the last 12 months.",
      },
    ],
  });
}

async function runDraftingStage(input: {
  answers: OnboardingAnswers;
  documentType: PolicyDocumentType;
  researchSummary: string;
  apiKey: string;
  baseUrl: string | null;
  siteName: string;
  siteUrl: string;
  model: string;
}) {
  const systemPrompt = buildPolicySystemPrompt(input.documentType);
  const userPrompt = buildPolicyUserPrompt(
    input.documentType,
    input.answers,
    input.researchSummary,
  );

  return callOpenRouterChat({
    apiKey: input.apiKey,
    baseUrl: input.baseUrl,
    siteName: input.siteName,
    siteUrl: input.siteUrl,
    model: input.model,
    systemPrompt,
    userPrompt,
    maxTokens: 4096,
    temperature: 0.2,
  });
}

function buildResearchUserPrompt(
  documentType: PolicyDocumentType,
  answers: OnboardingAnswers,
) {
  const productName = getProductName(answers);
  const primaryRegion = resolvePrimaryRegion(answers);

  return [
    `Document type: ${documentType}`,
    `Product name: ${productName}`,
    `Website: ${answers.websiteUrl || "Not provided"}`,
    `Product description: ${answers.productDescription || "Not provided"}`,
    `Company location: ${answers.companyLocation || "Not provided"}`,
    `Primary user region: ${primaryRegion}`,
    `Customer regions: ${formatList(answers.customerRegions, "Not provided")}`,
    `Data collected: ${formatList(answers.collectedData, "Not provided")}`,
    `Third-party vendors: ${formatList(answers.vendors, "Not provided")}`,
    `Paid plans: ${answers.acceptsPayments || "Unknown"}`,
    `Tracking and outreach: ${formatList(answers.outreachChannels, "Not provided")}`,
    "Find only the most relevant legal clauses for this region and product that changed in the last 12 months.",
  ].join("\n");
}

function buildPolicySystemPrompt(documentType: PolicyDocumentType) {
  const baseSections =
    documentType === "privacy-policy"
      ? [
          "Overview and scope",
          "Information collected",
          "How information is used",
          "Legal bases or consumer rights",
          "Cookies and analytics",
          "Third-party processors",
          "International transfers",
          "Retention and deletion",
          "Security",
          "User rights and contact",
          "Changes to this policy",
        ]
      : documentType === "terms-of-service"
        ? [
            "Acceptance and eligibility",
            "Accounts and access",
            "Billing, subscriptions, and refunds",
            "Acceptable use",
            "Intellectual property",
            "Service availability",
            "Disclaimers and limitations",
            "Termination",
            "Governing law",
            "Contact",
          ]
        : documentType === "cookie-policy"
          ? [
              "Cookie categories",
              "Analytics and marketing tracking",
              "How users can control cookies",
              "Third-party technologies",
              "Updates and contact",
            ]
          : [
              "Roles and definitions",
              "Processing scope",
              "Sub-processors",
              "Transfers",
              "Security measures",
              "Breach notices",
              "Consumer or data subject rights",
              "Updates and contact",
            ];

  return [
    "You are PolicyPack's legal drafting engine.",
    `Prompt version: ${POLICY_PROMPT_VERSION}.`,
    "Take the research data and the user's onboarding answers to draft a professional legal document in Markdown.",
    "Use a formal legal tone but keep it readable in plain English.",
    "Use Markdown headings for sections and numbered clauses under each section.",
    "Do not mention prompts, AI systems, web search, or internal reasoning.",
    "Do not fabricate laws not supported by the research stage.",
    `The document must cover these topics when relevant: ${baseSections.join(", ")}.`,
  ].join(" ");
}

function buildPolicyUserPrompt(
  documentType: PolicyDocumentType,
  answers: OnboardingAnswers,
  researchSummary: string,
) {
  const productName = getProductName(answers);
  const documentTitle = getDocumentTitle(documentType, answers);
  const primaryRegion = resolvePrimaryRegion(answers);

  return [
    `Task: Draft a ${documentTitle} for ${productName}.`,
    "Output format: Markdown only.",
    "Writing standard: professional and legally structured, but readable.",
    "",
    "## Onboarding Data",
    `- Product name: ${productName}`,
    `- Website: ${answers.websiteUrl || "Public SaaS website"}`,
    `- Product description: ${answers.productDescription || "Software product"}`,
    `- Company location: ${answers.companyLocation || "Not provided"}`,
    `- Primary user region: ${primaryRegion}`,
    `- Customer regions: ${formatList(answers.customerRegions, "Not provided")}`,
    `- Data collected: ${formatList(answers.collectedData, "Not provided")}`,
    `- Third-party vendors: ${formatList(answers.vendors, "Not provided")}`,
    `- Customer accounts: ${answers.userAccounts || "Unknown"}`,
    `- Paid plans: ${answers.acceptsPayments || "Unknown"}`,
    `- Outreach and tracking channels: ${formatList(answers.outreachChannels, "Not provided")}`,
    "",
    "## Research Data",
    researchSummary,
  ].join("\n");
}

async function callOpenRouterChat(input: {
  apiKey: string;
  baseUrl: string | null;
  siteName: string;
  siteUrl: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  temperature: number;
  plugins?: Array<Record<string, unknown>>;
}) {
  const response = await fetch(`${input.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": input.siteUrl,
      "X-Title": input.siteName,
    },
    body: JSON.stringify({
      model: input.model,
      temperature: input.temperature,
      max_tokens: input.maxTokens,
      plugins: input.plugins,
      messages: [
        { role: "system", content: input.systemPrompt },
        { role: "user", content: input.userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(await safeErrorText(response));
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return json.choices?.[0]?.message?.content ?? "";
}

async function safeErrorText(response: Response) {
  try {
    return await response.text();
  } catch {
    return `${response.status} ${response.statusText}`;
  }
}

function normalizeMarkdown(markdown: string, title: string) {
  const trimmed = markdown.trim();

  if (!trimmed) {
    return `# ${title}\n\n## 1. Draft Status\n1. This document could not be generated, so manual review is required.`;
  }

  return trimmed.startsWith("#") ? trimmed : `# ${title}\n\n${trimmed}`;
}

function getDocumentTitle(
  documentType: PolicyDocumentType,
  answers: OnboardingAnswers,
) {
  const snapshot = buildComplianceSnapshot(answers);
  const matched = snapshot.documents.find(
    (document) => document.id === documentType,
  );

  return matched?.title ?? "Policy Document";
}

function buildFallbackResearchSummary(answers: OnboardingAnswers) {
  const primaryRegion = resolvePrimaryRegion(answers);
  const productName = getProductName(answers);

  return `# Research Summary

## Key Updates
- Regional privacy notice obligations should be reviewed for ${primaryRegion}.
- Payment, cookie, and processor disclosures should be updated where applicable.

## Clauses To Include
- A clear description of data categories collected by ${productName}.
- Region-specific user rights and notice language.
- Processor, security, transfer, and retention clauses.

## Sources
- Template fallback used because no live provider response was available.`;
}

function buildFallbackPolicyMarkdown(
  documentType: PolicyDocumentType,
  answers: OnboardingAnswers,
) {
  const productName = getProductName(answers);
  const website = answers.websiteUrl || PRODUCTION_APP_URL;
  const primaryRegion = resolvePrimaryRegion(answers);
  const snapshot = buildComplianceSnapshot(answers);
  const documentMeta =
    snapshot.documents.find((document) => document.id === documentType) ??
    snapshot.documents[0];
  const dataCollected = formatList(
    answers.collectedData,
    "basic account information",
  );
  const vendors = formatList(
    answers.vendors,
    "standard hosting and analytics providers",
  );
  const channels = formatList(
    answers.outreachChannels,
    "service communications",
  );

  if (documentType === "privacy-policy") {
    return `# ${documentMeta.title}

## 1. Scope
1. This Privacy Policy explains how ${productName} collects, uses, and protects information when users access ${website}.
2. This policy applies to customers and visitors in ${formatList(snapshot.monitoredRegions, primaryRegion)}.

## 2. Information We Collect
1. We collect ${dataCollected} when users interact with the product.
2. We may also collect service usage, support, security, and diagnostic information where needed to operate the platform.

## 3. How We Use Information
1. We use personal information to provide, secure, improve, and support ${productName}.
2. We use collected information to manage accounts, fulfill service obligations, process transactions, and communicate product updates.

## 4. Legal Bases and User Rights
1. For users in ${primaryRegion}, we apply the rights and notice obligations required by the relevant privacy framework.
2. Users may request access, correction, deletion, or export of eligible personal data, subject to legal and operational limits.

## 5. Cookies and Analytics
1. ${productName} uses ${channels} to measure performance, secure the service, and support product communications.
2. Users can manage cookie choices through browser controls and any in-product consent interfaces that apply.

## 6. Vendors and Processors
1. We rely on ${vendors} to host the service, process payments, analyze performance, and support core product functions.
2. These providers may process personal information on our behalf under contractual and security controls.

## 7. International Transfers
1. Where data moves across borders, we apply transfer safeguards appropriate to ${primaryRegion} and other supported regions.
2. We review vendors and subprocessors to ensure a reasonable level of protection for transferred data.

## 8. Retention and Security
1. We retain information for as long as necessary to operate the service, comply with law, resolve disputes, and enforce agreements.
2. We use administrative, technical, and organizational controls designed to protect personal information from unauthorized access, loss, or misuse.

## 9. Contact and Updates
1. Users may contact ${productName} with privacy requests, access requests, or complaints related to data handling.
2. We may update this Privacy Policy from time to time and will publish the latest version at ${website}.`;
  }

  if (documentType === "terms-of-service") {
    return `# ${documentMeta.title}

## 1. Acceptance
1. These Terms of Service govern access to and use of ${productName}.
2. By using ${website}, users agree to be bound by these terms.

## 2. Accounts and Eligibility
1. Account creation status: ${answers.userAccounts || "Not specified"}.
2. Users are responsible for maintaining accurate account information and keeping credentials secure when accounts are enabled.

## 3. Billing and Subscriptions
1. Paid access status: ${answers.acceptsPayments || "Not specified"}.
2. Where paid plans apply, fees, billing cycles, and refund rules are governed by the plan selected by the customer.

## 4. Acceptable Use
1. Users may not misuse the service, interfere with operations, or attempt unauthorized access.
2. Users remain responsible for content, prompts, or data submitted through the platform.

## 5. Intellectual Property
1. ${productName} and its related materials remain the property of the service owner and licensors.
2. Customers retain rights to their own content, subject to the permissions needed to operate the service.

## 6. Service Availability
1. We may update, improve, suspend, or discontinue parts of the service as operational needs require.
2. We aim to maintain a reliable service but do not guarantee uninterrupted availability.

## 7. Termination
1. We may suspend or terminate access for violations of these terms, security risks, or legal requirements.
2. Users may stop using the service at any time, subject to any outstanding billing commitments.

## 8. Governing Law and Contact
1. These terms are interpreted with reference to the laws applicable to ${answers.companyLocation || primaryRegion}.
2. Questions about these terms may be directed through the contact details published on ${website}.`;
  }

  if (documentType === "cookie-policy") {
    return `# ${documentMeta.title}

## 1. Cookie Categories
1. ${productName} uses cookies and similar technologies to operate the service, understand usage, and improve performance.
2. Current cookie and outreach categories include ${channels}.

## 2. Why Cookies Are Used
1. We use cookies for authentication, analytics, performance, and product communications where applicable.
2. Some cookies are necessary for basic platform functionality and security.

## 3. Third-Party Tools
1. Third-party vendors such as ${vendors} may set or rely on similar technologies as part of the services they provide.
2. These providers operate under their own privacy terms in addition to our disclosures.

## 4. User Controls
1. Users can manage cookie preferences in browser settings and through any consent controls we provide.
2. Disabling some cookies may affect the availability or functionality of parts of the service.

## 5. Updates
1. We may revise this Cookie Policy to reflect changes in vendors, product behavior, or law.
2. The latest version will be available through ${website}.`;
  }

  return `# ${documentMeta.title}

## 1. Scope
1. This addendum supplements the legal terms for ${productName} and addresses privacy and data processing obligations relevant to ${primaryRegion}.
2. It applies to the processing of customer and end-user data handled through ${website}.

## 2. Processing Roles
1. ${productName} acts in the role appropriate to the service relationship and the nature of the personal data processed.
2. Roles and responsibilities may vary depending on whether customer instructions or direct consumer interactions are involved.

## 3. Processing Activities
1. Covered activities include account administration, service delivery, support, analytics, security, and vendor coordination.
2. Data categories involved include ${dataCollected}.

## 4. Subprocessors and Vendors
1. Authorized subprocessors and core vendors currently include ${vendors}.
2. Vendors are expected to apply security and confidentiality measures appropriate to the services they perform.

## 5. Transfers and Rights
1. Where required, we support the rights and notice obligations relevant to users in ${formatList(snapshot.monitoredRegions, primaryRegion)}.
2. Cross-border transfers are handled using safeguards and contractual terms appropriate to the affected jurisdiction.

## 6. Security and Incidents
1. We maintain administrative, technical, and organizational measures designed to protect personal information.
2. Material incidents are handled through documented security and notification procedures.

## 7. Updates
1. This addendum may be refreshed to reflect regulatory changes, vendor updates, or platform changes.
2. The latest version will be maintained through ${website}.`;
}

function formatList(items: string[], fallback: string) {
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
