import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export async function fetchProfileIdByAuthUserId(
  supabase: SupabaseClient<Database>,
  authUserId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    return null;
  }
  return data?.id ?? null;
}
