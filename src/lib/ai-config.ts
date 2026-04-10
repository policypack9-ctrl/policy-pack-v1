import { getPublicAppUrl } from "@/lib/site-config";

export type AIProvider = "openrouter" | "mock";
export type OpenRouterGenerationTier = "free" | "premium" | "internal";

export const OPENROUTER_MODEL_PROFILES = {
  free: {
    research: "google/gemini-flash-1.5",
    drafting: "deepseek/deepseek-chat",
  },
  premium: {
    research: "anthropic/claude-3.5-sonnet",
    drafting: "anthropic/claude-3.5-sonnet",
  },
  internal: {
    research: "anthropic/claude-3.5-sonnet",
    drafting: "anthropic/claude-3.5-sonnet",
  },
} as const;

export type OpenRouterConfig = {
  provider: AIProvider;
  apiKey: string | null;
  baseUrl: string | null;
  siteUrl: string;
  siteName: string;
  generationTier: OpenRouterGenerationTier;
  researchModel: string;
  draftingModel: string;
};

function getModelOverride(
  tier: OpenRouterGenerationTier,
  kind: "research" | "drafting",
) {
  const profilePrefix = tier.toUpperCase();
  const kindSuffix = kind === "research" ? "RESEARCH_MODEL" : "DRAFT_MODEL";
  const scopedKey = `OPENROUTER_${profilePrefix}_${kindSuffix}`;
  const legacyKey =
    kind === "research" ? "OPENROUTER_RESEARCH_MODEL" : "OPENROUTER_DRAFT_MODEL";

  return process.env[scopedKey] ?? process.env[legacyKey] ?? null;
}

export function getOpenRouterConfig(
  generationTier: OpenRouterGenerationTier = "free",
): OpenRouterConfig {
  const modelProfile = OPENROUTER_MODEL_PROFILES[generationTier];

  return {
    provider: process.env.OPENROUTER_API_KEY ? "openrouter" : "mock",
    apiKey: process.env.OPENROUTER_API_KEY ?? null,
    baseUrl: process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
    siteUrl: getPublicAppUrl(),
    siteName: process.env.NEXT_PUBLIC_APP_NAME ?? "PolicyPack",
    generationTier,
    researchModel:
      getModelOverride(generationTier, "research") ?? modelProfile.research,
    draftingModel:
      getModelOverride(generationTier, "drafting") ?? modelProfile.drafting,
  };
}

export function getPersistenceConfig() {
  return {
    databaseUrl: process.env.DATABASE_URL ?? null,
    publicDatabaseUrl: process.env.NEXT_PUBLIC_DATABASE_URL ?? null,
  };
}
