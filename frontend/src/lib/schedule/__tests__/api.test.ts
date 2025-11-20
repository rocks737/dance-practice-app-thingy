import { createClient } from "@/lib/supabase/client";
import {
  fetchSchedulePreferences,
  createSchedulePreference,
  updateSchedulePreference,
  deleteSchedulePreference,
} from "../api";
import type { SchedulePreferenceFormData } from "../validation";

jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(),
}));

const mockSupabase: any = {
  from: jest.fn(),
};

(createClient as jest.Mock).mockReturnValue(mockSupabase);

const childTables = [
  "schedule_preference_windows",
  "schedule_preference_roles",
  "schedule_preference_levels",
  "schedule_preference_focus",
  "schedule_preference_locations",
];

const createChildTableMock = () => {
  const deleteBuilder = {
    eq: jest.fn().mockReturnThis(),
    then: (resolve: any, reject?: any) =>
      Promise.resolve({ error: null }).then(resolve, reject),
  };

  return {
    insert: jest.fn().mockResolvedValue({ error: null }),
    delete: jest.fn().mockReturnValue(deleteBuilder),
  };
};

const createSelectBuilder = (response: any) => ({
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockResolvedValue(response),
  maybeSingle: jest.fn().mockResolvedValue(response),
});

const createUpdateBuilder = (response: any) => ({
  eq: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn().mockResolvedValue(response),
});

const createDeleteBuilder = (response: any) => ({
  eq: jest.fn().mockReturnThis(),
  then: (resolve: any, reject?: any) =>
    Promise.resolve(response).then(resolve, reject),
});

const sampleRawPreference = {
  id: "pref-1",
  user_id: "user-1",
  location_note: "Close to downtown",
  max_travel_distance_km: 20,
  notes: "Looking for drill partners",
  created_at: "2024-05-01T12:00:00.000Z",
  updated_at: "2024-05-02T15:00:00.000Z",
  schedule_preference_windows: [
    {
      day_of_week: "MONDAY",
      start_time: "10:00:00",
      end_time: "12:00:00",
    },
  ],
  schedule_preference_roles: [{ role: "LEAD" }],
  schedule_preference_levels: [{ level: "NOVICE" }],
  schedule_preference_focus: [{ focus_area: "TECHNIQUE" }],
  schedule_preference_locations: [
    {
      location_id: "loc-1",
      location: {
        id: "loc-1",
        name: "Studio HQ",
        city: "Austin",
        state: "TX",
        country: "USA",
      },
    },
  ],
};

describe("schedule/api", () => {
  const schedulePreferencesTable: any = {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "schedule_preferences") {
        return schedulePreferencesTable;
      }
      if (!childTables.includes(table)) {
        throw new Error(`Unexpected table ${table}`);
      }
      if (!mockSupabase[table]) {
        mockSupabase[table] = createChildTableMock();
      }
      return mockSupabase[table];
    });
    childTables.forEach((table) => {
      mockSupabase[table] = createChildTableMock();
    });
  });

  const formData: SchedulePreferenceFormData = {
    availabilityWindows: [
      { dayOfWeek: "MONDAY", startTime: "10:00", endTime: "12:00" },
    ],
    preferredRoles: ["LEAD"],
    preferredLevels: ["NOVICE"],
    preferredFocusAreas: ["TECHNIQUE"],
    preferredLocationIds: ["loc-1"],
    maxTravelDistanceKm: 20,
    locationNote: "Close to downtown",
    notes: "Looking for drill partners",
  };

  describe("fetchSchedulePreferences", () => {
    it("maps Supabase rows into domain objects", async () => {
      const builder = createSelectBuilder({
        data: [sampleRawPreference],
        error: null,
      });
      schedulePreferencesTable.select.mockReturnValue(builder);

      const result = await fetchSchedulePreferences("user-1");

      expect(schedulePreferencesTable.select).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith("user_id", "user-1");
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "pref-1",
        userId: "user-1",
        maxTravelDistanceKm: 20,
        availabilityWindows: [
          { dayOfWeek: "MONDAY", startTime: "10:00", endTime: "12:00" },
        ],
        preferredRoles: ["LEAD"],
        preferredLevels: ["NOVICE"],
        preferredFocusAreas: ["TECHNIQUE"],
        preferredLocations: [
          {
            id: "loc-1",
            name: "Studio HQ",
            city: "Austin",
            state: "TX",
          },
        ],
      });
    });
  });

  describe("createSchedulePreference", () => {
    beforeAll(() => {
      if (!global.crypto) {
        (global as any).crypto = {};
      }
      (global.crypto as any).randomUUID = jest.fn();
    });

    it("persists preference and child records then returns mapped value", async () => {
      (global.crypto.randomUUID as jest.Mock).mockReturnValue("pref-1");
      schedulePreferencesTable.insert.mockResolvedValue({ error: null });

      // fetchPreferenceById call
      schedulePreferencesTable.select.mockReturnValue(
        createSelectBuilder({
          data: sampleRawPreference,
          error: null,
        }),
      );

      const result = await createSchedulePreference({
        userId: "user-1",
        data: formData,
      });

      expect(schedulePreferencesTable.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "pref-1",
          user_id: "user-1",
          max_travel_distance_km: 20,
          notes: "Looking for drill partners",
        }),
      );
      childTables.forEach((table) => {
        expect(mockSupabase[table].delete).toHaveBeenCalled();
        expect(mockSupabase[table].insert).toHaveBeenCalled();
      });
      expect(result.id).toBe("pref-1");
      expect(result.preferredRoles).toEqual(["LEAD"]);
    });
  });

  describe("updateSchedulePreference", () => {
    it("updates base record and child tables then returns latest preference", async () => {
      schedulePreferencesTable.update.mockReturnValue(
        createUpdateBuilder({ data: { id: "pref-1" }, error: null }),
      );
      schedulePreferencesTable.select.mockReturnValue(
        createSelectBuilder({
          data: sampleRawPreference,
          error: null,
        }),
      );

      const result = await updateSchedulePreference({
        userId: "user-1",
        preferenceId: "pref-1",
        data: formData,
      });

      expect(schedulePreferencesTable.update).toHaveBeenCalledWith(
        expect.objectContaining({
          max_travel_distance_km: 20,
          location_note: "Close to downtown",
        }),
      );
      childTables.forEach((table) => {
        expect(mockSupabase[table].delete).toHaveBeenCalled();
        expect(mockSupabase[table].insert).toHaveBeenCalled();
      });
      expect(result.id).toBe("pref-1");
    });
  });

  describe("deleteSchedulePreference", () => {
    it("removes child records then deletes the preference", async () => {
      schedulePreferencesTable.delete.mockReturnValue(
        createDeleteBuilder({ error: null }),
      );

      await deleteSchedulePreference({
        userId: "user-1",
        preferenceId: "pref-1",
      });

      childTables.forEach((table) => {
        expect(mockSupabase[table].delete).toHaveBeenCalled();
      });
      expect(schedulePreferencesTable.delete).toHaveBeenCalled();
      const deleteBuilder = schedulePreferencesTable.delete.mock.results[0]
        .value;
      expect(deleteBuilder.eq).toHaveBeenNthCalledWith(1, "id", "pref-1");
      expect(deleteBuilder.eq).toHaveBeenNthCalledWith(2, "user_id", "user-1");
    });
  });
});


