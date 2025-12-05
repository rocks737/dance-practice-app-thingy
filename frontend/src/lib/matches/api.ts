"use client";

import { createClient } from "@/lib/supabase/client";

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


