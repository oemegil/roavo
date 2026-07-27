# ADR-003: Trip aggregate and persistence

## Status

Accepted — 2026-07-26

## Decision

- Trip is the aggregate root; no wrapper Itinerary table
- Soft deletion with `deletedAt`
- Status enum limited to `DRAFT` / `ARCHIVED` in this phase
- Destination optional at creation
- Auto-create TripDays for the inclusive date range
- Shrinking the range that would drop populated days returns `TRIP_DATE_RANGE_CONFLICT`

## Consequences

- Clear ownership and cascade boundaries
- Safe for a future separate mobile client consuming `/api/v1`
- Publishing / AI / maps remain later prompts
