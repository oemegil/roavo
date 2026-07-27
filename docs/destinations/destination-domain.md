# Destination domain

## Terminology

| Term | Meaning |
|------|---------|
| **Destination** | Normalized travel location Roavo can search, display, and attach to Trips |
| **Destination Catalog** | Internally curated `Destination` records |
| **Destination Provider** | External enrichment/search source (none required for MVP) |
| **Provider Reference** | Mapping from catalog Destination → external provider ID |
| **Manual Destination** | User-entered location stored only on a Trip |
| **Origin** | Trip starting location (snapshot fields; not forced into catalog) |
| **Place** | Future POI/venue concept — not Destinations |

## Model

`Destination` has a stable internal `id`, public `slug`, `normalizedName` for search, lifecycle `status` (`DRAFT` | `ACTIVE` | `ARCHIVED`), editorial metadata (categories, bestFor, budgetLevel, recommended days), optional coordinates/timezone, and optional hero image fields.

Public discovery returns only `ACTIVE` records.

## Catalog lifecycle

- Seed/curation inserts may use `ACTIVE` + `publishedAt`.
- Draft/archived records are hidden from public APIs.
- No admin UI in this release.

## Manual Destination

Manual entries:

- set `destinationSource = MANUAL`
- leave `destinationId` null
- store name (+ optional country/region) snapshots on the Trip
- never create a public catalog record from user input

## Trip snapshot policy

| Field | Role |
|-------|------|
| `destinationId` | Authoritative link to current catalog row (nullable) |
| `destinationName` / country / region snapshots | Preserve display values if catalog edits later |
| `destinationSource` | Server-derived `CATALOG` or `MANUAL` |

## Origin

Origin remains free-text snapshots on Trip (`originName`, `originCountryCode`). Catalog origin selection is deferred.

## Overlap with Trip preferences

Trip `destinationTypes` / `interests` are preference tags. Destination `categories` / `bestFor` are catalog metadata. See `TRIP_PREFERENCE_TO_DESTINATION_CATEGORY` for an explicit overlap map — they are related, not identical.
