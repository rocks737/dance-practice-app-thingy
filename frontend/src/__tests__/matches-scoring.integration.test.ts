import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import {
  createTestUser,
  cleanupTestUser,
  createTestSchedulePreference,
  createTestLocation,
  createAdminClient,
} from "./integration-utils";

const RUN_SUPABASE_INTEGRATION = process.env.RUN_SUPABASE_TESTS === "true";
const describeIfSupabase = RUN_SUPABASE_INTEGRATION ? describe : describe.skip;

interface MatchRow {
  candidate_profile_id: string;
  candidate_preference_id: string;
  score: number;
  overlapping_windows: number;
  overlapping_minutes: number;
  shared_focus_areas: number;
  wsdc_level_diff: number;
}

describeIfSupabase("Matches - Scoring Integration", () => {
  const admin = createAdminClient();
  let baseUser: Awaited<ReturnType<typeof createTestUser>>;
  let sharedLocationId: string;

  async function createUserWithPref(options: {
    wsdcLevel: number;
    window: { day: string; start: string; end: string };
    focusAreas?: string[];
  }) {
    const u = await createTestUser("DANCER");
    await admin.from("user_profiles").update({ home_location_id: sharedLocationId, wsdc_level: options.wsdcLevel }).eq("id", u.profileId);
    const prefId = await createTestSchedulePreference(u.profileId, [
      { dayOfWeek: options.window.day, startTime: options.window.start, endTime: options.window.end, recurring: true },
    ]);
    if (options.focusAreas?.length) {
      await admin.from("schedule_preference_focus").insert(
        options.focusAreas.map((f) => ({ preference_id: prefId, focus_area: f })),
      );
    }
    return u;
  }

  beforeAll(async () => {
    const loc = await createTestLocation("Scoring City", "Scoring City", "CA");
    sharedLocationId = loc.locationId;
    baseUser = await createUserWithPref({
      wsdcLevel: 5, // CHAMPION
      window: { day: "MONDAY", start: "10:00:00", end: "12:00:00" },
      focusAreas: ["TECHNIQUE", "MUSICALITY", "CONNECTION"],
    });
  });

  afterAll(async () => {
    await cleanupTestUser(baseUser);
  });

  async function fetchMatchesForBase(limit = 500): Promise<MatchRow[]> {
    const { data, error } = await baseUser.supabase.rpc("find_matches_for_current_user", {
      p_limit: limit,
    });
    if (error) {
      throw new Error(`RPC error in find_matches_for_current_user: ${error.message}`);
    }
    return (data ?? []) as MatchRow[];
  }

  it("orders candidates by overlapping minutes when other factors are equal", async () => {
    const high = await createUserWithPref({
      wsdcLevel: 2,
      window: { day: "MONDAY", start: "10:00:00", end: "12:00:00" }, // 2h overlap
      focusAreas: ["TECHNIQUE", "MUSICALITY"],
    });
    const mid = await createUserWithPref({
      wsdcLevel: 2,
      window: { day: "MONDAY", start: "10:30:00", end: "11:30:00" }, // 1h overlap
      focusAreas: ["TECHNIQUE", "MUSICALITY"],
    });
    const low = await createUserWithPref({
      wsdcLevel: 2,
      window: { day: "MONDAY", start: "11:00:00", end: "11:30:00" }, // 0.5h overlap
      focusAreas: ["TECHNIQUE", "MUSICALITY"],
    });
    const none = await createUserWithPref({
      wsdcLevel: 2,
      window: { day: "TUESDAY", start: "10:00:00", end: "12:00:00" }, // different day
      focusAreas: ["TECHNIQUE", "MUSICALITY"],
    });

    const rows = await fetchMatchesForBase(500);
    const getRow = (u: any) => rows.find((r) => r.candidate_profile_id === u.profileId);
    const highRow = getRow(high) as MatchRow;
    const midRow = getRow(mid) as MatchRow;
    const lowRow = getRow(low) as MatchRow;
    expect(getRow(none)).toBeUndefined();

    expect(highRow.overlapping_minutes).toBeGreaterThan(midRow.overlapping_minutes);
    expect(midRow.overlapping_minutes).toBeGreaterThan(lowRow.overlapping_minutes);
    expect(highRow.score).toBeGreaterThan(midRow.score);
    expect(midRow.score).toBeGreaterThan(lowRow.score);
  });

  it("orders candidates by shared focus areas when overlap and wsdc are equal", async () => {
    const f0 = await createUserWithPref({
      wsdcLevel: 2,
      window: { day: "MONDAY", start: "10:00:00", end: "12:00:00" },
      focusAreas: [],
    });
    const f1 = await createUserWithPref({
      wsdcLevel: 2,
      window: { day: "MONDAY", start: "10:00:00", end: "12:00:00" },
      focusAreas: ["TECHNIQUE"],
    });
    const f3 = await createUserWithPref({
      wsdcLevel: 5,
      window: { day: "MONDAY", start: "10:00:00", end: "12:00:00" },
      focusAreas: ["TECHNIQUE", "MUSICALITY", "CONNECTION"],
    });

    const rows = await fetchMatchesForBase(500);
    const getRow = (u: any) => rows.find((r) => r.candidate_profile_id === u.profileId) as MatchRow;
    const r0 = getRow(f0);
    const r1 = getRow(f1);
    const r3 = getRow(f3);

    expect(r1.overlapping_minutes).toBe(r0.overlapping_minutes);
    expect(r3.overlapping_minutes).toBe(r0.overlapping_minutes);
    expect(r1.shared_focus_areas).toBeGreaterThan(r0.shared_focus_areas);
    expect(r3.shared_focus_areas).toBeGreaterThan(r1.shared_focus_areas);
    expect(r1.score).toBeGreaterThan(r0.score);
    expect(r3.score).toBeGreaterThan(r1.score);
  });

  it("orders candidates by wsdc proximity when overlap and focus are equal", async () => {
    const same = await createUserWithPref({
      wsdcLevel: 5,
      window: { day: "MONDAY", start: "10:00:00", end: "12:00:00" },
      focusAreas: ["TECHNIQUE", "MUSICALITY", "CONNECTION"],
    });
    const diff2 = await createUserWithPref({
      wsdcLevel: 3, // diff 2 from base=5
      window: { day: "MONDAY", start: "10:00:00", end: "12:00:00" },
      focusAreas: ["TECHNIQUE", "MUSICALITY"],
    });
    const diff5 = await createUserWithPref({
      wsdcLevel: 0, // diff 5 from base=5
      window: { day: "MONDAY", start: "10:00:00", end: "12:00:00" },
      focusAreas: ["TECHNIQUE", "MUSICALITY"],
    });

    const rows = await fetchMatchesForBase(500);
    const getRow = (u: any) => rows.find((r) => r.candidate_profile_id === u.profileId) as MatchRow;
    const rSame = getRow(same);
    const rDiff2 = getRow(diff2);
    const rDiff5 = getRow(diff5);

    expect(rSame.overlapping_minutes).toBeGreaterThan(0);
    expect(rSame.overlapping_minutes).toBe(rDiff2.overlapping_minutes);
    expect(rSame.overlapping_minutes).toBe(rDiff5.overlapping_minutes);

    expect(rSame.score).toBeGreaterThan(rDiff2.score);
    expect(rDiff2.score).toBeGreaterThan(rDiff5.score);
  });
});


