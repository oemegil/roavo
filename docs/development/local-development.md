# Local development

## Prerequisites

- Node.js 20+ (22/24 also fine)
- pnpm (Corepack recommended)
- A **Supabase** project (PostgreSQL) — **required**; no local database

## Install

```bash
pnpm install
cp .env.example .env
```

Generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

## Database (Supabase only)

See the full guide: [supabase.md](./supabase.md)

1. Create a Supabase project
2. Paste the **Transaction pooler** URI into `DATABASE_URL`
3. Paste the **Direct** URI into `DIRECT_URL`
4. Run:

```bash
pnpm db:generate
pnpm db:migrate:deploy
pnpm db:seed
```

## Prisma

```bash
pnpm db:generate
pnpm db:validate
pnpm db:migrate        # development migrations
pnpm db:migrate:deploy # apply existing migrations to Supabase
pnpm db:seed
pnpm db:studio
```

## Run the web app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

The Next.js app runs locally; the database always lives on Supabase.

## Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

## Common problems

| Symptom | Fix |
|---------|-----|
| Prisma client missing | `pnpm db:generate` |
| Health returns `database: down` | Wake Supabase project; verify `DATABASE_URL` / `DIRECT_URL` |
| Migration fails on pooler | Ensure `DIRECT_URL` uses the direct (5432) connection |
| Password auth errors | URL-encode special characters in the DB password |
| `server-only` import in client | Keep database/logger/server env under server paths |

## Authentication notes

- Set `AUTH_SECRET` before running
- Apply migrations against Supabase before registering users
- Password reset is deferred and not available in the UI
- Auth hashing routes require Node.js runtime (not Edge)
