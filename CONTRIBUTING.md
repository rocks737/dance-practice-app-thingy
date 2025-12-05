# Contributing Guide

Welcome to the Dance Practice App! This guide will help you get started with contributing to the project.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
  - [Supabase Setup (Backend)](#supabase-setup-backend)
  - [Frontend Setup](#frontend-setup)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Common Tasks](#common-tasks)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** and **npm/yarn** - Required for the Next.js frontend
- **Docker** - Required for local Supabase instance
- **Python 3** (optional) - For running seed scripts
- **Git** - For version control

### Verify Your Setup

```bash
# Check Node.js version
node -v  # Should be 18 or higher

# Check Docker
docker --version

# Check Python (optional, for seed scripts)
python3 --version
```

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dance-practice-app-thingy
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase locally** (see [Supabase Setup](#supabase-setup) below)

4. **Configure environment variables** (see [Frontend Setup](#frontend-setup) below)

## Development Setup

The application uses **Supabase as the backend** - all API calls go directly to Supabase's PostgREST API. The frontend communicates with Supabase for authentication, database queries, and real-time features.

### Supabase Setup (Backend)

Supabase provides the backend infrastructure:
- **PostgreSQL Database** - Stores all application data
- **PostgREST API** - Auto-generated REST API from database schema
- **GoTrue Auth** - User authentication
- **Row Level Security (RLS)** - Database-level access control

1. **Install Supabase CLI** (if not already installed)
   ```bash
   npm install supabase --save-dev
   ```

2. **Start Supabase locally**
   ```bash
   npx supabase start
   ```

   This will:
   - Start PostgreSQL (port `54322`)
   - Start Supabase API/PostgREST (port `54321`)
   - Start Supabase Studio (port `54323`)
   - Apply all migrations from `supabase/migrations/`

3. **Get your local Supabase credentials**
   ```bash
   npx supabase status
   ```

   Copy the output values - you'll need them for the frontend configuration.

4. **Reset the database** (if needed)
   ```bash
   npx supabase db reset
   ```

   This will:
   - Drop all data
   - Reapply all migrations
   - Run seed scripts (if configured)

5. **Seed test data** (optional)
   ```bash
   python3 supabase/seed_via_api.py
   ```

   This creates test users and sample data:
   - `alice@example.com` / `alice123`
   - `bob@example.com` / `bob123`
   - `test@ex.com` / `test123` (with ADMIN role)

#### Supabase Project Structure

```
supabase/
├── migrations/                 # Database migrations
│   ├── 20240414161707_basejump-setup.sql
│   ├── 20240414161947_basejump-accounts.sql
│   ├── 20251119033000_app-schema.sql
│   └── 20251125041000_core_rls.sql
├── functions/                  # Edge functions
│   ├── billing-functions/
│   └── billing-webhooks/
├── config.toml                 # Supabase configuration
├── seed_via_api.py            # Python seed script
└── tests/                      # Database tests
```

### Frontend Setup

The frontend is a Next.js application using TypeScript, React, and Supabase.

1. **Install dependencies**
   ```bash
   cd frontend
   yarn install
   # or
   npm install
   ```

2. **Configure environment variables**

   Create a `.env.local` file in the `frontend/` directory:

   ```bash
   cd frontend
   cp .env.example .env.local  # If .env.example exists
   ```

   Add the following variables:

   ```env
   # Supabase Configuration (from local Supabase instance)
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

   # Application URL
   NEXT_PUBLIC_URL=http://localhost:3000
   ```

   **Getting Supabase keys:**
   ```bash
   npx supabase status
   ```
   
   This will output the API URL and keys. Copy the "Publishable key" as `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

3. **Run the development server**
   ```bash
   yarn dev
   # or
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

#### Frontend Project Structure

```
frontend/
├── src/
│   ├── app/                     # Next.js app router pages
│   │   ├── (app)/              # Authenticated routes
│   │   ├── auth/               # Authentication routes
│   │   └── login/              # Login page
│   ├── components/              # React components
│   │   ├── ui/                 # Reusable UI components
│   │   ├── profile/            # Profile-related components
│   │   ├── sessions/           # Session-related components
│   │   └── schedule/           # Schedule/calendar components
│   ├── lib/                    # Utility libraries
│   │   ├── supabase/           # Supabase client setup
│   │   ├── profiles/           # Profile API functions
│   │   ├── sessions/           # Session API functions
│   │   └── schedule/           # Schedule API functions
│   └── __tests__/              # Test files
├── public/                     # Static assets
├── package.json
├── next.config.js
└── tailwind.config.ts
```

## Running the Application

### Full Stack Development

1. **Terminal 1: Start Supabase (Backend)**
   ```bash
   npx supabase start
   ```

2. **Terminal 2: Start Frontend**
   ```bash
   cd frontend
   yarn dev
   ```

3. **Access the application**
   - **Frontend**: http://localhost:3000
   - **Supabase Studio** (database admin): http://localhost:54323
   - **Supabase API**: http://localhost:54321

### Quick Start

The simplest way to get started:

```bash
# Terminal 1: Start Supabase
npx supabase start

# Terminal 2: Start Frontend
cd frontend
yarn dev
```

That's it! The frontend will connect to the local Supabase instance automatically.

## Testing

### Frontend Tests

```bash
cd frontend

# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage
```

### Integration Tests

Frontend integration tests are in `frontend/src/__tests__/`:

```bash
cd frontend
yarn test integration
```

**Note:** Integration tests require Supabase to be running locally. Make sure to run `npx supabase start` before running integration tests.

## Project Structure

```
dance-practice-app-thingy/
├── frontend/                    # Next.js frontend
│   ├── src/
│   │   ├── app/                # Next.js app router pages
│   │   ├── components/         # React components
│   │   └── lib/                # API clients and utilities
│   ├── public/                 # Static assets
│   └── package.json            # Dependencies
├── supabase/                    # Supabase backend configuration
│   ├── migrations/             # Database migrations
│   ├── functions/              # Edge functions
│   ├── config.toml             # Supabase config
│   └── seed_via_api.py        # Seed script
├── backend/                     # Legacy Java code (not currently used)
│   └── ...                     # Spring Boot code (deprecated)
├── docs/                        # Documentation
└── README.md                    # Project overview
```

**Note:** The `backend/` directory contains legacy Java/Spring Boot code that is not currently used. The application uses Supabase as the backend, with all API calls going through Supabase's PostgREST API.

## Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write code following existing patterns
   - Add tests for new functionality
   - Update documentation as needed

3. **Run tests**
   ```bash
   # Frontend
   cd frontend && yarn test
   ```

4. **Check code formatting**
   ```bash
   # Frontend
   cd frontend
   yarn format:fix
   yarn lint:fix
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

6. **Push and create a pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

## Common Tasks

### Creating Database Migrations

1. **Make schema changes** directly in Supabase Studio or by creating a migration

2. **Generate migration** (Supabase)
   ```bash
   npx supabase migration new your_migration_name
   ```

3. **Write your migration SQL** in the new file under `supabase/migrations/`

4. **Test locally**
   ```bash
   npx supabase db reset
   ```

### Adding a New User Role

1. **Add migration** to update the database constraint in `user_roles` table
2. **Update RLS policies** if needed in `supabase/migrations/`
3. **Test with seed script**

### Resetting Local Database

```bash
# Reset Supabase database
npx supabase db reset

# Re-seed test data
python3 supabase/seed_via_api.py
```

### Viewing Logs

```bash
# Supabase logs
npx supabase logs
```

### Accessing the Database

```bash
# Via Supabase Studio (recommended)
open http://localhost:54323

# Via psql
psql postgresql://postgres:postgres@localhost:54322/postgres
```

The connection details are shown when you run `npx supabase status`.

## Troubleshooting

### Frontend won't connect to Supabase

- **Verify Supabase is running**: `npx supabase status`
- **Check `.env.local`** has correct values
- **Restart the dev server** after changing env vars

### Database connection errors

- **Check Supabase is running**: `npx supabase status`
- **Verify database credentials** in configuration
- **Try resetting the database**: `npx supabase db reset`

### Port conflicts

If ports are already in use:

- **Supabase API (54321)**: Check `supabase/config.toml` and change `[api].port`
- **Supabase Studio (54323)**: Check `supabase/config.toml` and change `[studio].port`
- **Frontend (3000)**: Use `PORT=3001 yarn dev`

## Getting Help

- Check existing issues on GitHub
- Review the codebase and existing patterns
- Ask questions in discussions or create an issue

## Code Style

- **Frontend**: Follow Next.js and React best practices. Use Prettier for formatting.
- **Database**: Follow PostgreSQL conventions. Use clear, descriptive migration names.
- **Commits**: Use conventional commit messages (feat:, fix:, docs:, etc.)

Happy coding! 🎉

