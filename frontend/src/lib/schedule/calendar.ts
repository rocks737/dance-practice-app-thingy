/**
 * Calendar utilities for converting between database availability windows
 * and react-big-calendar Event objects.
 */

import { dateFnsLocalizer } from "react-big-calendar";
import { format } from "date-fns";
import { parse } from "date-fns";
import { startOfWeek } from "date-fns";
import { getDay } from "date-fns";
import { addDays } from "date-fns";
import { setHours } from "date-fns";
import { setMinutes } from "date-fns";
import { startOfDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import { AvailabilityWindow, DayOfWeek, DAY_OF_WEEK_VALUES } from "./types";

// Create custom startOfWeek that always starts on Sunday (weekStartsOn: 0)
const startOfWeekSunday = (date: Date) => startOfWeek(date, { weekStartsOn: 0 });

// Create and export the localizer
const locales = {
  "en-US": enUS,
};

export const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: startOfWeekSunday,
  getDay,
  locales,
});

// Map DayOfWeek enum to JS day index (0 = Sunday, 1 = Monday, etc.)
const DAY_INDEX_MAP: Record<DayOfWeek, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

// Reverse map for quick lookup
const INDEX_DAY_MAP: Record<number, DayOfWeek> = Object.fromEntries(
  Object.entries(DAY_INDEX_MAP).map(([day, idx]) => [idx, day as DayOfWeek]),
) as Record<number, DayOfWeek>;

/**
 * Gets the Sunday of the week containing the given date.
 * Returns a date set to midnight (start of day).
 */
export function getWeekStart(date: Date = new Date()): Date {
  const weekStart = startOfWeekSunday(date);
  return startOfDay(weekStart);
}

/**
 * Calendar event representing an availability window
 */
export interface AvailabilityEvent extends AvailabilityWindow {
  /**
   * Unique identifier for the event (derived from window properties)
   */
  id: string;
  /**
   * Start date/time as JS Date for calendar display
   */
  start: Date;
  /**
   * End date/time as JS Date for calendar display
   */
  end: Date;
  /**
   * Display title for the event
   */
  title: string;
}

/**
 * Converts a database availability window to a calendar event.
 * @param window - The availability window to convert
 * @param weekStart - The Sunday of the week to display (defaults to current week)
 */
export function windowToEvent(
  window: AvailabilityWindow,
  weekStart: Date = getWeekStart(),
): AvailabilityEvent {
  const dayIndex = DAY_INDEX_MAP[window.dayOfWeek];

  // Calculate the date for this day in the given week (Sunday = 0, Monday = 1, etc.)
  const dayDate = addDays(weekStart, dayIndex);

  // Parse HH:mm times
  const [startHour, startMinute] = window.startTime.split(":").map(Number);
  const [endHour, endMinute] = window.endTime.split(":").map(Number);

  // Create Date objects
  const start = setMinutes(setHours(dayDate, startHour), startMinute);
  const end = setMinutes(setHours(dayDate, endHour), endMinute);

  return {
    id: `${window.dayOfWeek}-${window.startTime}-${window.endTime}`,
    ...window,
    start,
    end,
    title: `${format(start, "h:mm a")} - ${format(end, "h:mm a")}`,
  };
}

/**
 * Converts a calendar event or date range to a database availability window
 */
export function eventToWindow(
  start: Date,
  end: Date,
  dayOfWeek?: DayOfWeek,
): AvailabilityWindow {
  const day = dayOfWeek ?? INDEX_DAY_MAP[start.getDay()];

  return {
    dayOfWeek: day,
    startTime: format(start, "HH:mm"),
    endTime: format(end, "HH:mm"),
  };
}

/**
 * Converts an array of availability windows to calendar events.
 * For recurring windows, only shows instances in the future or current week.
 * For one-time windows, only shows them in the week of their specific date.
 * @param windows - Array of availability windows to convert
 * @param weekStart - The Sunday of the week to display (defaults to current week)
 */
export function windowsToEvents(
  windows: AvailabilityWindow[],
  weekStart: Date = getWeekStart(),
): AvailabilityEvent[] {
  const now = new Date();
  const currentWeekStart = getWeekStart(now);
  
  return windows
    .filter((window) => {
      // For one-time windows, only show if their specificDate falls within this week
      if (window.recurring === false) {
        if (!window.specificDate) {
          // Invalid one-time window without specific date - skip it
          return false;
        }
        
        // Parse the specific date (YYYY-MM-DD format)
        const specificDate = new Date(window.specificDate);
        const specificDateStart = startOfDay(specificDate);
        
        // Check if the specific date falls within the current week being displayed
        const weekEnd = addDays(weekStart, 6);
        return specificDateStart >= weekStart && specificDateStart <= weekEnd;
      }
      
      // For recurring windows, only show them if they're in the current week or future
      // This prevents showing recurring blocks in past weeks
      return weekStart >= currentWeekStart;
    })
    .map((window) => windowToEvent(window, weekStart));
}

/**
 * Gets the display date range for the calendar (one week view).
 * @param date - A date within the week to display (defaults to current date)
 */
export function getCalendarDateRange(date: Date = new Date()): {
  start: Date;
  end: Date;
} {
  const weekStart = getWeekStart(date);
  return {
    start: weekStart,
    end: addDays(weekStart, 6),
  };
}

/**
 * Formats a time string in HH:mm format (24-hour)
 */
export function formatTime24(date: Date): string {
  return format(date, "HH:mm");
}

/**
 * Validates that a time window is at least the minimum duration
 */
export function isValidDuration(start: Date, end: Date, minMinutes = 15): boolean {
  const diffMs = end.getTime() - start.getTime();
  const diffMinutes = diffMs / (1000 * 60);
  return diffMinutes >= minMinutes;
}

/**
 * Rounds a date to the nearest 15-minute interval
 */
export function roundToQuarterHour(date: Date): Date {
  const minutes = date.getMinutes();
  const roundedMinutes = Math.round(minutes / 15) * 15;
  return setMinutes(date, roundedMinutes);
}
