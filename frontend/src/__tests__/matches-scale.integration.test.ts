/**
 * Matches Scale Integration Test
 * -----------------------------------------------
 * Optional scale tests for the Postgres RPC:
 *   public.find_matches_for_current_user(p_limit)
 *
 * These tests reseed the database with many users using the Python
 * seed_via_api.py script and then exercise the matching RPC at scale.
 *
 * To run:
 *   cd supabase
 *   python3 seed_via_api.py --extra-users 200 --windows-per-user 2
 *   cd ../frontend
 *   SCALE_TEST=1 npm test -- src/__tests__/matches-scale.integration.test.ts --no-coverage
 */

import { describe, it, expect, beforeAll } from "@jest/globals";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { supabaseUrl, supabaseAnonKey, reseedWithScale } from "./integration-utils";

interface MatchRow {
  candidate_profile_id: string;
  candidate_preference_id: string;
  score: number;
  overlapping_windows: number;
  overlapping_minutes: number;
  shared_focus_areas: number;
  wsdc_level_diff: number;
}

// Only run these when SCALE_TEST=1 to keep default test runs fast.
const scaleEnabled = process.env.SCALE_TEST === "1";

interface SeededUserInfo {
  email: string;
  user_id: string;
  profile_id: string;
  windows: {
    day: string;
    start: string;
    end: string;
  }[];
}

const seededUsersEnv = process.env.SCALE_SEEDED_USERS_JSON;
const seededUsers: SeededUserInfo[] = seededUsersEnv ? JSON.parse(seededUsersEnv) : [];
const windowsPerUserEnv = process.env.SCALE_WINDOWS_PER_USER;
const windowsPerUser = windowsPerUserEnv != null ? Number(windowsPerUserEnv) : undefined;

(scaleEnabled ? describe : describe.skip)("Matches - Scale Integration", () => {
  let supabase: ReturnType<typeof createClient<Database>>;

  beforeAll(async () => {
    // If we weren't invoked via run_scale_tests.py (no JSON), reseed here
    // so the tests are still runnable by hand. When SCALE_SEEDED_USERS_JSON
    // is present, assume the Python runner already seeded appropriately.
    if (!seededUsersEnv) {
      // Reseed with a larger number of users and fewer windows per user
      // to simulate a busier system while keeping runtime reasonable.
      reseedWithScale(200, 2);
    }

    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

    // Sign in as seeded test user (created by seed_via_api.py)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "test@ex.com",
      password: "test123",
    });

    if (error || !data.session) {
      throw new Error(`Failed to sign in seeded test user for scale test: ${error?.message}`);
    }
  });

  it("returns a bounded, well-formed list of matches at scale", async () => {
    const limit = 50;
    const { data, error } = await supabase.rpc("find_matches_for_current_user", {
      p_limit: limit,
    });

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);

    const rows = (data ?? []) as unknown as MatchRow[];

    // Should never exceed the requested limit
    expect(rows.length).toBeLessThanOrEqual(limit);

    // When rows exist, verify ordering and basic invariants
    if (rows.length > 0) {
      // Scores should be non-negative and sorted descending
      for (let i = 0; i < rows.length; i++) {
        expect(rows[i].score).toBeGreaterThanOrEqual(0);
        if (i > 0) {
          expect(rows[i - 1].score).toBeGreaterThanOrEqual(rows[i].score);
        }
        expect(typeof rows[i].overlapping_minutes).toBe("number");
        expect(typeof rows[i].overlapping_windows).toBe("number");
      }
    }
  });

  it("allows extra users to find many matching partners", async () => {
    // Pick a few of the extra seeded users (based on the JSON provided by the seeder)
    // and verify they see plenty of matches. If the JSON is not provided (e.g. when
    // running this test manually without run_scale_tests.py), fall back to a static
    // list of expected extra emails.
    const extraUsersFromJson =
      seededUsers.length > 0
        ? seededUsers.filter((u) => u.email.startsWith("extra")).slice(0, 3)
        : [];

    const sampleEmails =
      extraUsersFromJson.length > 0
        ? extraUsersFromJson.map((u) => u.email)
        : ["extra1@example.com", "extra2@example.com", "extra3@example.com"];

    // Helper: determine if two users have at least one overlapping window
    // according to the same overlap condition used in SQL:
    // w1.start_time < w2.end_time AND w2.start_time < w1.end_time
    const timeToMinutes = (t: string) => {
      const [h, m, s] = t.split(":").map(Number);
      return h * 60 + m + (s ?? 0) / 60;
    };

    const haveOverlap = (a: SeededUserInfo, b: SeededUserInfo): boolean => {
      for (const wa of a.windows) {
        for (const wb of b.windows) {
          if (wa.day !== wb.day) continue;
          const aStart = timeToMinutes(wa.start);
          const aEnd = timeToMinutes(wa.end);
          const bStart = timeToMinutes(wb.start);
          const bEnd = timeToMinutes(wb.end);
          if (aStart < bEnd && bStart < aEnd) {
            return true;
          }
        }
      }
      return false;
    };

    for (const email of sampleEmails) {
      const selfFromJson = seededUsers.find((u) => u.email === email);
      if (!selfFromJson) {
        // eslint-disable-next-line no-console
        console.warn(`Skipping scale match check for ${email}: not found in seeded JSON`);
        continue;
      }
      const client = createClient<Database>(supabaseUrl, supabaseAnonKey);

      const { data: authData, error: authError } = await client.auth.signInWithPassword({
        email,
        password: "extra123",
      });

      // Some of the later extras may not exist if extra-users was set lower;
      // in that case we just skip that particular email.
      if (authError || !authData.session) {
        // eslint-disable-next-line no-console
        console.warn(`Skipping scale match check for ${email}: ${authError?.message}`);
        continue;
      }

      const { data, error } = await client.rpc("find_matches_for_current_user", {
        // Ask for many results so we can see most/all candidates for this user.
        p_limit: 500,
      });

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);

      const rows = (data ?? []) as unknown as MatchRow[];

      // Compute the exact expected set of matching profile_ids using the
      // seeded windows and the same overlap logic as the SQL function.
      const expectedMatches = seededUsers.filter(
        (other) =>
          other.profile_id !== selfFromJson.profile_id && haveOverlap(selfFromJson, other),
      );
      const expectedIds = new Set(expectedMatches.map((u) => u.profile_id));
      const actualIds = new Set(rows.map((r) => r.candidate_profile_id));

      // Diagnostic logging to help understand scale behavior per user.
      // eslint-disable-next-line no-console
      console.log(
        `[scale-matches] user=${email} profile=${selfFromJson.profile_id} ` +
          `windows=${JSON.stringify(selfFromJson.windows)} ` +
          `expectedCount=${expectedMatches.length} actualCount=${rows.length}`,
      );

      // Optionally log a small sample of expected vs actual IDs for spot-checking.
      // eslint-disable-next-line no-console
      console.log(
        `[scale-matches] user=${email} expectedSample=${JSON.stringify(
          expectedMatches.slice(0, 5).map((u) => u.profile_id),
        )} actualSample=${JSON.stringify(rows.slice(0, 5).map((r) => r.candidate_profile_id))}`,
      );

      expect(actualIds.size).toBe(expectedIds.size);
      // actualIds should equal expectedIds
      expectedIds.forEach((id) => {
        expect(actualIds.has(id)).toBe(true);
      });

      // None of the candidates should be the caller themself.
      const authUserId = authData.user.id as string;
      const { data: profileData, error: profileError } = await client
        .from("user_profiles")
        .select("id")
        .eq("auth_user_id", authUserId)
        .single();
      expect(profileError).toBeNull();
      const selfId = profileData!.id;

      rows.forEach((row) => {
        expect(row.candidate_profile_id).not.toBe(selfId);
        expect(row.overlapping_minutes).toBeGreaterThan(0);
      });
    }
  });
});


