import "server-only";

import { Prisma } from "@prisma/client";

import {
  buildGeocodeQuery,
  normalizeGeocodeQueryKey,
  searchNominatim,
} from "@/integrations/maps/nominatim";
import { prisma } from "@/server/infrastructure/database";

export type GeocodePlaceInput = {
  name: string;
  city?: string | null;
};

export type GeocodedPlace = GeocodePlaceInput & {
  latitude: number | null;
  longitude: number | null;
  displayName: string | null;
  osmId: string | null;
  found: boolean;
};

function toNumber(value: Prisma.Decimal | number | null | undefined): number | null {
  if (value == null) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Geocode a place with DB cache + Nominatim (rate-limited). */
export async function geocodePlace(
  input: GeocodePlaceInput,
  options?: { signal?: AbortSignal },
): Promise<GeocodedPlace> {
  const name = input.name.trim();
  const city = input.city?.trim() || null;
  const query = buildGeocodeQuery(name, city);
  const queryKey = normalizeGeocodeQueryKey(query);

  const cached = await prisma.geocodeCache.findUnique({ where: { queryKey } });
  if (cached) {
    return {
      name,
      city,
      latitude: toNumber(cached.latitude),
      longitude: toNumber(cached.longitude),
      displayName: cached.displayName,
      osmId: cached.osmId,
      found: cached.found,
    };
  }

  let result: Awaited<ReturnType<typeof searchNominatim>> = null;
  try {
    result = await searchNominatim(query, { signal: options?.signal });
  } catch {
    result = null;
  }

  const row = await prisma.geocodeCache.upsert({
    where: { queryKey },
    create: {
      queryKey,
      latitude: result?.latitude ?? null,
      longitude: result?.longitude ?? null,
      displayName: result?.displayName ?? null,
      osmId: result?.osmId ?? null,
      found: Boolean(result),
    },
    update: {
      latitude: result?.latitude ?? null,
      longitude: result?.longitude ?? null,
      displayName: result?.displayName ?? null,
      osmId: result?.osmId ?? null,
      found: Boolean(result),
    },
  });

  return {
    name,
    city,
    latitude: toNumber(row.latitude),
    longitude: toNumber(row.longitude),
    displayName: row.displayName,
    osmId: row.osmId,
    found: row.found,
  };
}

/** Geocode many places sequentially (Nominatim-friendly). Dedupes by query key. */
export async function geocodePlaces(
  places: GeocodePlaceInput[],
  options?: { signal?: AbortSignal },
): Promise<GeocodedPlace[]> {
  const results: GeocodedPlace[] = [];
  const seen = new Map<string, GeocodedPlace>();

  for (const place of places) {
    const key = normalizeGeocodeQueryKey(buildGeocodeQuery(place.name, place.city));
    const existing = seen.get(key);
    if (existing) {
      results.push({
        ...existing,
        name: place.name.trim(),
        city: place.city?.trim() || null,
      });
      continue;
    }
    const geocoded = await geocodePlace(place, options);
    seen.set(key, geocoded);
    results.push(geocoded);
  }

  return results;
}
