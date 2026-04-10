import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const envPath = path.join(projectRoot, ".env.local");
const outputPath = path.join(
  projectRoot,
  "src",
  "lib",
  "site-page-content.generated.json",
);
const INTERNAL_OPENROUTER_MODELS = {
  research: "anthropic/claude-3.7-sonnet",
  drafting: "anthropic/claude-3.7-sonnet",
};
const OPENROUTER_MODEL_COMPATIBILITY_FALLBACKS = {
  "anthropic/claude-3.5-sonnet": ["anthropic/claude-3.7-sonnet"],
  "anthropic/claude-3.5-sonnet-20241022": ["anthropic/claude-3.7-sonnet"],
};

const SITE_PROFILE = {
  brandName: "PolicyPack",
  legalName: "Superlinear Technology Pte. Ltd.",
  publicName: "Superlinear Technology Pte. Ltd. trading as PolicyPack",
  jurisdiction: "Singapore",
  supportEmail: "support@policypack.org",
  primaryUrl: "https://policypack.org",
  primaryDomain: "policypack.org",
  productSummary:
    "PolicyPack is an AI-powered legal automation platform for SaaS companies. It helps founders and operators generate, publish, and maintain Privacy Policies, Terms of Service, Cookie Policies, Refund Policies, and related compliance disclosures.",
  audience:
    "SaaS founders, website operators, payment providers, app reviewers, and privacy-conscious customers",
  aiDisclosureStyle:
    'Professional and generic. Refer to AI vendors as "secure automated data processors" unless naming a provider is legally necessary.',
  regionsServed: "Global, including the United States, United Kingdom, European Union, and Singapore",
  payments:
    "Paid subscriptions and premium exports may be processed through a merchant-of-record and payment processors.",
};

const PAGE_SPECS = [
  {
    key: "privacyPolicy",
    title: "Privacy Policy",
    purpose:
      "Draft a production-grade Privacy Policy for PolicyPack's public website and customer platform.",
    specialInstructions: [
      "In the first substantive paragraph, clearly state that PolicyPack is the trading name of Superlinear Technology Pte. Ltd., a Singapore company, and that the policy applies to policypack.org and related services.",
      "The operator identity should be explicit, consistent, and suitable for payment-provider verification.",
    ],
    requiredSections: [
      "Scope and controller identity",
      "Categories of data collected",
      "How data is used",
      "Lawful bases and user rights",
      "Payments, secure automated data processors, and subprocessors",
      "Cookies and analytics cross-reference",
      "International transfers",
      "Retention and deletion",
      "Security",
      "Children",
      "Changes and contact",
    ],
  },
  {
    key: "termsAndGdpr",
    title: "Terms of Service & Global Privacy Appendix",
    purpose:
      "Draft detailed Terms of Service for PolicyPack, with a privacy and cross-border processing appendix suitable for international SaaS operations.",
    specialInstructions: [
      "In the introductory paragraphs, clearly identify PolicyPack as the trading name of Superlinear Technology Pte. Ltd., a Singapore company, and make that operator wording consistent throughout.",
      "The commercial identity wording should be explicit enough for payment-provider and merchant-account verification.",
    ],
    requiredSections: [
      "Acceptance and operator identity",
      "Eligibility and account use",
      "Complimentary launch access, subscriptions, billing, and refunds",
      "Service scope and acceptable use",
      "AI-assisted outputs and no legal advice boundary",
      "Customer responsibilities",
      "Intellectual property",
      "Third-party services",
      "Availability and changes",
      "Disclaimers and liability limits",
      "Termination",
      "Governing law and disputes",
      "Global privacy appendix with roles, transfers, security, and data rights",
    ],
  },
  {
    key: "cookiePolicy",
    title: "Cookie Policy",
    purpose:
      "Draft a specific Cookie Policy for PolicyPack's public website and customer workspace.",
    requiredSections: [
      "What the policy covers",
      "Cookie categories",
      "Analytics and attribution use",
      "Third-party technologies",
      "Consent and controls",
      "Updates and contact",
    ],
  },
  {
    key: "refundPolicy",
    title: "Refund Policy",
    purpose:
      "Draft a clean Refund Policy for digital legal documents and premium SaaS access.",
    specialInstructions: [
      "The opening paragraph must clearly identify PolicyPack as the trading name of Superlinear Technology Pte. Ltd., a Singapore company.",
      "State plainly that refunds are not provided once the AI generation process has been initiated or once any generated document pack has been accessed, generated, exported, delivered, or downloaded.",
      "Do not include discretionary qualifiers, defect-based exceptions, review windows, or vague carve-outs.",
      "Keep the refund position direct, unambiguous, and consistent with merchant-of-record review expectations.",
    ],
    requiredSections: [
      "Digital products",
      "When refunds are unavailable",
      "Effect of initiating generation or accessing exports",
      "Billing contact",
    ],
  },
  {
    key: "aboutUs",
    title: "About Us",
    purpose:
      "Draft a compelling About Us page about Superlinear Technology Pte. Ltd., a Singapore-based technology company behind PolicyPack.",
    requiredSections: [
      "Who we are",
      "What PolicyPack does",
      "Why legal automation matters",
      "How we think about AI and compliance",
      "Contact",
    ],
  },
  {
    key: "legalDisclaimer",
    title: "Legal Disclaimer",
    purpose:
      "Draft a strong Legal Disclaimer that clearly states PolicyPack does not provide legal advice and does not create an attorney-client relationship.",
    requiredSections: [
      "No legal advice",
      "No attorney-client relationship",
      "Professional review may still be required",
      "Customer responsibility",
      "No guarantee of regulatory sufficiency",
      "Contact",
    ],
  },
  {
    key: "contactUs",
    title: "Contact Us",
    purpose:
      "Draft a simple but polished Contact Us page for support, privacy, commercial, and billing requests.",
    requiredSections: [
      "General support",
      "Privacy and compliance requests",
      "Billing and commercial inquiries",
      "Expected response window",
    ],
  },
] ;

async function main() {
  loadEnvFile(envPath);

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is missing from .env.local");
  }

  const baseUrl =
    process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
  const researchModel =
    process.env.OPENROUTER_INTERNAL_RESEARCH_MODEL ??
    process.env.OPENROUTER_PREMIUM_RESEARCH_MODEL ??
    process.env.OPENROUTER_RESEARCH_MODEL ??
    INTERNAL_OPENROUTER_MODELS.research;
  const draftingModel =
    process.env.OPENROUTER_INTERNAL_DRAFT_MODEL ??
    process.env.OPENROUTER_PREMIUM_DRAFT_MODEL ??
    process.env.OPENROUTER_DRAFT_MODEL ??
    INTERNAL_OPENROUTER_MODELS.drafting;

  const lastUpdated = formatLongDate(new Date());
  let researchSummary = "";

  try {
    researchSummary = await generateResearchSummary({
      apiKey,
      baseUrl,
      model: researchModel,
    });
  } catch {
    researchSummary = await generateResearchSummary({
      apiKey,
      baseUrl,
      model: draftingModel,
    });
  }

  const generatedEntries = {};

  for (const page of PAGE_SPECS) {
    const markdown = await draftSitePage({
      apiKey,
      baseUrl,
      model: draftingModel,
      lastUpdated,
      researchSummary,
      page,
    });

    generatedEntries[page.key] = markdown;
  }

  const payload = {
    lastUpdated,
    generatedAt: new Date().toISOString(),
    profile: SITE_PROFILE,
    pages: generatedEntries,
  };

  await fs.writeFile(outputPath, JSON.stringify(payload, null, 2), "utf8");

  process.stdout.write(
    `Generated site legal content at ${path.relative(projectRoot, outputPath)}\n`,
  );
}

function loadEnvFile(filePath) {
  const content = fsSync.readFileSync(filePath, "utf8");
  parseEnvContent(content);
}

function parseEnvContent(content) {
  const entries = content.split(/\r?\n/);
  for (const entry of entries) {
    const trimmed = entry.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    const unwrapped = value.replace(/^['"]|['"]$/g, "");

    if (!(key in process.env)) {
      process.env[key] = unwrapped;
    }
  }
}

async function generateResearchSummary({ apiKey, baseUrl, model }) {
  const systemPrompt = [
    "You are PolicyPack's internal legal research engine for its own public pages.",
    "Search the web for the most relevant 2025 and 2026 public requirements, enforcement signals, and platform review expectations for a Singapore-based AI-powered legal automation SaaS operating globally.",
    "Focus on Privacy Policy, Terms of Service, Cookie Policy, Refund Policy, Legal Disclaimer, About Us, and Contact page expectations.",
    "Prioritize Apple App Store, Google Play, Paddle, PayPal/Braintree, Stripe, GDPR, UK GDPR, CCPA/CPRA, and cookie disclosure expectations where relevant to a public SaaS website.",
    "Return concise Markdown with headings ## Key requirements, ## Review and approval signals, ## Clause quality bar, and ## Risks to avoid.",
    "Under ## Clause quality bar, summarize the characteristics of premium SaaS legal pages: detailed structure, specific operator wording, numbered clauses, clean headings, and publication-ready phrasing.",
  ].join(" ");

  const userPrompt = [
    `Brand: ${SITE_PROFILE.brandName}`,
    `Legal operator: ${SITE_PROFILE.publicName}`,
    `Jurisdiction: ${SITE_PROFILE.jurisdiction}`,
    `Website: ${SITE_PROFILE.primaryUrl}`,
    `Audience: ${SITE_PROFILE.audience}`,
    `Product summary: ${SITE_PROFILE.productSummary}`,
    `Target regions: ${SITE_PROFILE.regionsServed}`,
    "Find only the most relevant requirements and public review expectations from the last 18 months.",
  ].join("\n");

  return callOpenRouter({
    apiKey,
    baseUrl,
    model,
    systemPrompt,
    userPrompt,
    maxTokens: 2200,
    temperature: 0.1,
    plugins: [
      {
        id: "web",
        max_results: 6,
        search_prompt:
          "Find public legal page and compliance expectations relevant to a global AI SaaS website in 2025 and 2026.",
      },
    ],
  });
}

async function draftSitePage({
  apiKey,
  baseUrl,
  model,
  lastUpdated,
  researchSummary,
  page,
}) {
  const systemPrompt = [
    "You are PolicyPack's internal legal drafting engine.",
    "Draft publication-ready markdown for PolicyPack's own public legal and company pages.",
    "Use formal, specific, high-trust language that reads like a premium SaaS legal page, not boilerplate.",
    "Do not include Markdown code fences.",
    "Do not include a top-level # title because the page shell already renders the page title.",
    "Start with a short operator block using bold labels, then continue with ## numbered sections and ### subsections where needed.",
    "Write in clean English with specific clauses, lists, and contact details.",
    "Match the depth, polish, and authority of high-end SaaS legal pages, with sophisticated but readable phrasing.",
    "Use richer sectioning, clearer subsection labels, and more authoritative connective language than a generic template.",
    "Never claim that the company guarantees approval, legal sufficiency, or legal outcomes.",
    "Do not invent statistics, percentages, standards certifications, uptime promises, processor brand names, street addresses, registration numbers, arbitration venues, or named email aliases unless they were explicitly supplied in the company profile or research context.",
    "Do not use Markdown links. Use plain text URLs and plain email addresses only.",
    "Use ASCII punctuation only. Replace curly apostrophes or smart quotes with standard ASCII characters.",
    'When describing AI systems publicly, use professional wording such as "secure automated data processors" unless a named provider is legally necessary.',
    "The final page must seamlessly incorporate the legal name, brand, support email, and policypack.org domain.",
    "If the page is a Legal Disclaimer, explicitly state that the service is not legal advice and does not create an attorney-client relationship.",
    "If the page is About Us, write polished narrative paragraphs with concise supporting sections rather than stiff legal boilerplate.",
  ].join(" ");

  const userPrompt = [
    `Page type: ${page.title}`,
    `Task: ${page.purpose}`,
    "",
    "## Company Profile",
    `- Legal name: ${SITE_PROFILE.legalName}`,
    `- Public operator name: ${SITE_PROFILE.publicName}`,
    `- Brand: ${SITE_PROFILE.brandName}`,
    `- Jurisdiction: ${SITE_PROFILE.jurisdiction}`,
    `- Website: ${SITE_PROFILE.primaryUrl}`,
    `- Domain: ${SITE_PROFILE.primaryDomain}`,
    `- Support email: ${SITE_PROFILE.supportEmail}`,
    `- Product summary: ${SITE_PROFILE.productSummary}`,
    `- Audience: ${SITE_PROFILE.audience}`,
    `- Regions served: ${SITE_PROFILE.regionsServed}`,
    `- Payment context: ${SITE_PROFILE.payments}`,
    `- AI disclosure style: ${SITE_PROFILE.aiDisclosureStyle}`,
    `- Last updated label to include in operator block or intro when helpful: ${lastUpdated}`,
    "",
    "## Required sections",
    ...page.requiredSections.map((section) => `- ${section}`),
    ...(page.specialInstructions?.length
      ? ["", "## Page-specific instructions", ...page.specialInstructions.map((item) => `- ${item}`)]
      : []),
    "",
    "## Research context",
    researchSummary,
    "",
    "## Drafting instructions",
    "- Produce markdown only.",
    "- The page should feel credible to payment providers, app reviewers, and privacy-conscious customers.",
    "- Use numbered clauses for legal pages and polished paragraph structure for About Us.",
    "- Keep the Support email as support@policypack.org everywhere.",
    "- Do not invent corporate registration numbers or street addresses.",
    "- Do not invent statistics, percentages, or marketing claims.",
    "- Do not mention providers, standards, or legal mechanisms unless they are clearly supported by the research context.",
    "- Make the prose feel refined, structured, and publication-ready enough to serve as the public gold standard for PolicyPack itself.",
    "- Use the company legal name and policypack.org naturally inside clauses, operator blocks, and contact sections where relevant.",
  ].join("\n");

  const markdown = await callOpenRouter({
    apiKey,
    baseUrl,
    model,
    systemPrompt,
    userPrompt,
    maxTokens: 4200,
    temperature: 0.2,
  });

  return normalizeMarkdown(markdown);
}

async function callOpenRouter({
  apiKey,
  baseUrl,
  model,
  systemPrompt,
  userPrompt,
  maxTokens,
  temperature,
  plugins,
}) {
  const modelsToTry = [model, ...(OPENROUTER_MODEL_COMPATIBILITY_FALLBACKS[model] ?? [])];
  let lastError = null;

  for (const activeModel of modelsToTry) {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": SITE_PROFILE.primaryUrl,
        "X-Title": SITE_PROFILE.brandName,
      },
      body: JSON.stringify({
        model: activeModel,
        temperature,
        max_tokens: maxTokens,
        plugins,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      lastError = `OpenRouter request failed (${response.status}): ${errorText}`;

      if (
        activeModel === model &&
        (OPENROUTER_MODEL_COMPATIBILITY_FALLBACKS[model]?.length ?? 0) > 0 &&
        errorText.toLowerCase().includes("no endpoints found")
      ) {
        continue;
      }

      throw new Error(lastError);
    }

    const json = await response.json();
    return json?.choices?.[0]?.message?.content ?? "";
  }

  throw new Error(lastError ?? "OpenRouter request failed.");
}

function normalizeMarkdown(markdown) {
  return markdown
    .replace(/\r\n/g, "\n")
    .replace(/^```(?:markdown)?\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();
}

function formatLongDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

await main();
