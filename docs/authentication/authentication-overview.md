# Authentication overview

## Selected stack

- **Library:** Auth.js (NextAuth v5)
- **Credentials:** email + password
- **Sessions:** JWT (required by Auth.js for Credentials)
- **Revocation:** `User.tokenVersion` incremented on account deletion
- **Password hashing:** Argon2id via `@node-rs/argon2`
- **Adapter:** `@auth/prisma-adapter` with Account / Session / VerificationToken tables for future OAuth

## Intentionally deferred

- Password reset / forgot-password flows
- Email verification enforcement (field `emailVerifiedAt` exists)
- Google / Apple OAuth
- Passkeys / 2FA

## Flows

### Register

`POST /api/v1/auth/register` → create User + UserProfile in a transaction → Auth.js `signIn("credentials")` → redirect to `/trips`.

### Login

`POST /api/v1/auth/login` → Auth.js credentials → secure HttpOnly cookie session.

### Logout

`POST /api/v1/auth/logout` → clear session cookie + client query cache.

### Profile

`GET /api/v1/me`, `PATCH /api/v1/me/profile`, `DELETE /api/v1/me`.

## Route protection

- Middleware (Edge, auth.config only) redirects unauthenticated users away from `/trips`, `/profile`, `/settings`.
- Application layout re-checks session in Node.js (authoritative).
- API routes call `requireSessionUserId()`.

## Rate limiting

In-memory limiter for login/register. Not durable across serverless instances — replace with Redis/Upstash before production scale.

## Email verification policy

Users may sign in before verifying email. Publishing public content may require verification later.
