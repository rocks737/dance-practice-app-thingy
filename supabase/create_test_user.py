#!/usr/bin/env python3
"""
Script to create a test user in local Supabase instance.
This connects to the local Supabase database and creates a test user with profile.

Install dependencies:
    pip install -r requirements.txt
    # or
    pip install psycopg2-binary
"""

import sys

try:
    import psycopg2
except ImportError:
    print("Error: psycopg2 is not installed.")
    print("Install it with: pip install psycopg2-binary")
    print("Or install from requirements.txt: pip install -r requirements.txt")
    sys.exit(1)

from uuid import uuid4

# Local Supabase connection details
DB_CONFIG = {
    "host": "127.0.0.1",
    "port": 54322,
    "database": "postgres",
    "user": "postgres",
    "password": "postgres",
}

TEST_USER = {
    "email": "test@example.com",
    "password": "test123",
    "first_name": "Test",
    "last_name": "User",
}

def create_test_user():
    """Create a test user in the local Supabase instance."""
    try:
        print("Connecting to local Supabase database...")
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = False
        cur = conn.cursor()
        
        print("Creating auth user...")
        # Generate UUIDs
        auth_user_id = uuid4()
        instance_id = "00000000-0000-0000-0000-000000000000"
        
        # Create auth user
        cur.execute("""
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
                %s, %s, 'authenticated', 'authenticated', %s,
                crypt(%s, gen_salt('bf')),
                now(),
                '{"provider":"email","providers":["email"]}'::jsonb,
                '{}'::jsonb,
                now(),
                now(),
                '', '', '', ''
            )
            ON CONFLICT (id) DO NOTHING
            RETURNING id;
        """, (instance_id, str(auth_user_id), TEST_USER["email"], TEST_USER["password"]))
        
        result = cur.fetchone()
        if result:
            auth_user_id = result[0]
            print(f"✓ Auth user created: {auth_user_id}")
        else:
            # User might already exist, get the ID
            cur.execute("""
                SELECT id FROM auth.users WHERE email = %s;
            """, (TEST_USER["email"],))
            result = cur.fetchone()
            if result:
                auth_user_id = result[0]
                print(f"✓ Auth user already exists: {auth_user_id}")
            else:
                print("✗ Failed to create or find auth user")
                conn.rollback()
                return False
        
        print("Creating user profile...")
        profile_id = uuid4()
        
        cur.execute("""
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
                %s, %s, %s, %s, %s,
                0, 2, 3, true, 0,
                now(), now(), 0
            )
            ON CONFLICT (auth_user_id) DO NOTHING
            RETURNING id;
        """, (
            str(profile_id),
            str(auth_user_id),
            TEST_USER["first_name"],
            TEST_USER["last_name"],
            TEST_USER["email"],
        ))
        
        result = cur.fetchone()
        if result:
            profile_id = result[0]
            print(f"✓ User profile created: {profile_id}")
        else:
            # Profile might already exist
            cur.execute("""
                SELECT id FROM public.user_profiles WHERE auth_user_id = %s;
            """, (str(auth_user_id),))
            result = cur.fetchone()
            if result:
                profile_id = result[0]
                print(f"✓ User profile already exists: {profile_id}")
            else:
                print("✗ Failed to create or find user profile")
                conn.rollback()
                return False
        
        print("Adding DANCER role...")
        cur.execute("""
            INSERT INTO public.user_roles (user_id, role)
            VALUES (%s, 'DANCER')
            ON CONFLICT (user_id, role) DO NOTHING;
        """, (str(profile_id),))
        
        conn.commit()
        cur.close()
        conn.close()
        
        print("\n" + "="*50)
        print("✓ Test user created successfully!")
        print("="*50)
        print(f"Email: {TEST_USER['email']}")
        print(f"Password: {TEST_USER['password']}")
        print(f"Auth User ID: {auth_user_id}")
        print(f"Profile ID: {profile_id}")
        print("="*50)
        return True
        
    except psycopg2.OperationalError as e:
        print(f"✗ Database connection error: {e}")
        print("\nMake sure Supabase is running:")
        print("  npx supabase start")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        if 'conn' in locals():
            conn.rollback()
        return False

if __name__ == "__main__":
    success = create_test_user()
    sys.exit(0 if success else 1)

