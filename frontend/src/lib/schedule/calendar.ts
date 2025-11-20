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
import enUS from "date-fns/locale/en-US";
import { AvailabilityWindow, DayOfWeek, DAY_OF_WEEK_VALUES } from "./types";

// Create and export the localizer
const locales = {
  "en-US": enUS,
};

export const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
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
  Object.entries(DAY_INDEX_MAP).map(([day, idx]) => [idx, day as DayOfWeek])
) as Record<number, DayOfWeek>;

/**
 * Reference week anchor. We use a fixed week for consistent calendar display.
 * This anchors to the week starting Sunday, Dec 31, 2023.
 */
const REFERENCE_WEEK_START = new Date(2023, 11, 31); // Dec 31, 2023 is a Sunday

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
 * Converts a database availability window to a calendar event
 */
export function windowToEvent(window: AvailabilityWindow): AvailabilityEvent {
  const dayIndex = DAY_INDEX_MAP[window.dayOfWeek];
  
  // Calculate the date for this day in the reference week (Sunday = 0, Monday = 1, etc.)
  const dayDate = addDays(REFERENCE_WEEK_START, dayIndex);
  
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
    title: `${window.startTime} - ${window.endTime}`,
  };
}

/**
 * Converts a calendar event or date range to a database availability window
 */
export function eventToWindow(
  start: Date,
  end: Date,
  dayOfWeek?: DayOfWeek
): AvailabilityWindow {
  const day = dayOfWeek ?? INDEX_DAY_MAP[start.getDay()];
  
  return {
    dayOfWeek: day,
    startTime: format(start, "HH:mm"),
    endTime: format(end, "HH:mm"),
  };
}

/**
 * Converts an array of availability windows to calendar events
 */
export function windowsToEvents(windows: AvailabilityWindow[]): AvailabilityEvent[] {
  return windows.map(windowToEvent);
}

/**
 * Gets the display date range for the calendar (one week view)
 */
export function getCalendarDateRange(): { start: Date; end: Date } {
  return {
    start: REFERENCE_WEEK_START,
    end: addDays(REFERENCE_WEEK_START, 6),
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

