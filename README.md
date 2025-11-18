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
