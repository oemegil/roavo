# ADR-004: Date, time, money, and ordering

## Status

Accepted — 2026-07-26

## Decision

| Concern | Choice |
|---------|--------|
| Calendar dates | Prisma `@db.Date` + `YYYY-MM-DD` API helpers |
| Time of day | Integer minutes 0–1439 ↔ `HH:mm` |
| Money | Integer minor units |
| Ordering | Dense positions with transactional two-phase updates |
| Concurrency | Optional `expectedUpdatedAt` → `TRIP_VERSION_CONFLICT` |

## Alternatives rejected

- JS `Date` for time-only values
- Floating-point money columns
- Lexicographic rank libraries for MVP scale
