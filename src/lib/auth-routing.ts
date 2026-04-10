export type AuthEntryRoute = "login" | "register";

export function buildAuthRedirectHref(
  route: AuthEntryRoute,
  callbackPath: string,
) {
  const normalizedPath = callbackPath.startsWith("/")
    ? callbackPath
    : `/${callbackPath}`;

  return `/${route}?callbackUrl=${encodeURIComponent(normalizedPath)}`;
}
