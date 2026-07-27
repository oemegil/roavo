# ADR-005: Destination catalog and PostgreSQL search

## Status

Accepted

## Context

Roavo needs destination discovery for trip planning without AI recommendations, maps, or a dedicated search engine. Trip destination fields were free-text only.

## Decision

1. Maintain an internal curated `Destination` catalog with stable IDs and public slugs.
2. Search and browse the catalog via PostgreSQL + deterministic in-process ranking.
3. Store Trip destination as optional `destinationId` plus display snapshots and server-derived `destinationSource` (`CATALOG` | `MANUAL`).
4. Support manual Trip destinations without creating catalog records.
5. Keep origin as Trip snapshot fields (not required to exist in the catalog).

## Alternatives considered

- Elasticsearch / Algolia — rejected for MVP cost and operational complexity
- Provider IDs as domain IDs — rejected; providers must remain swappable
- Auto-promoting user input into the catalog — rejected for curation/quality/safety

## Consequences

- Catalog quality depends on curation/seed quality
- Search ranking is simple and explainable
- Historical trips remain readable via snapshots when catalog rows change
- Future mobile clients can reuse the same HTTP contracts
