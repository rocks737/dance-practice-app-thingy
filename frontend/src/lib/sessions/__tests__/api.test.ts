import { createClient } from "@/lib/supabase/client";
import { fetchSessions, createSession, updateSession } from "../api";
import type {
  SessionFilters,
  SessionStatus,
  SessionType,
  SessionVisibility,
} from "../types";

jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(),
}));

type QueryResponse = {
  data: any;
  error: { message: string } | null;
  count?: number | null;
};

const createQueryBuilder = (response: QueryResponse) => {
  const builder: any = {
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    then: (resolve: any, reject?: any) => Promise.resolve(response).then(resolve, reject),
  };

  return builder;
};

describe("sessions/api", () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = {
      from: jest.fn(),
    };
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe("fetchSessions", () => {
    it("returns mapped sessions with default pagination", async () => {
      const rawSession = {
        id: "session-1",
        title: "Morning Lab",
        session_type: "PARTNER_PRACTICE",
        status: "SCHEDULED",
        visibility: "PARTICIPANTS_ONLY",
        scheduled_start: "2024-02-01T10:00:00Z",
        scheduled_end: "2024-02-01T11:30:00Z",
        updated_at: "2024-02-01T09:30:00Z",
        version: 2,
        capacity: 12,
        location: {
          id: "loc-1",
          name: "Dance HQ",
          city: "Austin",
          state: "TX",
        },
        organizer: {
          id: "org-1",
          display_name: "Kelly",
          first_name: "Kelly",
          last_name: "Smith",
        },
        session_participants: [{ user_id: "u1" }, { user_id: "u2" }],
      };

      const builder = createQueryBuilder({
        data: [rawSession],
        error: null,
        count: 7,
      });
      mockSupabase.from.mockReturnValue(builder);

      const result = await fetchSessions();

      expect(mockSupabase.from).toHaveBeenCalledWith("sessions");
      expect(builder.select).toHaveBeenCalledWith(
        expect.stringContaining("session_participants"),
        { count: "exact" },
      );
      expect(builder.order).toHaveBeenCalledWith("scheduled_start", {
        ascending: false,
      });
      expect(builder.range).toHaveBeenCalledWith(0, 19);
      expect(result.total).toBe(7);
      expect(result.sessions[0]).toMatchObject({
        id: "session-1",
        title: "Morning Lab",
        sessionType: "PARTNER_PRACTICE",
        status: "SCHEDULED",
        participantCount: 2,
        location: {
          id: "loc-1",
          name: "Dance HQ",
          city: "Austin",
          state: "TX",
        },
        organizer: {
          id: "org-1",
          displayName: "Kelly",
          firstName: "Kelly",
          lastName: "Smith",
        },
      });
    });

    it("applies filters to the query builder", async () => {
      const builder = createQueryBuilder({
        data: [],
        error: null,
        count: 0,
      });
      mockSupabase.from.mockReturnValue(builder);

      const filters: SessionFilters = {
        searchText: "westie",
        statuses: ["SCHEDULED"] as SessionStatus[],
        sessionTypes: ["GROUP_PRACTICE"] as SessionType[],
        visibilities: ["PUBLIC"] as SessionVisibility[],
        fromDate: "2024-02-01T00:00:00Z",
        toDate: "2024-03-01T00:00:00Z",
      };

      await fetchSessions({ filters, limit: 5, offset: 10 });

      expect(builder.ilike).toHaveBeenCalledWith("title", "%westie%");
      expect(builder.in).toHaveBeenNthCalledWith(1, "status", filters.statuses);
      expect(builder.in).toHaveBeenNthCalledWith(2, "session_type", filters.sessionTypes);
      expect(builder.in).toHaveBeenNthCalledWith(3, "visibility", filters.visibilities);
      expect(builder.gte).toHaveBeenCalledWith("scheduled_start", filters.fromDate);
      expect(builder.lte).toHaveBeenCalledWith("scheduled_start", filters.toDate);
      expect(builder.range).toHaveBeenCalledWith(10, 14);
    });

    it("throws when Supabase returns an error", async () => {
      const builder = createQueryBuilder({
        data: null,
        error: { message: "Something went wrong" },
        count: null,
      });
      mockSupabase.from.mockReturnValue(builder);

      await expect(fetchSessions()).rejects.toThrow("Something went wrong");
    });
  });

  describe("createSession", () => {
    it("inserts payload and maps response", async () => {
      const rawSession = {
        id: "session-generated",
        title: "Evening Drill",
        session_type: "GROUP_PRACTICE",
        status: "SCHEDULED",
        visibility: "PUBLIC",
        scheduled_start: "2024-02-10T18:00:00Z",
        scheduled_end: "2024-02-10T19:30:00Z",
        updated_at: "2024-02-10T17:00:00Z",
        version: 1,
        capacity: 16,
        location: null,
        organizer: {
          id: "org-5",
          display_name: "Alex",
          first_name: "Alex",
          last_name: "Johnson",
        },
        session_participants: [],
      };

      const single = jest.fn().mockResolvedValue({ data: rawSession, error: null });
      const select = jest.fn().mockReturnValue({ single });
      const insert = jest.fn().mockReturnValue({ select });

      mockSupabase.from.mockReturnValue({
        insert,
      });

      const result = await createSession({
        title: "Evening Drill",
        sessionType: "GROUP_PRACTICE",
        status: "SCHEDULED",
        visibility: "PUBLIC",
        scheduledStart: "2024-02-10T18:00:00Z",
        scheduledEnd: "2024-02-10T19:30:00Z",
        organizerId: "org-5",
        capacity: 16,
      });

      expect(mockSupabase.from).toHaveBeenCalledWith("sessions");
      expect(insert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Evening Drill",
          session_type: "GROUP_PRACTICE",
          status: "SCHEDULED",
          organizer_id: "org-5",
          capacity: 16,
        }),
      );
      expect(select).toHaveBeenCalledWith(expect.any(String));
      expect(result.id).toBe("session-generated");
      expect(result.organizer?.id).toBe("org-5");
    });

    it("forces capacity=2 for partner practice sessions", async () => {
      const rawSession = {
        id: "session-partner",
        title: "Partner Practice",
        session_type: "PARTNER_PRACTICE",
        status: "SCHEDULED",
        visibility: "PUBLIC",
        scheduled_start: "2024-02-10T18:00:00Z",
        scheduled_end: "2024-02-10T19:30:00Z",
        updated_at: "2024-02-10T17:00:00Z",
        version: 1,
        capacity: 2,
        location: null,
        organizer: null,
        session_participants: [],
      };

      const single = jest.fn().mockResolvedValue({ data: rawSession, error: null });
      const select = jest.fn().mockReturnValue({ single });
      const insert = jest.fn().mockReturnValue({ select });
      mockSupabase.from.mockReturnValue({ insert });

      await createSession({
        title: "Partner Practice",
        sessionType: "PARTNER_PRACTICE",
        status: "SCHEDULED",
        visibility: "PUBLIC",
        scheduledStart: "2024-02-10T18:00:00Z",
        scheduledEnd: "2024-02-10T19:30:00Z",
        organizerId: "org-5",
        capacity: 99,
      });

      expect(insert).toHaveBeenCalledWith(
        expect.objectContaining({
          session_type: "PARTNER_PRACTICE",
          capacity: 2,
        }),
      );
    });
  });

  describe("updateSession", () => {
    it("sends patch and returns updated session", async () => {
      const rawSession = {
        id: "session-22",
        title: "Lunch Lab",
        session_type: "GROUP_PRACTICE",
        status: "COMPLETED",
        visibility: "PUBLIC",
        scheduled_start: "2024-02-05T12:00:00Z",
        scheduled_end: "2024-02-05T13:30:00Z",
        updated_at: "2024-02-05T14:00:00Z",
        version: 3,
        capacity: 8,
        location: null,
        organizer: null,
        session_participants: [{ user_id: "u-9" }],
      };

      const single = jest.fn().mockResolvedValue({ data: rawSession, error: null });
      const select = jest.fn().mockReturnValue({ single });
      const eq = jest.fn().mockReturnValue({ select });
      const update = jest.fn().mockReturnValue({ eq });

      // updateSession now prefetches session_type when capacity is provided.
      const typeSingle = jest.fn().mockResolvedValue({
        data: { session_type: "GROUP_PRACTICE" },
        error: null,
      });
      const typeEq = jest.fn().mockReturnValue({ single: typeSingle });
      const typeSelect = jest.fn().mockReturnValue({ eq: typeEq });

      mockSupabase.from
        .mockReturnValueOnce({
          select: typeSelect,
        })
        .mockReturnValueOnce({
          update,
        });

      const result = await updateSession({
        id: "session-22",
        patch: {
          status: "COMPLETED",
          visibility: "PUBLIC",
          capacity: 8,
        },
      });

      expect(mockSupabase.from).toHaveBeenCalledWith("sessions");
      expect(update).toHaveBeenCalledWith({
        status: "COMPLETED",
        visibility: "PUBLIC",
        capacity: 8,
      });
      expect(eq).toHaveBeenCalledWith("id", "session-22");
      expect(result.status).toBe("COMPLETED");
      expect(result.participantCount).toBe(1);
    });

    it("rejects capacity edits for partner practice sessions", async () => {
      const update = jest.fn();

      const typeSingle = jest.fn().mockResolvedValue({
        data: { session_type: "PARTNER_PRACTICE" },
        error: null,
      });
      const typeEq = jest.fn().mockReturnValue({ single: typeSingle });
      const typeSelect = jest.fn().mockReturnValue({ eq: typeEq });

      mockSupabase.from.mockReturnValueOnce({
        select: typeSelect,
      });

      await expect(
        updateSession({
          id: "session-pp",
          patch: { capacity: 3 },
        }),
      ).rejects.toThrow(/capacity is fixed at 2/i);

      expect(update).not.toHaveBeenCalled();
    });

    it("throws when Supabase update fails", async () => {
      const single = jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Update failed" },
      });
      const select = jest.fn().mockReturnValue({ single });
      const eq = jest.fn().mockReturnValue({ select });
      const update = jest.fn().mockReturnValue({ eq });
      mockSupabase.from.mockReturnValue({ update });

      await expect(
        updateSession({
          id: "broken",
          patch: { status: "CANCELLED" },
        }),
      ).rejects.toThrow("Update failed");
    });
  });
});
