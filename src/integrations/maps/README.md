# Maps integration boundary

Adapters for map rendering and geocoding live here.

- `nominatim.ts` — OpenStreetMap Nominatim search (server-only)
- `geocode.ts` — cached geocode helper used by itinerary persist / API

UI map components that render Leaflet + OSM tiles live under
`src/features/maps/` (client components). Do not import Leaflet from
server modules.
