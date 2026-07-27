# Destination provider abstraction

## Contract

`DestinationProvider`:

- `searchDestinations(query, options)`
- `getDestinationDetails(providerReference)`
- `healthCheck()`

Normalized DTO: `ProviderDestinationCandidate` (provider-agnostic fields only).

## Implemented providers

| Provider | Status |
|----------|--------|
| `InternalCatalogDestinationProvider` | Implemented — wraps catalog repository |
| GeoNames / Mapbox / Google Places / OSM | Enum reserved; **not** implemented |

Configuration: `DESTINATION_PROVIDER=internal` (only supported value).

## Boundaries

- No provider SDK types in domain/application/UI layers
- No SDK imports in React components or Route Handlers beyond calling application services
- Provider failures must map to application errors (`DESTINATION_PROVIDER_*`)
- External candidates must never auto-create active catalog Destinations

## Licensing / credentials

No external credentials required for the internal provider. When a future provider is added: document terms, attribution, rate limits, and server-only env vars before enabling.
