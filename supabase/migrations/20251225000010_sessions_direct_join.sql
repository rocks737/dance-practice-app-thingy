-- Allow direct "Join session" by inserting into session_participants as the current user.
-- Scope: PUBLIC sessions only (simple v1), with capacity + status enforcement.
--
-- This uses a SECURITY DEFINER helper to avoid RLS recursion when counting participants.

set search_path = public;

create or replace function public.session_is_joinable(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.sessions s
    where s.id = p_session_id
      and s.visibility = 'PUBLIC'
      and s.status in ('PROPOSED','SCHEDULED')
      and (
        s.capacity is null
        or (
          select count(*)
          from public.session_participants sp
          where sp.session_id = s.id
        ) < s.capacity
      )
  );
$$;

grant execute on function public.session_is_joinable(uuid) to authenticated;

-- Policy: allow authenticated users to join themselves to joinable sessions.
drop policy if exists "session_participants self join public" on public.session_participants;
create policy "session_participants self join public"
on public.session_participants
for insert
to authenticated
with check (
  user_id = public.current_profile_id()
  and public.session_is_joinable(session_participants.session_id)
);


