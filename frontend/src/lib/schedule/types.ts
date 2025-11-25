export const DAY_OF_WEEK_VALUES = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

export type DayOfWeek = (typeof DAY_OF_WEEK_VALUES)[number];

export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

export const PREFERRED_ROLE_VALUES = ["LEAD", "FOLLOW"] as const;
export type PreferredRole = (typeof PREFERRED_ROLE_VALUES)[number];

export const PREFERRED_ROLE_LABELS: Record<PreferredRole, string> = {
  LEAD: "Leader",
  FOLLOW: "Follower",
};

export const WSDC_SKILL_LEVEL_VALUES = [
  "NEWCOMER",
  "NOVICE",
  "INTERMEDIATE",
  "ADVANCED",
  "ALL_STAR",
  "CHAMPION",
] as const;

export type WsdcSkillLevel = (typeof WSDC_SKILL_LEVEL_VALUES)[number];

export const WSDC_SKILL_LEVEL_LABELS: Record<WsdcSkillLevel, string> = {
  NEWCOMER: "Newcomer",
  NOVICE: "Novice",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  ALL_STAR: "All-Star",
  CHAMPION: "Champion",
};

export const FOCUS_AREA_VALUES = [
  "CONNECTION",
  "TECHNIQUE",
  "MUSICALITY",
  "COMPETITION_PREP",
  "STYLING",
  "SOCIAL_DANCING",
  "CHOREOGRAPHY",
  "MINDSET",
  "CONDITIONING",
] as const;

export type FocusArea = (typeof FOCUS_AREA_VALUES)[number];

export const FOCUS_AREA_LABELS: Record<FocusArea, string> = {
  CONNECTION: "Connection",
  TECHNIQUE: "Technique",
  MUSICALITY: "Musicality",
  COMPETITION_PREP: "Competition prep",
  STYLING: "Styling",
  SOCIAL_DANCING: "Social dancing",
  CHOREOGRAPHY: "Choreography",
  MINDSET: "Mindset",
  CONDITIONING: "Conditioning",
};

export interface LocationSummary {
  id: string;
  name: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
}

export interface AvailabilityWindow {
  dayOfWeek: DayOfWeek;
  /**
   * Stored as HH:mm in the user's local timezone
   */
  startTime: string;
  /**
   * Stored as HH:mm in the user's local timezone
   */
  endTime: string;
}

export interface SchedulePreference {
  id: string;
  userId: string;
  locationNote: string | null;
  maxTravelDistanceKm: number | null;
  preferredLocations: LocationSummary[];
  availabilityWindows: AvailabilityWindow[];
  preferredRoles: PreferredRole[];
  preferredLevels: WsdcSkillLevel[];
  preferredFocusAreas: FocusArea[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SchedulePreferencePayload {
  availabilityWindows: AvailabilityWindow[];
  preferredRoles: PreferredRole[];
  preferredLevels: WsdcSkillLevel[];
  preferredFocusAreas: FocusArea[];
  preferredLocationIds: string[];
  maxTravelDistanceKm?: number | null;
  locationNote?: string | null;
  notes?: string | null;
}

export function formatLocationSummary(location: LocationSummary): string {
  const parts = [location.city, location.state, location.country].filter(Boolean);
  if (parts.length === 0) {
    return location.name ?? "Unknown location";
  }
  if (location.name && location.name.trim().length > 0) {
    return `${location.name} • ${parts.join(", ")}`;
  }
  return parts.join(", ");
}
