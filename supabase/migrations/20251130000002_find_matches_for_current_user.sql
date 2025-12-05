-- Matching RPC: find compatible practice partners for the current user
-- 
-- This is a V1 implementation that:
-- - Uses recurring availability windows only
-- - Requires at least one overlapping window
-- - Uses shared focus areas and WSDC level distance as soft scoring
-- - Excludes blocked users
--
-- Call from the app with:
--   supabase.rpc('find_matches_for_current_user', { p_limit: 20 })
--
-- It relies on public.current_profile_id() to identify the caller.
--
-- High-level behavior (V1):
-- - Identifies the "current user" via public.current_profile_id().
-- - Finds that user's MOST RECENT schedule preference and:
--     * All of its RECURRING availability windows
--     * All of its focus areas (what they want to work on)
-- - Builds a candidate set of OTHER visible profiles that:
--     * Have at least one schedule preference
--     * Are not blocked by / do not block the current user
-- - For each candidate preference, computes:
--     * Total overlapping minutes of recurring availability with the current user
--     * Number of shared focus areas
--     * Difference in WSDC skill level
-- - Produces a SCORE in the range [0, 100] combining:
--     * 0–60 pts: normalized overlapping minutes (capped at 10 hours of overlap)
--     * 0–25 pts: shared focus areas (capped at 5 shared areas)
--     * 0–15 pts: proximity in WSDC level (same level is best)
-- - Returns only candidates with at least one overlapping recurring window,
--   ordered by descending score, limited by p_limit.
--
-- Notes / limitations:
-- - Only RECURRING availability is considered (one-time windows ignored for now).
-- - The scoring weights are heuristic and can be tuned as we learn from usage.
-- - The function is STABLE and SECURITY DEFINER so it can see all needed rows
--   while still being callable by authenticated users subject to RLS.

create or replace function public.find_matches_for_current_user(
  p_limit integer default 20
)
returns table (
  candidate_profile_id uuid,
  candidate_preference_id uuid,
  score numeric,
  overlapping_windows integer,
  overlapping_minutes numeric,
  shared_focus_areas integer,
  wsdc_level_diff integer
)
language sql
stable
security definer
set search_path = public
as $$
-- Current caller's profile + skill information + home location
with cur_user as (
  select
    up.id as profile_id,
    up.wsdc_level,
    loc.city as home_city,
    loc.state as home_state,
    loc.country as home_country
  from user_profiles up
  left join locations loc on loc.id = up.home_location_id
  where up.id = public.current_profile_id()
),
-- Most recent schedule preference for the current user
current_pref as (
  select sp.id as preference_id
  from schedule_preferences sp
  join cur_user u on sp.user_id = u.profile_id
  order by sp.created_at desc
  limit 1
),
-- Recurring availability windows for the current preference
current_windows as (
  select w.*
  from schedule_preference_windows w
  join current_pref cp on w.preference_id = cp.preference_id
  where w.recurring = true
),
-- Focus areas (what the user wants to work on)
current_focus as (
  select f.focus_area
  from schedule_preference_focus f
  join current_pref cp on f.preference_id = cp.preference_id
),
-- All visible candidate users (not blocked), with their preferences and home location
candidates as (
  select
    sp.id as preference_id,
    sp.user_id as profile_id,
    up.wsdc_level,
    loc.city as home_city,
    loc.state as home_state,
    loc.country as home_country
  from schedule_preferences sp
  join user_profiles up on up.id = sp.user_id
  join cur_user cu on cu.profile_id <> up.id
  left join locations loc on loc.id = up.home_location_id
  left join user_blocks b
    on (b.user_id = cu.profile_id and b.blocked_user_id = up.id)
    or (b.blocked_user_id = cu.profile_id and b.user_id = up.id)
  where
    b.user_id is null
    and up.profile_visible = true
    -- Location filter: only match candidates whose home city matches current user's home city
    and cu.home_city is not null
    and loc.city is not null
    and loc.city = cu.home_city
),
-- Count of overlapping recurring windows between current user and each candidate
availability_overlap as (
  select
    c.profile_id,
    c.preference_id,
    count(*) as overlapping_windows,
    -- Total overlapping minutes across all matching windows
    sum(
      greatest(
        0,
        extract(
          epoch from (
            least(w1.end_time, w2.end_time)
            - greatest(w1.start_time, w2.start_time)
          )
        ) / 60.0
      )
    ) as overlapping_minutes
  from candidates c
  join schedule_preference_windows w2
    on w2.preference_id = c.preference_id
   and w2.recurring = true
  join current_windows w1
    on w1.day_of_week = w2.day_of_week
   and w1.start_time < w2.end_time
   and w2.start_time < w1.end_time
  group by c.profile_id, c.preference_id
),
-- Count of shared focus areas between current user and each candidate
focus_overlap as (
  select
    c.profile_id,
    c.preference_id,
    count(*) as shared_focus_areas
  from candidates c
  join schedule_preference_focus f2
    on f2.preference_id = c.preference_id
  join current_focus f1
    on f1.focus_area = f2.focus_area
  group by c.profile_id, c.preference_id
)
-- Final scoring and ranking of candidates
select
  c.profile_id as candidate_profile_id,
  c.preference_id as candidate_preference_id,
  (
    -- 0–60 points: total overlapping minutes (capped at 10 hours of overlap)
    least(coalesce(a.overlapping_minutes, 0), 600) / 600.0 * 60.0
    +
    -- 0–25 points: shared focus areas (capped at 5 shared focus areas)
    least(coalesce(f.shared_focus_areas, 0), 5) / 5.0 * 25.0
    +
    -- 0–15 points: WSDC level proximity (diff 0 → 15 pts, diff ≥ 5 → 0 pts)
    (
      greatest(
        0,
        5 - abs(
          coalesce(c.wsdc_level, 0) - coalesce(cu.wsdc_level, 0)
        )
      ) / 5.0 * 15.0
    )
  )::numeric as score,
  coalesce(a.overlapping_windows, 0) as overlapping_windows,
  coalesce(a.overlapping_minutes, 0) as overlapping_minutes,
  coalesce(f.shared_focus_areas, 0) as shared_focus_areas,
  abs(
    coalesce(c.wsdc_level, 0) - coalesce(cu.wsdc_level, 0)
  ) as wsdc_level_diff
from candidates c
cross join cur_user cu
left join availability_overlap a
  on a.profile_id = c.profile_id
 and a.preference_id = c.preference_id
left join focus_overlap f
  on f.profile_id = c.profile_id
 and f.preference_id = c.preference_id
where coalesce(a.overlapping_windows, 0) > 0
order by score desc
limit p_limit;
$$;

-- Allow authenticated users to execute the matching RPC
grant execute on function public.find_matches_for_current_user(integer) to authenticated;



