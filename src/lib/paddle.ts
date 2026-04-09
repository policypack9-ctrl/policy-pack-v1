import "server-only";

import { Environment, Paddle } from "@paddle/paddle-node-sdk";

export function getPaddleConfig() {
  return {
    apiKey: process.env.PADDLE_API_KEY?.trim() ?? "",
    priceId: process.env.PADDLE_PRICE_ID?.trim() ?? "",
    environment:
      process.env.PADDLE_ENVIRONMENT?.trim().toLowerCase() === "production"
        ? Environment.production
        : Environment.sandbox,
  } as const;
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
