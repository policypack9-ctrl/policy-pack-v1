import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
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
import { sendAdminNotification, sendWelcomeEmail } from "@/lib/notifications";

const supabaseAdapterConfig = getSupabaseAdapterConfig();
const authBaseUrl = getAuthBaseUrl();
const authSecret = getAuthSecret();
const googleAuthConfig = getGoogleAuthConfig();
const providers: Provider[] = [
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
        token.isPremium = profile.isPremium;
        token.name = profile.name ?? token.name;
        token.email = profile.email ?? token.email;
        token.picture = profile.image ?? token.picture;
        return token;
      }

      if (userId) {
        const profile = await getAppUserProfileById(userId);
        
        // If profile doesn't exist, it means the user was deleted
        if (!profile) {
          // Clear token properties to force invalidation
          token.userId = "";
          token.sub = "";
          return token;
        }

        token.userId = userId;
        token.isPremium = profile.isPremium;
        token.name = profile.name ?? token.name;
        token.email = profile.email ?? token.email;
        token.picture = profile.image ?? token.picture;
      }

      return token;
    },
    async session({ session, token }) {
      // If token has no userId, it means the user was deleted or invalid
      if (!token.userId && !token.sub) {
        // Return an empty session object which will cause the user to be treated as unauthenticated
        return {
          ...session,
          user: undefined,
        } as typeof session;
      }

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
    async createUser({ user }) {
      if (typeof user.id === "string") {
        await upsertUserProfileFromAuthUser({
          id: user.id,
          email: user.email ?? null,
          name: user.name ?? null,
          image: user.image ?? null,
        });

        const name = user.name || "User";
        const email = user.email || "";
        
        await sendAdminNotification({
          kind: "registration",
          subject: "New PolicyPack registration (OAuth)",
          summary: "A new account has been created via Google OAuth.",
          details: [
            { label: "Name", value: name },
            { label: "Email", value: email },
            { label: "User ID", value: user.id },
            {
              label: "Created At",
              value: new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }),
            },
          ],
        });

        if (email) {
          await sendWelcomeEmail(email, name);
        }
      }
    },
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
