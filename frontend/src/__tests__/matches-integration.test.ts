/**
 * Matches Integration Test
 * -----------------------------------------------
 * Smoke tests for the Postgres RPC:
 *   public.find_matches_for_current_user(p_limit)
 *
 * This uses the real Supabase instance (local) and exercises:
 * - current_profile_id() wiring
 * - basic candidate filtering
 * - scoring output shape
 *
 * It assumes `supabase/seed_via_api.py` has created at least:
 * - alice@example.com
 * - bob@example.com
 * - test@ex.com (admin)
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import {
  supabaseUrl,
  supabaseAnonKey,
  createTestUser,
  createTestSchedulePreference,
  cleanupTestUser,
  createAdminClient,
  type TestUser,
} from "./integration-utils";

interface MatchRow {
  candidate_profile_id: string;
  candidate_preference_id: string;
  score: number;
  overlapping_windows: number;
  shared_focus_areas: number;
  wsdc_level_diff: number;
}

describe("Matches - Integration", () => {
  let supabase: ReturnType<typeof createClient<Database>>;
  let testSession: string | null = null;

  beforeAll(async () => {
    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

    // Sign in as seeded test user (created by seed_via_api.py)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "test@ex.com",
      password: "test123", // see supabase/seed_via_api.py
    });

    if (error || !data.session) {
      throw new Error(`Failed to sign in seeded test user: ${error?.message}`);
    }

    // Store access token in memory for potential debugging
    testSession = data.session.access_token;
  });

  afterAll(async () => {
    // Sign out to clean up auth state
    await supabase.auth.signOut();
  });

  it("returns at least one match candidate for seeded test user", async () => {
    const { data, error } = await (supabase as any).rpc("find_matches_for_current_user", {
      p_limit: 10,
    });

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);

    const rows = (data ?? []) as unknown as MatchRow[];

    // We expect at least alice/bob to be potential candidates for test@ex.com
    // Exact count/ordering is not asserted here to keep the test stable.
    expect(rows.length).toBeGreaterThanOrEqual(1);

    const row = rows[0];
    expect(row.candidate_profile_id).toBeDefined();
    expect(row.candidate_preference_id).toBeDefined();
    expect(typeof row.score).toBe("number");
    expect(typeof row.overlapping_windows).toBe("number");
    expect(typeof row.shared_focus_areas).toBe("number");
    expect(typeof row.wsdc_level_diff).toBe("number");
  });

  it("honors the limit parameter", async () => {
    const { data, error } = await (supabase as any).rpc("find_matches_for_current_user", {
      p_limit: 1,
    });

    expect(error).toBeNull();
    const rows = (data ?? []) as unknown as MatchRow[];

    // Either zero (no matches) or exactly one row, but never more than p_limit
    expect(rows.length).toBeLessThanOrEqual(1);
  });

  describe("custom fixtures", () => {
    let userA: TestUser | undefined;
    let userB: TestUser | undefined;
    let userC: TestUser | undefined;

    afterEach(async () => {
      await cleanupTestUser(userA);
      await cleanupTestUser(userB);
      await cleanupTestUser(userC);
      userA = undefined;
      userB = undefined;
      userC = undefined;
    });

    it("returns no matches when there is no overlapping recurring availability", async () => {
      userA = await createTestUser("DANCER");
      userB = await createTestUser("DANCER");

      // A: Monday 10-12, B: Tuesday 10-12 (no overlap)
      await createTestSchedulePreference(userA.profileId, [
        { dayOfWeek: "MONDAY", startTime: "10:00:00", endTime: "12:00:00" },
      ]);
      await createTestSchedulePreference(userB.profileId, [
        { dayOfWeek: "TUESDAY", startTime: "10:00:00", endTime: "12:00:00" },
      ]);

      const { data, error } = await (userA.supabase as any).rpc("find_matches_for_current_user", {
        p_limit: 10,
      });

      expect(error).toBeNull();
      const rows = (data ?? []) as unknown as MatchRow[];
      // There should be no match entry specifically for userB
      expect(rows.find((r) => r.candidate_profile_id === userB!.profileId)).toBeUndefined();
    });

    it("matches when windows overlap and reports overlapping_windows", async () => {
      userA = await createTestUser("DANCER");
      userB = await createTestUser("DANCER");

      // A: Monday 10-12, B: Monday 11-13 -> 1 overlapping window
      await createTestSchedulePreference(userA.profileId, [
        { dayOfWeek: "MONDAY", startTime: "10:00:00", endTime: "12:00:00" },
      ]);
      await createTestSchedulePreference(userB.profileId, [
        { dayOfWeek: "MONDAY", startTime: "11:00:00", endTime: "13:00:00" },
      ]);

      const { data, error } = await (userA.supabase as any).rpc("find_matches_for_current_user", {
        p_limit: 10,
      });

      expect(error).toBeNull();
      const rows = (data ?? []) as unknown as MatchRow[];
      expect(rows.length).toBeGreaterThanOrEqual(1);

      // At least one candidate should have at least one overlapping window
      expect(rows.some((r) => r.overlapping_windows >= 1)).toBe(true);
    });

    it("excludes blocked users even if availability overlaps", async () => {
      userA = await createTestUser("DANCER");
      userB = await createTestUser("DANCER");

      // Both have identical overlapping windows
      await createTestSchedulePreference(userA.profileId, [
        { dayOfWeek: "TUESDAY", startTime: "18:00:00", endTime: "21:00:00" },
      ]);
      await createTestSchedulePreference(userB.profileId, [
        { dayOfWeek: "TUESDAY", startTime: "18:00:00", endTime: "21:00:00" },
      ]);

      // A blocks B (using admin client for test setup to bypass RLS)
      const adminClient = createAdminClient();
      const { error: blockError } = await adminClient.from("user_blocks").insert({
        user_id: userA.profileId,
        blocked_user_id: userB.profileId,
      });
      expect(blockError).toBeNull();

      const { data, error } = await (userA.supabase as any).rpc("find_matches_for_current_user", {
        p_limit: 10,
      });

      expect(error).toBeNull();
      const rows = (data ?? []) as unknown as MatchRow[];

      // Despite perfect overlap, B must not appear due to blocking
      expect(rows.find((r) => r.candidate_profile_id === userB!.profileId)).toBeUndefined();
    });

    it("gives higher score for more shared focus areas", async () => {
      userA = await createTestUser("DANCER");
      userB = await createTestUser("DANCER");
      userC = await createTestUser("DANCER");

      // Everyone overlaps on the same recurring window
      await createTestSchedulePreference(userA.profileId, [
        { dayOfWeek: "WEDNESDAY", startTime: "19:00:00", endTime: "21:00:00" },
      ]);
      await createTestSchedulePreference(userB.profileId, [
        { dayOfWeek: "WEDNESDAY", startTime: "19:30:00", endTime: "21:30:00" },
      ]);
      await createTestSchedulePreference(userC.profileId, [
        { dayOfWeek: "WEDNESDAY", startTime: "19:30:00", endTime: "21:30:00" },
      ]);

      // Seed focus areas via admin client to bypass RLS for setup
      const admin = createAdminClient();

      const getPrefId = async (profileId: string) => {
        const { data, error } = await admin
          .from("schedule_preferences")
          .select("id")
          .eq("user_id", profileId)
          .single();
        if (error || !data) {
          throw new Error(`Failed to fetch preference id for ${profileId}: ${error?.message}`);
        }
        return data.id as string;
      };

      const prefA = await getPrefId(userA.profileId);
      const prefB = await getPrefId(userB.profileId);
      const prefC = await getPrefId(userC.profileId);

      // A: TECHNIQUE, MUSICALITY
      await admin.from("schedule_preference_focus").insert([
        { preference_id: prefA, focus_area: "TECHNIQUE" },
        { preference_id: prefA, focus_area: "MUSICALITY" },
      ]);

      // B: TECHNIQUE only
      await admin.from("schedule_preference_focus").insert([
        { preference_id: prefB, focus_area: "TECHNIQUE" },
      ]);

      // C: TECHNIQUE + MUSICALITY (2 shared areas with A)
      await admin.from("schedule_preference_focus").insert([
        { preference_id: prefC, focus_area: "TECHNIQUE" },
        { preference_id: prefC, focus_area: "MUSICALITY" },
      ]);

      const { data, error } = await (userA.supabase as any).rpc("find_matches_for_current_user", {
        p_limit: 10,
      });

      expect(error).toBeNull();
      const rows = (data ?? []) as unknown as MatchRow[];

      const matchB = rows.find((r) => r.candidate_profile_id === userB!.profileId);
      const matchC = rows.find((r) => r.candidate_profile_id === userC!.profileId);

      // At minimum, B should be a match
      expect(matchB).toBeDefined();
      // If C is also present, it should have at least as many shared focus areas
      // and a score >= B (since it shares more focus areas with A).
      if (matchC) {
        expect(matchC.shared_focus_areas).toBeGreaterThanOrEqual(matchB!.shared_focus_areas);
        expect(matchC.score).toBeGreaterThanOrEqual(matchB!.score);
      }
    });

    it("favors candidates with closer wsdc level", async () => {
      userA = await createTestUser("DANCER");
      userB = await createTestUser("DANCER");
      userC = await createTestUser("DANCER");

      const admin = createAdminClient();

      // Everyone overlaps on same window
      await createTestSchedulePreference(userA.profileId, [
        { dayOfWeek: "THURSDAY", startTime: "18:00:00", endTime: "20:00:00" },
      ]);
      await createTestSchedulePreference(userB.profileId, [
        { dayOfWeek: "THURSDAY", startTime: "18:30:00", endTime: "20:30:00" },
      ]);
      await createTestSchedulePreference(userC.profileId, [
        { dayOfWeek: "THURSDAY", startTime: "18:30:00", endTime: "20:30:00" },
      ]);

      // Set wsdc levels: A=2, B=2 (diff 0), C=5 (diff 3)
      await admin
        .from("user_profiles")
        .update({ wsdc_level: 2 })
        .eq("id", userA.profileId);
      await admin
        .from("user_profiles")
        .update({ wsdc_level: 2 })
        .eq("id", userB.profileId);
      await admin
        .from("user_profiles")
        .update({ wsdc_level: 5 })
        .eq("id", userC.profileId);

      const { data, error } = await (userA.supabase as any).rpc("find_matches_for_current_user", {
        p_limit: 10,
      });

      expect(error).toBeNull();
      const rows = (data ?? []) as unknown as MatchRow[];

      const matchB = rows.find((r) => r.candidate_profile_id === userB!.profileId);
      const matchC = rows.find((r) => r.candidate_profile_id === userC!.profileId);

      expect(matchB).toBeDefined();
      if (matchC) {
        expect(matchB!.wsdc_level_diff).toBeLessThanOrEqual(matchC.wsdc_level_diff);
        expect(matchB!.score).toBeGreaterThanOrEqual(matchC.score);
      }
    });
  });
});


