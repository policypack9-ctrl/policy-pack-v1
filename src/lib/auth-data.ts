import "server-only";

import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

import {
  getSupabaseConfigStatus,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "@/lib/auth-env";
import type { SavedGeneratedDocument } from "@/lib/db";
import {
  buildLaunchCampaignSnapshot,
  buildDefaultLaunchCampaignSnapshot,
  FREE_GENERATION_USER_LIMIT,
  type LaunchCampaignSnapshot,
} from "@/lib/launch-campaign";
import type { GeneratedPolicyDocument, PolicyDocumentType } from "@/lib/policy-generator";

type NextAuthUserRow = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  emailVerified: string | null;
};

type UserProfileRow = {
  user_id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  password_hash: string | null;
  is_premium: boolean | null;
  premium_unlocked_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type GeneratedDocumentRow = {
  id: string;
  user_id: string;
  document_key: PolicyDocumentType;
  title: string;
  markdown: string;
  provider: string | null;
  model: string | null;
  generated_at: string;
  created_at: string | null;
  updated_at: string | null;
};

type NextAuthAccountRow = {
  provider: string;
};

export type AppUserProfile = {
  userId: string;
  name: string | null;
  email: string | null;
  image: string | null;
  passwordHash: string | null;
  isPremium: boolean;
  premiumUnlockedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type UserSignInMethod = "password" | "google";

export type AccountSettingsSummary = {
  profile: AppUserProfile | null;
  signInMethods: UserSignInMethod[];
  canChangePassword: boolean;
};

export type CredentialsUserInput = {
  name: string;
  email: string;
  password: string;
};

export type SupabaseAuthHealth =
  | {
      ok: true;
    }
  | {
      ok: false;
      code: "missing-env" | "next-auth-schema" | "user-profiles-table";
      message: string;
      details?: string;
      missingKeys?: string[];
    };

function getSupabaseAdminClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function formatSupabaseAuthError(error: unknown, fallbackMessage: string) {
  const message = error instanceof Error ? error.message : String(error ?? "");

  if (/invalid schema:\s*next_auth/i.test(message)) {
    return new Error(
      "Supabase auth schema `next_auth` is not accessible. Expose the `next_auth` schema in Supabase Data API settings and apply `supabase/schema.sql` to the project database.",
    );
  }

  return new Error(message || fallbackMessage);
}

export async function getSupabaseAuthHealth(): Promise<SupabaseAuthHealth> {
  const configStatus = getSupabaseConfigStatus();

  if (!configStatus.isConfigured) {
    return {
      ok: false,
      code: "missing-env",
      message:
        "Supabase registration is unavailable because the server-side Supabase environment variables are incomplete.",
      missingKeys: configStatus.missingKeys,
    };
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      ok: false,
      code: "missing-env",
      message:
        "Supabase registration is unavailable because the server-side Supabase client could not be created.",
      missingKeys: configStatus.missingKeys,
    };
  }

  const nextAuthSchemaCheck = await supabase
    .schema("next_auth")
    .from("users")
    .select("id")
    .limit(1);

  if (nextAuthSchemaCheck.error) {
    return {
      ok: false,
      code: "next-auth-schema",
      message:
        "Supabase auth tables are not reachable. Expose the `next_auth` schema in Supabase Data API settings and run `supabase/schema.sql` on this project.",
      details: nextAuthSchemaCheck.error.message,
    };
  }

  const userProfilesCheck = await supabase
    .from("user_profiles")
    .select("user_id")
    .limit(1);

  if (userProfilesCheck.error) {
    return {
      ok: false,
      code: "user-profiles-table",
      message:
        "The `public.user_profiles` table is not reachable from the Supabase service role key.",
      details: userProfilesCheck.error.message,
    };
  }

  return { ok: true };
}

function mapProfile(
  user: NextAuthUserRow,
  profile?: UserProfileRow | null,
): AppUserProfile {
  return {
    userId: user.id,
    name: profile?.display_name ?? user.name ?? null,
    email: profile?.email ?? user.email ?? null,
    image: profile?.avatar_url ?? user.image ?? null,
    passwordHash: profile?.password_hash ?? null,
    isPremium: Boolean(profile?.is_premium),
    premiumUnlockedAt: profile?.premium_unlocked_at ?? null,
    createdAt: profile?.created_at ?? null,
    updatedAt: profile?.updated_at ?? null,
  };
}

async function getNextAuthUserById(userId: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .schema("next_auth")
    .from("users")
    .select("id, name, email, image, emailVerified")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw formatSupabaseAuthError(error, "Unable to read next_auth.users by id.");
  }

  return (data as NextAuthUserRow | null) ?? null;
}

async function getNextAuthUserByEmail(email: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .schema("next_auth")
    .from("users")
    .select("id, name, email, image, emailVerified")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw formatSupabaseAuthError(
      error,
      "Unable to read next_auth.users by email.",
    );
  }

  return (data as NextAuthUserRow | null) ?? null;
}

async function getUserProfileRow(userId: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .select(
      "user_id, email, display_name, avatar_url, password_hash, is_premium, premium_unlocked_at, created_at, updated_at",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw formatSupabaseAuthError(
      error,
      "Unable to read public.user_profiles.",
    );
  }

  return (data as UserProfileRow | null) ?? null;
}

async function getNextAuthAccountsByUserId(userId: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return [] as NextAuthAccountRow[];
  }

  const { data, error } = await supabase
    .schema("next_auth")
    .from("accounts")
    .select("provider")
    .eq("userId", userId);

  if (error) {
    throw formatSupabaseAuthError(
      error,
      "Unable to read next_auth.accounts by user id.",
    );
  }

  return ((data as NextAuthAccountRow[] | null) ?? []) satisfies NextAuthAccountRow[];
}

export function getSupabaseAdapterConfig() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  return {
    url: getSupabaseUrl(),
    secret: getSupabaseServiceRoleKey(),
  };
}

export async function getAppUserProfileById(userId: string) {
  const [user, profile] = await Promise.all([
    getNextAuthUserById(userId),
    getUserProfileRow(userId),
  ]);

  if (!user) {
    return null;
  }

  return mapProfile(user, profile);
}

export async function getAppUserProfileByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return null;
  }

  const user = await getNextAuthUserByEmail(normalizedEmail);

  if (!user) {
    return null;
  }

  const profile = await getUserProfileRow(user.id);
  return mapProfile(user, profile);
}

export async function upsertUserProfileFromAuthUser(user: {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const existingProfile = await getUserProfileRow(user.id);

  const payload = {
    user_id: user.id,
    email: user.email ?? null,
    display_name: existingProfile?.display_name ?? user.name ?? null,
    avatar_url: existingProfile?.avatar_url ?? user.image ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("user_profiles")
    .upsert(payload, { onConflict: "user_id" });

  if (error) {
    throw error;
  }

  return getAppUserProfileById(user.id);
}

export async function createCredentialsUser(input: CredentialsUserInput) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const existingUser = await getNextAuthUserByEmail(input.email);

  if (existingUser) {
    return {
      ok: false,
      reason: "exists" as const,
    };
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const { data: user, error: userError } = await supabase
    .schema("next_auth")
    .from("users")
    .insert({
      name: input.name,
      email: input.email,
      emailVerified: null,
      image: null,
    })
    .select("id, name, email, image, emailVerified")
    .single();

  if (userError) {
    throw formatSupabaseAuthError(
      userError,
      "Unable to create a user in next_auth.users.",
    );
  }

  const { error: profileError } = await supabase.from("user_profiles").upsert(
    {
      user_id: user.id,
      email: input.email,
      display_name: input.name,
      password_hash: passwordHash,
      is_premium: false,
      avatar_url: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (profileError) {
    await supabase.schema("next_auth").from("users").delete().eq("id", user.id);
    throw formatSupabaseAuthError(
      profileError,
      "Unable to create a user profile in public.user_profiles.",
    );
  }

  return {
    ok: true,
    profile: await getAppUserProfileById(user.id),
  };
}

export async function verifyCredentials(email: string, password: string) {
  const user = await getNextAuthUserByEmail(email);

  if (!user) {
    return null;
  }

  const profile = await getUserProfileRow(user.id);

  if (!profile?.password_hash) {
    return null;
  }

  const isValid = await bcrypt.compare(password, profile.password_hash);

  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    name: profile.display_name ?? user.name ?? email.split("@")[0] ?? "PolicyPack User",
    email: user.email,
    image: profile.avatar_url ?? user.image ?? null,
  };
}

export async function setUserPremium(userId: string, isPremium = true) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase
    .from("user_profiles")
    .upsert(
      {
        user_id: userId,
        is_premium: isPremium,
        premium_unlocked_at: isPremium ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (error) {
    throw formatSupabaseAuthError(
      error,
      "Unable to update premium status in public.user_profiles.",
    );
  }

  return getAppUserProfileById(userId);
}

export async function getAccountSettingsSummary(userId: string) {
  const [profile, accounts] = await Promise.all([
    getAppUserProfileById(userId),
    getNextAuthAccountsByUserId(userId),
  ]);

  const methods = new Set<UserSignInMethod>();

  if (profile?.passwordHash) {
    methods.add("password");
  }

  for (const account of accounts) {
    if (account.provider === "google") {
      methods.add("google");
    }
  }

  return {
    profile,
    signInMethods: [...methods],
    canChangePassword: methods.has("password"),
  } satisfies AccountSettingsSummary;
}

export async function updateUserDisplayName(userId: string, displayName: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Account updates are unavailable right now.");
  }

  const normalizedName = displayName.trim();

  if (normalizedName.length < 2) {
    throw new Error("Display name must be at least 2 characters long.");
  }

  const [userUpdate, profileUpdate] = await Promise.all([
    supabase
      .schema("next_auth")
      .from("users")
      .update({
        name: normalizedName,
      })
      .eq("id", userId),
    supabase
      .from("user_profiles")
      .update({
        display_name: normalizedName,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId),
  ]);

  if (userUpdate.error) {
    throw formatSupabaseAuthError(
      userUpdate.error,
      "Unable to update the account name.",
    );
  }

  if (profileUpdate.error) {
    throw formatSupabaseAuthError(
      profileUpdate.error,
      "Unable to update the profile name.",
    );
  }

  return getAppUserProfileById(userId);
}

export async function updateUserPassword(input: {
  userId: string;
  currentPassword: string;
  nextPassword: string;
}) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Password updates are unavailable right now.");
  }

  const profile = await getUserProfileRow(input.userId);

  if (!profile?.password_hash) {
    throw new Error("Password sign-in is not enabled for this account.");
  }

  const currentPassword = input.currentPassword;
  const nextPassword = input.nextPassword;

  if (nextPassword.length < 8) {
    throw new Error("Your new password must be at least 8 characters long.");
  }

  const isCurrentPasswordValid = await bcrypt.compare(
    currentPassword,
    profile.password_hash,
  );

  if (!isCurrentPasswordValid) {
    throw new Error("Your current password is incorrect.");
  }

  const passwordHash = await bcrypt.hash(nextPassword, 12);
  const { error } = await supabase
    .from("user_profiles")
    .update({
      password_hash: passwordHash,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", input.userId);

  if (error) {
    throw formatSupabaseAuthError(error, "Unable to update the password.");
  }

  return true;
}

export async function deleteUserAccount(userId: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Account deletion is unavailable right now.");
  }

  const { error } = await supabase
    .schema("next_auth")
    .from("users")
    .delete()
    .eq("id", userId);

  if (error) {
    throw formatSupabaseAuthError(error, "Unable to delete the account.");
  }

  return true;
}

export async function saveGeneratedDocumentForUser(
  userId: string,
  documentType: PolicyDocumentType,
  generated: GeneratedPolicyDocument,
) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { error } = await supabase.from("generated_documents").upsert(
    {
      user_id: userId,
      document_key: documentType,
      title: generated.title,
      markdown: generated.markdown,
      provider: generated.provider,
      model: generated.model,
      generated_at: generated.generatedAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,document_key" },
  );

  if (error) {
    throw formatSupabaseAuthError(
      error,
      "Unable to save generated document.",
    );
  }

  return true;
}

export async function listGeneratedDocumentsForUser(userId: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return [] as SavedGeneratedDocument[];
  }

  const { data, error } = await supabase
    .from("generated_documents")
    .select(
      "id, user_id, document_key, title, markdown, provider, model, generated_at, created_at, updated_at",
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw formatSupabaseAuthError(
      error,
      "Unable to list generated documents.",
    );
  }

  return ((data as GeneratedDocumentRow[] | null) ?? []).map((document) => ({
    id: document.document_key,
    title: document.title,
    markdown: document.markdown,
    provider: document.provider ?? "openrouter",
    model: document.model ?? "unknown",
    generatedAt: document.generated_at,
  })) satisfies SavedGeneratedDocument[];
}

export async function getLaunchCampaignSnapshot(
  userId?: string | null,
): Promise<LaunchCampaignSnapshot> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return buildDefaultLaunchCampaignSnapshot(userId);
  }

  const registeredUsersPromise = supabase
    .from("user_profiles")
    .select("user_id", { count: "exact", head: true });
  const eligibleUsersPromise = supabase
    .from("user_profiles")
    .select("user_id")
    .order("created_at", { ascending: true })
    .order("user_id", { ascending: true })
    .limit(FREE_GENERATION_USER_LIMIT);
  const generatedDocumentsPromise = userId
    ? supabase
        .from("generated_documents")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
    : Promise.resolve({ count: 0, error: null } as const);

  const [registeredUsersResult, eligibleUsersResult, generatedDocumentsResult] =
    await Promise.all([
      registeredUsersPromise,
      eligibleUsersPromise,
      generatedDocumentsPromise,
    ]);

  if (registeredUsersResult.error) {
    throw formatSupabaseAuthError(
      registeredUsersResult.error,
      "Unable to count registered users for the launch campaign.",
    );
  }

  if (eligibleUsersResult.error) {
    throw formatSupabaseAuthError(
      eligibleUsersResult.error,
      "Unable to read launch campaign eligibility.",
    );
  }

  if (generatedDocumentsResult.error) {
    throw formatSupabaseAuthError(
      generatedDocumentsResult.error,
      "Unable to read generated document usage for the launch campaign.",
    );
  }

  const eligibleUserIds = (
    (eligibleUsersResult.data as Array<{ user_id: string }> | null) ?? []
  ).map((row) => row.user_id);

  return buildLaunchCampaignSnapshot({
    registeredUsers: registeredUsersResult.count ?? 0,
    eligibleUserIds,
    userId,
    generatedDocumentCount: generatedDocumentsResult.count ?? 0,
  });
}
