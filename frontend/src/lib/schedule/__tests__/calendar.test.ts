import { describe, it, expect } from "@jest/globals";
import {
  windowToEvent,
  eventToWindow,
  windowsToEvents,
  isValidDuration,
  roundToQuarterHour,
} from "../calendar";
import type { AvailabilityWindow } from "../types";

describe("calendar utilities", () => {
  describe("windowToEvent", () => {
    it("converts a Monday window correctly", () => {
      const window: AvailabilityWindow = {
        dayOfWeek: "MONDAY",
        startTime: "18:00",
        endTime: "20:00",
      };

      const event = windowToEvent(window);

      expect(event.dayOfWeek).toBe("MONDAY");
      expect(event.startTime).toBe("18:00");
      expect(event.endTime).toBe("20:00");
      expect(event.title).toBe("18:00 - 20:00");
      expect(event.start).toBeInstanceOf(Date);
      expect(event.end).toBeInstanceOf(Date);
      expect(event.start.getHours()).toBe(18);
      expect(event.start.getMinutes()).toBe(0);
      expect(event.end.getHours()).toBe(20);
      expect(event.end.getMinutes()).toBe(0);
    });

    it("handles Sunday correctly", () => {
      const window: AvailabilityWindow = {
        dayOfWeek: "SUNDAY",
        startTime: "10:30",
        endTime: "12:45",
      };

      const event = windowToEvent(window);

      expect(event.dayOfWeek).toBe("SUNDAY");
      expect(event.start.getHours()).toBe(10);
      expect(event.start.getMinutes()).toBe(30);
      expect(event.end.getHours()).toBe(12);
      expect(event.end.getMinutes()).toBe(45);
    });
  });

  describe("eventToWindow", () => {
    it("converts Date objects to a window", () => {
      const start = new Date(2024, 0, 1, 18, 0); // Monday
      const end = new Date(2024, 0, 1, 20, 0);

      const window = eventToWindow(start, end);

      expect(window.dayOfWeek).toBe("MONDAY");
      expect(window.startTime).toBe("18:00");
      expect(window.endTime).toBe("20:00");
    });

    it("handles custom day of week override", () => {
      const start = new Date(2024, 0, 1, 18, 0);
      const end = new Date(2024, 0, 1, 20, 0);

      const window = eventToWindow(start, end, "FRIDAY");

      expect(window.dayOfWeek).toBe("FRIDAY");
    });
  });

  describe("windowsToEvents", () => {
    it("converts an array of windows", () => {
      const windows: AvailabilityWindow[] = [
        { dayOfWeek: "MONDAY", startTime: "18:00", endTime: "20:00" },
        { dayOfWeek: "WEDNESDAY", startTime: "19:00", endTime: "21:00" },
      ];

      const events = windowsToEvents(windows);

      expect(events).toHaveLength(2);
      expect(events[0].dayOfWeek).toBe("MONDAY");
      expect(events[1].dayOfWeek).toBe("WEDNESDAY");
    });
  });

  describe("isValidDuration", () => {
    it("returns true for 15 minute duration", () => {
      const start = new Date(2024, 0, 1, 18, 0);
      const end = new Date(2024, 0, 1, 18, 15);

      expect(isValidDuration(start, end, 15)).toBe(true);
    });

    it("returns false for duration less than minimum", () => {
      const start = new Date(2024, 0, 1, 18, 0);
      const end = new Date(2024, 0, 1, 18, 10);

      expect(isValidDuration(start, end, 15)).toBe(false);
    });

    it("returns true for 1 hour duration", () => {
      const start = new Date(2024, 0, 1, 18, 0);
      const end = new Date(2024, 0, 1, 19, 0);

      expect(isValidDuration(start, end, 15)).toBe(true);
    });
  });

  describe("roundToQuarterHour", () => {
    it("rounds down to nearest 15 minutes", () => {
      const date = new Date(2024, 0, 1, 18, 7);
      const rounded = roundToQuarterHour(date);

      expect(rounded.getHours()).toBe(18);
      expect(rounded.getMinutes()).toBe(0);
    });

    it("rounds up to nearest 15 minutes", () => {
      const date = new Date(2024, 0, 1, 18, 8);
      const rounded = roundToQuarterHour(date);

      expect(rounded.getHours()).toBe(18);
      expect(rounded.getMinutes()).toBe(15);
    });

    it("keeps exact 15-minute intervals unchanged", () => {
      const date = new Date(2024, 0, 1, 18, 30);
      const rounded = roundToQuarterHour(date);

      expect(rounded.getHours()).toBe(18);
      expect(rounded.getMinutes()).toBe(30);
    });
  });
});

