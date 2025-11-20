import { z } from "zod";
import {
  DAY_OF_WEEK_VALUES,
  FOCUS_AREA_VALUES,
  PREFERRED_ROLE_VALUES,
  WSDC_SKILL_LEVEL_VALUES,
} from "./types";

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

const dayOfWeekEnum = z.enum(DAY_OF_WEEK_VALUES);
const preferredRoleEnum = z.enum(PREFERRED_ROLE_VALUES);
const wsdcLevelEnum = z.enum(WSDC_SKILL_LEVEL_VALUES);
const focusAreaEnum = z.enum(FOCUS_AREA_VALUES);

export const availabilityWindowSchema = z
  .object({
    dayOfWeek: dayOfWeekEnum,
    startTime: z
      .string()
      .regex(timePattern, "Start time must be in HH:MM format"),
    endTime: z
      .string()
      .regex(timePattern, "End time must be in HH:MM format"),
  })
  .refine(
    (window) => window.startTime < window.endTime,
    {
      message: "Start time must be before end time",
      path: ["endTime"],
    },
  );

export const schedulePreferenceSchema = z.object({
  availabilityWindows: z
    .array(availabilityWindowSchema)
    .min(1, "Add at least one availability window"),
  preferredRoles: z
    .array(preferredRoleEnum)
    .min(1, "Select at least one role")
    .max(PREFERRED_ROLE_VALUES.length),
  preferredLevels: z
    .array(wsdcLevelEnum)
    .max(WSDC_SKILL_LEVEL_VALUES.length)
    .optional()
    .default([]),
  preferredFocusAreas: z
    .array(focusAreaEnum)
    .max(FOCUS_AREA_VALUES.length)
    .optional()
    .default([]),
  preferredLocationIds: z
    .array(z.string().uuid())
    .max(10, "You can select up to 10 preferred locations")
    .optional()
    .default([]),
  maxTravelDistanceKm: z
    .number()
    .int()
    .min(0, "Travel distance cannot be negative")
    .max(500, "Travel distance seems too large (max 500km)")
    .nullable()
    .optional(),
  locationNote: z
    .string()
    .max(255, "Location note must be 255 characters or less")
    .nullable()
    .optional(),
  notes: z
    .string()
    .max(1000, "Notes must be 1000 characters or less")
    .nullable()
    .optional(),
});

export type AvailabilityWindowFormData = z.infer<typeof availabilityWindowSchema>;
export type SchedulePreferenceFormData = z.infer<typeof schedulePreferenceSchema>;


