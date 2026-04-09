import { getPublicAppUrl } from "@/lib/site-config";

export type AIProvider = "openrouter" | "mock";

export const OPENROUTER_PIPELINE_MODELS = {
  research: "google/gemini-flash-1.5",
  drafting: "deepseek/deepseek-chat",
} as const;

export const ACTIVE_OPENROUTER_PIPELINE = {
  researchModel: OPENROUTER_PIPELINE_MODELS.research,
  draftingModel: OPENROUTER_PIPELINE_MODELS.drafting,
} as const;

export type OpenRouterConfig = {
  provider: AIProvider;
  apiKey: string | null;
  baseUrl: string | null;
  siteUrl: string;
  siteName: string;
  researchModel: string;
  draftingModel: string;
};

export function getOpenRouterConfig(): OpenRouterConfig {
  return {
    provider: process.env.OPENROUTER_API_KEY ? "openrouter" : "mock",
    apiKey: process.env.OPENROUTER_API_KEY ?? null,
    baseUrl: process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
    siteUrl: getPublicAppUrl(),
    siteName: process.env.NEXT_PUBLIC_APP_NAME ?? "PolicyPack",
    researchModel:
      process.env.OPENROUTER_RESEARCH_MODEL ??
      ACTIVE_OPENROUTER_PIPELINE.researchModel,
    draftingModel:
      process.env.OPENROUTER_DRAFT_MODEL ??
      ACTIVE_OPENROUTER_PIPELINE.draftingModel,
  };
}

export function getPersistenceConfig() {
  return {
    databaseUrl: process.env.DATABASE_URL ?? null,
    publicDatabaseUrl: process.env.NEXT_PUBLIC_DATABASE_URL ?? null,
  };
}
