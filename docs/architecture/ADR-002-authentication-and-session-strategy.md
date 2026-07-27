# ADR-002: Authentication and session strategy

## Status

Accepted — 2026-07-26

## Context

Roavo needs secure email/password authentication, sessions, profile management, and future OAuth readiness. Password reset is deferred by product decision for this phase.

## Decision

Use **Auth.js (NextAuth v5)** with:

- Credentials provider
- **JWT sessions** (Auth.js requirement for Credentials)
- Prisma adapter tables for future OAuth
- **Argon2id** password hashing
- `tokenVersion` for session invalidation after account deletion
- Edge-safe `auth.config.ts` for middleware; Node `auth.ts` for handlers/services

### Travel preferences storage

Validated JSON column on `UserProfile.travelPreferences` using Zod (`travelPreferencesSchema`). Preferable for MVP over a separate table because preferences are read/written with the profile and not queried independently yet.

## Alternatives considered

| Option | Why not |
|--------|---------|
| Database sessions with Credentials | Auth.js does not support Credentials + DB sessions cleanly |
| Custom JWT framework | Higher risk; Auth.js is maintained |
| Clerk / Supabase Auth | Extra vendor lock-in for MVP |
| bcrypt | Argon2id is preferred and Node-compatible via `@node-rs/argon2` |

## Consequences

- Secure HttpOnly cookies via Auth.js
- OAuth can be added without schema redesign
- JWT cannot be server-revoked instantly without `tokenVersion` checks
- In-memory rate limits are single-instance only
- No password reset until a later prompt

## Known limitations

- Password reset not implemented
- Email verification not enforced
- Rate limiter not distributed
- JWT callback performs DB refresh in Node (skipped on Edge)
