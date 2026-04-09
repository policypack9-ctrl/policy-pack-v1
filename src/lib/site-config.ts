export const PRIMARY_DOMAIN = "policypack.org";
export const WWW_DOMAIN = `www.${PRIMARY_DOMAIN}`;
export const PRODUCTION_APP_URL = `https://${PRIMARY_DOMAIN}`;

export function getPublicAppUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configured) {
    return configured;
  }

  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_APP_URL;
  }

  return "http://localhost:3000";
}
