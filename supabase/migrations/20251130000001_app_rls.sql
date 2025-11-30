-- ------------------------------------------------------------------
-- Dance Practice App - Row Level Security (RLS)
-- Consolidated migration including all RLS policies and helper functions
-- ------------------------------------------------------------------

set search_path = public;

-- ------------------------------------------------------------------
-- Helper Functions
-- ------------------------------------------------------------------

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.user_profiles
  where auth_user_id = auth.uid()
  limit 1;
$$;

grant execute on function public.current_profile_id() to authenticated;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = public.current_profile_id()
      and ur.role = 'ADMIN'
  );
$$;

grant execute on function public.current_user_is_admin() to authenticated;

-- Helper function to check if current user is a participant in a session
-- Uses security definer to bypass RLS and avoid infinite recursion
create or replace function public.is_session_participant(session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.session_participants sp
    where sp.session_id = is_session_participant.session_id
      and sp.user_id = public.current_profile_id()
  );
$$;

grant execute on function public.is_session_participant(uuid) to authenticated;

-- Helper function to check if current user is the organizer of a session
-- Uses security definer to bypass RLS and avoid infinite recursion
create or replace function public.is_session_organizer(session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.sessions s
    where s.id = is_session_organizer.session_id
      and s.organizer_id = public.current_profile_id()
  );
$$;

grant execute on function public.is_session_organizer(uuid) to authenticated;

-- Helper function to check if current user owns a preference
create or replace function public.preference_owned_by_current(pref_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.schedule_preferences sp
    where sp.id = pref_id
      and sp.user_id = public.current_profile_id()
  );
$$;

grant execute on function public.preference_owned_by_current(uuid) to authenticated;

-- Helper function to check if current user owns a session note
create or replace function public.session_note_owned(note_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.session_notes sn
    where sn.id = note_id
      and sn.author_id = public.current_profile_id()
  );
$$;

grant execute on function public.session_note_owned(uuid) to authenticated;

-- ------------------------------------------------------------------
-- RLS Policies: user_profiles
-- ------------------------------------------------------------------

alter table public.user_profiles enable row level security;

drop policy if exists "user_profiles public read" on public.user_profiles;
create policy "user_profiles public read"
on public.user_profiles
for select
to authenticated
using (profile_visible = true);

drop policy if exists "user_profiles owner read" on public.user_profiles;
create policy "user_profiles owner read"
on public.user_profiles
for select
to authenticated
using (auth_user_id = auth.uid());

drop policy if exists "user_profiles owner update" on public.user_profiles;
create policy "user_profiles owner update"
on public.user_profiles
for update
to authenticated
using (auth_user_id = auth.uid())
with check (auth_user_id = auth.uid());

drop policy if exists "user_profiles owner delete" on public.user_profiles;
create policy "user_profiles owner delete"
on public.user_profiles
for delete
to authenticated
using (auth_user_id = auth.uid());

drop policy if exists "user_profiles owner insert" on public.user_profiles;
create policy "user_profiles owner insert"
on public.user_profiles
for insert
to authenticated
with check (auth_user_id = auth.uid());

drop policy if exists "user_profiles admin all" on public.user_profiles;
create policy "user_profiles admin all"
on public.user_profiles
for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

-- ------------------------------------------------------------------
-- RLS Policies: user_roles
-- ------------------------------------------------------------------

alter table public.user_roles enable row level security;

drop policy if exists "user_roles owner read" on public.user_roles;
create policy "user_roles owner read"
on public.user_roles
for select
to authenticated
using (
  user_id = public.current_profile_id()
);

drop policy if exists "user_roles admin all" on public.user_roles;
create policy "user_roles admin all"
on public.user_roles
for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

-- ------------------------------------------------------------------
-- RLS Policies: locations
-- ------------------------------------------------------------------

alter table public.locations enable row level security;

-- Allow authenticated users to read locations
drop policy if exists "locations readable by authenticated" on public.locations;
create policy "locations readable by authenticated"
on public.locations
for select
to authenticated
using (true);

-- Inserts only by admins
drop policy if exists "locations insertable by admins" on public.locations;
create policy "locations insertable by admins"
on public.locations
for insert
to authenticated
with check (public.current_user_is_admin());

-- Updates only by admins
drop policy if exists "locations updatable by admins" on public.locations;
create policy "locations updatable by admins"
on public.locations
for update
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

-- Deletes only by admins
drop policy if exists "locations deletable by admins" on public.locations;
create policy "locations deletable by admins"
on public.locations
for delete
to authenticated
using (public.current_user_is_admin());

-- ------------------------------------------------------------------
-- RLS Policies: schedule_preferences
-- ------------------------------------------------------------------

alter table public.schedule_preferences enable row level security;

drop policy if exists "schedule_preferences owner read" on public.schedule_preferences;
create policy "schedule_preferences owner read"
on public.schedule_preferences
for select
to authenticated
using (user_id = public.current_profile_id());

drop policy if exists "schedule_preferences owner write" on public.schedule_preferences;
create policy "schedule_preferences owner write"
on public.schedule_preferences
for all
to authenticated
using (user_id = public.current_profile_id())
with check (user_id = public.current_profile_id());

drop policy if exists "schedule_preferences admin all" on public.schedule_preferences;
create policy "schedule_preferences admin all"
on public.schedule_preferences
for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

-- ------------------------------------------------------------------
-- RLS Policies: schedule_preference child tables
-- ------------------------------------------------------------------

alter table public.schedule_preference_windows enable row level security;
alter table public.schedule_preference_roles enable row level security;
alter table public.schedule_preference_levels enable row level security;
alter table public.schedule_preference_focus enable row level security;
alter table public.schedule_preference_locations enable row level security;

do $$
declare
  tbl text;
begin
  foreach tbl in array
    array[
      'schedule_preference_windows',
      'schedule_preference_roles',
      'schedule_preference_levels',
      'schedule_preference_focus',
      'schedule_preference_locations'
    ]
  loop
    execute format('drop policy if exists "%I owner access" on public.%I;', tbl, tbl);
    execute format($fmt$
      create policy "%s owner access"
      on public.%s
      for all
      to authenticated
      using (public.preference_owned_by_current(%s.preference_id))
      with check (public.preference_owned_by_current(%s.preference_id));
    $fmt$, tbl, tbl, tbl, tbl);

    execute format('drop policy if exists "%I admin all" on public.%I;', tbl, tbl);
    execute format($fmt$
      create policy "%s admin all"
      on public.%s
      for all
      to authenticated
      using (public.current_user_is_admin())
      with check (public.current_user_is_admin());
    $fmt$, tbl, tbl);
  end loop;
end $$;

-- ------------------------------------------------------------------
-- RLS Policies: sessions
-- ------------------------------------------------------------------

alter table public.sessions enable row level security;

drop policy if exists "sessions public read" on public.sessions;
create policy "sessions public read"
on public.sessions
for select
to authenticated
using (visibility = 'PUBLIC');

drop policy if exists "sessions organizer / participant read" on public.sessions;
create policy "sessions organizer / participant read"
on public.sessions
for select
to authenticated
using (
  organizer_id = public.current_profile_id()
  or public.is_session_participant(sessions.id)
);

drop policy if exists "sessions organizer insert" on public.sessions;
create policy "sessions organizer insert"
on public.sessions
for insert
to authenticated
with check (
  organizer_id = public.current_profile_id()
);

drop policy if exists "sessions organizer update" on public.sessions;
create policy "sessions organizer update"
on public.sessions
for update
to authenticated
using (organizer_id = public.current_profile_id())
with check (organizer_id = public.current_profile_id());

drop policy if exists "sessions organizer delete" on public.sessions;
create policy "sessions organizer delete"
on public.sessions
for delete
to authenticated
using (organizer_id = public.current_profile_id());

drop policy if exists "sessions admin all" on public.sessions;
create policy "sessions admin all"
on public.sessions
for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

-- ------------------------------------------------------------------
-- RLS Policies: session_participants
-- ------------------------------------------------------------------

alter table public.session_participants enable row level security;

drop policy if exists "session_participants read" on public.session_participants;
create policy "session_participants read"
on public.session_participants
for select
to authenticated
using (
  user_id = public.current_profile_id()
  or public.is_session_organizer(session_participants.session_id)
  or public.current_user_is_admin()
);

drop policy if exists "session_participants organizer insert" on public.session_participants;
create policy "session_participants organizer insert"
on public.session_participants
for insert
to authenticated
with check (
  public.is_session_organizer(session_participants.session_id)
);

drop policy if exists "session_participants organizer update" on public.session_participants;
create policy "session_participants organizer update"
on public.session_participants
for update
to authenticated
using (
  public.is_session_organizer(session_participants.session_id)
)
with check (
  public.is_session_organizer(session_participants.session_id)
);

drop policy if exists "session_participants organizer delete" on public.session_participants;
create policy "session_participants organizer delete"
on public.session_participants
for delete
to authenticated
using (
  public.is_session_organizer(session_participants.session_id)
);

drop policy if exists "session_participants self remove" on public.session_participants;
create policy "session_participants self remove"
on public.session_participants
for delete
to authenticated
using (user_id = public.current_profile_id());

drop policy if exists "session_participants admin all" on public.session_participants;
create policy "session_participants admin all"
on public.session_participants
for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

-- ------------------------------------------------------------------
-- RLS Policies: session_focus_areas
-- ------------------------------------------------------------------

alter table public.session_focus_areas enable row level security;

drop policy if exists "session_focus_areas organizer write" on public.session_focus_areas;
create policy "session_focus_areas organizer write"
on public.session_focus_areas
for all
to authenticated
using (
  public.is_session_organizer(session_focus_areas.session_id)
)
with check (
  public.is_session_organizer(session_focus_areas.session_id)
);

drop policy if exists "session_focus_areas admin all" on public.session_focus_areas;
create policy "session_focus_areas admin all"
on public.session_focus_areas
for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

-- ------------------------------------------------------------------
-- RLS Policies: session_notes
-- ------------------------------------------------------------------

alter table public.session_notes enable row level security;
alter table public.session_note_media enable row level security;
alter table public.session_note_tags enable row level security;

drop policy if exists "session_notes read access" on public.session_notes;
create policy "session_notes read access"
on public.session_notes
for select
to authenticated
using (
  visibility = 'PUBLIC'
  or author_id = public.current_profile_id()
  or (
    visibility = 'PARTICIPANTS_ONLY'
    and public.is_session_participant(session_notes.session_id)
  )
  or public.current_user_is_admin()
);

drop policy if exists "session_notes author insert" on public.session_notes;
create policy "session_notes author insert"
on public.session_notes
for insert
to authenticated
with check (author_id = public.current_profile_id());

drop policy if exists "session_notes author update" on public.session_notes;
create policy "session_notes author update"
on public.session_notes
for update
to authenticated
using (author_id = public.current_profile_id())
with check (author_id = public.current_profile_id());

drop policy if exists "session_notes author delete" on public.session_notes;
create policy "session_notes author delete"
on public.session_notes
for delete
to authenticated
using (author_id = public.current_profile_id());

drop policy if exists "session_notes admin all" on public.session_notes;
create policy "session_notes admin all"
on public.session_notes
for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

do $$
declare
  tbl text;
begin
  foreach tbl in array array['session_note_media','session_note_tags']
  loop
    execute format('drop policy if exists "%I author access" on public.%I;', tbl, tbl);
    execute format($fmt$
      create policy "%s author access"
      on public.%s
      for all
      to authenticated
      using (public.session_note_owned(%s.note_id))
      with check (public.session_note_owned(%s.note_id));
    $fmt$, tbl, tbl, tbl, tbl);

    execute format('drop policy if exists "%I admin all" on public.%I;', tbl, tbl);
    execute format($fmt$
      create policy "%s admin all"
      on public.%s
      for all
      to authenticated
      using (public.current_user_is_admin())
      with check (public.current_user_is_admin());
    $fmt$, tbl, tbl);
  end loop;
end $$;

-- ------------------------------------------------------------------
-- RLS Policies: abuse_reports
-- ------------------------------------------------------------------

alter table public.abuse_reports enable row level security;

drop policy if exists "abuse_reports reporter read" on public.abuse_reports;
create policy "abuse_reports reporter read"
on public.abuse_reports
for select
to authenticated
using (
  reporter_id = public.current_profile_id()
);

drop policy if exists "abuse_reports reporter insert" on public.abuse_reports;
create policy "abuse_reports reporter insert"
on public.abuse_reports
for insert
to authenticated
with check (reporter_id = public.current_profile_id());

drop policy if exists "abuse_reports admin all" on public.abuse_reports;
create policy "abuse_reports admin all"
on public.abuse_reports
for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

-- ------------------------------------------------------------------
-- RLS Policies: user_blocks
-- ------------------------------------------------------------------

alter table public.user_blocks enable row level security;

drop policy if exists "user_blocks owner access" on public.user_blocks;
create policy "user_blocks owner access"
on public.user_blocks
for all
to authenticated
using (user_id = public.current_profile_id())
with check (user_id = public.current_profile_id());

drop policy if exists "user_blocks admin all" on public.user_blocks;
create policy "user_blocks admin all"
on public.user_blocks
for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

-- ------------------------------------------------------------------
-- RLS Policies: user_notification_channels
-- ------------------------------------------------------------------

alter table public.user_notification_channels enable row level security;

drop policy if exists "notification_channels owner" on public.user_notification_channels;
create policy "notification_channels owner"
on public.user_notification_channels
for all
to authenticated
using (user_id = public.current_profile_id())
with check (user_id = public.current_profile_id());

drop policy if exists "notification_channels admin all" on public.user_notification_channels;
create policy "notification_channels admin all"
on public.user_notification_channels
for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

