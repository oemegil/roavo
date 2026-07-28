import "server-only";

import type { Prisma } from "@prisma/client";

import type { GeneratedItinerary } from "@/integrations/ai/output-schemas";
import { geocodePlaces } from "@/integrations/maps/geocode";

type ItemCreate = {
  tripDayId: string;
  type: "NOTE" | "ATTRACTION";
  title: string;
  description: string | null;
  locationName: string | null;
  externalPlaceId: string | null;
  latitude: number | null;
  longitude: number | null;
  currencyCode: string;
  position: number;
  source: "AI_GENERATED";
};

/** Geocode all itinerary places before opening a DB transaction. */
export async function geocodeGeneratedItineraryPlaces(itinerary: GeneratedItinerary) {
  const requests = itinerary.days.flatMap((day) =>
    (day.places ?? []).map((place) => ({
      name: place.name,
      city: place.city ?? day.cityName ?? null,
    })),
  );
  if (requests.length === 0) return [];
  return geocodePlaces(requests);
}

/** Persist guidebook itinerary onto existing trip days (same shape as AI apply). */
export async function persistGeneratedItinerary(
  tx: Prisma.TransactionClient,
  input: {
    days: Array<{ id: string; title: string | null; notes: string | null }>;
    itinerary: GeneratedItinerary;
    currencyCode: string;
    /** Pre-geocoded places in day-major order matching flatMap of day.places */
    geocodedPlaces?: Awaited<ReturnType<typeof geocodeGeneratedItineraryPlaces>>;
  },
) {
  const orderedDays = input.days;
  const itemCreates: ItemCreate[] = [];
  let geocodeCursor = 0;

  for (let i = 0; i < orderedDays.length; i += 1) {
    const day = orderedDays[i]!;
    const generatedDay = input.itinerary.days[i];
    if (!generatedDay) continue;

    const eventsBlock = generatedDay.eventsHighlight?.trim()
      ? `\n\n── Etkinlik notu ──\n${generatedDay.eventsHighlight.trim()}`
      : "";
    const dayNotes =
      [generatedDay.notes?.trim(), eventsBlock.trim()].filter(Boolean).join("\n\n") ||
      null;

    await tx.tripDay.update({
      where: { id: day.id },
      data: {
        title: generatedDay.theme
          ? generatedDay.cityName
            ? `${generatedDay.theme} · ${generatedDay.cityName}`
            : generatedDay.theme
          : day.title,
        notes: dayNotes ?? day.notes,
      },
    });

    let position = 0;

    itemCreates.push({
      tripDayId: day.id,
      type: "NOTE",
      title: generatedDay.cityName
        ? `${generatedDay.cityName} — günün programı`
        : "Günün programı",
      description: generatedDay.scheduleText,
      locationName: generatedDay.cityName ?? null,
      externalPlaceId: null,
      latitude: null,
      longitude: null,
      currencyCode: input.currencyCode,
      position: position++,
      source: "AI_GENERATED",
    });

    if (generatedDay.eventsHighlight?.trim()) {
      itemCreates.push({
        tripDayId: day.id,
        type: "NOTE",
        title: "Bu tarihlerde dikkat: etkinlikler",
        description: generatedDay.eventsHighlight.trim(),
        locationName: generatedDay.cityName ?? null,
        externalPlaceId: null,
        latitude: null,
        longitude: null,
        currencyCode: input.currencyCode,
        position: position++,
        source: "AI_GENERATED",
      });
    }

    const places = generatedDay.places ?? [];
    for (const place of places) {
      const geocoded = input.geocodedPlaces?.[geocodeCursor++];
      itemCreates.push({
        tripDayId: day.id,
        type: "ATTRACTION",
        title: place.name,
        description: null,
        locationName: place.city ?? generatedDay.cityName ?? null,
        externalPlaceId: geocoded?.osmId ?? null,
        latitude: geocoded?.latitude ?? null,
        longitude: geocoded?.longitude ?? null,
        currencyCode: input.currencyCode,
        position: position++,
        source: "AI_GENERATED",
      });
    }
  }

  if (itemCreates.length > 0) {
    await tx.itineraryItem.createMany({ data: itemCreates });
  }
}
