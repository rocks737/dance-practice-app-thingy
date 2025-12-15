BEGIN;
create extension if not exists "basejump-supabase_test_helpers" version '0.0.6';

select plan(6);

do $$
declare
  ident_a text := 'a_user_' || encode(gen_random_bytes(4), 'hex');
  ident_b text := 'b_user_' || encode(gen_random_bytes(4), 'hex');
  auth_a uuid;
  auth_b uuid;
  profile_a uuid;
  profile_b uuid;
  start_ts timestamptz := date_trunc('minute', now() + interval '1 day');
  end_ts timestamptz := start_ts + interval '1 hour';
begin
  -- Setup temp table for captured results (owned by session user)
  create temporary table if not exists tmp_session_invites (
    step text primary key,
    invite_id uuid,
    session_id uuid,
    status text
  ) on commit preserve rows;
  grant all on tmp_session_invites to authenticated, anon;

  create temporary table if not exists tmp_meta (
    profile_a uuid,
    profile_b uuid
  ) on commit preserve rows;
  grant all on tmp_meta to authenticated, anon;

  -- Create two auth users via basejump helpers (only if missing)
  perform tests.create_supabase_user(ident_a, ident_a || '@example.com');
  perform tests.create_supabase_user(ident_b, ident_b || '@example.com');

  -- Resolve their auth IDs (auth users are created by helper)
  select tests.get_supabase_uid(ident_a) into auth_a;
  select tests.get_supabase_uid(ident_b) into auth_b;

  -- Ensure user_profiles exist for each auth user (helpers do not create them)
  insert into user_profiles (
    auth_user_id,
    email,
    first_name,
    last_name,
    primary_role,
    competitiveness_level,
    account_status,
    profile_visible
  )
  values
    (auth_a, ident_a || '@example.com', 'A', 'User', 0, 1, 0, true),
    (auth_b, ident_b || '@example.com', 'B', 'User', 0, 1, 0, true)
  on conflict (auth_user_id) do nothing;

  -- Fetch profile ids
  select id into profile_a from user_profiles where auth_user_id = auth_a;
  select id into profile_b from user_profiles where auth_user_id = auth_b;

  -- Ensure profiles exist (helpers should create them; this is a guard)
  if profile_a is null or profile_b is null then
    raise exception 'Missing profile for test users';
  end if;

  insert into tmp_meta(profile_a, profile_b) values (profile_a, profile_b);

  -- A proposes to B (creates pending invite)
  perform tests.authenticate_as(ident_a);
  insert into tmp_session_invites(step, invite_id, session_id, status)
  select 'first', ps.invite_id, ps.session_id, ps.invite_status
  from propose_practice_session(profile_b, start_ts, end_ts, null, 'first') as ps;

  -- B sends a new request for the exact same window back to A (should auto-accept existing)
  perform tests.authenticate_as(ident_b);
  insert into tmp_session_invites(step, invite_id, session_id, status)
  select 'mirror', ps.invite_id, ps.session_id, ps.invite_status
  from propose_practice_session(profile_a, start_ts, end_ts, null, 'mirror') as ps;
end $$;

-- Assertions
select is(
  (select status from tmp_session_invites where step = 'first'),
  'PENDING',
  'Initial invite is pending'
);

select results_eq(
  format('select status::text from session_invites where id = %L', (select invite_id from tmp_session_invites where step = 'first')),
  'select ''ACCEPTED''::text',
  'Original invite marked accepted after mirrored request'
);

select is(
  (select status from tmp_session_invites where step = 'mirror'),
  'ACCEPTED',
  'Second propose auto-accepts existing invite'
);

select results_eq(
  format('select status::text from session_invites where id = %L', (select invite_id from tmp_session_invites where step = 'mirror')),
  'select ''ACCEPTED''::text',
  'Invite marked accepted after mirrored request'
);

select results_eq(
  format('select status::text from sessions where id = %L', (select session_id from tmp_session_invites where step = 'mirror')),
  'select ''SCHEDULED''::text',
  'Session is scheduled after auto-accept'
);

-- Final: verify both participants exist (ignore RLS by using postgres role)
set local role postgres;
select is(
  (select count(*) from public.session_participants where session_id = (select session_id from tmp_session_invites where step = 'mirror')),
  2::bigint,
  'Both users are participants on the scheduled session'
);
reset role;

select * from finish();
ROLLBACK;

