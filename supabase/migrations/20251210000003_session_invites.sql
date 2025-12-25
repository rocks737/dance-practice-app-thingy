-- Session invites + propose/response helpers for practice sessions
-- Adds:
--   - session_invites table
--   - RLS policies
--   - propose_practice_session() RPC
--   - respond_to_session_invite() RPC
--   - suggest_overlapping_windows() RPC (overlap of recurring availability)

set search_path = public;

-- Needed for scheduled expiry sweeper
create extension if not exists pg_cron;

-- ----------------------------
-- Table
-- ----------------------------
create table if not exists session_invites (
    id uuid not null default gen_random_uuid(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz,
    version bigint not null default 0,
    session_id uuid not null references sessions on delete cascade,
    proposer_id uuid not null references user_profiles,
    invitee_id uuid not null references user_profiles,
    note varchar(500),
    status varchar(16) not null default 'PENDING' check (status in ('PENDING','ACCEPTED','DECLINED','CANCELLED','EXPIRED')),
    expires_at timestamptz,
    constraint pk_session_invites primary key (id),
    constraint uk_session_invites_session_invitee unique (session_id, invitee_id),
    constraint chk_session_invites_no_self_invite check (proposer_id <> invitee_id)
);

-- Timestamps
create trigger set_session_invites_timestamps
    before insert on session_invites
    for each row execute function set_timestamps_on_insert();

create trigger update_session_invites_updated_at
    before update on session_invites
    for each row execute function update_updated_at_column();

-- ----------------------------
-- RLS
-- ----------------------------
alter table session_invites enable row level security;

-- Read: proposer or invitee
drop policy if exists "session_invites proposer/invitee read" on session_invites;
create policy "session_invites proposer/invitee read"
on session_invites
for select
to authenticated
using (
  proposer_id = public.current_profile_id()
  or invitee_id = public.current_profile_id()
);

-- Insert: proposer == current user
drop policy if exists "session_invites proposer insert" on session_invites;
create policy "session_invites proposer insert"
on session_invites
for insert
to authenticated
with check (
  proposer_id = public.current_profile_id()
  and invitee_id <> public.current_profile_id()
);

-- Allow invitees to read sessions they were invited to (for proposed sessions)
drop policy if exists "sessions invitee read" on public.sessions;
create policy "sessions invitee read"
on public.sessions
for select
to authenticated
using (
  exists (
    select 1
    from public.session_invites si
    where si.session_id = sessions.id
      and si.invitee_id = public.current_profile_id()
  )
);

-- Update by invitee: accept or decline
drop policy if exists "session_invites invitee respond" on session_invites;
create policy "session_invites invitee respond"
on session_invites
for update
to authenticated
using (invitee_id = public.current_profile_id())
with check (
  invitee_id = public.current_profile_id()
  and status in ('ACCEPTED','DECLINED')
);

-- Update by proposer: cancel
drop policy if exists "session_invites proposer cancel" on session_invites;
create policy "session_invites proposer cancel"
on session_invites
for update
to authenticated
using (proposer_id = public.current_profile_id())
with check (
  proposer_id = public.current_profile_id()
  and status = 'CANCELLED'
);

-- Admin override
drop policy if exists "session_invites admin all" on session_invites;
create policy "session_invites admin all"
on session_invites
for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

-- ----------------------------
-- RPC: propose practice session (creates session + invite)
-- ----------------------------
create or replace function public.propose_practice_session(
  p_invitee_id uuid,
  p_start timestamptz,
  p_end timestamptz,
  p_location_id uuid default null,
  p_note text default null
)
returns table (
  session_id uuid,
  invite_id uuid,
  invite_status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_proposer_id uuid;
  v_session_id uuid;
  v_invite_id uuid;
  v_expires_at timestamptz;
  v_active_invites integer;
begin
  -- Keep status as source of truth: sweep expired rows before applying business rules.
  perform public.expire_session_invites();

  v_proposer_id := public.current_profile_id();
  if v_proposer_id is null then
    raise exception 'Missing profile for current user';
  end if;

  if p_invitee_id is null then
    raise exception 'Invitee is required';
  end if;

  if p_invitee_id = v_proposer_id then
    raise exception 'Cannot invite yourself';
  end if;

  if p_start is null or p_end is null or p_end <= p_start then
    raise exception 'End time must be after start time';
  end if;

  -- Disallow proposing sessions that start in the past.
  -- Prevents creating invites that are instantly expired.
  if p_start < now() then
    raise exception 'Start time must be in the future';
  end if;

  -- Default expiry: sooner of proposed end time or 24 hours from now
  v_expires_at := least(p_end, now() + interval '24 hours');

  -- Limit: max 3 active outgoing invites per invitee at a time.
  -- "Active" = PENDING. (Expired rows are swept above.)
  select count(*) into v_active_invites
  from session_invites si
  where si.proposer_id = v_proposer_id
    and si.invitee_id = p_invitee_id
    and si.status = 'PENDING';

  if v_active_invites >= 3 then
    raise exception 'You already have 3 active practice requests to this person. Please wait for a response or cancel an existing request.';
  end if;

  -- If the invitee already sent a pending invite for the exact same window,
  -- treat this as an acceptance of that existing request instead of creating
  -- a new session + invite.
  select si.id, si.session_id
    into v_invite_id, v_session_id
  from session_invites si
  join sessions s on s.id = si.session_id
  where si.proposer_id = p_invitee_id
    and si.invitee_id = v_proposer_id
    and si.status = 'PENDING'
    and s.scheduled_start = p_start
    and s.scheduled_end = p_end
  limit 1;

  if found then
    update session_invites
      set status = 'ACCEPTED'
    where id = v_invite_id;

    -- Ensure both proposer (mirror sender) and original invitee are participants (idempotent, RLS-safe)
    perform public.upsert_session_participants(v_session_id, array[v_proposer_id, p_invitee_id]);

    update sessions
      set status = 'SCHEDULED'
    where id = v_session_id;

    return query
    select v_session_id, v_invite_id, 'ACCEPTED'::text as invite_status;
    return;
  end if;

  -- Prevent double-booking: disallow proposing a time that overlaps any other
  -- active (pending) invite that the current user has sent (outgoing only).
  -- Incoming invites are soft-blocked in the UI (warning) but not rejected here.
  --
  -- NOTE: We check AFTER the "mirror accept" path above so that accepting an
  -- exact-matching pending invite is still allowed.
  if exists (
    select 1
    from session_invites si
    join sessions s on s.id = si.session_id
    where si.status = 'PENDING'
      and si.proposer_id = v_proposer_id
      and s.scheduled_start < p_end
      and s.scheduled_end > p_start
  ) then
    raise exception 'You already have a proposed session that overlaps this time. Please pick a different slot.';
  end if;

  insert into sessions (
    organizer_id,
    location_id,
    scheduled_start,
    scheduled_end,
    status,
    visibility,
    session_type,
    title,
    capacity,
    created_at,
    updated_at,
    version
  ) values (
    v_proposer_id,
    p_location_id,
    p_start,
    p_end,
    'PROPOSED',
    'PARTICIPANTS_ONLY',
    'PARTNER_PRACTICE',
    'Proposed practice session',
    2,
    now(),
    now(),
    0
  )
  returning id into v_session_id;

  -- Organizer is automatically a participant
  insert into session_participants (session_id, user_id)
  values (v_session_id, v_proposer_id)
  on conflict do nothing;

  insert into session_invites (
    session_id,
    proposer_id,
    invitee_id,
    note,
    status,
    expires_at
  ) values (
    v_session_id,
    v_proposer_id,
    p_invitee_id,
    p_note,
    'PENDING',
    v_expires_at
  )
  returning id into v_invite_id;

  return query
  select v_session_id, v_invite_id, 'PENDING'::text as invite_status;
end;
$$;

grant execute on function public.propose_practice_session(
  uuid,
  timestamptz,
  timestamptz,
  uuid,
  text
) to authenticated;

-- ----------------------------
-- RPC: respond to invite (accept / decline / cancel)
-- ----------------------------
create or replace function public.respond_to_session_invite(
  p_invite_id uuid,
  p_action text
)
returns table (
  invite_id uuid,
  session_id uuid,
  invite_status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid;
  v_invite session_invites%rowtype;
begin
  -- Sweep expired rows so status is reliable for the invite we are about to handle.
  perform public.expire_session_invites();

  v_actor := public.current_profile_id();
  if v_actor is null then
    raise exception 'Missing profile for current user';
  end if;

  select * into v_invite
  from session_invites
  where id = p_invite_id;

  if not found then
    raise exception 'Invite not found';
  end if;

  -- If the sweeper already marked it expired, return terminal status.
  if v_invite.status = 'EXPIRED' then
    return query
    select v_invite.id, v_invite.session_id, 'EXPIRED'::text;
    return;
  end if;

  -- Enforce expiry before any action
  if v_invite.expires_at is not null and v_invite.expires_at < now() then
    update session_invites
      set status = 'EXPIRED'
    where id = v_invite.id
      and status = 'PENDING';

    -- Important: do NOT raise an exception here, or the update above will be rolled back.
    -- Instead, return a terminal status that the application can interpret as a failure.
    return query
    select v_invite.id, v_invite.session_id, 'EXPIRED'::text;
    return;
  end if;

  if v_invite.status <> 'PENDING' then
    raise exception 'Invite already handled';
  end if;

  if upper(p_action) not in ('ACCEPT','DECLINE','CANCEL') then
    raise exception 'Unsupported action %', p_action;
  end if;

  if upper(p_action) = 'ACCEPT' then
    if v_actor <> v_invite.invitee_id then
      raise exception 'Only the invitee can accept';
    end if;

    update session_invites
      set status = 'ACCEPTED'
    where id = v_invite.id;

    -- ensure both invitee and proposer are participants (idempotent, bypasses RLS)
    perform public.upsert_session_participants(
      v_invite.session_id,
      array[v_actor, v_invite.proposer_id]
    );

    update sessions
      set status = 'SCHEDULED'
    where id = v_invite.session_id;

    return query
    select v_invite.id, v_invite.session_id, 'ACCEPTED'::text;
  elsif upper(p_action) = 'DECLINE' then
    if v_actor <> v_invite.invitee_id then
      raise exception 'Only the invitee can decline';
    end if;

    update session_invites
      set status = 'DECLINED'
    where id = v_invite.id;

    return query
    select v_invite.id, v_invite.session_id, 'DECLINED'::text;
  else
    -- CANCEL by proposer
    if v_actor <> v_invite.proposer_id then
      raise exception 'Only the proposer can cancel';
    end if;

    update session_invites
      set status = 'CANCELLED'
    where id = v_invite.id;

    update sessions
      set status = 'CANCELLED'
    where id = v_invite.session_id;

    return query
    select v_invite.id, v_invite.session_id, 'CANCELLED'::text;
  end if;
end;
$$;

grant execute on function public.respond_to_session_invite(uuid, text) to authenticated;

-- ----------------------------
-- RPC: overlapping recurring windows (current user vs invitee)
-- ----------------------------
create or replace function public.suggest_overlapping_windows(
  p_invitee_id uuid
)
returns table (
  day_of_week varchar,
  start_time time,
  end_time time,
  overlap_minutes numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with cur_pref as (
    select id
    from schedule_preferences
    where user_id = public.current_profile_id()
      and deleted_at is null
    order by created_at desc
    limit 1
  ),
  invitee_pref as (
    select id
    from schedule_preferences
    where user_id = p_invitee_id
      and deleted_at is null
    order by created_at desc
    limit 1
  ),
  cur_windows as (
    select day_of_week, start_time, end_time
    from schedule_preference_windows w
    join cur_pref cp on cp.id = w.preference_id
    where w.recurring = true
  ),
  invitee_windows as (
    select day_of_week, start_time, end_time
    from schedule_preference_windows w
    join invitee_pref ip on ip.id = w.preference_id
    where w.recurring = true
  )
  select
    cw.day_of_week,
    greatest(cw.start_time, iw.start_time) as start_time,
    least(cw.end_time, iw.end_time) as end_time,
    extract(
      epoch from (
        least(cw.end_time, iw.end_time) - greatest(cw.start_time, iw.start_time)
      )
    ) / 60.0 as overlap_minutes
  from cur_windows cw
  join invitee_windows iw
    on cw.day_of_week = iw.day_of_week
  where cw.start_time < iw.end_time
    and iw.start_time < cw.end_time
  order by overlap_minutes desc, cw.day_of_week asc;
$$;

grant execute on function public.suggest_overlapping_windows(uuid) to authenticated;

-- ----------------------------
-- Sweeper: persist EXPIRED status for expired pending invites
-- ----------------------------
create or replace function public.expire_session_invites()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer;
begin
  update public.session_invites
    set status = 'EXPIRED'
  where status = 'PENDING'
    and expires_at is not null
    and expires_at < now();

  get diagnostics v_updated = row_count;
  return v_updated;
end;
$$;

-- Schedule the sweeper to run every 5 minutes.
-- Use a named job so it can be updated idempotently.
do $$
begin
  -- If the job exists from a prior run/reset, remove it first.
  perform cron.unschedule('expire_session_invites');
exception when others then
  -- ignore if job doesn't exist yet
  null;
end;
$$;

select cron.schedule(
  'expire_session_invites',
  '*/5 * * * *',
  $$select public.expire_session_invites();$$
);

