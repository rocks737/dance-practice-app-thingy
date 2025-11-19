-- Create a test user with email/password
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/ycouamhfhambbfcakkqo/sql/new

-- Create auth user
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('testpassword123', gen_salt('bf')), -- Password: testpassword123
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) returning id;

-- Note the returned UUID and use it to create a user profile
-- Replace YOUR_AUTH_USER_ID with the UUID from above
insert into public.user_profiles (
  id,
  auth_user_id,
  first_name,
  last_name,
  email,
  primary_role,
  wsdc_level,
  competitiveness_level,
  profile_visible,
  account_status,
  created_at,
  updated_at,
  version
) values (
  gen_random_uuid(),
  'YOUR_AUTH_USER_ID', -- Replace this with the UUID from the first query
  'Test',
  'User',
  'test@example.com',
  0, -- LEADER
  2, -- INTERMEDIATE
  3,
  true,
  0, -- ACTIVE
  now(),
  now(),
  0
) returning id;

-- To make them an admin, insert into user_roles:
insert into public.user_roles (user_id, role)
values (
  'YOUR_USER_PROFILE_ID', -- Replace with the UUID from the second query
  'ADMIN'
);

