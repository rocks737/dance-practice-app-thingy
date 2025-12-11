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
  // Validate input
  if (!window || !window.dayOfWeek || !window.startTime || !window.endTime) {
    throw new Error("Invalid window: missing required properties");
  }
  
  const dayIndex = DAY_INDEX_MAP[window.dayOfWeek];
  
  if (dayIndex === undefined) {
    throw new Error(`Invalid dayOfWeek: ${window.dayOfWeek}`);
  }

  // Calculate the date for this day in the given week (Sunday = 0, Monday = 1, etc.)
  const dayDate = addDays(weekStart, dayIndex);

  // Parse HH:mm times with validation
  const startParts = window.startTime.split(":");
  const endParts = window.endTime.split(":");
  
  if (startParts.length !== 2 || endParts.length !== 2) {
    throw new Error(`Invalid time format: ${window.startTime} or ${window.endTime}`);
  }
  
  const [startHour, startMinute] = startParts.map(Number);
  const [endHour, endMinute] = endParts.map(Number);
  
  if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
    throw new Error(`Invalid time values: ${window.startTime} or ${window.endTime}`);
  }

  // Create Date objects
  const start = setMinutes(setHours(dayDate, startHour), startMinute);
  const end = setMinutes(setHours(dayDate, endHour), endMinute);

  const title = `${format(start, "h:mm a")} - ${format(end, "h:mm a")}`;
  const id = window.recurring !== false
    ? `recurring-${window.dayOfWeek}-${window.startTime}-${window.endTime}`
    : `onetime-${window.specificDate}-${window.startTime}-${window.endTime}`;

  return {
    id,
    dayOfWeek: window.dayOfWeek,
    startTime: window.startTime,
    endTime: window.endTime,
    recurring: window.recurring,
    specificDate: window.specificDate,
    start,
    end,
    title,
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
  console.log("[windowsToEvents] Input windows:", windows?.length || 0);
  console.log("[windowsToEvents] Week start:", weekStart);
  
  if (!windows || !Array.isArray(windows)) {
    console.warn("[windowsToEvents] Invalid windows array:", windows);
    return [];
  }
  
  const now = new Date();
  const currentWeekStart = getWeekStart(now);
  
  const filtered = windows.filter((window) => {
      // Validate required window properties
      if (!window || !window.dayOfWeek || !window.startTime || !window.endTime) {
        console.warn("Invalid window - missing required properties:", window);
        return false;
      }
      
      // For one-time windows, only show if their specificDate falls within this week
      if (window.recurring === false) {
        if (!window.specificDate) {
          // Invalid one-time window without specific date - log warning
          console.warn(
            `Invalid one-time window missing specificDate:`,
            window
          );
          return false;
        }
        
        // Parse the specific date (YYYY-MM-DD format)
        const specificDate = new Date(window.specificDate);
        const specificDateStart = startOfDay(specificDate);
        
        // Check if the specific date falls within the current week being displayed
        const weekEnd = addDays(weekStart, 6);
        return specificDateStart >= weekStart && specificDateStart <= weekEnd;
      }
      
      // For recurring windows, always show them for the displayed week
      return true;
    });
  
  console.log("[windowsToEvents] After filter:", filtered.length);
  
  const mapped = filtered.map((window) => {
      try {
        const event = windowToEvent(window, weekStart);
        console.log("[windowsToEvents] Generated event:", event?.id, event?.title);
        return event;
      } catch (error) {
        console.error("Error converting window to event:", window, error);
        return null;
      }
    });
  
  const result = mapped.filter((event): event is AvailabilityEvent => {
    const isValid = event !== null && event !== undefined;
    if (!isValid) {
      console.warn("[windowsToEvents] Filtered out null/undefined event");
    }
    return isValid;
  });
  
  console.log("[windowsToEvents] Final events:", result.length, result);
  
  return result;
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
