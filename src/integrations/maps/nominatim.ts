import "server-only";

export type NominatimSearchResult = {
  latitude: number;
  longitude: number;
  displayName: string;
  osmId: string;
};

type NominatimJsonHit = {
  lat: string;
  lon: string;
  display_name: string;
  osm_type?: string;
  osm_id?: number;
};

const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";

/** Nominatim policy: max ~1 request/second. Shared across warm instances. */
let lastRequestAt = 0;

async function throttleNominatim(): Promise<void> {
  const now = Date.now();
  const waitMs = Math.max(0, 1100 - (now - lastRequestAt));
  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  lastRequestAt = Date.now();
}

export function buildGeocodeQuery(name: string, city?: string | null): string {
  const parts = [name.trim()];
  const cityTrim = city?.trim();
  if (cityTrim && !name.toLowerCase().includes(cityTrim.toLowerCase())) {
    parts.push(cityTrim);
  }
  return parts.filter(Boolean).join(", ");
}

export function normalizeGeocodeQueryKey(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Search OpenStreetMap Nominatim for a place.
 * Caller must pass a descriptive User-Agent (policy requirement).
 */
export async function searchNominatim(
  query: string,
  options?: { userAgent?: string; signal?: AbortSignal },
): Promise<NominatimSearchResult | null> {
  const q = query.trim();
  if (!q) return null;

  await throttleNominatim();

  const url = new URL(NOMINATIM_SEARCH_URL);
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const userAgent =
    options?.userAgent ?? `Roavo/1.0 (${process.env.APP_URL ?? "https://roavo.app"})`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": userAgent,
    },
    signal: options?.signal,
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as NominatimJsonHit[];
  const hit = data[0];
  if (!hit?.lat || !hit?.lon) return null;

  const latitude = Number(hit.lat);
  const longitude = Number(hit.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return {
    latitude,
    longitude,
    displayName: hit.display_name,
    osmId:
      hit.osm_type && hit.osm_id != null
        ? `${hit.osm_type}:${hit.osm_id}`
        : `nominatim:${hit.lat},${hit.lon}`,
  };
}
