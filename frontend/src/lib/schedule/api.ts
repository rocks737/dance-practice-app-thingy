import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/types";
import {
  FOCUS_AREA_VALUES,
  PREFERRED_ROLE_VALUES,
  WSDC_SKILL_LEVEL_VALUES,
  type AvailabilityWindow,
  type FocusArea,
  type LocationSummary,
  type PreferredRole,
  type SchedulePreference,
  type SchedulePreferencePayload,
  type WsdcSkillLevel,
} from "./types";
import type { SchedulePreferenceFormData } from "./validation";

const SCHEDULE_PREFERENCE_SELECT = `
  id,
  user_id,
  location_note,
  max_travel_distance_km,
  notes,
  created_at,
  updated_at,
  schedule_preference_windows (
    day_of_week,
    start_time,
    end_time
  ),
  schedule_preference_roles (
    role
  ),
  schedule_preference_levels (
    level
  ),
  schedule_preference_focus (
    focus_area
  ),
  schedule_preference_locations (
    location_id,
    location:locations!fk_sched_pref_locations_location (
      id,
      name,
      city,
      state,
      country
    )
  )
`;

type SchedulePreferenceRow = Tables<"schedule_preferences">;
type SchedulePreferenceWindowRow = Tables<"schedule_preference_windows">;
type SchedulePreferenceRoleRow = Tables<"schedule_preference_roles">;
type SchedulePreferenceLevelRow = Tables<"schedule_preference_levels">;
type SchedulePreferenceFocusRow = Tables<"schedule_preference_focus">;
type SchedulePreferenceLocationRow = Tables<"schedule_preference_locations"> & {
  location: Pick<Tables<"locations">, "id" | "name" | "city" | "state" | "country"> | null;
};

type RawSchedulePreferenceRow = SchedulePreferenceRow & {
  schedule_preference_windows: SchedulePreferenceWindowRow[] | null;
  schedule_preference_roles: SchedulePreferenceRoleRow[] | null;
  schedule_preference_levels: SchedulePreferenceLevelRow[] | null;
  schedule_preference_focus: SchedulePreferenceFocusRow[] | null;
  schedule_preference_locations: SchedulePreferenceLocationRow[] | null;
};

const preferredRoleSet = new Set<PreferredRole>(PREFERRED_ROLE_VALUES);
const wsdcLevelSet = new Set<WsdcSkillLevel>(WSDC_SKILL_LEVEL_VALUES);
const focusAreaSet = new Set<FocusArea>(FOCUS_AREA_VALUES);

export interface CreateSchedulePreferenceInput {
  userId: string;
  data: SchedulePreferenceFormData;
}

export interface UpdateSchedulePreferenceInput {
  userId: string;
  preferenceId: string;
  data: SchedulePreferenceFormData;
}

export interface DeleteSchedulePreferenceInput {
  userId: string;
  preferenceId: string;
}

export async function fetchSchedulePreferences(
  userId: string,
): Promise<SchedulePreference[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("schedule_preferences")
    .select(SCHEDULE_PREFERENCE_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data as RawSchedulePreferenceRow[] | null)?.map(mapPreference) ?? [];
}

export async function createSchedulePreference(
  input: CreateSchedulePreferenceInput,
): Promise<SchedulePreference> {
  const supabase = createClient();
  const normalized = normalizePayload(input.data);
  const preferenceId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  const baseInsert: TablesInsert<"schedule_preferences"> = {
    id: preferenceId,
    user_id: input.userId,
    location_note: normalized.locationNote ?? null,
    max_travel_distance_km: normalized.maxTravelDistanceKm ?? null,
    notes: normalized.notes ?? null,
    created_at: timestamp,
    updated_at: timestamp,
    version: 0,
  };

  const { error } = await supabase.from("schedule_preferences").insert(baseInsert);
  if (error) {
    throw new Error(error.message);
  }

  await replaceChildRows(supabase, preferenceId, normalized);

  return await fetchPreferenceById(supabase, preferenceId, input.userId);
}

export async function updateSchedulePreference(
  input: UpdateSchedulePreferenceInput,
): Promise<SchedulePreference> {
  const supabase = createClient();
  const normalized = normalizePayload(input.data);
  const timestamp = new Date().toISOString();

  const baseUpdate: TablesUpdate<"schedule_preferences"> = {
    location_note: normalized.locationNote ?? null,
    max_travel_distance_km: normalized.maxTravelDistanceKm ?? null,
    notes: normalized.notes ?? null,
    updated_at: timestamp,
  };

  const { data, error } = await supabase
    .from("schedule_preferences")
    .update(baseUpdate)
    .eq("id", input.preferenceId)
    .eq("user_id", input.userId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Schedule preference not found");
  }

  await replaceChildRows(supabase, input.preferenceId, normalized);

  return await fetchPreferenceById(supabase, input.preferenceId, input.userId);
}

export async function deleteSchedulePreference(
  input: DeleteSchedulePreferenceInput,
): Promise<void> {
  const supabase = createClient();
  await deleteChildRows(supabase, input.preferenceId);

  const { error } = await supabase
    .from("schedule_preferences")
    .delete()
    .eq("id", input.preferenceId)
    .eq("user_id", input.userId);

  if (error) {
    throw new Error(error.message);
  }
}

async function fetchPreferenceById(
  supabase: SupabaseClient<Database>,
  preferenceId: string,
  userId: string,
): Promise<SchedulePreference> {
  const { data, error } = await supabase
    .from("schedule_preferences")
    .select(SCHEDULE_PREFERENCE_SELECT)
    .eq("id", preferenceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Unable to load schedule preference");
  }

  return mapPreference(data as RawSchedulePreferenceRow);
}

function normalizePayload(
  data: SchedulePreferenceFormData,
): SchedulePreferencePayload {
  return {
    availabilityWindows: data.availabilityWindows ?? [],
    preferredRoles: data.preferredRoles ?? [],
    preferredLevels: data.preferredLevels ?? [],
    preferredFocusAreas: data.preferredFocusAreas ?? [],
    preferredLocationIds: dedupeStrings(data.preferredLocationIds ?? []),
    maxTravelDistanceKm:
      data.maxTravelDistanceKm === undefined ? null : data.maxTravelDistanceKm,
    locationNote: data.locationNote ?? null,
    notes: data.notes ?? null,
  };
}

function dedupeStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => Boolean(value?.trim()))));
}

function mapPreference(row: RawSchedulePreferenceRow): SchedulePreference {
  return {
    id: row.id,
    userId: row.user_id,
    locationNote: row.location_note,
    maxTravelDistanceKm: row.max_travel_distance_km,
    preferredLocations: mapLocations(row.schedule_preference_locations),
    availabilityWindows: mapWindows(row.schedule_preference_windows),
    preferredRoles: mapRoles(row.schedule_preference_roles),
    preferredLevels: mapLevels(row.schedule_preference_levels),
    preferredFocusAreas: mapFocusAreas(row.schedule_preference_focus),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapLocations(
  rows: SchedulePreferenceLocationRow[] | null,
): LocationSummary[] {
  if (!rows) {
    return [];
  }

  const byId = new Map<string, LocationSummary>();

  for (const entry of rows) {
    const location = entry.location;
    if (!location) {
      continue;
    }
    byId.set(location.id, {
      id: location.id,
      name: location.name,
      city: location.city,
      state: location.state,
      country: location.country,
    });
  }

  return Array.from(byId.values());
}

function mapWindows(
  rows: SchedulePreferenceWindowRow[] | null,
): AvailabilityWindow[] {
  if (!rows) {
    return [];
  }

  return rows.map((window) => ({
    dayOfWeek: window.day_of_week as AvailabilityWindow["dayOfWeek"],
    startTime: normalizeTime(window.start_time),
    endTime: normalizeTime(window.end_time),
  }));
}

function mapRoles(rows: SchedulePreferenceRoleRow[] | null): PreferredRole[] {
  if (!rows) {
    return [];
  }

  const roles: PreferredRole[] = [];
  for (const role of rows) {
    if (role.role && preferredRoleSet.has(role.role as PreferredRole)) {
      roles.push(role.role as PreferredRole);
    }
  }
  return roles;
}

function mapLevels(rows: SchedulePreferenceLevelRow[] | null): WsdcSkillLevel[] {
  if (!rows) {
    return [];
  }

  const levels: WsdcSkillLevel[] = [];
  for (const level of rows) {
    if (level.level && wsdcLevelSet.has(level.level as WsdcSkillLevel)) {
      levels.push(level.level as WsdcSkillLevel);
    }
  }
  return levels;
}

function mapFocusAreas(rows: SchedulePreferenceFocusRow[] | null): FocusArea[] {
  if (!rows) {
    return [];
  }

  const focusAreas: FocusArea[] = [];
  for (const focus of rows) {
    if (focus.focus_area && focusAreaSet.has(focus.focus_area as FocusArea)) {
      focusAreas.push(focus.focus_area as FocusArea);
    }
  }
  return focusAreas;
}

function normalizeTime(value: string | null): string {
  if (!value) {
    return "00:00";
  }
  return value.slice(0, 5);
}

async function replaceChildRows(
  supabase: SupabaseClient<Database>,
  preferenceId: string,
  payload: SchedulePreferencePayload,
): Promise<void> {
  await deleteChildRows(supabase, preferenceId);

  const inserts: Promise<unknown>[] = [];

  if (payload.availabilityWindows.length > 0) {
    inserts.push(
      supabase.from("schedule_preference_windows").insert(
        payload.availabilityWindows.map((window) => ({
          preference_id: preferenceId,
          day_of_week: window.dayOfWeek,
          start_time: window.startTime,
          end_time: window.endTime,
        })),
      ),
    );
  }

  if (payload.preferredRoles.length > 0) {
    inserts.push(
      supabase.from("schedule_preference_roles").insert(
        payload.preferredRoles.map((role) => ({
          preference_id: preferenceId,
          role,
        })),
      ),
    );
  }

  if (payload.preferredLevels.length > 0) {
    inserts.push(
      supabase.from("schedule_preference_levels").insert(
        payload.preferredLevels.map((level) => ({
          preference_id: preferenceId,
          level,
        })),
      ),
    );
  }

  if (payload.preferredFocusAreas.length > 0) {
    inserts.push(
      supabase.from("schedule_preference_focus").insert(
        payload.preferredFocusAreas.map((area) => ({
          preference_id: preferenceId,
          focus_area: area,
        })),
      ),
    );
  }

  if (payload.preferredLocationIds.length > 0) {
    inserts.push(
      supabase.from("schedule_preference_locations").insert(
        payload.preferredLocationIds.map((locationId) => ({
          preference_id: preferenceId,
          location_id: locationId,
        })),
      ),
    );
  }

  for (const request of inserts) {
    const { error } = await request;
    if (error) {
      throw new Error(error.message);
    }
  }
}

async function deleteChildRows(
  supabase: SupabaseClient<Database>,
  preferenceId: string,
): Promise<void> {
  const responses = await Promise.all([
    supabase.from("schedule_preference_windows").delete().eq("preference_id", preferenceId),
    supabase.from("schedule_preference_roles").delete().eq("preference_id", preferenceId),
    supabase.from("schedule_preference_levels").delete().eq("preference_id", preferenceId),
    supabase.from("schedule_preference_focus").delete().eq("preference_id", preferenceId),
    supabase.from("schedule_preference_locations").delete().eq("preference_id", preferenceId),
  ]);

  for (const response of responses) {
    const { error } = response;
    if (error) {
      throw new Error(error.message);
    }
  }
}


