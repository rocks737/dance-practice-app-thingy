import { createClient } from "@/lib/supabase/client";
import { fetchActiveInviteeIds, fetchMatchesForCurrentUser, type MatchRow } from "../api";

jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(),
}));

let mockSupabase: any;

beforeEach(() => {
  jest.clearAllMocks();
  mockSupabase = {
    rpc: jest.fn(),
    from: jest.fn(),
  };
  (createClient as jest.Mock).mockReturnValue(mockSupabase);
});

describe("matches/api", () => {
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

describe("fetchActiveInviteeIds", () => {
  let chain: any;

  beforeEach(() => {
    chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn(),
    };
    mockSupabase.rpc.mockReset();
    mockSupabase.from.mockReturnValue(chain);
  });

  it("returns invitee ids for pending invites", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: "profile-123", error: null });
    chain.in.mockResolvedValue({
      data: [
        { invitee_id: "p1", status: "PENDING" },
        { invitee_id: "p2", status: "PENDING" },
      ],
      error: null,
    });

    const ids = await fetchActiveInviteeIds();

    expect(mockSupabase.from).toHaveBeenCalledWith("session_invites");
    expect(chain.eq).toHaveBeenCalledWith("proposer_id", "profile-123");
    expect(ids.has("p1")).toBe(true);
    expect(ids.has("p2")).toBe(true);
  });

  it("returns empty set when profile id cannot be resolved", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

    const ids = await fetchActiveInviteeIds();

    expect(ids.size).toBe(0);
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it("returns empty set when invite query fails", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: "profile-123", error: null });
    chain.in.mockResolvedValue({ data: null, error: { message: "fail" } });

    const ids = await fetchActiveInviteeIds();

    expect(ids.size).toBe(0);
  });
});


