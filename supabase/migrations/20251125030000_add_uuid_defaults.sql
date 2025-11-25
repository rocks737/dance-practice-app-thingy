-- Ensure gen_random_uuid() is available (Supabase projects typically have extensions schema)
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- Set default UUIDs for primary-key id columns so clients don't need to supply ids
alter table public.user_profiles
  alter column id set default gen_random_uuid();

alter table public.locations
  alter column id set default gen_random_uuid();

alter table public.schedule_preferences
  alter column id set default gen_random_uuid();

alter table public.sessions
  alter column id set default gen_random_uuid();

alter table public.session_notes
  alter column id set default gen_random_uuid();

alter table public.abuse_reports
  alter column id set default gen_random_uuid();


