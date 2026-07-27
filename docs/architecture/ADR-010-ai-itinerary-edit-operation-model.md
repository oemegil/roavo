# ADR-010: Constrained itinerary edit operations

## Status

Accepted

## Context

Free-form “rewrite the whole trip” edits are hard to validate and dangerous for manual content.

## Decision

- AI returns a discriminated edit plan (`ADD_ITEM`, `UPDATE_ITEM`, `DELETE_ITEM`, …)
- Application validates every referenced ID against the owned Trip
- Manual items are preserved by default
- Day regeneration and item replacement produce the same preview/apply path

## Consequences

- Edits are reviewable and transactional
- Invented IDs are rejected
- Broad natural-language requests still map to constrained ops
