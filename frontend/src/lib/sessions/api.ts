"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Database, Tables, TablesInsert, TablesUpdate } from "@/lib/supabase/types";
import {
  SessionFilters,
  SessionListItem,
  SessionStatus,
  SessionType,
  SessionVisibility,
  defaultSessionFilters,
} from "./types";

type RawSessionRecord = {
  id: string;
  title: string;
  session_type: string;
  status: string;
  visibility: string;
  scheduled_start: string;
  scheduled_end: string;
  updated_at: string;
  version: number;
  capacity: number | null;
  location_id?: string | null;
  organizer_id?: string;
  location: {
    id: string;
    name: string | null;
    city: string | null;
    state: string | null;
  } | null;
  organizer: {
    id: string;
    display_name: string | null;
    first_name: string;
    last_name: string;
  } | null;
  session_participants: {
    user_id: string;
  }[];
};

const SESSION_LIST_SELECT = `
  id,
  title,
  session_type,
  status,
  visibility,
  scheduled_start,
  scheduled_end,
  updated_at,
  version,
  capacity,
  location:locations!fk_sessions_location (
    id,
    name,
    city,
    state
  ),
  organizer:user_profiles!fk_sessions_organizer (
    id,
    display_name,
    first_name,
    last_name
  ),
  session_participants (
    user_id
  )
`;

export interface FetchSessionsOptions {
  filters?: SessionFilters;
  limit?: number;
  offset?: number;
}

export interface FetchSessionsResult {
  sessions: SessionListItem[];
  total: number;
}

export interface CreateSessionInput {
  title: string;
  sessionType: SessionType;
  status: SessionStatus;
  visibility: SessionVisibility;
  scheduledStart: string;
  scheduledEnd: string;
  organizerId: string;
  capacity?: number | null;
  locationId?: string | null;
}

export interface UpdateSessionInput {
  id: string;
  patch: {
    status?: SessionStatus;
    visibility?: SessionVisibility;
    capacity?: number | null;
  };
}

export type SessionParticipantSummary = {
  id: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
};

export async function joinSession(
  sessionId: string,
  profileId: string,
  supabaseOverride?: SupabaseClient<Database>,
): Promise<void> {
  const supabase = supabaseOverride ?? createClient();
  const { error } = await supabase.from("session_participants").insert({
    session_id: sessionId,
    user_id: profileId,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function leaveSession(
  sessionId: string,
  profileId: string,
  supabaseOverride?: SupabaseClient<Database>,
): Promise<void> {
  const supabase = supabaseOverride ?? createClient();
  const { error } = await supabase
    .from("session_participants")
    .delete()
    .eq("session_id", sessionId)
    .eq("user_id", profileId);
  if (error) {
    throw new Error(error.message);
  }
}

export type LocationOption = {
  id: string;
  name: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
};

export async function fetchLocationOptions(
  supabaseOverride?: SupabaseClient<Database>,
): Promise<LocationOption[]> {
  const supabase = supabaseOverride ?? createClient();
  const { data, error } = await supabase
    .from("locations")
    .select("id,name,city,state,country")
    .order("name", { ascending: true })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []) as LocationOption[];
}

export async function fetchSessions(
  options: FetchSessionsOptions = {},
  supabaseOverride?: SupabaseClient<Database>,
): Promise<FetchSessionsResult> {
  const supabase = supabaseOverride ?? createClient();
  const { filters = defaultSessionFilters, limit = 20, offset = 0 } = options;

  let query = supabase
    .from("sessions")
    .select(SESSION_LIST_SELECT, { count: "exact" })
    .order("scheduled_start", { ascending: false });

  query = applySessionFilters(query, filters);

  if (limit != null) {
    const rangeEnd = offset + limit - 1;
    query = query.range(offset, rangeEnd);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return {
    sessions: (data ?? []).map(mapSessionRecord),
    total: count ?? data?.length ?? 0,
  };
}

/**
 * Fetch signed-up participants for a session (rows in `session_participants`),
 * best-effort resolving each participant to a readable `user_profiles` record.
 *
 * Note: profile rows may be filtered by RLS (e.g. private profiles). In that case
 * the participant will still be returned with name fields null.
 */
export async function fetchSessionParticipantSummaries(
  sessionId: string,
  supabaseOverride?: SupabaseClient<Database>,
): Promise<SessionParticipantSummary[]> {
  const supabase = supabaseOverride ?? createClient();

  const { data: participantRows, error: participantsError } = await supabase
    .from("session_participants")
    .select("user_id")
    .eq("session_id", sessionId)
    .order("user_id", { ascending: true });

  if (participantsError) {
    throw new Error(participantsError.message);
  }

  const ids = (participantRows ?? []).map((r) => r.user_id).filter(Boolean);
  if (ids.length === 0) return [];

  const { data: profileRows, error: profilesError } = await supabase
    .from("user_profiles")
    .select("id, first_name, last_name, display_name")
    .in("id", ids);

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const byId = new Map(
    (profileRows ?? []).map((p) => [
      p.id,
      {
        id: p.id,
        displayName: p.display_name ?? null,
        firstName: p.first_name ?? null,
        lastName: p.last_name ?? null,
      } satisfies SessionParticipantSummary,
    ]),
  );

  // Preserve participant ordering; fill unknowns if profile rows were filtered out.
  return ids.map((id) => byId.get(id) ?? { id, displayName: null, firstName: null, lastName: null });
}

function applySessionFilters(query: any, filters: SessionFilters) {
  const normalized = { ...defaultSessionFilters, ...filters };

  if (normalized.searchText?.trim()) {
    query = query.ilike("title", `%${normalized.searchText.trim()}%`);
  }

  if (normalized.statuses?.length) {
    query = query.in("status", normalized.statuses as string[]);
  }

  if (normalized.sessionTypes?.length) {
    query = query.in("session_type", normalized.sessionTypes as string[]);
  }

  if (normalized.visibilities?.length) {
    query = query.in("visibility", normalized.visibilities as string[]);
  }

  if (normalized.fromDate) {
    query = query.gte("scheduled_start", normalized.fromDate);
  }

  if (normalized.toDate) {
    query = query.lte("scheduled_start", normalized.toDate);
  }

  return query;
}

function mapSessionRecord(record: RawSessionRecord): SessionListItem {
  return {
    id: record.id,
    title: record.title,
    sessionType: record.session_type as SessionType,
    status: record.status as SessionStatus,
    visibility: record.visibility as SessionVisibility,
    scheduledStart: record.scheduled_start,
    scheduledEnd: record.scheduled_end,
    updatedAt: record.updated_at,
    version: record.version,
    capacity: record.capacity,
    location: record.location
      ? {
          id: record.location.id,
          name: record.location.name,
          city: record.location.city,
          state: record.location.state,
        }
      : null,
    organizer: record.organizer
      ? {
          id: record.organizer.id,
          displayName: record.organizer.display_name,
          firstName: record.organizer.first_name,
          lastName: record.organizer.last_name,
        }
      : null,
    participantCount: record.session_participants?.length ?? 0,
  };
}

export async function createSession(
  input: CreateSessionInput,
  supabaseOverride?: SupabaseClient<Database>,
): Promise<SessionListItem> {
  const supabase = supabaseOverride ?? createClient();
  const isPartnerPractice = input.sessionType === "PARTNER_PRACTICE";
  const payload: TablesInsert<"sessions"> = {
    title: input.title,
    session_type: input.sessionType,
    status: input.status,
    visibility: input.visibility,
    scheduled_start: input.scheduledStart,
    scheduled_end: input.scheduledEnd,
    organizer_id: input.organizerId,
    // Partner practice is always 1:1, so capacity is fixed at 2.
    capacity: isPartnerPractice ? 2 : (input.capacity ?? null),
    location_id: input.locationId ?? null,
  };

  const { data, error } = await supabase
    .from("sessions")
    .insert(payload)
    .select(SESSION_LIST_SELECT)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapSessionRecord(data as RawSessionRecord);
}

export async function updateSession(
  input: UpdateSessionInput,
  supabaseOverride?: SupabaseClient<Database>,
): Promise<SessionListItem> {
  const supabase = supabaseOverride ?? createClient();

  // Guard: Partner practice is always 1:1; don't allow capacity edits.
  if (input.patch.capacity !== undefined) {
    const { data: existing, error: existingError } = await supabase
      .from("sessions")
      .select("session_type")
      .eq("id", input.id)
      .single();
    if (existingError) {
      throw new Error(existingError.message);
    }
    if ((existing as any)?.session_type === "PARTNER_PRACTICE") {
      throw new Error("Partner practice capacity is fixed at 2");
    }
  }

  const patch: TablesUpdate<"sessions"> = {
    status: input.patch.status,
    visibility: input.patch.visibility,
    capacity: input.patch.capacity === undefined ? undefined : input.patch.capacity,
  };

  const { data, error } = await supabase
    .from("sessions")
    .update(patch)
    .eq("id", input.id)
    .select(SESSION_LIST_SELECT)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapSessionRecord(data as RawSessionRecord);
}
