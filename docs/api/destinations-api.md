# Destinations API

Base: `/api/v1`

Public reads return only `ACTIVE` catalog destinations. Trip mutations require authentication + ownership.

## Discovery

### `GET /api/v1/destinations`

Query: `q`, `type`, `countryCode`, `category`, `budgetLevel`, `bestFor`, `cursor`, `limit` (default 20, max 50)

Response: `{ items, nextCursor, filters }` with destination summaries (no long descriptions).

### `GET /api/v1/destinations/featured`

Featured active destinations in editorial order.

### `GET /api/v1/destinations/:destinationId`

Full detail DTO including disclaimer text.

### `GET /api/v1/destinations/by-slug/:slug`

Same detail payload via public slug.

## Trip destination

### `PUT /api/v1/trips/:tripId/destination`

Discriminated union:

```json
{ "mode": "catalog", "destinationId": "..." }
```

```json
{ "mode": "manual", "name": "...", "countryCode": "PT", "regionName": "Algarve" }
```

Optional `confirmItineraryWarning: true` when the trip already has itinerary items.

Server resolves catalog metadata; client metadata is not trusted.

### `DELETE /api/v1/trips/:tripId/destination`

Clears relation + snapshots. Does not delete itinerary items.

## Error codes

| Code | Meaning |
|------|---------|
| `DESTINATION_INVALID_QUERY` | Malformed search input |
| `DESTINATION_NOT_FOUND` | Missing / unavailable destination |
| `DESTINATION_INACTIVE` | Draft/archived not publicly readable |
| `DESTINATION_SEARCH_FAILED` | Unexpected search failure |
| `DESTINATION_PROVIDER_UNAVAILABLE` | External provider down (reserved) |
| `DESTINATION_PROVIDER_RATE_LIMITED` | External provider throttled (reserved) |
| `DESTINATION_SELECTION_INVALID` | Selection / confirmation rules |
| `DESTINATION_MANUAL_INPUT_INVALID` | Manual payload invalid |
| `TRIP_DESTINATION_UPDATE_FAILED` | Persistence failure |

## Mobile-future notes

These HTTP contracts are presentation-independent JSON suitable for a future separate mobile client. Web auth remains cookie/session-based; mobile token auth is out of scope for this task.

## Cache

Public discovery responses may set short `Cache-Control` (`s-maxage`). Authenticated trip destination mutations are never publicly cached.
