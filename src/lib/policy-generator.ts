import "server-only";

import {
  getOpenRouterConfig,
  type AIProvider,
  type OpenRouterGenerationTier,
} from "@/lib/ai-config";
import {
  COMPANY_BRAND_NAME,
  COMPANY_JURISDICTION,
  COMPANY_LEGAL_NAME,
  COMPANY_PRIMARY_DOMAIN,
  COMPANY_PRIMARY_URL,
  COMPANY_PUBLIC_NAME,
  COMPANY_SUPPORT_EMAIL,
} from "@/lib/company";
import {
  buildComplianceSnapshot,
  getProductName,
  normalizeAnswers,
  resolvePrimaryRegion,
  type DashboardDocument,
  type OnboardingAnswers,
} from "@/lib/policy-engine";

export type PolicyDocumentType = DashboardDocument["id"];

export type GeneratedPolicyDocument = {
  markdown: string;
  provider: AIProvider;
  model: string;
  generationTier: OpenRouterGenerationTier;
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
  generationTier?: OpenRouterGenerationTier;
};

const POLICY_PROMPT_VERSION = "policypack-openrouter-two-stage-v2";
const OPENROUTER_MODEL_COMPATIBILITY_FALLBACKS: Record<string, string[]> = {
  "anthropic/claude-3.5-sonnet": ["anthropic/claude-3.7-sonnet"],
  "anthropic/claude-3.5-sonnet-20241022": ["anthropic/claude-3.7-sonnet"],
};

export async function generatePolicyDocument({
  answers,
  documentType,
  generationTier = "free",
}: GeneratePolicyInput): Promise<GeneratedPolicyDocument> {
  const normalizedAnswers = normalizeAnswers(answers);
  const config = getOpenRouterConfig(generationTier);
  const title = getDocumentTitle(documentType, normalizedAnswers);
  const generatedAt = new Date().toISOString();

  if (config.provider === "mock" || !config.apiKey) {
    return {
      markdown: buildFallbackPolicyMarkdown(documentType, normalizedAnswers),
      provider: "mock",
      model: "template-fallback",
      generationTier,
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
    // For free tier: run research with a timeout to stay within Vercel 60s limit.
    // If research times out or fails, draft directly from answers (still high quality).
    let researchSummary = "";
    let researchModel = config.researchModel;

    if (generationTier === "premium" || generationTier === "internal") {
      // Premium: full two-stage pipeline
      const researchStage = await runResearchStage({
        answers: normalizedAnswers,
        documentType,
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        siteName: config.siteName,
        siteUrl: config.siteUrl,
        model: config.researchModel,
      });
      researchSummary = researchStage.content;
      researchModel = researchStage.model;
    } else {
      // Free tier: skip web-search research stage to stay within 60s Vercel timeout.
      // Draft directly from the structured onboarding answers (fast + reliable).
      researchSummary = buildFallbackResearchSummary(normalizedAnswers);
      researchModel = "answers-only";
    }

    const draftingStage = await runDraftingStage({
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
      markdown: normalizeMarkdown(draftingStage.content, title),
      provider: "openrouter",
      model: draftingStage.model,
      generationTier,
      usedFallback: false,
      title,
      generatedAt,
      research: {
        model: researchModel,
        summary: researchSummary,
      },
    };
  } catch {
    return {
      markdown: buildFallbackPolicyMarkdown(documentType, normalizedAnswers),
      provider: "mock",
      model: "template-fallback",
      generationTier,
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
  const currentYear = new Date().getUTCFullYear();
  const systemPrompt = [
    "You are PolicyPack's legal research stage.",
    `Prompt version: ${POLICY_PROMPT_VERSION}.`,
    "Search the web and summarize only the most relevant legal clauses or disclosure changes from the last 12 months.",
    `Prioritize guidance and law updates that are relevant in ${currentYear} and affect the user's region, payment handling, tracking, AI usage, and SaaS operations.`,
    "If the onboarding data includes custom values entered through an Other field, treat them as first-class facts and search for requirements that apply to them.",
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
  const systemPrompt = buildPolicySystemPrompt(
    input.documentType,
    input.answers,
  );
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
  const operatorIdentity = resolveDocumentOperatorLabel(answers);
  const policyPackContext = isPolicyPackDocumentContext(answers);

  return [
    `Document type: ${documentType}`,
    `Product name: ${productName}`,
    `Service brand: ${COMPANY_BRAND_NAME}`,
    `Company legal name: ${policyPackContext ? COMPANY_LEGAL_NAME : "Not provided by user"}`,
    `Operating entity wording: ${operatorIdentity}`,
    `Official domain: ${policyPackContext ? COMPANY_PRIMARY_DOMAIN : answers.websiteUrl || "Not provided"}`,
    `Website: ${answers.websiteUrl || "Not provided"}`,
    `Product description: ${answers.productDescription || "Not provided"}`,
    `Company location: ${answers.companyLocation || "Not provided"}`,
    `Primary user region: ${primaryRegion}`,
    `Customer regions: ${formatList(answers.customerRegions, "Not provided")}`,
    `Data collected: ${formatList(answers.collectedData, "Not provided")}`,
    `Third-party vendors: ${formatList(answers.vendors, "Not provided")}`,
    `Paid plans: ${answers.acceptsPayments || "Unknown"}`,
    `Tracking and outreach: ${formatList(answers.outreachChannels, "Not provided")}`,
    `Custom user inputs: ${formatCustomInputs(answers)}`,
    "Find only the most relevant legal clauses for this region and product that changed in the last 12 months.",
  ].join("\n");
}

function buildPolicySystemPrompt(
  documentType: PolicyDocumentType,
  answers: OnboardingAnswers,
) {
  const operatorIdentity = resolveDocumentOperatorLabel(answers);
  const policyPackContext = isPolicyPackDocumentContext(answers);
  const baseSections =
    documentType === "privacy-policy"
      ? [
          "Operator identity and scope",
          "Data categories and sources",
          "Business and transactional uses",
          "Legal bases and regional rights",
          "Cookies, analytics, and tracking",
          "Processors, subprocessors, and AI systems",
          "International transfers",
          "Retention and deletion",
          "Security safeguards",
          "Children",
          "Changes and contact",
        ]
      : documentType === "terms-of-service"
        ? [
            "Acceptance and operator identity",
            "Eligibility and account rules",
            "Billing, subscriptions, complimentary access, and refunds",
            "Service scope and customer responsibilities",
            "Acceptable use",
            "AI outputs and no legal advice boundary",
            "Intellectual property",
            "Third-party services",
            "Availability and service changes",
            "Disclaimers, liability caps, and indemnity",
            "Termination",
            "Governing law and contact",
          ]
        : documentType === "cookie-policy"
          ? [
              "What this policy covers",
              "Cookie categories",
              "Analytics and marketing tracking",
              "Third-party technologies",
              "How users can control cookies",
              "Updates and contact",
            ]
          : documentType === "about-us"
            ? ["Who we are", "Our mission and vision", "The team", "Company history", "Values"]
            : documentType === "contact-us"
              ? ["Contact methods", "Support hours", "Mailing address", "Response time expectations"]
              : documentType === "legal-disclaimer"
                ? ["General information disclaimer", "No professional advice", "Limitation of liability", "Errors and omissions"]
                : documentType === "refund-policy"
                  ? ["Refund eligibility", "Cancellation process", "Exceptions", "Processing time", "Contact"]
                  : ["General clauses"];
  const genericAiInstruction =
    answers.aiTransparencyLevel === "Professional/Generic"
      ? 'If transparency is set to "Generic", avoid naming specific AI models or brands; use professional technical categories instead, especially "Secure Automated Data Processors".'
      : "If a named provider is relevant, you may identify it directly in a professional way.";

  return [
    "You are PolicyPack's legal drafting engine.",
    `Prompt version: ${POLICY_PROMPT_VERSION}.`,
    "Take the research data and the user's onboarding answers to draft a professional legal document in Markdown.",
    "Use a formal legal tone but keep it readable in plain English.",
    `The operator should be described as ${operatorIdentity}.`,
    policyPackContext
      ? `Because this draft is for PolicyPack, the legal operator should be identified as ${COMPANY_PUBLIC_NAME}, the official website should be ${COMPANY_PRIMARY_URL}, and the public contact email should be ${COMPANY_SUPPORT_EMAIL}.`
      : "Do not insert PolicyPack's own legal identity, domain, or support email into customer documents unless the onboarding data clearly indicates the document is for PolicyPack itself.",
    "Formatting standard: start with # Title, then a short operator block with bold labels, then ## numbered sections, then ### subsections where helpful, then numbered clauses and bullet lists for categories, examples, or processor lists.",
    "The final document must feel specific, structured, and publication-ready rather than generic or template-like.",
    "Make the clauses concrete to the product, region, billing model, account model, tracking stack, and AI transparency setting in the onboarding data.",
    "Any custom items entered through an Other field are binding user requirements and must be reflected explicitly in the final document where relevant.",
    genericAiInstruction,
    "Do not mention prompts, AI systems, web search, or internal reasoning.",
    "Do not fabricate laws not supported by the research stage.",
    "If the document type is Terms of Service, include an explicit professional boundary that the product helps with legal automation but is not itself a law firm or substitute for licensed legal advice.",
    "If the document type is Privacy Policy, identify the operator, the domain, the categories of data, the purposes, rights, processors, transfers, retention, security, and contact points in detail.",
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
  const documentVendors = formatDocumentVendors(answers);
  const operatorIdentity = resolveDocumentOperatorLabel(answers);
  const policyPackContext = isPolicyPackDocumentContext(answers);

  return [
    `Task: Draft a ${documentTitle} for ${productName}.`,
    "Output format: Markdown only.",
    "Writing standard: professional and legally structured, but readable.",
    "",
    "## Onboarding Data",
    `- Product name: ${productName}`,
    `- Brand name: ${COMPANY_BRAND_NAME}`,
    `- Company legal name: ${policyPackContext ? COMPANY_LEGAL_NAME : "Not provided by user"}`,
    `- Operator wording: ${operatorIdentity}`,
    `- Company jurisdiction: ${policyPackContext ? COMPANY_JURISDICTION : answers.companyLocation || "Not provided"}`,
    `- Official domain: ${policyPackContext ? COMPANY_PRIMARY_DOMAIN : answers.websiteUrl || "Not provided"}`,
    `- Official website: ${policyPackContext ? COMPANY_PRIMARY_URL : answers.websiteUrl || "Public SaaS website"}`,
    `- Support email: ${policyPackContext ? COMPANY_SUPPORT_EMAIL : "Use the business support contact published by the customer where appropriate; do not invent one."}`,
    `- Website: ${answers.websiteUrl || "Public SaaS website"}`,
    `- Product description: ${answers.productDescription || "Software product"}`,
    `- AI transparency level: ${answers.aiTransparencyLevel || "Named Providers"}`,
    `- Company location: ${answers.companyLocation || "Not provided"}`,
    `- Primary user region: ${primaryRegion}`,
    `- Customer regions: ${formatList(answers.customerRegions, "Not provided")}`,
    `- Data collected: ${formatList(answers.collectedData, "Not provided")}`,
    `- Third-party vendors (raw): ${formatList(answers.vendors, "Not provided")}`,
    `- Third-party vendors (document wording): ${formatList(documentVendors, "Not provided")}`,
    `- Customer accounts: ${answers.userAccounts || "Unknown"}`,
    `- Paid plans: ${answers.acceptsPayments || "Unknown"}`,
    `- Outreach and tracking channels: ${formatList(answers.outreachChannels, "Not provided")}`,
    `- Custom user inputs: ${formatCustomInputs(answers)}`,
    "- Instruction: If a custom onboarding input appears above, include it directly in the relevant legal clauses instead of replacing it with generic wording.",
    '- Instruction: If AI transparency is "Professional/Generic", refer to AI vendors as "Secure Automated Data Processors" instead of naming brands or model families.',
    "- Instruction: Produce benchmark-quality structure with rich headings, clear clause grouping, concise bullet lists, and publication-ready specificity.",
    policyPackContext
      ? "- Instruction: The final document must seamlessly reference the official PolicyPack operator identity and the policypack.org domain where relevant."
      : "- Instruction: Use the user's product identity and website naturally, and never replace them with PolicyPack's own corporate details.",
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
  const modelsToTry = [
    input.model,
    ...getCompatibleFallbackModels(input.model),
  ];
  let lastError: string | null = null;

  for (const model of modelsToTry) {
    const response = await fetch(`${input.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": input.siteUrl,
        "X-Title": input.siteName,
      },
      body: JSON.stringify({
        model,
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
      lastError = await safeErrorText(response);
      if (
        model !== input.model ||
        !shouldRetryWithCompatibleModel(input.model, lastError)
      ) {
        break;
      }

      continue;
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    return {
      content: json.choices?.[0]?.message?.content ?? "",
      model,
    };
  }

  throw new Error(lastError ?? "OpenRouter request failed.");
}

async function safeErrorText(response: Response) {
  try {
    return await response.text();
  } catch {
    return `${response.status} ${response.statusText}`;
  }
}

function getCompatibleFallbackModels(model: string) {
  return OPENROUTER_MODEL_COMPATIBILITY_FALLBACKS[model] ?? [];
}

function shouldRetryWithCompatibleModel(model: string, errorText: string) {
  return (
    getCompatibleFallbackModels(model).length > 0 &&
    errorText.toLocaleLowerCase("en-US").includes("no endpoints found")
  );
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
  const website = answers.websiteUrl || "https://your-website.com";
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
    formatDocumentVendors(answers),
    "standard hosting and analytics providers",
  );
  const channels = formatList(
    answers.outreachChannels,
    "service communications",
  );
  const operatorLine = buildDocumentOperatorBlock(answers, website);

  const operatorIdentity = resolveDocumentOperatorLabel(answers);
  const supportContact = isPolicyPackDocumentContext(answers) ? COMPANY_SUPPORT_EMAIL : "the official support contact published on the website";
  const legalName = isPolicyPackDocumentContext(answers) ? COMPANY_LEGAL_NAME : operatorIdentity;

  if (documentType === "privacy-policy") {
    return `# ${documentMeta.title}

${operatorLine}

## 1. Scope and Application
1. This Privacy Policy explains how ${operatorIdentity} collects, uses, stores, and protects personal information when individuals access ${website} or use ${productName}.
2. This Privacy Policy applies to customers and visitors in ${formatList(snapshot.monitoredRegions, primaryRegion)} and should be read together with any jurisdiction-specific rights notices required by local law.

## 2. Information We Collect
### 2.1 Information submitted directly
1. We collect ${dataCollected} when users create accounts, submit onboarding details, request legal documents, purchase premium access, or communicate with support.
### 2.2 Information collected automatically
1. We may also collect service usage, support, security, and diagnostic information where needed to operate the platform securely and improve document quality.

## 3. How We Use Information
1. We use personal information to provide, secure, improve, and support ${productName}.
2. We use collected information to manage accounts, fulfill service obligations, process transactions, maintain compliance records, and communicate product or regulatory updates.

## 4. Legal Bases and User Rights
1. For users in ${primaryRegion}, we apply the rights and notice obligations required by the relevant privacy framework.
2. Users may request access, correction, deletion, restriction, or export of eligible personal data, subject to legal, security, and operational limits.

## 5. Cookies and Analytics
1. ${productName} uses ${channels} to measure performance, secure the service, and support product communications.
2. Users can manage cookie choices through browser controls and any in-product consent interfaces that apply.

## 6. Vendors and Processors
1. We rely on ${vendors} to host the service, process payments, analyze performance, and support core product functions.
2. These providers may process personal information on our behalf under contractual, confidentiality, and security controls appropriate to the services they provide.

## 7. International Transfers
1. Where data moves across borders, we apply transfer safeguards appropriate to ${primaryRegion} and other supported regions.
2. We review vendors and subprocessors to maintain a commercially reasonable level of protection for transferred information.

## 8. Retention and Security
1. We retain information for as long as necessary to operate the service, comply with law, resolve disputes, and enforce agreements.
2. We use administrative, technical, and organizational controls designed to protect personal information from unauthorized access, loss, or misuse.

## 9. Contact and Updates
1. Users may contact ${supportContact} with privacy requests, access requests, or complaints related to data handling.
2. We may update this Privacy Policy from time to time and will publish the latest version at ${website}.`;
  }

  if (documentType === "terms-of-service") {
    return `# ${documentMeta.title}

${operatorLine}

## 1. Acceptance and Operator Identity
1. These Terms of Service govern access to and use of ${productName}, operated by ${operatorIdentity}.
2. By using ${website}, users agree to be bound by these Terms of Service and any policies referenced within them.

## 2. Eligibility and Accounts
1. Account creation status: ${answers.userAccounts || "Not specified"}.
2. Users are responsible for maintaining accurate account information, safeguarding credentials, and controlling access to their workspace when accounts are enabled.

## 3. Billing, Complimentary Access, and Refunds
1. Paid access status: ${answers.acceptsPayments || "Not specified"}.
2. Where paid plans apply, fees, billing cycles, taxes, and refund rules are governed by the plan selected by the customer and the published refund terms.
3. Any complimentary launch access may be limited, revoked, or modified according to the launch rules displayed at the time of registration.

## 4. Service Scope and Customer Responsibilities
1. ${productName} provides AI-assisted legal automation and document generation workflows designed to help teams prepare baseline legal materials faster.
2. Users remain responsible for the accuracy, legality, and completeness of the business information, prompts, and instructions submitted through the platform.

## 5. Professional Boundary
1. ${productName} helps with legal automation but does not provide legal advice, create an attorney-client relationship, or replace review by a licensed lawyer.
2. Customers should obtain professional legal review where their facts, jurisdiction, or risk profile require it.

## 6. Acceptable Use
1. Users may not misuse the service, interfere with operations, distribute harmful code, infringe rights, or attempt unauthorized access.
2. Users remain responsible for content, prompts, or data submitted through the platform.

## 7. Intellectual Property
1. ${productName} and its related materials remain the property of ${legalName} and its licensors.
2. Customers retain rights to their own inputs, subject to the permissions reasonably required to operate the service.

## 8. Service Availability
1. We may update, improve, suspend, or discontinue parts of the service as operational needs require.
2. We aim to maintain a reliable service but do not guarantee uninterrupted availability.

## 9. Liability, Termination, and Contact
1. To the fullest extent permitted by law, liability limits and disclaimer principles apply to the use of the service.
2. We may suspend or terminate access for violations of these terms, security risks, fraud concerns, or legal requirements.
3. These terms are interpreted with reference to the laws applicable to ${answers.companyLocation || primaryRegion}, unless mandatory law requires otherwise.
4. Questions about these terms may be directed to ${supportContact}.`;
  }

  if (documentType === "cookie-policy") {
    return `# ${documentMeta.title}

${operatorLine}

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

  if (documentType === "about-us") {
    return `# ${documentMeta.title}\n\n${operatorLine}\n\n## 1. Who We Are\n1. ${productName} is a company focused on providing value to its customers.\n2. We operate primarily in ${primaryRegion}.\n\n## 2. Our Mission\n1. To deliver reliable and efficient services to our users.`;
  }

  if (documentType === "contact-us") {
    return `# ${documentMeta.title}\n\n${operatorLine}\n\n## 1. Get in Touch\n1. If you have any questions, please contact us at ${supportContact}.\n2. We aim to respond to all inquiries within 48 hours.`;
  }

  if (documentType === "legal-disclaimer") {
    return `# ${documentMeta.title}\n\n${operatorLine}\n\n## 1. General Information\n1. The information provided by ${productName} on ${website} is for general informational purposes only.\n\n## 2. No Professional Advice\n1. We do not offer legal, financial, or professional advice. Always seek the advice of a qualified professional.\n\n## 3. Limitation of Liability\n1. Under no circumstance shall we have any liability to you for any loss or damage incurred as a result of the use of our site or services.`;
  }

  if (documentType === "refund-policy") {
    return `# ${documentMeta.title}\n\n${operatorLine}\n\n## 1. Refunds\n1. We stand behind our products. If you are not satisfied, please contact ${supportContact} within 14 days of purchase.\n\n## 2. Exceptions\n1. Certain items or services may be non-refundable. Please review the specific terms at the time of purchase.`;
  }

  return `# ${documentMeta.title}\n\n${operatorLine}\n\n## 1. Scope\n1. This document supplements the legal terms for ${productName}.`;
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

function formatCustomInputs(answers: OnboardingAnswers) {
  const customInputs = [
    answers.companyLocationOther
      ? `Business location: ${answers.companyLocationOther}`
      : null,
    answers.customerRegionsOther
      ? `Customer region: ${answers.customerRegionsOther}`
      : null,
    answers.collectedDataOther
      ? `Data collected: ${answers.collectedDataOther}`
      : null,
    answers.vendorsOther ? `Third-party service: ${answers.vendorsOther}` : null,
    answers.outreachChannelsOther
      ? `Channel: ${answers.outreachChannelsOther}`
      : null,
  ].filter((value): value is string => Boolean(value));

  return customInputs.length > 0 ? customInputs.join("; ") : "None";
}

function formatDocumentVendors(answers: OnboardingAnswers) {
  const genericAi = answers.aiTransparencyLevel === "Professional/Generic";

  if (!genericAi) {
    return dedupeDocumentLabels(answers.vendors);
  }

  return dedupeDocumentLabels(
    answers.vendors.map((vendor) =>
      isAiVendorLabel(vendor) ? "Secure Automated Data Processors" : vendor,
    ),
  );
}

function buildDocumentOperatorBlock(
  answers: OnboardingAnswers,
  website: string,
) {
  const operatorLabel = resolveDocumentOperatorLabel(answers);
  const contactLine = isPolicyPackDocumentContext(answers)
    ? COMPANY_SUPPORT_EMAIL
    : "Use the official support contact published by the business";

  return `**Operator:** ${operatorLabel}  \n**Website:** ${website}  \n**Support:** ${contactLine}`;
}

function resolveDocumentOperatorLabel(answers: OnboardingAnswers) {
  if (isPolicyPackDocumentContext(answers)) {
    return COMPANY_PUBLIC_NAME;
  }

  return getProductName(answers);
}

function isPolicyPackDocumentContext(answers: OnboardingAnswers) {
  const productName = getProductName(answers).trim().toLocaleLowerCase("en-US");
  const website = (answers.websiteUrl || "")
    .trim()
    .toLocaleLowerCase("en-US");

  return productName === "policypack" || website.includes(COMPANY_PRIMARY_DOMAIN);
}

function isAiVendorLabel(vendor: string) {
  const normalized = vendor.trim().toLocaleLowerCase("en-US");

  return [
    "openai",
    "open router",
    "openrouter",
    "anthropic",
    "claude",
    "gemini",
    "google ai",
    "google gemini",
    "deepseek",
    "cohere",
    "mistral",
  ].some((needle) => normalized.includes(needle));
}

function dedupeDocumentLabels(items: string[]) {
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
