import { describe, it, expect, beforeAll } from "@jest/globals";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { supabaseUrl, supabaseAnonKey, createAdminClient } from "./integration-utils";

interface MatchRow {
  candidate_profile_id: string;
  candidate_preference_id: string;
  score: number;
  overlapping_windows: number;
  overlapping_minutes: number;
  shared_focus_areas: number;
  wsdc_level_diff: number;
}

interface ProfileInfo {
  id: string;
  email: string;
  wsdc_level: number | null;
}

describe("Matches - Scoring Integration", () => {
  let baseClient: ReturnType<typeof createClient<Database>>;
  let baseProfileId: string;
  const admin = createAdminClient();

  const emails = {
    // RPC caller; seeded as a normal auth user via USERS in seed_via_api.py
    base: "test@ex.com",
    overlapHigh: "scoring_high_overlap@example.com",
    overlapMid: "scoring_mid_overlap@example.com",
    overlapLow: "scoring_low_overlap@example.com",
    overlapNone: "scoring_no_overlap@example.com",
    focus0: "scoring_focus0@example.com",
    focus1: "scoring_focus1@example.com",
    focus3: "scoring_focus3@example.com",
    wsdcSame: "scoring_wsdc_same@example.com",
    wsdcDiff2: "scoring_wsdc_diff2@example.com",
    wsdcDiff5: "scoring_wsdc_diff5@example.com",
  } as const;

  const profileByEmail: Record<string, ProfileInfo> = {};

  beforeAll(async () => {
    baseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

    // Sign in as the base user (current user for RPC)
    const { data: authData, error: authError } = await baseClient.auth.signInWithPassword({
      email: emails.base,
      password: "test123",
    });
    if (authError || !authData.session) {
      throw new Error(`Failed to sign in scoring base user: ${authError?.message}`);
    }

    // Resolve profile IDs for all scoring fixture emails using admin client
    const allEmails = Object.values(emails);
    const { data: profiles, error: profilesError } = await admin
      .from("user_profiles")
      .select("id,email,wsdc_level")
      .in("email", allEmails);

    if (profilesError || !profiles) {
      throw new Error(`Failed to load scoring fixture profiles: ${profilesError?.message}`);
    }

    profiles.forEach((p) => {
      profileByEmail[p.email] = {
        id: p.id,
        email: p.email,
        wsdc_level: p.wsdc_level as number | null,
      };
    });

    if (!profileByEmail[emails.base]) {
      throw new Error("Missing scoring base profile in seeded data.");
    }
    baseProfileId = profileByEmail[emails.base].id;
  });

  async function fetchMatchesForBase(limit = 500): Promise<MatchRow[]> {
    const { data, error } = await (baseClient as any).rpc("find_matches_for_current_user", {
      p_limit: limit,
    });
    if (error) {
      throw new Error(`RPC error in find_matches_for_current_user: ${error.message}`);
    }
    return (data ?? []) as MatchRow[];
  }

  it("orders candidates by overlapping minutes when other factors are equal", async () => {
    const rows = await fetchMatchesForBase(500);

    // Diagnostic: log all candidate IDs and scores for visibility during debugging.
    // eslint-disable-next-line no-console
    console.log(
      "[scoring-overlap] candidates:",
      rows.map((r) => ({
        id: r.candidate_profile_id,
        score: r.score,
        minutes: r.overlapping_minutes,
        focus: r.shared_focus_areas,
        wsdcDiff: r.wsdc_level_diff,
      })),
    );

    const high = rows.find((r) => r.candidate_profile_id === profileByEmail[emails.overlapHigh].id);
    const mid = rows.find((r) => r.candidate_profile_id === profileByEmail[emails.overlapMid].id);
    const low = rows.find((r) => r.candidate_profile_id === profileByEmail[emails.overlapLow].id);
    const none = rows.find((r) => r.candidate_profile_id === profileByEmail[emails.overlapNone].id);

    expect(high).toBeDefined();
    expect(mid).toBeDefined();
    expect(low).toBeDefined();
    // No-overlap candidate should not appear at all due to RPC filter
    expect(none).toBeUndefined();

    const highRow = high as MatchRow;
    const midRow = mid as MatchRow;
    const lowRow = low as MatchRow;

    // Sanity: overlapping_minutes reflect the ordering we expect
    expect(highRow.overlapping_minutes).toBeGreaterThan(midRow.overlapping_minutes);
    expect(midRow.overlapping_minutes).toBeGreaterThan(lowRow.overlapping_minutes);

    // With identical focus areas and wsdc levels, score should strictly follow minutes.
    expect(highRow.score).toBeGreaterThan(midRow.score);
    expect(midRow.score).toBeGreaterThan(lowRow.score);
  });

  it("orders candidates by shared focus areas when overlap and wsdc are equal", async () => {
    const rows = await fetchMatchesForBase(500);

    const f0 = rows.find((r) => r.candidate_profile_id === profileByEmail[emails.focus0].id);
    const f1 = rows.find((r) => r.candidate_profile_id === profileByEmail[emails.focus1].id);
    const f3 = rows.find((r) => r.candidate_profile_id === profileByEmail[emails.focus3].id);

    expect(f0).toBeDefined();
    expect(f1).toBeDefined();
    expect(f3).toBeDefined();

    const row0 = f0 as MatchRow;
    const row1 = f1 as MatchRow;
    const row3 = f3 as MatchRow;

    // All focus fixtures share the same windows and wsdc level as the base.
    expect(row0.overlapping_minutes).toBeGreaterThan(0);
    expect(row1.overlapping_minutes).toBe(row0.overlapping_minutes);
    expect(row3.overlapping_minutes).toBe(row0.overlapping_minutes);
    expect(row0.wsdc_level_diff).toBe(row1.wsdc_level_diff);
    expect(row1.wsdc_level_diff).toBe(row3.wsdc_level_diff);

    // Sanity: focus counts are monotonic
    expect(row0.shared_focus_areas).toBeLessThanOrEqual(row1.shared_focus_areas);
    expect(row1.shared_focus_areas).toBeLessThanOrEqual(row3.shared_focus_areas);

    // Score should increase with more shared focus areas when other factors are fixed.
    expect(row1.score).toBeGreaterThan(row0.score);
    expect(row3.score).toBeGreaterThan(row1.score);
  });

  it("orders candidates by wsdc proximity when overlap and focus are equal", async () => {
    const rows = await fetchMatchesForBase(500);

    const same = rows.find((r) => r.candidate_profile_id === profileByEmail[emails.wsdcSame].id);
    const diff2 = rows.find((r) => r.candidate_profile_id === profileByEmail[emails.wsdcDiff2].id);
    const diff5 = rows.find((r) => r.candidate_profile_id === profileByEmail[emails.wsdcDiff5].id);

    expect(same).toBeDefined();
    expect(diff2).toBeDefined();
    expect(diff5).toBeDefined();

    const sameRow = same as MatchRow;
    const diff2Row = diff2 as MatchRow;
    const diff5Row = diff5 as MatchRow;

    // All wsdc fixtures share the same windows and focus areas as the base.
    expect(sameRow.overlapping_minutes).toBeGreaterThan(0);
    expect(sameRow.overlapping_minutes).toBe(diff2Row.overlapping_minutes);
    expect(sameRow.overlapping_minutes).toBe(diff5Row.overlapping_minutes);
    expect(sameRow.shared_focus_areas).toBe(diff2Row.shared_focus_areas);
    expect(sameRow.shared_focus_areas).toBe(diff5Row.shared_focus_areas);

    // Sanity: wsdc diffs are as designed: "same" closest, then diff2, then diff5 farthest.
    expect(sameRow.wsdc_level_diff).toBeLessThan(diff2Row.wsdc_level_diff);
    expect(diff2Row.wsdc_level_diff).toBeLessThan(diff5Row.wsdc_level_diff);

    // Score should strictly decrease as wsdc_level_diff increases when other factors are fixed.
    expect(sameRow.score).toBeGreaterThan(diff2Row.score);
    expect(diff2Row.score).toBeGreaterThan(diff5Row.score);
  });
});


