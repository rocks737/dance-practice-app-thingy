-- Ensure mirrored auto-accept inserts both participants and allow invitee inserts via RLS

-- Helper to upsert participants with superuser privileges (RLS-safe)
-- Used by propose_practice_session, respond_to_session_invite, and participant triggers.
create or replace function public.upsert_session_participants(p_session_id uuid, p_user_ids uuid[])
returns void
language sql
security definer
set search_path = public
as $$
  insert into session_participants (session_id, user_id)
  select p_session_id, unnest(p_user_ids)
  on conflict do nothing;
$$;
grant execute on function public.upsert_session_participants(uuid, uuid[]) to authenticated;

-- RLS: allow invitee to insert their participant row when their invite is accepted
drop policy if exists "session_participants invitee accepted insert" on public.session_participants;
create policy "session_participants invitee accepted insert"
on public.session_participants
for insert
to authenticated
with check (
  exists (
    select 1
    from public.session_invites si
    where si.session_id = session_participants.session_id
      and si.invitee_id = public.current_profile_id()
      and si.status = 'ACCEPTED'
  )
);

-- Ensure participants are present whenever an invite becomes accepted
create or replace function public.ensure_session_invite_participants()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'ACCEPTED' then
    perform public.upsert_session_participants(new.session_id, array[new.proposer_id, new.invitee_id]);
  end if;
  return new;
end;
$$;

drop trigger if exists session_invites_add_participants on public.session_invites;
create trigger session_invites_add_participants
after update on public.session_invites
for each row
when (old.status is distinct from new.status and new.status = 'ACCEPTED')
execute procedure public.ensure_session_invite_participants();

-- Defensive: whenever a session becomes scheduled, ensure both proposer/invitee participants exist
create or replace function public.ensure_session_participants_on_schedule()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  inv record;
begin
  for inv in
    select proposer_id, invitee_id
    from session_invites
    where session_id = new.id
      and status = 'ACCEPTED'
  loop
    perform public.upsert_session_participants(new.id, array[inv.proposer_id, inv.invitee_id]);
  end loop;
  return new;
end;
$$;

drop trigger if exists sessions_ensure_participants on public.sessions;
create trigger sessions_ensure_participants
after update on public.sessions
for each row
when (old.status is distinct from new.status and new.status = 'SCHEDULED')
execute procedure public.ensure_session_participants_on_schedule();

