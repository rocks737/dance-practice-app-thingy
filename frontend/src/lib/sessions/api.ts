"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/types";
import {
  SessionFilters,
  SessionListItem,
  SessionStatus,
  SessionType,
  SessionVisibility,
  defaultSessionFilters,
} from "./types";

type SessionQueryBuilder = ReturnType<SupabaseClient<Database>["from"]>;

type RawSessionRecord = Tables<"sessions"> & {
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

export async function fetchSessions(
  options: FetchSessionsOptions = {},
): Promise<FetchSessionsResult> {
  const supabase = createClient();
  const {
    filters = defaultSessionFilters,
    limit = 20,
    offset = 0,
  } = options;

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

function applySessionFilters(
  query: SessionQueryBuilder,
  filters: SessionFilters,
) {
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
): Promise<SessionListItem> {
  const supabase = createClient();
  const payload: TablesInsert<"sessions"> = {
    id: crypto.randomUUID(),
    title: input.title,
    session_type: input.sessionType,
    status: input.status,
    visibility: input.visibility,
    scheduled_start: input.scheduledStart,
    scheduled_end: input.scheduledEnd,
    organizer_id: input.organizerId,
    capacity: input.capacity ?? null,
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
): Promise<SessionListItem> {
  const supabase = createClient();
  const patch: TablesUpdate<"sessions"> = {
    status: input.patch.status,
    visibility: input.patch.visibility,
    capacity:
      input.patch.capacity === undefined ? undefined : input.patch.capacity,
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

