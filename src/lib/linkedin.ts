import "server-only";

import { getAuthBaseUrl } from "@/lib/auth-env";

type LinkedInTokenResponse = {
  access_token: string;
  expires_in: number;
  scope?: string;
};

type LinkedInUserInfo = {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  email_verified?: boolean;
  picture?: string;
  locale?: {
    country?: string;
    language?: string;
  };
};

export const LINKEDIN_ACCESS_TOKEN_COOKIE = "linkedin_access_token";
export const LINKEDIN_EXPIRES_AT_COOKIE = "linkedin_access_token_expires_at";
export const LINKEDIN_MEMBER_SUB_COOKIE = "linkedin_member_sub";
export const LINKEDIN_MEMBER_NAME_COOKIE = "linkedin_member_name";
export const LINKEDIN_OAUTH_STATE_COOKIE = "linkedin_oauth_state";

function readEnvValue(key: string) {
  return process.env[key]?.trim() ?? "";
}

export function getLinkedInConfig() {
  const clientId = readEnvValue("LINKEDIN_CLIENT_ID");
  const clientSecret = readEnvValue("LINKEDIN_CLIENT_SECRET");
  const redirectUri =
    readEnvValue("LINKEDIN_REDIRECT_URI") ||
    `${getAuthBaseUrl()}/api/admin/linkedin/callback`;

  return {
    clientId,
    clientSecret,
    redirectUri,
  };
}

export function isLinkedInConfigured() {
  const config = getLinkedInConfig();
  return Boolean(config.clientId && config.clientSecret && config.redirectUri);
}

export function createLinkedInOAuthState() {
  return crypto.randomUUID();
}

export function getLinkedInScopes() {
  return ["openid", "profile", "email", "w_member_social"];
}

export function buildLinkedInAuthorizationUrl(state: string) {
  const config = getLinkedInConfig();

  if (!config.clientId || !config.redirectUri) {
    throw new Error("LinkedIn OAuth is not configured.");
  }

  const url = new URL("https://www.linkedin.com/oauth/v2/authorization");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("scope", getLinkedInScopes().join(" "));

  return url.toString();
}

export async function exchangeLinkedInCodeForAccessToken(code: string) {
  const config = getLinkedInConfig();

  if (!config.clientId || !config.clientSecret || !config.redirectUri) {
    throw new Error("LinkedIn OAuth is not configured.");
  }

  const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LinkedIn token exchange failed: ${errorText}`);
  }

  return (await response.json()) as LinkedInTokenResponse;
}

export async function fetchLinkedInUserInfo(accessToken: string) {
  const response = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LinkedIn userinfo failed: ${errorText}`);
  }

  return (await response.json()) as LinkedInUserInfo;
}

