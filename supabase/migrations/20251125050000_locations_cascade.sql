set search_path = public;

alter table public.schedule_preference_locations
  drop constraint if exists fk_sched_pref_locations_location;

alter table public.schedule_preference_locations
  add constraint fk_sched_pref_locations_location
    foreign key (location_id)
    references public.locations (id)
    on delete cascade;


