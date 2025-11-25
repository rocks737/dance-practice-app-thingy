-- Enable RLS on locations and restrict writes to admins
alter table if exists public.locations enable row level security;

-- Allow authenticated users to read locations
drop policy if exists "Locations readable by authenticated" on public.locations;
create policy "Locations readable by authenticated"
on public.locations
for select
to authenticated
using (true);

-- Helper predicate: current auth user is admin via user_roles
-- We inline the EXISTS checks in each policy to avoid requiring a SQL function

-- Inserts only by admins
drop policy if exists "Locations insertable by admins" on public.locations;
create policy "Locations insertable by admins"
on public.locations
for insert
to authenticated
with check (
  exists (
    select 1
    from public.user_profiles up
    join public.user_roles ur on ur.user_id = up.id
    where up.auth_user_id = auth.uid()
      and ur.role = 'ADMIN'
  )
);

-- Updates only by admins
drop policy if exists "Locations updatable by admins" on public.locations;
create policy "Locations updatable by admins"
on public.locations
for update
to authenticated
using (
  exists (
    select 1
    from public.user_profiles up
    join public.user_roles ur on ur.user_id = up.id
    where up.auth_user_id = auth.uid()
      and ur.role = 'ADMIN'
  )
)
with check (
  exists (
    select 1
    from public.user_profiles up
    join public.user_roles ur on ur.user_id = up.id
    where up.auth_user_id = auth.uid()
      and ur.role = 'ADMIN'
  )
);

-- Deletes only by admins
drop policy if exists "Locations deletable by admins" on public.locations;
create policy "Locations deletable by admins"
on public.locations
for delete
to authenticated
using (
  exists (
    select 1
    from public.user_profiles up
    join public.user_roles ur on ur.user_id = up.id
    where up.auth_user_id = auth.uid()
      and ur.role = 'ADMIN'
  )
);


