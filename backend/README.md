## Java entities – reference only

This folder no longer contains a runnable Spring Boot/Gradle project. The only reason it sticks around is to preserve the original JPA entity definitions (with annotations, relationships, enums, etc.) that mirror our Supabase schema.

- Supabase is the _only_ backend for this repo.
- There’s no `build.gradle`, no controllers, no services, no tests.
- Each Java file includes a comment reminding future readers (and AI tools) that the code is archival/documentation only.

If you need to generate SQL or run experiments against these entities, copy them into your own Spring project or view the Supabase migrations under `supabase/`.

