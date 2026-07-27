# Deployment (Vercel)

## Runtime

- Next.js App Router on Vercel Node.js runtime
- Recommended Node.js 20.x or 22.x

## Build

- Install: `pnpm install`
- Build: `pnpm build` (runs `prisma generate` via `postinstall` / `db:generate`)
- Start (local prod): `pnpm start`

## Required environment variables

| Name | Notes |
|------|--------|
| `APP_URL` | Public site URL, e.g. `https://roavo.vercel.app` |
| `DATABASE_URL` | Supabase Transaction pooler URI (`6543`, `pgbouncer=true`) |
| `DIRECT_URL` | Supabase Direct URI (`5432`) for Prisma migrations |
| `AI_PROVIDER` | Reserved; default `gemini` |
| `AUTH_SECRET` | Auth.js secret (`openssl rand -base64 32`) |
| `AUTH_TRUST_HOST` | Usually `true` on Vercel |
| `NODE_ENV` | Set by Vercel |

Auth routes that hash passwords use the **Node.js** runtime (`runtime = "nodejs"`), not Edge.

Never expose database URLs, `AUTH_SECRET`, or AI keys via `NEXT_PUBLIC_*`.

## Migrations

Run `pnpm db:migrate:deploy` against `DIRECT_URL` in a release step before or with deploy. Do not rely on `prisma db push` in production.

## Supabase Postgres notes

- Primary host is **Supabase** for local and production
- `DATABASE_URL`: Transaction pooler (serverless-friendly)
- `DIRECT_URL`: Direct connection for Prisma Migrate
- See [supabase.md](./supabase.md)
- Avoid long-lived connection assumptions; the Prisma singleton is for Node process reuse within an instance

## Not in this phase

- Automatic Vercel deploy from this bootstrap task
- Mobile / Capacitor packaging
- Full PWA offline support
