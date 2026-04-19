# MongoDB To Supabase Migration

This folder contains the one-time migration scripts for moving legacy MongoDB data into Supabase Postgres.

## Scripts

- `migrateUsersToSupabase.ts`
- `migrateTestsAndQuestionsToSupabase.ts`
- `migrateUserDataToSupabase.ts`
- `migrateResultsToSupabase.ts`
- `runAll.ts`

## Required env

- `MONGODB_URI`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Local run

```bash
bun run supabase:migrate:all
```

## One-time production run

Use local shell env or a local `.env.production.local`-style file that is ignored by git. Do not commit production credentials.

Recommended order:

```bash
bun run supabase:migrate:users
bun run supabase:migrate:tests
bun run supabase:migrate:user-data
bun run supabase:migrate:results
```

Or run the wrapper:

```bash
bun run supabase:migrate:all
```

## Safety notes

- Run this once against production only after validating counts on local data.
- Use a service-role key only from a trusted local environment.
- Rotate any production key that was pasted into chat or shared outside the team password manager.
