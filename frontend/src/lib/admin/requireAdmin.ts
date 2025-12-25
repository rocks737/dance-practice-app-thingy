import "server-only";

import { createClient } from "@/lib/supabase/server";

export type RequireAdminResult = {
  profileId: string;
};

/**
 * Ensures the current request is authenticated AND the caller has ADMIN in `user_roles`.
 * Throws an Error on failure (route handlers should translate to 401/403).
 */
export async function requireAdmin(): Promise<RequireAdminResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (profileError || !profile?.id) {
    throw new Error("Forbidden");
  }

  const { data: roles, error: rolesError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", profile.id);

  if (rolesError) {
    throw new Error("Forbidden");
  }

  const isAdmin = roles?.some((r) => r.role === "ADMIN");
  if (!isAdmin) {
    throw new Error("Forbidden");
  }

  return { profileId: profile.id };
}



