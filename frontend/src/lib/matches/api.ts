"use client";

import { createClient } from "@/lib/supabase/client";
import type { FocusArea } from "@/lib/schedule/types";
import { FOCUS_AREA_VALUES } from "@/lib/schedule/types";

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


