-- Quick script to create a test user in local Supabase
-- Run this in Supabase Studio SQL Editor: http://127.0.0.1:54323

-- First, create the auth user
DO $$
DECLARE
  auth_user_id uuid;
  profile_id uuid;
BEGIN
  -- Create auth user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'test@example.com',
    crypt('testpassword123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO auth_user_id;

  -- Create user profile
  INSERT INTO public.user_profiles (
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
  ) VALUES (
    gen_random_uuid(),
    auth_user_id,
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
  ) RETURNING id INTO profile_id;

  -- Add DANCER role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (profile_id, 'DANCER')
  ON CONFLICT (user_id, role) DO NOTHING;

  RAISE NOTICE 'Test user created successfully!';
  RAISE NOTICE 'Email: test@example.com';
  RAISE NOTICE 'Password: test123';
  RAISE NOTICE 'Auth User ID: %', auth_user_id;
  RAISE NOTICE 'Profile ID: %', profile_id;
END $$;

