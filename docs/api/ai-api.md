# AI API

Base: `/api/v1`

All AI routes require authentication. Operations and previews are user-scoped.

## Destination recommendations

- `POST /ai/destination-recommendations`
- `POST /ai/destination-recommendations/:operationId/select`

## Itinerary generation

- `POST /trips/:tripId/ai/generate-itinerary`
- `POST /trips/:tripId/ai/itinerary-previews/:previewId/apply`
- `DELETE /trips/:tripId/ai/itinerary-previews/:previewId`

## Editing

- `POST /trips/:tripId/ai/edit`
- `POST /trips/:tripId/ai/edit-previews/:previewId/apply`
- `DELETE /trips/:tripId/ai/edit-previews/:previewId`
- `POST /trips/:tripId/days/:dayId/ai/regenerate`
- `POST /trips/:tripId/items/:itemId/ai/replace`

## Status

- `GET /ai/operations/:operationId`

## Error codes

See `AppErrorCode` values prefixed with `AI_`.
