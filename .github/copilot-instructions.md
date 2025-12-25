# Dance Practice App - AI Agent Instructions

## Architecture Overview

**Three-Tier Stack:**
- **Frontend**: Next.js 15 (App Router) with TypeScript, React 18, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL + Row Level Security + Edge Functions)
- **Auth**: Supabase Auth with email verification

**NO Spring Boot backend exists.** The `backend/` folder contains reference-only JPA entities documenting the database schema. All backend logic runs in Supabase via RLS policies, triggers, and PostgreSQL functions.

## Critical Developer Workflows

### Local Development Setup
```bash
# Frontend
cd frontend && yarn install && yarn dev  # http://localhost:3000

# Supabase (required for full functionality)
npx supabase start                       # Boots local Supabase stack
npx supabase db reset                    # Applies all migrations
```

### Testing Commands
```bash
# Frontend tests (no Supabase required)
npm test                                 # Unit tests with Jest
npm run test:watch                       # Watch mode
npm run test:coverage                    # Coverage report

# Integration tests (requires supabase start)
npm run test:integration                 # Supabase-backed tests

# E2E tests
npm run test:e2e                         # Playwright tests
```

### Database Migrations
- **Create**: Add `.sql` file to `supabase/migrations/` with timestamp prefix
- **Apply locally**: `npx supabase db reset`
- **Push to production**: `npx supabase db push` (after `npx supabase login`)

## Project-Specific Patterns

### Supabase Client Initialization
**CRITICAL**: Use the correct client for the context:

```typescript
// Server Components (async functions only)
import { createClient } from "@/lib/supabase/server"
const supabase = await createClient()

// Client Components ("use client" directive)
import { createClient } from "@/lib/supabase/client"
const supabase = createClient()

// Middleware (not imported directly - uses validateSession)
// See frontend/src/lib/supabase/middleware.ts
```

### Next.js Route Organization
```
frontend/src/app/
├── (app)/              # Authenticated routes with AppSidebar layout
│   ├── layout.tsx      # Enforces auth, renders sidebar
│   ├── profile/
│   ├── schedule/
│   ├── matches/
│   ├── sessions/
│   └── admin/
├── auth/               # Supabase auth callbacks
├── login/              # Public login page
├── signup/             # Multi-step signup flow (4 steps)
└── designer-preview/   # Public UI component preview (no auth)
```

### User Profile Auto-Creation
Profiles are created **at the API layer** (not database triggers) on first login via [middleware.ts](frontend/src/middleware.ts). After Supabase auth succeeds, middleware checks if `user_profiles` exists; if missing, it redirects to `/signup` to complete onboarding.

### Multi-Step Signup Flow
Users must complete 4 steps ([docs/SIGNUP_FLOW_IMPLEMENTATION.md](docs/SIGNUP_FLOW_IMPLEMENTATION.md)):
1. Email/password (Supabase auth)
2. Personal info (name, birthdate)
3. Dance profile (role, skill level, bio)
4. Schedule availability (at least one time window required)

Middleware enforces completion before accessing protected routes.

### Row Level Security (RLS)
All data access is controlled by RLS policies ([20251130000001_app_rls.sql](supabase/migrations/20251130000001_app_rls.sql)). Key helper functions:
- `public.current_profile_id()` - Returns user's profile ID from `auth.uid()`
- `public.current_user_is_admin()` - Checks ADMIN role
- `public.is_session_participant(session_id)` - Verifies session membership

**Never bypass RLS in application code.** Trust the database to enforce permissions.

### Partner Matching Algorithm
The `find_matches_for_current_user()` RPC function ([20251130000002_find_matches_for_current_user.sql](supabase/migrations/20251130000002_find_matches_for_current_user.sql)) scores candidates based on:
- Overlapping recurring availability windows (0-60 pts)
- Shared focus areas (0-25 pts)
- WSDC skill level proximity (0-15 pts)

Call from client: `supabase.rpc('find_matches_for_current_user', { p_limit: 20 })`

### UI Component Patterns
- **shadcn/ui**: All UI components in `frontend/src/components/ui/` (Button, Dialog, etc.)
- **Styling utility**: Use `cn()` from `@/lib/utils` to merge Tailwind classes
- **Client interactivity**: Add `"use client"` directive for hooks, event handlers, or browser APIs
- **Framer Motion**: Available for animations (`framer-motion` installed)
- **Dark mode**: Supported via `next-themes` (`ThemeProvider` in layout)

### Form Validation
Use Zod schemas from `frontend/src/lib/profiles/validation.ts`:
- `signupAuthSchema` - Email/password validation
- `signupPersonalInfoSchema` - Name, birthdate
- `signupDanceProfileSchema` - Role, skill level, bio
- `profileSettingsSchema` - Profile updates

Combine with `react-hook-form` + `@hookform/resolvers/zod`.

### Testing Patterns
- **Unit tests**: Co-locate with source files (`__tests__/` subdirectories)
- **Integration tests**: `frontend/src/__tests__/*.integration.test.ts` (require Supabase)
- **Custom test utils**: Import `render` from `@/test/test-utils` (wraps with providers)
- **E2E tests**: `frontend/playwright/*.spec.ts`

See [frontend/src/__tests__/README.md](frontend/src/__tests__/README.md) for examples.

## Key Files & Directories

- **Schema**: `supabase/migrations/20251130000000_app_schema.sql` (all tables, enums)
- **RLS**: `supabase/migrations/20251130000001_app_rls.sql` (security policies)
- **Middleware**: `frontend/src/middleware.ts` (auth + profile completion checks)
- **Auth utils**: `frontend/src/lib/supabase/` (client, server, middleware helpers)
- **Profile API**: `frontend/src/lib/profiles/` (types, validation, CRUD)
- **Backend entities**: `backend/src/main/java/` (documentation only - not runnable)

## Common Pitfalls

❌ **Don't** create Spring Boot controllers/services (backend is Supabase-only)
❌ **Don't** use `createClient` from wrong module (server vs client context)
❌ **Don't** forget `"use client"` directive for interactive components
❌ **Don't** skip `await` on `createClient()` in Server Components
❌ **Don't** create new migrations without timestamp prefixes (format: `YYYYMMDDHHMMSS_description.sql`)
❌ **Don't** bypass RLS policies in application code

✅ **Do** use existing Supabase RPC functions for complex queries
✅ **Do** add tests when modifying authentication or data access logic
✅ **Do** check middleware logic when adding new protected routes
✅ **Do** use `cn()` utility for conditional Tailwind styling
✅ **Do** validate user input with Zod schemas before Supabase calls
