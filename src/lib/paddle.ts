import "server-only";

import { Environment, Paddle } from "@paddle/paddle-node-sdk";
import type { CreateTransactionRequestBody } from "@paddle/paddle-node-sdk";

import { PRODUCTION_APP_URL } from "@/lib/site-config";
import { type BillingPlanId } from "@/lib/billing-plans";
import { normalizeDiscountCode } from "@/lib/billing-discounts";

export type PaddleApiKeyMode = "sandbox" | "live" | "unknown";
type PaddleClientTokenSource = "env" | "api";

type PaddleClientTokenResult = {
  token: string;
  source: PaddleClientTokenSource;
};

let cachedPaddleClientToken: PaddleClientTokenResult | null = null;

export function getPaddleConfig() {
  const apiKey = process.env.PADDLE_API_KEY?.trim() ?? "";
  const publicEnvironment =
    process.env.NEXT_PUBLIC_PADDLE_ENV?.trim().toLowerCase() ?? "";

  return {
    apiKey,
    clientToken:
      process.env.PADDLE_CLIENT_TOKEN?.trim() ??
      process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.trim() ??
      "",
    priceId: process.env.PADDLE_PRICE_ID?.trim() ?? "",
    starterPriceId:
      process.env.PADDLE_STARTER_PRICE_ID?.trim() ??
      process.env.PADDLE_PRICE_ID?.trim() ??
      "",
    premiumPriceId:
      process.env.PADDLE_PREMIUM_PRICE_ID?.trim() ??
      process.env.PADDLE_PRICE_ID?.trim() ??
      "",
    webhookSecret: process.env.PADDLE_WEBHOOK_SECRET?.trim() ?? "",
    environment:
      (process.env.PADDLE_ENVIRONMENT?.trim().toLowerCase() || publicEnvironment) ===
      "production"
        ? Environment.production
        : Environment.sandbox,
  } as const;
}

export function getPaddleApiKeyMode(apiKey: string): PaddleApiKeyMode {
  if (
    apiKey.startsWith("pdl_sdbx_") ||
    apiKey.startsWith("pdl_sandbox_")
  ) {
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

export function getConfiguredPaddleClientToken() {
  return getPaddleConfig().clientToken;
}

export async function resolvePaddleDiscountIdFromCode(discountCode?: string | null) {
  const normalizedCode = normalizeDiscountCode(discountCode);

  if (!normalizedCode) {
    return null;
  }

  const paddle = getPaddleClient();

  if (!paddle) {
    return null;
  }

  const discounts = paddle.discounts.list({
    code: [normalizedCode],
    status: ["active"],
  });
  const results = await discounts.next();
  const matchingDiscount = results.find((discount) => discount.code?.toUpperCase() === normalizedCode);

  if (!matchingDiscount || !matchingDiscount.enabledForCheckout) {
    return null;
  }

  return matchingDiscount.id;
}

export async function getOrCreatePaddleClientToken() {
  const configuredToken = getConfiguredPaddleClientToken();

  if (configuredToken) {
    return {
      token: configuredToken,
      source: "env",
    } satisfies PaddleClientTokenResult;
  }

  if (cachedPaddleClientToken) {
    return cachedPaddleClientToken;
  }

  const paddle = getPaddleClient();

  if (!paddle) {
    return null;
  }

  try {
    const generatedToken = await paddle.clientTokens.create({
      name: `PolicyPack Dashboard ${Date.now()}`,
      description: "Temporary Paddle.js client token for the PolicyPack dashboard.",
    });

    cachedPaddleClientToken = {
      token: generatedToken.token,
      source: "api",
    };

    return cachedPaddleClientToken;
  } catch {
    return null;
  }
}

export function buildPolicyPackCheckoutItems(
  productName: string,
  planId: BillingPlanId,
  priceId?: string,
): CreateTransactionRequestBody["items"] {
  const fallbackPrice =
    planId === "starter"
      ? {
          description: `PolicyPack starter pages for ${productName}`,
          name: "PolicyPack Starter Pages",
          unitPrice: {
            amount: "3900",
            currencyCode: "USD" as const,
          },
          product: {
            name: "PolicyPack Starter Pages",
            taxCategory: "saas" as const,
            description:
              "A one-time three-page legal starter pack for PolicyPack workspaces.",
          },
        }
      : {
          description: `PolicyPack premium workspace for ${productName}`,
          name: "PolicyPack Premium Workspace",
          unitPrice: {
            amount: "2900",
            currencyCode: "USD" as const,
          },
          billingCycle: {
            interval: "month" as const,
            frequency: 1,
          },
          product: {
            name: "PolicyPack Premium Workspace",
            taxCategory: "saas" as const,
            description:
              "Full workspace access with exports, monitoring, and premium legal coverage.",
          },
        };

  if (priceId) {
    return [{ priceId, quantity: 1 }];
  }

  return [
    {
      quantity: 1,
      price: fallbackPrice,
    },
  ];
}
