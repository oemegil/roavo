# Supabase database setup

Roavo uses **Supabase PostgreSQL only** — for both local app development and production.

There is **no local Postgres** and **no Docker database** in this project.

Auth remains Auth.js in the Next.js app. Supabase Auth is not used in this phase.

## 1. Create a project

1. Open [Supabase](https://supabase.com/dashboard)
2. Create a project
3. Wait until the database is ready

## 2. Copy connection strings

In the dashboard:

**Project Settings → Database → Connection string**

Set in `.env`:

| Variable | Supabase mode | Typical port | Purpose |
|----------|---------------|--------------|---------|
| `DATABASE_URL` | Transaction pooler | `6543` | App runtime (Prisma Client / serverless) |
| `DIRECT_URL` | Direct (or Session mode) | `5432` | Prisma Migrate |

Recommended query params:

- Pooled: `?pgbouncer=true&schema=public`
- Direct: `?schema=public`

URI shape examples:

```text
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&schema=public
DIRECT_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?schema=public
```

If your database password has special characters (`@`, `#`, `%`, etc.), URL-encode them.

## 3. Apply migrations and seed

```bash
pnpm db:generate
pnpm db:migrate:deploy
pnpm db:seed
```

## 4. Verify

```bash
pnpm db:validate
pnpm dev
# then open /api/v1/health — checks.database should be "up"
```

## Notes

- Do not commit real Supabase passwords
- Free-tier projects pause after inactivity — wake the project if connections fail
- Keep using Prisma migrations; do not rely on Supabase Table Editor as the source of schema truth for app models
