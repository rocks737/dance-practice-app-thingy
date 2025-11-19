-- ------------------------------------------------------------------
-- Dance Practice domain schema synced from backend/build/schema.sql
-- Generated via SPRING_PROFILES_ACTIVE=schema-export ./gradlew bootRun
-- ------------------------------------------------------------------
set search_path to public;

create table abuse_reports (
    created_at timestamp(6) with time zone not null,
    deleted_at timestamp(6) with time zone,
    handled_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone not null,
    version bigint not null,
    id uuid not null,
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
    latitude float(53),
    location_type smallint check (location_type between 0 and 4),
    longitude float(53),
    created_at timestamp(6) with time zone not null,
    deleted_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone not null,
    version bigint not null,
    id uuid not null,
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
    end_time time(6) not null,
    start_time time(6) not null,
    day_of_week varchar(16) not null check (day_of_week in ('MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY')),
    preference_id uuid not null,
    primary key (end_time, start_time, day_of_week, preference_id)
);

create table schedule_preferences (
    max_travel_distance_km integer,
    created_at timestamp(6) with time zone not null,
    deleted_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone not null,
    version bigint not null,
    id uuid not null,
    user_id uuid not null,
    notes varchar(1000),
    location_note varchar(255),
    primary key (id)
);

create table session_focus_areas (
    session_id uuid not null,
    focus_area varchar(64) check (focus_area in ('CONNECTION','TECHNIQUE','MUSICALITY','COMPETITION_PREP','STYLING','SOCIAL_DANCING','CHOREOGRAPHY','MINDSET','CONDITIONING'))
);

create table session_note_media (
    note_id uuid not null,
    media_url varchar(500)
);

create table session_note_tags (
    note_id uuid not null,
    tag varchar(64)
);

create table session_notes (
    created_at timestamp(6) with time zone not null,
    deleted_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone not null,
    version bigint not null,
    author_id uuid not null,
    id uuid not null,
    session_id uuid not null,
    visibility varchar(32) not null check (visibility in ('AUTHOR_ONLY','PARTICIPANTS_ONLY','PUBLIC')),
    content varchar(4000) not null,
    primary key (id)
);

create table session_participants (
    session_id uuid not null,
    user_id uuid not null,
    primary key (session_id, user_id)
);

create table sessions (
    capacity integer,
    created_at timestamp(6) with time zone not null,
    deleted_at timestamp(6) with time zone,
    scheduled_end timestamp(6) with time zone not null,
    scheduled_start timestamp(6) with time zone not null,
    updated_at timestamp(6) with time zone not null,
    version bigint not null,
    id uuid not null,
    location_id uuid,
    organizer_id uuid not null,
    session_type varchar(32) not null check (session_type in ('PARTNER_PRACTICE','GROUP_PRACTICE','PRIVATE_WITH_INSTRUCTOR','CLASS')),
    status varchar(32) not null check (status in ('PROPOSED','SCHEDULED','COMPLETED','CANCELLED')),
    visibility varchar(32) not null check (visibility in ('AUTHOR_ONLY','PARTICIPANTS_ONLY','PUBLIC')),
    title varchar(255) not null,
    primary key (id)
);

create table user_blocks (
    blocked_user_id uuid not null,
    user_id uuid not null,
    primary key (blocked_user_id, user_id)
);

create table user_notification_channels (
    user_id uuid not null,
    channel varchar(64)
);

create table user_profiles (
    account_status smallint not null check (account_status between 0 and 2),
    birth_date date,
    competitiveness_level integer not null check ((competitiveness_level<=5) and (competitiveness_level>=1)),
    primary_role smallint not null check (primary_role between 0 and 1),
    profile_visible boolean not null,
    wsdc_level smallint check (wsdc_level between 0 and 5),
    created_at timestamp(6) with time zone not null,
    deleted_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone not null,
    version bigint not null,
    auth_user_id uuid not null unique,
    home_location_id uuid,
    id uuid not null,
    first_name varchar(120) not null,
    last_name varchar(120) not null,
    display_name varchar(160),
    dance_goals varchar(500),
    bio varchar(1000),
    email varchar(255) not null,
    primary key (id),
    constraint uk_user_profiles_email unique (email)
);

create table user_roles (
    user_id uuid not null,
    role varchar(32) not null check (role in ('DANCER','INSTRUCTOR','ADMIN','ORGANIZER')),
    primary key (user_id, role)
);

alter table abuse_reports
    add constraint fk_abuse_reports_reported_user foreign key (reported_user_id) references user_profiles,
    add constraint fk_abuse_reports_reporter foreign key (reporter_id) references user_profiles,
    add constraint fk_abuse_reports_session foreign key (session_id) references sessions;

alter table schedule_preference_focus
    add constraint fk_sched_pref_focus_preference foreign key (preference_id) references schedule_preferences;

alter table schedule_preference_levels
    add constraint fk_sched_pref_levels_preference foreign key (preference_id) references schedule_preferences;

alter table schedule_preference_locations
    add constraint fk_sched_pref_locations_location foreign key (location_id) references locations,
    add constraint fk_sched_pref_locations_preference foreign key (preference_id) references schedule_preferences;

alter table schedule_preference_roles
    add constraint fk_sched_pref_roles_preference foreign key (preference_id) references schedule_preferences;

alter table schedule_preference_windows
    add constraint fk_sched_pref_windows_preference foreign key (preference_id) references schedule_preferences;

alter table schedule_preferences
    add constraint fk_schedule_preferences_user foreign key (user_id) references user_profiles;

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
    add constraint fk_session_participants_session foreign key (session_id) references sessions;

alter table sessions
    add constraint fk_sessions_location foreign key (location_id) references locations,
    add constraint fk_sessions_organizer foreign key (organizer_id) references user_profiles;

alter table user_blocks
    add constraint fk_user_blocks_blocked_user foreign key (blocked_user_id) references user_profiles,
    add constraint fk_user_blocks_user foreign key (user_id) references user_profiles;

alter table user_notification_channels
    add constraint fk_user_notification_channels_user foreign key (user_id) references user_profiles;

alter table user_profiles
    add constraint fk_user_profiles_home_location foreign key (home_location_id) references locations;

alter table user_roles
    add constraint fk_user_roles_user foreign key (user_id) references user_profiles;

-- Enforce linkage to Supabase Auth
alter table user_profiles
    add constraint fk_user_profiles_auth_user foreign key (auth_user_id) references auth.users (id);

