"use client";

import { createClient } from "@/lib/supabase/client";
import type { FocusArea } from "@/lib/schedule/types";
import { FOCUS_AREA_VALUES } from "@/lib/schedule/types";

const ACTIVE_INVITE_STATUSES = ["PENDING"];

export interface MatchRow {
  candidate_profile_id: string;
  candidate_preference_id: string;
  score: number;
  overlapping_windows: number;
  overlapping_minutes: number;
  shared_focus_areas: number;
  wsdc_level_diff: number;
}

export interface MatchCandidate {
  profileId: string;
  preferenceId: string;
  score: number;
  overlappingWindows: number;
  overlappingMinutes: number;
  sharedFocusAreas: number;
  wsdcLevelDiff: number;
}

/**
 * Enriched match data including profile details and focus areas
 */
export interface EnrichedMatch {
  profileId: string;
  preferenceId: string;
  score: number;
  overlappingWindows: number;
  overlappingMinutes: number;
  sharedFocusAreas: number;
  wsdcLevelDiff: number;
  // Profile data
  firstName: string;
  lastName: string;
  displayName: string | null;
  primaryRole: number;
  wsdcLevel: number | null;
  competitivenessLevel: number;
  bio: string | null;
  danceGoals: string | null;
  // Focus areas from their schedule preference
  focusAreas: FocusArea[];
}

/**
 * Fetch invitee profile IDs for any active (pending) invites the current user has sent.
 */
export async function fetchActiveInviteeIds(): Promise<Set<string>> {
  const supabase = createClient();

  const { data: profileId, error: profileError } = await supabase.rpc("current_profile_id");
  if (profileError || !profileId) {
    console.warn("Unable to resolve current profile id for invite filtering", profileError);
    return new Set();
  }

  const { data, error } = await supabase
    .from("session_invites")
    .select("invitee_id, status")
    .eq("proposer_id", profileId as string)
    .in("status", ACTIVE_INVITE_STATUSES);

  if (error) {
    console.warn("Unable to load active invites for filtering", error);
    return new Set();
  }

  return new Set((data ?? []).map((row) => row.invitee_id).filter(Boolean));
}

/**
 * Fetches ranked match candidates for the currently authenticated user.
 * Wraps the Postgres RPC: public.find_matches_for_current_user(p_limit)
 */
export async function fetchMatchesForCurrentUser(
  limit: number = 20,
): Promise<MatchCandidate[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("find_matches_for_current_user", {
    p_limit: limit,
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as MatchRow[];

  return rows.map((row) => ({
    profileId: row.candidate_profile_id,
    preferenceId: row.candidate_preference_id,
    score: row.score,
    overlappingWindows: row.overlapping_windows,
    overlappingMinutes: row.overlapping_minutes,
    sharedFocusAreas: row.shared_focus_areas,
    wsdcLevelDiff: row.wsdc_level_diff,
  }));
}

const focusAreaSet = new Set<FocusArea>(FOCUS_AREA_VALUES);

/**
 * Fetches enriched match data including profile details and focus areas.
 * This function:
 * 1. Calls find_matches_for_current_user RPC
 * 2. Batch fetches user profiles for all matched candidates
 * 3. Batch fetches focus areas for all matched preferences
 */
export async function fetchEnrichedMatches(
  limit: number = 20,
): Promise<EnrichedMatch[]> {
  const supabase = createClient();

  // Step 1: Get base matches
  const { data: matchData, error: matchError } = await supabase.rpc(
    "find_matches_for_current_user",
    { p_limit: limit },
  );

  if (matchError) {
    throw new Error(matchError.message);
  }

  const matchRows = (matchData ?? []) as MatchRow[];

  if (matchRows.length === 0) {
    return [];
  }

  // Extract IDs for batch fetching
  const profileIds = matchRows.map((row) => row.candidate_profile_id);
  const preferenceIds = matchRows.map((row) => row.candidate_preference_id);

  // Step 2: Batch fetch profiles
  const { data: profiles, error: profileError } = await supabase
    .from("user_profiles")
    .select(
      "id, first_name, last_name, display_name, primary_role, wsdc_level, competitiveness_level, bio, dance_goals",
    )
    .in("id", profileIds);

  if (profileError) {
    throw new Error(profileError.message);
  }

  // Step 3: Batch fetch focus areas
  const { data: focusRows, error: focusError } = await supabase
    .from("schedule_preference_focus")
    .select("preference_id, focus_area")
    .in("preference_id", preferenceIds);

  if (focusError) {
    throw new Error(focusError.message);
  }

  // Build lookup maps
  const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);
  const focusMap = new Map<string, FocusArea[]>();

  for (const row of focusRows ?? []) {
    if (!focusMap.has(row.preference_id)) {
      focusMap.set(row.preference_id, []);
    }
    if (row.focus_area && focusAreaSet.has(row.focus_area as FocusArea)) {
      focusMap.get(row.preference_id)!.push(row.focus_area as FocusArea);
    }
  }

  // Step 4: Combine into enriched matches
  return matchRows
    .map((row) => {
      const profile = profileMap.get(row.candidate_profile_id);
      if (!profile) {
        return null;
      }

      return {
        profileId: row.candidate_profile_id,
        preferenceId: row.candidate_preference_id,
        score: row.score,
        overlappingWindows: row.overlapping_windows,
        overlappingMinutes: row.overlapping_minutes,
        sharedFocusAreas: row.shared_focus_areas,
        wsdcLevelDiff: row.wsdc_level_diff,
        firstName: profile.first_name,
        lastName: profile.last_name,
        displayName: profile.display_name,
        primaryRole: profile.primary_role,
        wsdcLevel: profile.wsdc_level,
        competitivenessLevel: profile.competitiveness_level,
        bio: profile.bio,
        danceGoals: profile.dance_goals,
        focusAreas: focusMap.get(row.candidate_preference_id) ?? [],
      };
    })
    .filter((match): match is EnrichedMatch => match !== null);
}

export interface OverlapSuggestion {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  overlapMinutes: number;
}

export interface ProposeSessionResult {
  sessionId: string;
  inviteId: string;
  inviteStatus: string;
}

export type InviteResponseAction = "ACCEPT" | "DECLINE" | "CANCEL";

type SuggestionRow = {
  day_of_week: string;
  start_time: string;
  end_time: string;
  overlap_minutes: number | string | null;
};

type InviteRpcRow = {
  session_id: string;
  invite_id: string;
  invite_status?: string | null;
};

/**
 * Overlapping recurring windows between the current user and an invitee.
 * Returns day + start/end times (as strings) ordered by overlap minutes.
 */
export async function fetchOverlapSuggestions(
  inviteeProfileId: string,
): Promise<OverlapSuggestion[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("suggest_overlapping_windows", {
    p_invitee_id: inviteeProfileId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as SuggestionRow[];

  return rows.map((row) => ({
    dayOfWeek: row.day_of_week,
    startTime: row.start_time,
    endTime: row.end_time,
    overlapMinutes: Number(row.overlap_minutes ?? 0),
  }));
}

/**
 * Create a proposed practice session + invite a specific match.
 */
export async function proposePracticeSession(input: {
  inviteeProfileId: string;
  start: string;
  end: string;
  locationId?: string | null;
  note?: string | null;
}): Promise<ProposeSessionResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("propose_practice_session", {
    p_invitee_id: input.inviteeProfileId,
    p_start: input.start,
    p_end: input.end,
    p_location_id: input.locationId ?? null,
    p_note: input.note ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = (Array.isArray(data) ? data[0] : data) as InviteRpcRow | null;
  if (!row?.session_id || !row?.invite_id) {
    throw new Error("Unable to create invite");
  }

  return {
    sessionId: row.session_id,
    inviteId: row.invite_id,
    inviteStatus: row.invite_status ?? "PENDING",
  };
}

/**
 * Accept / decline / cancel an invite via RPC.
 */
export async function respondToInvite(
  inviteId: string,
  action: InviteResponseAction,
): Promise<ProposeSessionResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("respond_to_session_invite", {
    p_invite_id: inviteId,
    p_action: action,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = (Array.isArray(data) ? data[0] : data) as InviteRpcRow | null;
  if (!row?.session_id || !row?.invite_id) {
    throw new Error("Unable to update invite");
  }

  return {
    sessionId: row.session_id,
    inviteId: row.invite_id,
    inviteStatus: row.invite_status ?? action,
  };
}


