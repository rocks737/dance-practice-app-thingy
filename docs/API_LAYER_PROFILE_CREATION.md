# Profile Creation at API Layer - Complete Setup

## 🎯 What Changed

We moved user profile creation from a **database trigger** to the **API/application layer** for better control and flexibility.

### Before (Database Trigger)
- ❌ Profile created automatically by Postgres trigger
- ❌ Hard to customize or add business logic
- ❌ Difficult to add onboarding flows
- ❌ Database-level coupling

### After (API Layer)
- ✅ Profile created by Next.js middleware on first request
- ✅ Easy to customize and validate
- ✅ Application-level control
- ✅ Ready for future onboarding workflows

---

## 📁 Files Changed

### 1. **Middleware** (`frontend/src/lib/supabase/middleware.ts`)
Added `ensureUserProfileExists()` function that:
- Runs on every authenticated request
- Checks if user profile exists
- Creates profile with defaults if missing
- Adds default DANCER role

### 2. **API Service** (`frontend/src/lib/api/user-profile.ts`)
Created reusable service with:
- `createDefaultUserProfile()` - Creates profile with defaults
- `ensureUserProfile()` - Idempotent profile creation
- Full TypeScript types

### 3. **Database Migration** (`supabase/migrations/20251119130000_remove_auto_profile_trigger.sql`)
Removes the old trigger:
- Drops `on_auth_user_created` trigger
- Drops `handle_new_user()` function

### 4. **Backfill Script** (`supabase/migrations/helpers/backfill_steve_profile.sql`)
SQL script to create your profile with ADMIN role

---

## 🚀 Deployment Steps

### Step 1: Deploy Database Changes
```bash
cd /home/steve/workspace/dance-practice-app-thingy
npx supabase db push
```
✅ **COMPLETED** - Trigger removed from database

### Step 2: Create Your Profile
Go to Supabase SQL Editor:
https://supabase.com/dashboard/project/ycouamhfhambbfcakkqo/sql/new

Run this SQL:
```sql
-- Create profile and add roles for your account
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
    3,
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
```

This will:
- ✅ Create your user_profiles record
- ✅ Add both ADMIN and DANCER roles
- ✅ Return the created records

### Step 3: Verify
```sql
-- Check your profile and roles
SELECT 
  up.id,
  up.email,
  up.first_name,
  up.last_name,
  array_agg(ur.role ORDER BY ur.role) as roles
FROM user_profiles up
LEFT JOIN user_roles ur ON up.id = ur.user_id
WHERE up.email = 'stevebyerly62@gmail.com'
GROUP BY up.id, up.email, up.first_name, up.last_name;
```

Expected output:
```
id  | email                    | first_name | last_name | roles
----|--------------------------|------------|-----------|---------------
xxx | stevebyerly62@gmail.com  | Steve      | Byerly    | {ADMIN,DANCER}
```

### Step 4: Test the App
1. Refresh your browser (or sign out and back in)
2. You should see the **Admin** link in the sidebar
3. All pages should work correctly

---

## 🔄 How It Works Now

### For Existing Users (You)
1. Run the backfill SQL script ☝️
2. Refresh browser
3. Middleware sees you have a profile → continues normally

### For New Users (After This Change)
1. User signs up through Supabase Auth → creates `auth.users` record
2. User visits any page after login
3. Middleware runs:
   - Gets user from auth
   - Checks if profile exists in `user_profiles`
   - If not, creates profile with defaults + DANCER role
4. User can immediately use the app!

---

## 🎨 Default Profile Values

New users get:
```typescript
{
  first_name: '',
  last_name: '',
  primary_role: 0,        // LEADER
  wsdc_level: 2,          // INTERMEDIATE
  competitiveness_level: 3,
  profile_visible: true,
  account_status: 0,      // ACTIVE
  roles: ['DANCER']       // Default role
}
```

These can be customized in the onboarding flow later!

---

## 🛠️ Future Enhancements

Now that profile creation is in the application layer, you can easily:

1. **Custom Onboarding Flow**
   ```typescript
   // Redirect new users to onboarding
   if (profileJustCreated) {
     redirect('/onboarding/welcome')
   }
   ```

2. **Collect More Info**
   ```typescript
   // Get first/last name from OAuth
   const firstName = user.user_metadata?.first_name || ''
   const lastName = user.user_metadata?.last_name || ''
   ```

3. **Role Assignment Logic**
   ```typescript
   // Assign role based on email domain
   const isInstructor = email.endsWith('@danceschool.com')
   const role = isInstructor ? 'INSTRUCTOR' : 'DANCER'
   ```

4. **Validation & Business Logic**
   ```typescript
   // Validate age, location, etc.
   if (!isValidAge(birthDate)) {
     throw new Error('Must be 18+')
   }
   ```

---

## ✅ Checklist

- [x] Database trigger removed
- [x] Middleware updated with profile creation logic
- [x] API service created for reusability
- [ ] **Run backfill script for your account** ← DO THIS NOW
- [ ] Test: Refresh app and verify Admin link appears
- [ ] Test: Create new test user and verify profile is auto-created

---

## 📚 References

- Middleware: `frontend/src/lib/supabase/middleware.ts` (line 15-62)
- API Service: `frontend/src/lib/api/user-profile.ts`
- Backfill Script: `supabase/migrations/helpers/backfill_steve_profile.sql`
- Migration: `supabase/migrations/20251119130000_remove_auto_profile_trigger.sql`

