import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      isPremium: boolean;
    };
  }

  interface User {
    id?: string;
    isPremium?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    isPremium?: boolean;
  }
}

