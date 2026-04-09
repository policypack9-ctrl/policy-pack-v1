import "server-only";

import { Environment, Paddle } from "@paddle/paddle-node-sdk";

import { PRODUCTION_APP_URL } from "@/lib/site-config";

export type PaddleApiKeyMode = "sandbox" | "live" | "unknown";

export function getPaddleConfig() {
  const apiKey = process.env.PADDLE_API_KEY?.trim() ?? "";

  return {
    apiKey,
    priceId: process.env.PADDLE_PRICE_ID?.trim() ?? "",
    webhookSecret: process.env.PADDLE_WEBHOOK_SECRET?.trim() ?? "",
    environment:
      process.env.PADDLE_ENVIRONMENT?.trim().toLowerCase() === "production"
        ? Environment.production
        : Environment.sandbox,
  } as const;
}

export function getPaddleApiKeyMode(apiKey: string): PaddleApiKeyMode {
  if (apiKey.startsWith("pdl_sandbox_")) {
    return "sandbox";
  }

  if (apiKey.startsWith("pdl_live_")) {
    return "live";
  }

  return "unknown";
}

export function getPaddleEnvironmentLabel(environment: Environment) {
  return environment === Environment.production ? "production" : "sandbox";
}

export function hasPaddleEnvironmentMismatch() {
  const config = getPaddleConfig();
  const keyMode = getPaddleApiKeyMode(config.apiKey);

  if (!config.apiKey || keyMode === "unknown") {
    return false;
  }

  return (
    (config.environment === Environment.sandbox && keyMode === "live") ||
    (config.environment === Environment.production && keyMode === "sandbox")
  );
}

export function getPaddleMismatchMessage() {
  const config = getPaddleConfig();
  const keyMode = getPaddleApiKeyMode(config.apiKey);
  const environmentLabel = getPaddleEnvironmentLabel(config.environment);

  if (!config.apiKey) {
    return "PADDLE_API_KEY is missing.";
  }

  if (keyMode === "unknown") {
    return "PADDLE_API_KEY does not match a known Paddle key format.";
  }

  return `PADDLE_API_KEY is a ${keyMode} key, but PADDLE_ENVIRONMENT is set to ${environmentLabel}. Paddle keys are environment-specific.`;
}

export function getPaddleClient() {
  const config = getPaddleConfig();

  if (!config.apiKey) {
    return null;
  }

  return new Paddle(config.apiKey, {
    environment: config.environment,
  });
}

export function getPaddleLegalUrls(baseUrl = PRODUCTION_APP_URL) {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");

  return {
    privacyPolicy: `${normalizedBaseUrl}/privacy`,
    terms: `${normalizedBaseUrl}/terms`,
    refundPolicy: `${normalizedBaseUrl}/refund-policy`,
  };
}

export function isVerifiedPaddleTransactionStatus(status: string | null | undefined) {
  return status === "paid" || status === "completed";
}
