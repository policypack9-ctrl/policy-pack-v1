import NextAuth from "next-auth";
import type { AppProviders } from "@auth/core/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { SupabaseAdapter } from "@auth/supabase-adapter";

import {
  getAppUserProfileById,
  getSupabaseAdapterConfig,
  upsertUserProfileFromAuthUser,
  verifyCredentials,
} from "@/lib/auth-data";
import {
  getAuthBaseUrl,
  getAuthSecret,
  getGoogleAuthConfig,
  isGoogleAuthConfigured,
} from "@/lib/auth-env";
import { PRIMARY_DOMAIN, PRODUCTION_APP_URL, WWW_DOMAIN } from "@/lib/site-config";

const supabaseAdapterConfig = getSupabaseAdapterConfig();
const authBaseUrl = getAuthBaseUrl();
const authSecret = getAuthSecret();
const googleAuthConfig = getGoogleAuthConfig();
const providers: AppProviders = [
  Credentials({
    name: "Email & Password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email =
        typeof credentials?.email === "string"
          ? credentials.email.trim().toLowerCase()
          : "";
      const password =
        typeof credentials?.password === "string" ? credentials.password : "";

      if (!email || !password) {
        return null;
      }

      return verifyCredentials(email, password);
    },
  }),
];

if (isGoogleAuthConfigured()) {
  providers.push(
    Google({
      clientId: googleAuthConfig.clientId,
      clientSecret: googleAuthConfig.clientSecret,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: supabaseAdapterConfig
    ? SupabaseAdapter(supabaseAdapterConfig)
    : undefined,
  secret: authSecret || undefined,
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      const userId =
        (typeof user?.id === "string" && user.id) ||
        (typeof token.userId === "string" && token.userId) ||
        (typeof token.sub === "string" && token.sub) ||
        "";

      if (trigger === "update" && typeof session?.name === "string") {
        token.name = session.name;
      }

      if (typeof user?.id === "string") {
        token.userId = user.id;
        const profile = await upsertUserProfileFromAuthUser({
          id: user.id,
          email: user.email ?? null,
          name: user.name ?? null,
          image: user.image ?? null,
        });
        token.isPremium = profile?.isPremium ?? false;
        token.name = profile?.name ?? token.name;
        token.email = profile?.email ?? token.email;
        token.picture = profile?.image ?? token.picture;
        return token;
      }

      if (userId) {
        const profile = await getAppUserProfileById(userId);
        token.userId = userId;
        token.isPremium = profile?.isPremium ?? false;
        token.name = profile?.name ?? token.name;
        token.email = profile?.email ?? token.email;
        token.picture = profile?.image ?? token.picture;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.userId ?? token.sub ?? "");
        session.user.isPremium = Boolean(token.isPremium);
        session.user.name =
          typeof token.name === "string" ? token.name : session.user.name;
        session.user.email =
          typeof token.email === "string" ? token.email : session.user.email;
        session.user.image =
          typeof token.picture === "string" ? token.picture : session.user.image;
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      try {
        const target = new URL(url);
        const allowedOrigins = new Set([
          baseUrl,
          authBaseUrl,
          PRODUCTION_APP_URL,
          `https://${PRIMARY_DOMAIN}`,
          `https://${WWW_DOMAIN}`,
        ]);

        if (
          allowedOrigins.has(target.origin) ||
          target.hostname === PRIMARY_DOMAIN ||
          target.hostname === WWW_DOMAIN
        ) {
          return url;
        }
      } catch {
        return `${baseUrl}/dashboard`;
      }

      return `${baseUrl}/dashboard`;
    },
  },
  events: {
    async signIn({ user }) {
      if (typeof user.id === "string") {
        await upsertUserProfileFromAuthUser({
          id: user.id,
          email: user.email ?? null,
          name: user.name ?? null,
          image: user.image ?? null,
        });
      }
    },
  },
  providers,
});
