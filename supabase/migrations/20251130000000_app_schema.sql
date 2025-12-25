-- ------------------------------------------------------------------
-- Dance Practice App - Complete Schema
-- Consolidated migration including all schema, defaults, and triggers
-- ------------------------------------------------------------------

set search_path to public;

-- Ensure extensions are available
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- ------------------------------------------------------------------
-- Tables
-- ------------------------------------------------------------------

create table abuse_reports (
    id uuid not null default gen_random_uuid(),
    created_at timestamp(6) with time zone not null default now(),
    updated_at timestamp(6) with time zone not null default now(),
    deleted_at timestamp(6) with time zone,
    handled_at timestamp(6) with time zone,
    version bigint not null default 0,
    reported_user_id uuid,
    reporter_id uuid not null,
    session_id uuid,
    category varchar(32) not null check (category in ('HARASSMENT','SAFETY','SPAM','PAYMENT','OTHER')),
    status varchar(32) not null check (status in ('OPEN','ACKNOWLEDGED','IN_REVIEW','RESOLVED','DISMISSED')),
    admin_notes varchar(2000),
    description varchar(2000) not null,
    primary key (id)
);

create table locations (
    id uuid not null default gen_random_uuid(),
    created_at timestamp(6) with time zone not null default now(),
    updated_at timestamp(6) with time zone not null default now(),
    deleted_at timestamp(6) with time zone,
    version bigint not null default 0,
    latitude float(53),
    longitude float(53),
    location_type smallint check (location_type between 0 and 4),
    postal_code varchar(32),
    city varchar(120),
    country varchar(120),
    state varchar(120),
    description varchar(1000),
    address_line1 varchar(255),
    address_line2 varchar(255),
    name varchar(255) not null,
    primary key (id)
);

create table schedule_preferences (
    id uuid not null default gen_random_uuid(),
    created_at timestamp(6) with time zone not null default now(),
    updated_at timestamp(6) with time zone not null default now(),
    deleted_at timestamp(6) with time zone,
    version bigint not null default 0,
    user_id uuid not null,
    max_travel_distance_km integer,
    notes varchar(1000),
    location_note varchar(255),
    primary key (id)
);

create table schedule_preference_focus (
    preference_id uuid not null,
    focus_area varchar(64) check (focus_area in ('CONNECTION','TECHNIQUE','MUSICALITY','COMPETITION_PREP','STYLING','SOCIAL_DANCING','CHOREOGRAPHY','MINDSET','CONDITIONING'))
);

create table schedule_preference_levels (
    preference_id uuid not null,
    level varchar(32) check (level in ('NEWCOMER','NOVICE','INTERMEDIATE','ADVANCED','ALL_STAR','CHAMPION'))
);

create table schedule_preference_locations (
    location_id uuid not null,
    preference_id uuid not null,
    primary key (location_id, preference_id)
);

create table schedule_preference_roles (
    preference_id uuid not null,
    role varchar(16) check (role in ('LEAD','FOLLOW'))
);

create table schedule_preference_windows (
    id uuid not null default gen_random_uuid(),
    preference_id uuid not null,
    day_of_week varchar(16) not null check (day_of_week in ('MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY')),
    start_time time(6) not null,
    end_time time(6) not null,
    recurring boolean not null default true,
    specific_date date,
    primary key (id),
    constraint schedule_preference_windows_unique unique (preference_id, day_of_week, start_time, end_time, recurring, specific_date)
);

comment on column schedule_preference_windows.recurring is 
'If true, this window applies every week on the specified day. If false, it only applies to the specific_date.';

comment on column schedule_preference_windows.specific_date is 
'For non-recurring windows, the specific date this window applies to.';

create table sessions (
    id uuid not null default gen_random_uuid(),
    created_at timestamp(6) with time zone not null default now(),
    updated_at timestamp(6) with time zone not null default now(),
    deleted_at timestamp(6) with time zone,
    version bigint not null default 0,
    organizer_id uuid not null,
    location_id uuid,
    scheduled_start timestamp(6) with time zone not null,
    scheduled_end timestamp(6) with time zone not null,
    capacity integer,
    session_type varchar(32) not null check (session_type in ('PARTNER_PRACTICE','GROUP_PRACTICE','PRIVATE_WITH_INSTRUCTOR','CLASS')),
    status varchar(32) not null check (status in ('PROPOSED','SCHEDULED','COMPLETED','CANCELLED')),
    visibility varchar(32) not null check (visibility in ('AUTHOR_ONLY','PARTICIPANTS_ONLY','PUBLIC')),
    title varchar(255) not null,
    primary key (id)
);

create table session_focus_areas (
    session_id uuid not null,
    focus_area varchar(64) check (focus_area in ('CONNECTION','TECHNIQUE','MUSICALITY','COMPETITION_PREP','STYLING','SOCIAL_DANCING','CHOREOGRAPHY','MINDSET','CONDITIONING'))
);

create table session_participants (
    session_id uuid not null,
    user_id uuid not null,
    primary key (session_id, user_id)
);

create table session_notes (
    id uuid not null default gen_random_uuid(),
    created_at timestamp(6) with time zone not null default now(),
    updated_at timestamp(6) with time zone not null default now(),
    deleted_at timestamp(6) with time zone,
    version bigint not null default 0,
    author_id uuid not null,
    session_id uuid not null,
    visibility varchar(32) not null check (visibility in ('AUTHOR_ONLY','PARTICIPANTS_ONLY','PUBLIC')),
    content varchar(4000) not null,
    primary key (id)
);

create table session_note_media (
    note_id uuid not null,
    media_url varchar(500)
);

create table session_note_tags (
    note_id uuid not null,
    tag varchar(64)
);

create table user_profiles (
    id uuid not null default gen_random_uuid(),
    created_at timestamp(6) with time zone not null default now(),
    updated_at timestamp(6) with time zone not null default now(),
    deleted_at timestamp(6) with time zone,
    version bigint not null default 0,
    auth_user_id uuid not null unique,
    home_location_id uuid,
    email varchar(255) not null,
    first_name varchar(120) not null,
    last_name varchar(120) not null,
    display_name varchar(160),
    birth_date date,
    primary_role smallint not null check (primary_role between 0 and 1),
    wsdc_level smallint check (wsdc_level between 0 and 5),
    competitiveness_level integer not null check ((competitiveness_level<=5) and (competitiveness_level>=1)),
    account_status smallint not null check (account_status between 0 and 2),
    profile_visible boolean not null,
    bio varchar(1000),
    dance_goals varchar(500),
    primary key (id),
    constraint uk_user_profiles_email unique (email)
);

create table user_roles (
    user_id uuid not null,
    role varchar(32) not null check (role in ('DANCER','INSTRUCTOR','ADMIN','ORGANIZER')),
    primary key (user_id, role)
);

create table user_blocks (
    user_id uuid not null,
    blocked_user_id uuid not null,
    primary key (blocked_user_id, user_id)
);

create table user_notification_channels (
    user_id uuid not null,
    channel varchar(64)
);

-- ------------------------------------------------------------------
-- Foreign Key Constraints
-- ------------------------------------------------------------------

alter table abuse_reports
    add constraint fk_abuse_reports_reported_user foreign key (reported_user_id) references user_profiles,
    add constraint fk_abuse_reports_reporter foreign key (reporter_id) references user_profiles,
    add constraint fk_abuse_reports_session foreign key (session_id) references sessions;

alter table schedule_preference_focus
    add constraint fk_sched_pref_focus_preference foreign key (preference_id) references schedule_preferences;

alter table schedule_preference_levels
    add constraint fk_sched_pref_levels_preference foreign key (preference_id) references schedule_preferences;

alter table schedule_preference_locations
    add constraint fk_sched_pref_locations_location foreign key (location_id) references locations on delete cascade,
    add constraint fk_sched_pref_locations_preference foreign key (preference_id) references schedule_preferences;

alter table schedule_preference_roles
    add constraint fk_sched_pref_roles_preference foreign key (preference_id) references schedule_preferences;

alter table schedule_preference_windows
    add constraint fk_sched_pref_windows_preference foreign key (preference_id) references schedule_preferences;

alter table schedule_preferences
    add constraint fk_schedule_preferences_user foreign key (user_id) references user_profiles;

-- Ensure each user can only have one active schedule preference at a time
-- Deleted preferences (deleted_at IS NOT NULL) are excluded from this constraint
create unique index idx_schedule_preferences_user_id_unique
on schedule_preferences (user_id)
where deleted_at is null;

alter table session_focus_areas
    add constraint fk_session_focus_areas_session foreign key (session_id) references sessions;

alter table session_note_media
    add constraint fk_session_note_media_note foreign key (note_id) references session_notes;

alter table session_note_tags
    add constraint fk_session_note_tags_note foreign key (note_id) references session_notes;

alter table session_notes
    add constraint fk_session_notes_author foreign key (author_id) references user_profiles,
    add constraint fk_session_notes_session foreign key (session_id) references sessions;

alter table session_participants
    add constraint fk_session_participants_user foreign key (user_id) references user_profiles,
    add constraint fk_session_participants_session foreign key (session_id) references sessions on delete cascade;

alter table sessions
    add constraint fk_sessions_location foreign key (location_id) references locations,
    add constraint fk_sessions_organizer foreign key (organizer_id) references user_profiles;

alter table user_blocks
    add constraint fk_user_blocks_blocked_user foreign key (blocked_user_id) references user_profiles,
    add constraint fk_user_blocks_user foreign key (user_id) references user_profiles;

alter table user_notification_channels
    add constraint fk_user_notification_channels_user foreign key (user_id) references user_profiles;

alter table user_profiles
    add constraint fk_user_profiles_home_location foreign key (home_location_id) references locations,
    add constraint fk_user_profiles_auth_user foreign key (auth_user_id) references auth.users (id);

alter table user_roles
    add constraint fk_user_roles_user foreign key (user_id) references user_profiles;

-- ------------------------------------------------------------------
-- Timestamp Triggers
-- ------------------------------------------------------------------

-- Function to enforce created_at and updated_at on INSERT
-- This will override any value provided by the client
create or replace function set_timestamps_on_insert()
returns trigger as $$
begin
    new.created_at = now();
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

-- Function to automatically update the updated_at timestamp
-- This will override any value provided by the client
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

-- Create triggers to enforce timestamps on INSERT (override any client values)
create trigger set_abuse_reports_timestamps before insert on abuse_reports
    for each row execute function set_timestamps_on_insert();

create trigger set_locations_timestamps before insert on locations
    for each row execute function set_timestamps_on_insert();

create trigger set_schedule_preferences_timestamps before insert on schedule_preferences
    for each row execute function set_timestamps_on_insert();

create trigger set_session_notes_timestamps before insert on session_notes
    for each row execute function set_timestamps_on_insert();

create trigger set_sessions_timestamps before insert on sessions
    for each row execute function set_timestamps_on_insert();

create trigger set_user_profiles_timestamps before insert on user_profiles
    for each row execute function set_timestamps_on_insert();

-- Create triggers to automatically update updated_at on UPDATE
create trigger update_abuse_reports_updated_at before update on abuse_reports
    for each row execute function update_updated_at_column();

create trigger update_locations_updated_at before update on locations
    for each row execute function update_updated_at_column();

create trigger update_schedule_preferences_updated_at before update on schedule_preferences
    for each row execute function update_updated_at_column();

create trigger update_session_notes_updated_at before update on session_notes
    for each row execute function update_updated_at_column();

create trigger update_sessions_updated_at before update on sessions
    for each row execute function update_updated_at_column();

create trigger update_user_profiles_updated_at before update on user_profiles
    for each row execute function update_updated_at_column();

