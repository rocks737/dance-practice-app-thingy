# dance-practice-app-thingy

Frontend + Supabase playground for the dance practice partner matcher.

## Where did the Java backend go?

There isn’t one anymore. The previous Spring Boot/Gradle stack has been removed so we don’t confuse people (or AI assistants) into thinking there’s an API to run. The `backend/` folder now only contains **reference-only JPA entities/enums** that document the Supabase schema.

- ✅ Safe to open/read to understand relationships, column names, soft-delete patterns, etc.
- ❌ Not runnable—no Gradle wrapper, Dockerfile, controllers, or services exist here.
- 📝 Each Java file includes a comment reminding future readers that Supabase is the real backend.

If you need executable code, copy the entities into your own project or inspect the Supabase migrations instead.

## Frontend

The frontend is a Next.js app using the Basejump starter kit, configured for Supabase authentication and account management.

### Running locally

```bash
cd frontend
yarn install
yarn dev
```

The app will be available at `http://localhost:3000`.

### Configuration

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://ycouamhfhambbfcakkqo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_URL=http://localhost:3000
```

### Deploying to Vercel

```bash
cd frontend
vercel --prod
```

Or connect via GitHub: push your repo and import it in the Vercel dashboard. Add the environment variables in Project Settings → Environment Variables.

## Supabase CLI workflow

- Install/update the CLI locally:

  ```bash
  npm install supabase --save-dev
  npx supabase --version
  ```

- Boot the local stack and apply every migration in `supabase/migrations`:

  ```bash
  supabase start
  supabase db reset
  ```

- Push new migrations to the hosted project (ref `ycouamhfhambbfcakkqo`) when you’re ready:

  ```bash
  npx supabase login
  supabase db push
  ```

That’s it—no JVM build, no schema-export profile, no Docker Compose backend. Supabase is the source of truth for data + auth.

## User Profile Auto-Creation

User profiles are **automatically created at the API layer** on first login after authentication. This happens in the Next.js middleware (`src/lib/supabase/middleware.ts`).

New users automatically get:
- ✅ A `user_profiles` record linked to their auth account
- ✅ Default DANCER role
- ✅ Default settings (INTERMEDIATE skill, LEADER role, profile visible)

### Why API Layer vs Database Trigger?

We moved profile creation from database triggers to the application layer for:
- ✨ Better control over onboarding flows
- ✨ Easier to customize and validate
- ✨ Simpler to add business logic
- ✨ Future-proof for custom onboarding workflows

### Adding Roles

To add additional roles (ADMIN, INSTRUCTOR, ORGANIZER):

```sql
-- Add ADMIN role to a user
INSERT INTO user_roles (user_id, role)
SELECT id, 'ADMIN'
FROM user_profiles
WHERE email = 'user@example.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

### Backfilling Existing Users

If you have auth users without profiles, use:

```bash
# Run the backfill script
npx supabase db execute -f supabase/migrations/helpers/backfill_steve_profile.sql

# Or manually in SQL editor:
# See supabase/migrations/helpers/create_existing_user_profiles.sql
```