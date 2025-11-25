import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import {
  windowToEvent,
  eventToWindow,
  windowsToEvents,
  isValidDuration,
  roundToQuarterHour,
  getWeekStart,
  getCalendarDateRange,
} from "../calendar";
import type { AvailabilityWindow } from "../types";
import { addDays, startOfWeek } from "date-fns";

describe("calendar utilities", () => {
  // Use a fixed date for testing to avoid flaky tests
  const fixedTestDate = new Date(2024, 0, 15, 12, 0, 0); // Monday, Jan 15, 2024

  describe("getWeekStart", () => {
    it("returns Sunday for a Monday", () => {
      const monday = new Date(2024, 0, 15, 12, 0, 0); // Monday, Jan 15, 2024
      const weekStart = getWeekStart(monday);

      expect(weekStart.getDay()).toBe(0); // Sunday
      expect(weekStart.getHours()).toBe(0);
      expect(weekStart.getMinutes()).toBe(0);
    });

    it("returns Sunday for a Sunday", () => {
      const sunday = new Date(2024, 0, 14, 12, 0, 0); // Sunday, Jan 14, 2024
      const weekStart = getWeekStart(sunday);

      expect(weekStart.getDay()).toBe(0); // Sunday
      expect(weekStart.getDate()).toBe(14);
    });

    it("returns Sunday for a Saturday", () => {
      const saturday = new Date(2024, 0, 20, 12, 0, 0); // Saturday, Jan 20, 2024
      const weekStart = getWeekStart(saturday);

      expect(weekStart.getDay()).toBe(0); // Sunday
      expect(weekStart.getDate()).toBe(14); // Jan 14 (Sunday of that week)
    });

    it("defaults to current date if no argument provided", () => {
      const weekStart = getWeekStart();
      expect(weekStart.getDay()).toBe(0); // Always returns a Sunday
      expect(weekStart.getHours()).toBe(0);
      expect(weekStart.getMinutes()).toBe(0);
    });

    it("resets time to midnight", () => {
      const dateWithTime = new Date(2024, 0, 15, 14, 30, 45);
      const weekStart = getWeekStart(dateWithTime);

      expect(weekStart.getHours()).toBe(0);
      expect(weekStart.getMinutes()).toBe(0);
      expect(weekStart.getSeconds()).toBe(0);
      expect(weekStart.getMilliseconds()).toBe(0);
    });
  });

  describe("getCalendarDateRange", () => {
    it("returns week range starting from Sunday", () => {
      const monday = new Date(2024, 0, 15, 12, 0, 0); // Monday, Jan 15, 2024
      const range = getCalendarDateRange(monday);

      expect(range.start.getDay()).toBe(0); // Sunday
      expect(range.end.getDay()).toBe(6); // Saturday
      expect(range.start.getDate()).toBe(14); // Jan 14 (Sunday)
      expect(range.end.getDate()).toBe(20); // Jan 20 (Saturday)
    });

    it("defaults to current week if no argument provided", () => {
      const range = getCalendarDateRange();
      expect(range.start.getDay()).toBe(0); // Sunday
      expect(range.end.getDay()).toBe(6); // Saturday
    });
  });

  describe("windowToEvent", () => {
    it("converts a Monday window correctly with default week", () => {
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

    it("converts a window with custom week start", () => {
      const weekStart = new Date(2024, 0, 14, 0, 0, 0); // Sunday, Jan 14, 2024
      const window: AvailabilityWindow = {
        dayOfWeek: "MONDAY",
        startTime: "18:00",
        endTime: "20:00",
      };

      const event = windowToEvent(window, weekStart);

      expect(event.start.getDate()).toBe(15); // Monday, Jan 15
      expect(event.start.getHours()).toBe(18);
      expect(event.start.getMinutes()).toBe(0);
    });

    it("handles Sunday correctly", () => {
      const weekStart = new Date(2024, 0, 14, 0, 0, 0); // Sunday, Jan 14, 2024
      const window: AvailabilityWindow = {
        dayOfWeek: "SUNDAY",
        startTime: "10:30",
        endTime: "12:45",
      };

      const event = windowToEvent(window, weekStart);

      expect(event.dayOfWeek).toBe("SUNDAY");
      expect(event.start.getDate()).toBe(14); // Sunday, Jan 14
      expect(event.start.getHours()).toBe(10);
      expect(event.start.getMinutes()).toBe(30);
      expect(event.end.getHours()).toBe(12);
      expect(event.end.getMinutes()).toBe(45);
    });

    it("handles Saturday correctly", () => {
      const weekStart = new Date(2024, 0, 14, 0, 0, 0); // Sunday, Jan 14, 2024
      const window: AvailabilityWindow = {
        dayOfWeek: "SATURDAY",
        startTime: "14:00",
        endTime: "16:00",
      };

      const event = windowToEvent(window, weekStart);

      expect(event.dayOfWeek).toBe("SATURDAY");
      expect(event.start.getDate()).toBe(20); // Saturday, Jan 20
      expect(event.start.getHours()).toBe(14);
      expect(event.end.getHours()).toBe(16);
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
    it("converts an array of windows with default week", () => {
      const windows: AvailabilityWindow[] = [
        { dayOfWeek: "MONDAY", startTime: "18:00", endTime: "20:00" },
        { dayOfWeek: "WEDNESDAY", startTime: "19:00", endTime: "21:00" },
      ];

      const events = windowsToEvents(windows);

      expect(events).toHaveLength(2);
      expect(events[0].dayOfWeek).toBe("MONDAY");
      expect(events[1].dayOfWeek).toBe("WEDNESDAY");
    });

    it("converts an array of windows with custom week start", () => {
      const weekStart = new Date(2024, 0, 14, 0, 0, 0); // Sunday, Jan 14, 2024
      const windows: AvailabilityWindow[] = [
        { dayOfWeek: "MONDAY", startTime: "18:00", endTime: "20:00" },
        { dayOfWeek: "WEDNESDAY", startTime: "19:00", endTime: "21:00" },
      ];

      const events = windowsToEvents(windows, weekStart);

      expect(events).toHaveLength(2);
      expect(events[0].dayOfWeek).toBe("MONDAY");
      expect(events[0].start.getDate()).toBe(15); // Monday, Jan 15
      expect(events[1].dayOfWeek).toBe("WEDNESDAY");
      expect(events[1].start.getDate()).toBe(17); // Wednesday, Jan 17
    });

    it("preserves event IDs across different weeks", () => {
      const weekStart1 = new Date(2024, 0, 14, 0, 0, 0); // Week of Jan 14
      const weekStart2 = new Date(2024, 0, 21, 0, 0, 0); // Week of Jan 21
      const window: AvailabilityWindow = {
        dayOfWeek: "MONDAY",
        startTime: "18:00",
        endTime: "20:00",
      };

      const event1 = windowsToEvents([window], weekStart1)[0];
      const event2 = windowsToEvents([window], weekStart2)[0];

      // IDs should be the same (based on day/time, not date)
      expect(event1.id).toBe(event2.id);
      // But dates should be different
      expect(event1.start.getDate()).not.toBe(event2.start.getDate());
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

  describe("week consistency", () => {
    it("always returns Sunday for week start regardless of input day", () => {
      const daysOfWeek = [
        new Date(2024, 0, 14, 12, 0, 0), // Sunday
        new Date(2024, 0, 15, 12, 0, 0), // Monday
        new Date(2024, 0, 16, 12, 0, 0), // Tuesday
        new Date(2024, 0, 17, 12, 0, 0), // Wednesday
        new Date(2024, 0, 18, 12, 0, 0), // Thursday
        new Date(2024, 0, 19, 12, 0, 0), // Friday
        new Date(2024, 0, 20, 12, 0, 0), // Saturday
      ];

      daysOfWeek.forEach((date) => {
        const weekStart = getWeekStart(date);
        expect(weekStart.getDay()).toBe(0); // Always Sunday
      });
    });

    it("maintains consistent week boundaries across different weeks", () => {
      const week1 = new Date(2024, 0, 15, 12, 0, 0); // Monday, Jan 15
      const week2 = new Date(2024, 0, 22, 12, 0, 0); // Monday, Jan 22

      const start1 = getWeekStart(week1);
      const start2 = getWeekStart(week2);

      // Should be exactly 7 days apart
      const diffDays = Math.round(
        (start2.getTime() - start1.getTime()) / (1000 * 60 * 60 * 24),
      );
      expect(diffDays).toBe(7);
    });

    it("handles year boundaries correctly", () => {
      const dec31 = new Date(2023, 11, 31, 12, 0, 0); // Sunday, Dec 31, 2023
      const jan1 = new Date(2024, 0, 1, 12, 0, 0); // Monday, Jan 1, 2024

      const weekStartDec = getWeekStart(dec31);
      const weekStartJan = getWeekStart(jan1);

      expect(weekStartDec.getFullYear()).toBe(2023);
      expect(weekStartDec.getMonth()).toBe(11); // December
      expect(weekStartDec.getDate()).toBe(31);

      expect(weekStartJan.getFullYear()).toBe(2023);
      expect(weekStartJan.getMonth()).toBe(11); // December
      expect(weekStartJan.getDate()).toBe(31); // Same Sunday
    });
  });

  describe("event date mapping across weeks", () => {
    it("maps same day-of-week to different dates in different weeks", () => {
      const window: AvailabilityWindow = {
        dayOfWeek: "WEDNESDAY",
        startTime: "19:00",
        endTime: "21:00",
      };

      const week1Start = new Date(2024, 0, 14, 0, 0, 0); // Sunday, Jan 14
      const week2Start = new Date(2024, 0, 21, 0, 0, 0); // Sunday, Jan 21

      const event1 = windowToEvent(window, week1Start);
      const event2 = windowToEvent(window, week2Start);

      // Same day of week, same time
      expect(event1.dayOfWeek).toBe(event2.dayOfWeek);
      expect(event1.startTime).toBe(event2.startTime);
      expect(event1.endTime).toBe(event2.endTime);

      // But different actual dates
      expect(event1.start.getDate()).toBe(17); // Wednesday, Jan 17
      expect(event2.start.getDate()).toBe(24); // Wednesday, Jan 24
    });

    it("preserves event structure when week changes", () => {
      const windows: AvailabilityWindow[] = [
        { dayOfWeek: "MONDAY", startTime: "18:00", endTime: "20:00" },
        { dayOfWeek: "FRIDAY", startTime: "19:00", endTime: "21:00" },
      ];

      const week1Start = new Date(2024, 0, 14, 0, 0, 0);
      const week2Start = new Date(2024, 0, 21, 0, 0, 0);

      const events1 = windowsToEvents(windows, week1Start);
      const events2 = windowsToEvents(windows, week2Start);

      expect(events1.length).toBe(events2.length);
      expect(events1[0].id).toBe(events2[0].id); // Same ID
      expect(events1[1].id).toBe(events2[1].id); // Same ID

      // But dates are different
      expect(events1[0].start.getDate()).not.toBe(events2[0].start.getDate());
      expect(events1[1].start.getDate()).not.toBe(events2[1].start.getDate());
    });
  });
});
