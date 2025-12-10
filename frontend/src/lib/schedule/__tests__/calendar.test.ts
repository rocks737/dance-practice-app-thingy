import { describe, it, expect } from "@jest/globals";
import {
  windowToEvent,
  eventToWindow,
  windowsToEvents,
  isValidDuration,
  roundToQuarterHour,
  getWeekStart,
} from "../calendar";
import { AvailabilityWindow } from "../types";
import { addDays, setHours, setMinutes } from "date-fns";

describe("calendar utilities", () => {
  describe("windowToEvent", () => {
    it("should convert a recurring window to an event", () => {
      const window: AvailabilityWindow = {
        dayOfWeek: "MONDAY",
        startTime: "10:00",
        endTime: "12:00",
        recurring: true,
      };

      // Use Jan 5, 2025 noon as Sunday (week start)
      const weekStart = new Date("2025-01-05T12:00:00");
      const event = windowToEvent(window, weekStart);

    expect(event.dayOfWeek).toBe("MONDAY");
    expect(event.startTime).toBe("10:00");
    expect(event.endTime).toBe("12:00");
    expect(event.recurring).toBe(true);
    expect(event.title).toBe("10:00 AM - 12:00 PM");
    expect(event.start.getDay()).toBe(1); // Monday
    expect(event.start.getHours()).toBe(10);
    expect(event.end.getHours()).toBe(12);
    });

    it("should convert a one-time window to an event", () => {
      const window: AvailabilityWindow = {
        dayOfWeek: "FRIDAY",
        startTime: "18:00",
        endTime: "20:00",
        recurring: false,
        specificDate: "2025-01-10",
      };

      const weekStart = new Date("2025-01-05T12:00:00");
      const event = windowToEvent(window, weekStart);

      expect(event.recurring).toBe(false);
      expect(event.specificDate).toBe("2025-01-10");
      expect(event.start.getDay()).toBe(5); // Friday
    });

    it("should handle different days of the week", () => {
      const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const;
      const weekStart = new Date("2025-01-05T12:00:00"); // Sunday

      days.forEach((day, index) => {
        const window: AvailabilityWindow = {
          dayOfWeek: day,
          startTime: "09:00",
          endTime: "10:00",
        };

        const event = windowToEvent(window, weekStart);
        expect(event.start.getDay()).toBe(index);
      });
    });
  });

  describe("eventToWindow", () => {
    it("should convert dates to an availability window", () => {
      const start = new Date("2025-01-06T10:00:00"); // Monday
      const end = new Date("2025-01-06T12:00:00");

      const window = eventToWindow(start, end);

      expect(window.dayOfWeek).toBe("MONDAY");
      expect(window.startTime).toBe("10:00");
      expect(window.endTime).toBe("12:00");
    });

    it("should handle custom day of week parameter", () => {
      const start = new Date("2025-01-06T10:00:00");
      const end = new Date("2025-01-06T12:00:00");

      const window = eventToWindow(start, end, "FRIDAY");

      expect(window.dayOfWeek).toBe("FRIDAY");
    });
  });

  describe("windowsToEvents", () => {
    it("should convert multiple windows to events for current/future weeks", () => {
      // Use dates far in the future to avoid date-sensitivity issues
      // Calculate a future Wednesday date dynamically
      const now = new Date();
      const futureDate = new Date(now);
      futureDate.setFullYear(futureDate.getFullYear() + 1); // 1 year from now
      
      // Find the next Sunday (week start)
      const dayOfWeek = futureDate.getDay();
      const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
      futureDate.setDate(futureDate.getDate() + daysUntilSunday);
      futureDate.setHours(0, 0, 0, 0);
      
      const weekStart = futureDate;
      
      // Calculate the Wednesday of that week for the one-time event
      const wednesday = new Date(weekStart);
      wednesday.setDate(wednesday.getDate() + 3); // Sunday + 3 = Wednesday
      const specificDate = wednesday.toISOString().split("T")[0]; // YYYY-MM-DD format
      
      const windows: AvailabilityWindow[] = [
        { dayOfWeek: "MONDAY", startTime: "10:00", endTime: "12:00", recurring: true },
        { dayOfWeek: "WEDNESDAY", startTime: "14:00", endTime: "16:00", recurring: false, specificDate },
      ];

      const events = windowsToEvents(windows, weekStart);

      // Should have both: 1 recurring + 1 one-time
      expect(events).toHaveLength(2);
      expect(events[0].dayOfWeek).toBe("MONDAY");
      expect(events[0].recurring).toBe(true);
      expect(events[1].dayOfWeek).toBe("WEDNESDAY");
      expect(events[1].recurring).toBe(false);
    });
    
    it("should filter out recurring windows from past weeks", () => {
      const windows: AvailabilityWindow[] = [
        { dayOfWeek: "MONDAY", startTime: "10:00", endTime: "12:00", recurring: true },
      ];

      // Use a week clearly in the past (2020)
      const pastWeekStart = new Date("2020-01-05T12:00:00");
      const events = windowsToEvents(windows, pastWeekStart);

      // Recurring windows should not show in past weeks
      expect(events).toHaveLength(0);
    });
  });

  describe("isValidDuration", () => {
    it("should return true for valid durations", () => {
      const start = new Date("2025-01-06T10:00:00");
      const end = new Date("2025-01-06T10:15:00");

      expect(isValidDuration(start, end, 15)).toBe(true);
    });

    it("should return false for too-short durations", () => {
      const start = new Date("2025-01-06T10:00:00");
      const end = new Date("2025-01-06T10:10:00");

      expect(isValidDuration(start, end, 15)).toBe(false);
    });

    it("should handle custom minimum durations", () => {
      const start = new Date("2025-01-06T10:00:00");
      const end = new Date("2025-01-06T10:30:00");

      expect(isValidDuration(start, end, 30)).toBe(true);
      expect(isValidDuration(start, end, 60)).toBe(false);
    });
  });

  describe("roundToQuarterHour", () => {
    it("should round to nearest 15 minutes", () => {
      const date1 = new Date("2025-01-06T10:07:00");
      const rounded1 = roundToQuarterHour(date1);
      expect(rounded1.getMinutes()).toBe(0);

      const date2 = new Date("2025-01-06T10:08:00");
      const rounded2 = roundToQuarterHour(date2);
      expect(rounded2.getMinutes()).toBe(15);

      const date3 = new Date("2025-01-06T10:23:00");
      const rounded3 = roundToQuarterHour(date3);
      expect(rounded3.getMinutes()).toBe(30);

      const date4 = new Date("2025-01-06T10:38:00");
      const rounded4 = roundToQuarterHour(date4);
      expect(rounded4.getMinutes()).toBe(45);
    });

    it("should not change times already on quarter hours", () => {
      const date = new Date("2025-01-06T10:15:00");
      const rounded = roundToQuarterHour(date);
      expect(rounded.getMinutes()).toBe(15);
    });
  });

  describe("getWeekStart", () => {
    it("should return Sunday of the current week", () => {
      const date = new Date("2025-01-08T12:00:00"); // Wednesday
      const weekStart = getWeekStart(date);

      expect(weekStart.getDay()).toBe(0); // Sunday
      expect(weekStart.getHours()).toBe(0);
      expect(weekStart.getMinutes()).toBe(0);
    });

    it("should return same date if already Sunday", () => {
      const date = new Date("2025-01-05T12:00:00"); // Sunday
      const weekStart = getWeekStart(date);

      expect(weekStart.getDay()).toBe(0);
      expect(weekStart.getDate()).toBe(5);
    });
  });
});
