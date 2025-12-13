BEGIN;
create extension if not exists "basejump-supabase_test_helpers" version '0.0.6';

select plan(6);

-- Test data
do $$
declare
  auth_a uuid := gen_random_uuid();
  auth_b uuid := gen_random_uuid();
  profile_a uuid;
  profile_b uuid;
  start_ts timestamptz := date_trunc('minute', now() + interval '1 day');
  end_ts timestamptz := start_ts + interval '1 hour';
  invite_id uuid;
  session_id uuid;
  status text;
begin
  insert into user_profiles (
    auth_user_id, email, first_name, last_name, primary_role,
    wsdc_level, competitiveness_level, account_status, profile_visible
  ) values (
    auth_a, 'a@example.com', 'A', 'Tester', 0,
    1, 3, 0, true
  ) returning id into profile_a;

  insert into user_profiles (
    auth_user_id, email, first_name, last_name, primary_role,
    wsdc_level, competitiveness_level, account_status, profile_visible
  ) values (
    auth_b, 'b@example.com', 'B', 'Tester', 1,
    1, 3, 0, true
  ) returning id into profile_b;

  -- A proposes to B (creates pending invite)
  perform set_config('request.jwt.claims', json_build_object('sub', auth_a)::text, true);
  select invite_id, session_id, invite_status
    into invite_id, session_id, status
  from propose_practice_session(profile_b, start_ts, end_ts, null, 'first');

  perform is(status, 'PENDING', 'Initial invite is pending');
  perform results_eq(
    $$ select status from session_invites where id = $1 $$,
    'select ''PENDING''::text',
    'Session invite stored as pending',
    invite_id
  );

  -- B sends a new request for the exact same window back to A.
  -- This should auto-accept the existing invite and schedule the session.
  perform set_config('request.jwt.claims', json_build_object('sub', auth_b)::text, true);
  select invite_id, session_id, invite_status
    into invite_id, session_id, status
  from propose_practice_session(profile_a, start_ts, end_ts, null, 'mirror');

  perform is(status, 'ACCEPTED', 'Second propose auto-accepts existing invite');
  perform results_eq(
    $$ select status from session_invites where id = $1 $$,
    'select ''ACCEPTED''::text',
    'Invite marked accepted after mirrored request',
    invite_id
  );
  perform results_eq(
    $$ select status from sessions where id = $1 $$,
    'select ''SCHEDULED''::text',
    'Session is scheduled after auto-accept',
    session_id
  );
  perform is(
    (select count(*) from session_participants where session_id = session_id and user_id in (profile_a, profile_b)),
    2::bigint,
    'Both users are participants on the scheduled session'
  );
end $$;

select * from finish();
ROLLBACK;

