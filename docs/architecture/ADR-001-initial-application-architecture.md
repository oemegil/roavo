# ADR-001: Initial application architecture

## Status

Accepted — 2026-07-26

## Context

Roavo is an AI-powered, mobile-first travel planning MVP. The first delivery target is **web only** (Vercel). Native / Capacitor packaging is deferred. The repository started empty and needed a production-quality foundation without implementing product features yet.

## Decision

Build Roavo as a **modular monolith** on **Next.js App Router**:

- UI and route handlers in one deployable Next.js application
- Business logic in `src/server/application` and `src/server/domain`
- Persistence via **PostgreSQL + Prisma**
- Client server-state via **TanStack Query**
- Validation via **Zod**
- UI primitives via **shadcn/ui + Tailwind**
- Future AI access behind an `integrations/ai` provider boundary

### Why Next.js Route Handlers

MVP needs one team, one deploy unit, and low operational overhead. Route Handlers keep HTTP close to the app while remaining thin adapters over application services. Microservices would add cost without benefit at this stage.

### Why PostgreSQL and Prisma

Relational modeling fits trips, days, items, likes, and bookmarks. Prisma gives typed access and migrations. The primary hosted Postgres target is **Supabase** (pooled + direct URLs).

### Why AI providers will be abstracted

Product code must not couple to Gemini, OpenAI, Claude, or Ollama. A single `AIProvider` interface keeps prompt orchestration and domain logic stable when the vendor changes.

### Why server components by default

Most early screens are read-oriented. Server Components reduce client JS. Client Components are reserved for interaction (forms, providers, error boundaries).

### Error handling approach

Application services should prefer a small typed **`Result<T, E>`** for expected failures, with **`AppError`** subclasses for HTTP mapping. Do not mix ad-hoc thrown strings with Result inconsistently.

## Alternatives considered

| Option | Why not now |
|--------|-------------|
| Separate API service | Extra deploy/ops for MVP |
| Drizzle / raw SQL only | Prisma migration ergonomics preferred |
| Global client state (Redux/Zustand) | TanStack Query covers server state |
| Full PWA + Capacitor now | Explicitly deferred; web first |

## Consequences

- Fast iteration on one codebase
- Clear module boundaries for later features
- Must keep Prisma and secrets out of client bundles (`server-only`)
- Domain schema arrives in later prompts; bootstrap only verifies connectivity

## Known limitations

- No authentication yet
- No product domain tables yet
- No AI providers installed
- No mobile packaging
- Password reset deferred beyond the first auth phase
