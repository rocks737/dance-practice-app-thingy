/**
 * Schedule preference integration tests (RLS + data shape).
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import {
  createTestUser,
  cleanupTestUser,
  createAdminClient,
} from "./integration-utils";

describe("Schedule Preference - Integration", () => {
  let owner: Awaited<ReturnType<typeof createTestUser>>;
  let other: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    owner = await createTestUser("DANCER");
    other = await createTestUser("DANCER");
  });

  afterAll(async () => {
    await cleanupTestUser(owner);
    await cleanupTestUser(other);
  });

  it("creates a preference with recurring + one-time windows and hides it from other users", async () => {
    // Create preference for owner
    const { data: pref, error: prefError } = await owner.supabase
      .from("schedule_preferences")
      .insert({
        user_id: owner.profileId,
        notes: "Integration preference",
      })
      .select("id")
      .single();
    expect(prefError).toBeNull();
    const prefId = pref!.id as string;

    // Recurring window
    const { error: winError } = await owner.supabase
      .from("schedule_preference_windows")
      .insert([
        {
          preference_id: prefId,
          day_of_week: "MONDAY",
          start_time: "10:00:00",
          end_time: "12:00:00",
          recurring: true,
        },
        {
          preference_id: prefId,
          day_of_week: "FRIDAY",
          start_time: "18:00:00",
          end_time: "20:00:00",
          recurring: false,
          specific_date: "2025-12-05",
        },
      ]);
    expect(winError).toBeNull();

    // Owner can read their preference
    const { data: ownerPref, error: ownerReadErr } = await owner.supabase
      .from("schedule_preferences")
      .select("id, schedule_preference_windows(day_of_week,recurring,specific_date)")
      .eq("id", prefId)
      .maybeSingle();
    expect(ownerReadErr).toBeNull();
    expect(ownerPref?.schedule_preference_windows?.length).toBe(2);

    // Other user should not see the preference (RLS)
    const { data: otherPref, error: otherErr } = await other.supabase
      .from("schedule_preferences")
      .select("id")
      .eq("id", prefId)
      .maybeSingle();
    expect(otherErr).toBeNull();
    expect(otherPref).toBeNull();

    // Admin can see it
    const admin = createAdminClient();
    const { data: adminPref, error: adminErr } = await admin
      .from("schedule_preferences")
      .select("id")
      .eq("id", prefId)
      .maybeSingle();
    expect(adminErr).toBeNull();
    expect(adminPref?.id).toBe(prefId);
  });
});
