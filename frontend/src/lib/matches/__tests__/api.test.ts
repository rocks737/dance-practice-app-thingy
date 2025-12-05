import { createClient } from "@/lib/supabase/client";
import { fetchMatchesForCurrentUser, type MatchRow } from "../api";

jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(),
}));

describe("matches/api", () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = {
      rpc: jest.fn(),
    };
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it("calls RPC with default limit and maps rows correctly", async () => {
    const rows: MatchRow[] = [
      {
        candidate_profile_id: "profile-1",
        candidate_preference_id: "pref-1",
        score: 42.5,
        overlapping_windows: 3,
        shared_focus_areas: 2,
        wsdc_level_diff: 1,
      },
    ];

    mockSupabase.rpc.mockResolvedValue({ data: rows, error: null });

    const result = await fetchMatchesForCurrentUser();

    expect(mockSupabase.rpc).toHaveBeenCalledWith("find_matches_for_current_user", {
      p_limit: 20,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      profileId: "profile-1",
      preferenceId: "pref-1",
      score: 42.5,
      overlappingWindows: 3,
      sharedFocusAreas: 2,
      wsdcLevelDiff: 1,
    });
  });

  it("passes custom limit to RPC", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: [], error: null });

    await fetchMatchesForCurrentUser(5);

    expect(mockSupabase.rpc).toHaveBeenCalledWith("find_matches_for_current_user", {
      p_limit: 5,
    });
  });

  it("returns empty array when RPC returns null/empty data", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

    const result = await fetchMatchesForCurrentUser();

    expect(result).toEqual([]);
  });

  it("throws when RPC returns an error", async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: null,
      error: { message: "RPC failed" },
    });

    await expect(fetchMatchesForCurrentUser()).rejects.toThrow("RPC failed");
  });
});


