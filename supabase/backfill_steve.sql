-- Simple backfill script for stevebyerly62@gmail.com
-- Just creates the profile and adds roles - no functions

-- Create profile and add roles in one go
WITH new_profile AS (
  INSERT INTO user_profiles (
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
  )
  SELECT 
    gen_random_uuid(),
    au.id,
    'Steve',
    'Byerly',
    au.email,
    0, -- LEADER
    2, -- INTERMEDIATE
    3, -- Medium competitiveness
    true,
    0, -- ACTIVE
    now(),
    now(),
    0
  FROM auth.users au
  WHERE au.email = 'stevebyerly62@gmail.com'
    AND NOT EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.auth_user_id = au.id
    )
  RETURNING id
)
INSERT INTO user_roles (user_id, role)
SELECT id, role
FROM new_profile
CROSS JOIN (VALUES ('ADMIN'), ('DANCER')) AS roles(role)
ON CONFLICT (user_id, role) DO NOTHING
RETURNING *;

