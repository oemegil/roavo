# ADR-009: AI preview and application model

## Status

Accepted

## Context

Applying AI itineraries directly risks overwriting user work and accepting stale results.

## Decision

- Persist `AiOperation` metadata for every call
- Store recommendation snapshots and itinerary/edit previews separately
- Require explicit apply; expire unapplied previews after 24h
- Enforce Trip `updatedAt` version checks on apply

## Consequences

- Users can discard proposals safely
- Stale previews fail with `AI_TRIP_VERSION_CONFLICT`
- Preview JSON is immutable and not the long-term itinerary source of truth
