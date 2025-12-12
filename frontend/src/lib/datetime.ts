import { format, parse } from "date-fns";

/**
 * Convert a datetime-local input value (YYYY-MM-DDTHH:mm) to an ISO string,
 * respecting the user's local timezone.
 */
export function datetimeLocalToIso(value: string): string {
  const parsed = parse(value, "yyyy-MM-dd'T'HH:mm", new Date());
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid datetime-local value");
  }
  return parsed.toISOString();
}

/**
 * Format a Date into the value expected by a datetime-local input.
 */
export function dateToDatetimeLocal(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

