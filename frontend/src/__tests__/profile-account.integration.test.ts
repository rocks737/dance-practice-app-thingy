/**
 * Profile/account integration tests:
 * - Update profile fields via RLS
 * - Update password and re-authenticate
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { createTestUser, cleanupTestUser } from "./integration-utils";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseAnonKey } from "./integration-utils";

describe("Profile & Account - Integration", () => {
  let user: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    user = await createTestUser("DANCER");
  });

  afterAll(async () => {
    await cleanupTestUser(user);
  });

  it("updates profile display name and visibility", async () => {
    const newDisplay = `Display-${Date.now()}`;

    const { data, error } = await user.supabase
      .from("user_profiles")
      .update({
        display_name: newDisplay,
        profile_visible: false,
      })
      .eq("id", user.profileId)
      .select("display_name, profile_visible")
      .single();

    expect(error).toBeNull();
    expect(data?.display_name).toBe(newDisplay);
    expect(data?.profile_visible).toBe(false);
  });

  it("updates password and re-authenticates", async () => {
    const newPassword = "NewStrongPass123!";

    const { error: updateErr } = await user.supabase.auth.updateUser({
      password: newPassword,
    });
    expect(updateErr).toBeNull();

    // Re-authenticate with a fresh client to verify the new password works
    const freshClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await freshClient.auth.signInWithPassword({
      email: user.email,
      password: newPassword,
    });
    expect(error).toBeNull();
    expect(data.session).toBeDefined();
  });
});
