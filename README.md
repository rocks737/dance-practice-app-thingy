# dance-practice-app-thingy

Backend and frontend playground for the dance practice partner matcher.

## Backend quickstart

```bash
cd backend
./gradlew bootRun
```

The API will be available on `http://localhost:8080` (see `/api/*` routes).  
Swagger/OpenAPI isn’t wired up yet, but controllers live in `com.dancepractice.app.web.controller`.

## Running with Docker Compose

```bash
docker compose up --build
```

Services:

- `postgres` – stateful Postgres 16 database (persisted via the `pgdata` volume)
- `backend` – Spring Boot app (profile `local`, auto-migrated schema via Hibernate)

The compose file exposes backend on `8080` and Postgres on `5432`.

## Tests

```bash
cd backend
./gradlew test
```

Repository tests run against Testcontainers/Postgres, so Docker must be available.

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

## Supabase CLI & schema export

- Install/update the Supabase CLI with npm (local project scope keeps versions aligned):

  ```bash
  npm install supabase --save-dev
  npx supabase --version
  ```

- Export the current JPA schema via the dedicated Spring profile. This writes `backend/build/schema.sql` (override the path by setting `SCHEMA_EXPORT_TARGET`):

  ```bash
  cd backend
  ./gradlew bootRun -Dspring-boot.run.profiles=schema-export --no-daemon
  ```

  The app starts in non-web mode, generates the SQL script, logs the absolute output path, and exits automatically. Use the resulting file to seed Supabase migrations.

- The backend `user_profiles` table stores dancer metadata and references Supabase Auth via `auth_user_id`. User profiles are **automatically created** when someone signs up through Supabase Auth (via database trigger). The trigger creates a default profile with DANCER role.

- To add additional roles (ADMIN, INSTRUCTOR, ORGANIZER):

  ```sql
  -- Add ADMIN role to a user
  INSERT INTO user_roles (user_id, role)
  SELECT id, 'ADMIN'
  FROM user_profiles
  WHERE email = 'user@example.com'
  ON CONFLICT (user_id, role) DO NOTHING;
  ```

- For existing users who signed up before the auto-profile trigger was added, use:

  ```sql
  SELECT public.create_profile_for_existing_user('user@example.com');
  ```

- Supabase bootstrap assets now live under `supabase/` (copied from the Basejump template). To recreate the Supabase state locally run:

  ```bash
  supabase start         # spins up local stack using supabase/config.toml
  supabase db reset      # applies Basejump bootstrap + domain migrations (see supabase/migrations)
  ```

  To push your local migrations to the hosted project (ref `ycouamhfhambbfcakkqo`), run `supabase db push` after logging in via `npx supabase login`.

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