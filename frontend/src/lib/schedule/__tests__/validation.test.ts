/**
 * Tests for schedule validation schemas
 */

import { availabilityWindowSchema, schedulePreferenceSchema } from "../validation";

describe("schedule/validation", () => {
  describe("availabilityWindowSchema", () => {
    it("should validate a valid recurring window", () => {
      const validWindow = {
        dayOfWeek: "MONDAY",
        startTime: "10:00",
        endTime: "12:00",
        recurring: true,
      };

      const result = availabilityWindowSchema.safeParse(validWindow);
      expect(result.success).toBe(true);
    });

    it("should validate a valid one-time window with specificDate", () => {
      const validWindow = {
        dayOfWeek: "FRIDAY",
        startTime: "14:00",
        endTime: "16:00",
        recurring: false,
        specificDate: "2025-12-15",
      };

      const result = availabilityWindowSchema.safeParse(validWindow);
      expect(result.success).toBe(true);
    });

    it("should default recurring to true when not provided", () => {
      const window = {
        dayOfWeek: "TUESDAY",
        startTime: "09:00",
        endTime: "11:00",
      };

      const result = availabilityWindowSchema.safeParse(window);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.recurring).toBe(true);
      }
    });

    it("should reject invalid dayOfWeek values", () => {
      const invalidWindow = {
        dayOfWeek: "INVALID_DAY",
        startTime: "10:00",
        endTime: "12:00",
      };

      const result = availabilityWindowSchema.safeParse(invalidWindow);
      expect(result.success).toBe(false);
    });

    it("should reject invalid startTime format", () => {
      const invalidWindow = {
        dayOfWeek: "MONDAY",
        startTime: "10:00:00", // Should be HH:mm, not HH:mm:ss
        endTime: "12:00",
      };

      const result = availabilityWindowSchema.safeParse(invalidWindow);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("HH:MM format");
      }
    });

    it("should reject invalid endTime format", () => {
      const invalidWindow = {
        dayOfWeek: "MONDAY",
        startTime: "10:00",
        endTime: "12pm", // Invalid format
      };

      const result = availabilityWindowSchema.safeParse(invalidWindow);
      expect(result.success).toBe(false);
    });

    it("should reject when startTime is after endTime", () => {
      const invalidWindow = {
        dayOfWeek: "MONDAY",
        startTime: "14:00",
        endTime: "12:00",
      };

      const result = availabilityWindowSchema.safeParse(invalidWindow);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Start time must be before end time");
      }
    });

    it("should reject when startTime equals endTime", () => {
      const invalidWindow = {
        dayOfWeek: "MONDAY",
        startTime: "10:00",
        endTime: "10:00",
      };

      const result = availabilityWindowSchema.safeParse(invalidWindow);
      expect(result.success).toBe(false);
    });

    it("should reject one-time window without specificDate", () => {
      const invalidWindow = {
        dayOfWeek: "MONDAY",
        startTime: "10:00",
        endTime: "12:00",
        recurring: false,
        // Missing specificDate
      };

      const result = availabilityWindowSchema.safeParse(invalidWindow);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Specific date is required for one-time availability"
        );
      }
    });

    it("should accept all valid day of week values", () => {
      const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

      days.forEach((day) => {
        const window = {
          dayOfWeek: day,
          startTime: "10:00",
          endTime: "12:00",
        };

        const result = availabilityWindowSchema.safeParse(window);
        expect(result.success).toBe(true);
      });
    });

    it("should accept edge case times (midnight, 23:59)", () => {
      const midnightWindow = {
        dayOfWeek: "MONDAY",
        startTime: "00:00",
        endTime: "01:00",
      };

      const lateNightWindow = {
        dayOfWeek: "MONDAY",
        startTime: "22:00",
        endTime: "23:59",
      };

      expect(availabilityWindowSchema.safeParse(midnightWindow).success).toBe(true);
      expect(availabilityWindowSchema.safeParse(lateNightWindow).success).toBe(true);
    });

    it("should reject times with invalid hour values", () => {
      const invalidWindow = {
        dayOfWeek: "MONDAY",
        startTime: "25:00", // Invalid hour
        endTime: "12:00",
      };

      const result = availabilityWindowSchema.safeParse(invalidWindow);
      expect(result.success).toBe(false);
    });

    it("should reject times with invalid minute values", () => {
      const invalidWindow = {
        dayOfWeek: "MONDAY",
        startTime: "10:60", // Invalid minutes
        endTime: "12:00",
      };

      const result = availabilityWindowSchema.safeParse(invalidWindow);
      expect(result.success).toBe(false);
    });
  });

  describe("schedulePreferenceSchema", () => {
    const validWindow = {
      dayOfWeek: "MONDAY",
      startTime: "10:00",
      endTime: "12:00",
      recurring: true,
    };

    it("should validate valid schedule preference", () => {
      const validPreference = {
        availabilityWindows: [validWindow],
        preferredRoles: ["LEAD"],
      };

      const result = schedulePreferenceSchema.safeParse(validPreference);
      expect(result.success).toBe(true);
    });

    it("should require at least one availability window", () => {
      const invalidPreference = {
        availabilityWindows: [],
        preferredRoles: ["LEAD"],
      };

      const result = schedulePreferenceSchema.safeParse(invalidPreference);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Add at least one availability window");
      }
    });

    it("should require at least one preferred role", () => {
      const invalidPreference = {
        availabilityWindows: [validWindow],
        preferredRoles: [],
      };

      const result = schedulePreferenceSchema.safeParse(invalidPreference);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Select at least one role");
      }
    });

    it("should accept multiple preferred roles", () => {
      const validPreference = {
        availabilityWindows: [validWindow],
        preferredRoles: ["LEAD", "FOLLOW"],
      };

      const result = schedulePreferenceSchema.safeParse(validPreference);
      expect(result.success).toBe(true);
    });

    it("should accept preferred levels", () => {
      const validPreference = {
        availabilityWindows: [validWindow],
        preferredRoles: ["LEAD"],
        preferredLevels: ["NEWCOMER", "NOVICE", "INTERMEDIATE"],
      };

      const result = schedulePreferenceSchema.safeParse(validPreference);
      expect(result.success).toBe(true);
    });

    it("should accept preferred focus areas", () => {
      const validPreference = {
        availabilityWindows: [validWindow],
        preferredRoles: ["LEAD"],
        preferredFocusAreas: ["TECHNIQUE", "MUSICALITY"],
      };

      const result = schedulePreferenceSchema.safeParse(validPreference);
      expect(result.success).toBe(true);
    });

    it("should accept valid preferred location IDs (UUIDs)", () => {
      const validPreference = {
        availabilityWindows: [validWindow],
        preferredRoles: ["LEAD"],
        preferredLocationIds: [
          "550e8400-e29b-41d4-a716-446655440000",
          "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
        ],
      };

      const result = schedulePreferenceSchema.safeParse(validPreference);
      expect(result.success).toBe(true);
    });

    it("should reject invalid location IDs (non-UUIDs)", () => {
      const invalidPreference = {
        availabilityWindows: [validWindow],
        preferredRoles: ["LEAD"],
        preferredLocationIds: ["not-a-uuid"],
      };

      const result = schedulePreferenceSchema.safeParse(invalidPreference);
      expect(result.success).toBe(false);
    });

    it("should limit preferred locations to 10", () => {
      // Generate 11 valid UUIDs
      const validUuids = [
        "550e8400-e29b-41d4-a716-446655440000",
        "550e8400-e29b-41d4-a716-446655440001",
        "550e8400-e29b-41d4-a716-446655440002",
        "550e8400-e29b-41d4-a716-446655440003",
        "550e8400-e29b-41d4-a716-446655440004",
        "550e8400-e29b-41d4-a716-446655440005",
        "550e8400-e29b-41d4-a716-446655440006",
        "550e8400-e29b-41d4-a716-446655440007",
        "550e8400-e29b-41d4-a716-446655440008",
        "550e8400-e29b-41d4-a716-446655440009",
        "550e8400-e29b-41d4-a716-44665544000a",
      ];
      const invalidPreference = {
        availabilityWindows: [validWindow],
        preferredRoles: ["LEAD"],
        preferredLocationIds: validUuids,
      };

      const result = schedulePreferenceSchema.safeParse(invalidPreference);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("You can select up to 10 preferred locations");
      }
    });

    it("should accept valid maxTravelDistanceKm", () => {
      const validPreference = {
        availabilityWindows: [validWindow],
        preferredRoles: ["LEAD"],
        maxTravelDistanceKm: 50,
      };

      const result = schedulePreferenceSchema.safeParse(validPreference);
      expect(result.success).toBe(true);
    });

    it("should reject negative maxTravelDistanceKm", () => {
      const invalidPreference = {
        availabilityWindows: [validWindow],
        preferredRoles: ["LEAD"],
        maxTravelDistanceKm: -10,
      };

      const result = schedulePreferenceSchema.safeParse(invalidPreference);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Travel distance cannot be negative");
      }
    });

    it("should reject maxTravelDistanceKm over 500", () => {
      const invalidPreference = {
        availabilityWindows: [validWindow],
        preferredRoles: ["LEAD"],
        maxTravelDistanceKm: 600,
      };

      const result = schedulePreferenceSchema.safeParse(invalidPreference);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("max 500km");
      }
    });

    it("should accept null maxTravelDistanceKm", () => {
      const validPreference = {
        availabilityWindows: [validWindow],
        preferredRoles: ["LEAD"],
        maxTravelDistanceKm: null,
      };

      const result = schedulePreferenceSchema.safeParse(validPreference);
      expect(result.success).toBe(true);
    });

    it("should enforce locationNote max length of 255 characters", () => {
      const invalidPreference = {
        availabilityWindows: [validWindow],
        preferredRoles: ["LEAD"],
        locationNote: "a".repeat(256),
      };

      const result = schedulePreferenceSchema.safeParse(invalidPreference);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("255 characters");
      }
    });

    it("should enforce notes max length of 1000 characters", () => {
      const invalidPreference = {
        availabilityWindows: [validWindow],
        preferredRoles: ["LEAD"],
        notes: "a".repeat(1001),
      };

      const result = schedulePreferenceSchema.safeParse(invalidPreference);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("1000 characters");
      }
    });

    it("should accept valid notes within character limit", () => {
      const validPreference = {
        availabilityWindows: [validWindow],
        preferredRoles: ["LEAD"],
        notes: "I prefer practicing in the evening and enjoy working on musicality.",
      };

      const result = schedulePreferenceSchema.safeParse(validPreference);
      expect(result.success).toBe(true);
    });

    it("should default empty arrays for optional array fields", () => {
      const minimalPreference = {
        availabilityWindows: [validWindow],
        preferredRoles: ["LEAD"],
      };

      const result = schedulePreferenceSchema.safeParse(minimalPreference);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.preferredLevels).toEqual([]);
        expect(result.data.preferredFocusAreas).toEqual([]);
        expect(result.data.preferredLocationIds).toEqual([]);
      }
    });
  });
});
