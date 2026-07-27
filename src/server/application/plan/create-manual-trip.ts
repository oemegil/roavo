import "server-only";

import { AppError } from "@/lib/errors";
import type { CreateManualTripInput } from "@/features/plan/schemas";
import { toTripDetailDto, type TripDetailDto } from "@/features/trips/dto";
import { inclusiveDayCount, parseDateOnly, formatDateOnly } from "@/server/domain/trips/date-only";
import { resolveCitiesByIds } from "@/server/domain/places/catalog";
import { findActiveDestinationBySlug } from "@/server/repositories/destination-repository";
import { prisma, tripDetailInclude } from "@/server/repositories/trip-repository";
import { generateDaysForRange } from "@/server/domain/trips/day-planner";

export async function createManualTripService(input: {
  ownerId: string;
  data: CreateManualTripInput;
}): Promise<{ trip: TripDetailDto }> {
  const cities = resolveCitiesByIds(input.data.cityIds);
  const freeNames = input.data.cityNames.filter(Boolean);
  if (cities.length === 0 && freeNames.length === 0) {
    throw new AppError({
      code: "VALIDATION_ERROR",
      message: "En az bir şehir seç veya yaz.",
      status: 400,
    });
  }

  const startDate = parseDateOnly(input.data.startDate);
  const endDate = parseDateOnly(input.data.endDate);
  inclusiveDayCount(startDate, endDate);
  const baseDays = generateDaysForRange(startDate, endDate);
  const notesByDate = new Map(
    input.data.days.map((day) => [day.date, day] as const),
  );

  const stopNames =
    cities.length > 0
      ? cities.map((c) => c.nameTr).join(" · ")
      : freeNames.join(" · ");
  const primary = cities[0] ?? null;

  let destinationId: string | null = null;
  if (primary?.destinationSlug) {
    const catalog = await findActiveDestinationBySlug(primary.destinationSlug);
    destinationId = catalog?.id ?? null;
  }

  const stopCreates =
    cities.length > 0
      ? await Promise.all(
          cities.map(async (city, index) => {
            let destId: string | null = null;
            if (city.destinationSlug) {
              const d = await findActiveDestinationBySlug(city.destinationSlug);
              destId = d?.id ?? null;
            }
            return {
              position: index,
              name: city.nameTr,
              countryCode: city.countryCode,
              iataCode: city.iata,
              destinationId: destId,
            };
          }),
        )
      : freeNames.map((name, index) => ({
          position: index,
          name,
          countryCode: null as string | null,
          iataCode: null as string | null,
          destinationId: null as string | null,
        }));

  const trip = await prisma.trip.create({
    data: {
      ownerId: input.ownerId,
      title: input.data.title,
      originName: "Manuel kayıt",
      originCountryCode: "TR",
      destinationId,
      destinationName: stopNames,
      destinationCountryCode: primary?.countryCode ?? null,
      destinationSource: destinationId ? "CATALOG" : "MANUAL",
      startDate,
      endDate,
      travelerCount: 1,
      currencyCode: "TRY",
      travelPace: "BALANCED",
      interests: [],
      additionalNotes: "Kullanıcı tarafından eklenen gezi kaydı",
      days: {
        create: baseDays.map((day) => {
          const dateKey = formatDateOnly(day.date);
          const override = notesByDate.get(dateKey);
          return {
            date: day.date,
            title: override?.title?.trim() || day.title,
            notes: override?.notes?.trim() || null,
            position: day.position,
          };
        }),
      },
      stops: {
        create: stopCreates,
      },
    },
    include: tripDetailInclude,
  });

  // Persist day narratives as NOTE items when provided
  for (const day of trip.days) {
    const dateKey = formatDateOnly(day.date);
    const override = notesByDate.get(dateKey);
    if (!override?.notes?.trim()) continue;
    await prisma.itineraryItem.create({
      data: {
        tripDayId: day.id,
        type: "NOTE",
        title: "O gün neler yaptım",
        description: override.notes.trim(),
        position: 0,
        source: "MANUAL",
      },
    });
  }

  const refreshed = await prisma.trip.findFirstOrThrow({
    where: { id: trip.id },
    include: tripDetailInclude,
  });

  return { trip: toTripDetailDto(refreshed) };
}
