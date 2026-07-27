# ADR-006: Destination provider boundary

## Status

Accepted

## Context

Future enrichment may use GeoNames, Mapbox, Google Places, or OSM-based sources. Those systems must not become the Roavo domain model.

## Decision

1. Define a provider-independent `DestinationProvider` interface and `ProviderDestinationCandidate` DTO.
2. Implement only `InternalCatalogDestinationProvider` for this release.
3. Persist optional `DestinationProviderReference` rows with uniqueness on `(provider, providerDestinationId)`.
4. Never use provider IDs as internal Destination primary keys.
5. Never auto-promote external candidates into the active public catalog from search endpoints.

## Alternatives considered

- Calling provider SDKs from UI/route handlers — rejected (leaks types, credentials, error shapes)
- Skipping abstraction until a provider exists — rejected; boundaries are cheaper early

## Consequences

- App works with zero external place credentials
- Adding a real provider later requires env, terms, rate limits, and mapping code only inside infrastructure modules
- Licensing/attribution remains documented per provider when enabled
