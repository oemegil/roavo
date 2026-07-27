import "server-only";

import type { Prisma } from "@prisma/client";

import type { GeneratedItinerary } from "@/integrations/ai/output-schemas";

/** Persist guidebook itinerary onto existing trip days (same shape as AI apply). */
export async function persistGeneratedItinerary(
  tx: Prisma.TransactionClient,
  input: {
    days: Array<{ id: string; title: string | null; notes: string | null }>;
    itinerary: GeneratedItinerary;
    currencyCode: string;
  },
) {
  const orderedDays = input.days;
  const itemCreates: Array<{
    tripDayId: string;
    type: "NOTE";
    title: string;
    description: string;
    locationName: string | null;
    currencyCode: string;
    position: number;
    source: "AI_GENERATED";
  }> = [];

  for (let i = 0; i < orderedDays.length; i += 1) {
    const day = orderedDays[i]!;
    const generatedDay = input.itinerary.days[i];
    if (!generatedDay) continue;

    const eventsBlock = generatedDay.eventsHighlight?.trim()
      ? `\n\n── Etkinlik notu ──\n${generatedDay.eventsHighlight.trim()}`
      : "";
    const dayNotes =
      [generatedDay.notes?.trim(), eventsBlock.trim()]
        .filter(Boolean)
        .join("\n\n") || null;

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

    itemCreates.push({
      tripDayId: day.id,
      type: "NOTE",
      title: generatedDay.cityName
        ? `${generatedDay.cityName} — günün programı`
        : "Günün programı",
      description: generatedDay.scheduleText,
      locationName: generatedDay.cityName ?? null,
      currencyCode: input.currencyCode,
      position: 0,
      source: "AI_GENERATED",
    });

    if (generatedDay.eventsHighlight?.trim()) {
      itemCreates.push({
        tripDayId: day.id,
        type: "NOTE",
        title: "Bu tarihlerde dikkat: etkinlikler",
        description: generatedDay.eventsHighlight.trim(),
        locationName: generatedDay.cityName ?? null,
        currencyCode: input.currencyCode,
        position: 1,
        source: "AI_GENERATED",
      });
    }
  }

  if (itemCreates.length > 0) {
    await tx.itineraryItem.createMany({ data: itemCreates });
  }
}
