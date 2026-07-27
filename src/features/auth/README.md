# Auth feature

## Responsibility

Owns authentication and session-facing UI: registration, login, logout, and protected-route helpers.

## Belongs here

- Auth forms and related hooks
- Auth-specific schemas and API clients
- Session-aware UI utilities for this feature

## Does not belong here

- Trip domain logic
- AI orchestration
- Password reset (deferred)
- Global layout chrome shared across the app

## Current status

Email/password registration, login, logout, and profile APIs are implemented. Password reset is intentionally excluded from this phase.
