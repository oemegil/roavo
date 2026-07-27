# Roavo

AI-powered travel planning — **Let's Roavo this trip.**

Roavo helps travelers discover destinations and build editable itineraries from origin, dates, budget, pace, and interests. Users do not need to know where they want to go before they start.

> **Status:** Active MVP development. Auth, trips, destination catalog, and AI planning (recommendations + itinerary generate/edit) are implemented. Public social features and maps are not.

## MVP summary (planned)

- Email auth and profiles (**password reset deferred**)
- Trip creation, AI destination suggestions, editable itineraries
- Draft / publish, public trip pages, likes, bookmarks
- **Roavo This Trip** cloning
- Web-first delivery (mobile / Capacitor later)

## Technology stack

- Next.js (App Router) + TypeScript + React
- Tailwind CSS + shadcn/ui + Lucide
- TanStack Query + React Hook Form + Zod
- PostgreSQL (Supabase) + Prisma
- Auth.js (NextAuth v5) + Argon2id
- Vitest + React Testing Library + Playwright
- Deploy target: Vercel (web)

## Prerequisites

- Node.js 20+
- pnpm
- A Supabase project (PostgreSQL)

## Installation

```bash
pnpm install
cp .env.example .env
# set AUTH_SECRET (openssl rand -base64 32)
```

## Environment setup

See `.env.example`:

- `APP_URL`
- `DATABASE_URL` (Supabase pooler)
- `DIRECT_URL` (Supabase direct)
- `AI_PROVIDER`
- `NODE_ENV`
- `AUTH_SECRET`
- `AUTH_TRUST_HOST`
- `DESTINATION_PROVIDER` (`internal`)

## Database setup (Supabase)

1. Create a Supabase project
2. Put the **Transaction pooler** URI in `DATABASE_URL`
3. Put the **Direct** URI in `DIRECT_URL`
4. Run:

```bash
pnpm db:generate
pnpm db:migrate:deploy
pnpm db:seed
pnpm db:validate
```

Guide: [docs/development/supabase.md](docs/development/supabase.md)

## Running locally

```bash
pnpm dev
```

## Available scripts

| Script | Purpose |
|--------|---------|
| `pnpm dev` | Development server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` / `lint:fix` | ESLint |
| `pnpm format` / `format:check` | Prettier |
| `pnpm typecheck` | TypeScript |
| `pnpm test` | Unit / component tests |
| `pnpm test:e2e` | Playwright smoke |
| `pnpm db:*` | Prisma generate / migrate / studio / validate / seed |

## Testing

```bash
pnpm test
pnpm build && pnpm test:e2e
```

## Authentication

See [docs/authentication/authentication-overview.md](docs/authentication/authentication-overview.md) and [ADR-002](docs/architecture/ADR-002-authentication-and-session-strategy.md).

Password reset is **not** included in this phase.

## Build & deployment

```bash
pnpm build
```

See [docs/development/deployment.md](docs/development/deployment.md).

## Current implementation status

| Area | Status |
|------|--------|
| Next.js app shell | Done |
| Auth (register / login / logout / session) | Done |
| Profile view / edit / account deletion | Done |
| Trip domain & manual itinerary editor | Done |
| Destination catalog, search, detail, Trip selection | Done |
| AI destination recommendations + itinerary generate/edit | Done |
| Password reset | Deferred |
| Maps / Places / public social features | Not started |

## Docs

- [ADR-001 Initial architecture](docs/architecture/ADR-001-initial-application-architecture.md)
- [ADR-002 Authentication](docs/architecture/ADR-002-authentication-and-session-strategy.md)
- [ADR-005 Destination catalog](docs/architecture/ADR-005-destination-catalog-and-search.md)
- [ADR-006 Destination provider boundary](docs/architecture/ADR-006-destination-provider-boundary.md)
- [ADR-007 AI provider](docs/architecture/ADR-007-ai-provider-and-prompt-architecture.md)
- [AI architecture](docs/ai/ai-architecture.md)
- [AI API](docs/api/ai-api.md)
- [Destinations API](docs/api/destinations-api.md)
- [Local development](docs/development/local-development.md)
- [Supabase setup](docs/development/supabase.md)
- [Deployment](docs/development/deployment.md)
- [Authentication overview](docs/authentication/authentication-overview.md)
