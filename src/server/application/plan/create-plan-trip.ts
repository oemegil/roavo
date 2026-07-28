import "server-only";

import { AppError } from "@/lib/errors";
import { createRequestLogger } from "@/lib/logging/logger";
import type { CreatePlanTripInput } from "@/features/plan/schemas";
import { toTripDetailDto, type TripDetailDto } from "@/features/trips/dto";
import { awardTravelerScore } from "@/server/application/traveler/award-score";
import { generateItineraryPreviewService } from "@/server/application/ai/itinerary-generation";
import {
  geocodeGeneratedItineraryPlaces,
  persistGeneratedItinerary,
} from "@/server/application/plan/persist-generated-itinerary";
import { inclusiveDayCount, parseDateOnly } from "@/server/domain/trips/date-only";
import { resolveCitiesByIds } from "@/server/domain/places/catalog";
import { findActiveDestinationBySlug } from "@/server/repositories/destination-repository";
import { prisma, tripDetailInclude } from "@/server/repositories/trip-repository";
import { generateDaysForRange } from "@/server/domain/trips/day-planner";

export async function createPlanTripService(input: {
  ownerId: string;
  data: CreatePlanTripInput;
  correlationId?: string;
}): Promise<{
  trip: TripDetailDto;
  previewId?: string;
  itineraryError?: {
    code: string;
    message: string;
    details?: string;
    debug?: {
      systemPrompt?: string;
      userPrompt?: string;
      schemaHint?: string;
      rawResponse?: string | null;
    };
  };
}> {
  const log = createRequestLogger(input.correlationId ?? "plan-create");
  const cities = resolveCitiesByIds(input.data.cityIds);
  if (cities.length === 0) {
    throw new AppError({
      code: "VALIDATION_ERROR",
      message: "En az bir geçerli şehir seç.",
      status: 400,
    });
  }

  const startDate = parseDateOnly(input.data.startDate);
  const endDate = parseDateOnly(input.data.endDate);
  const dayCount = inclusiveDayCount(startDate, endDate);
  const days = generateDaysForRange(startDate, endDate);

  const stopNames = cities.map((c) => c.nameTr).join(" · ");
  const primary = cities[0]!;
  const originName = input.data.origin?.name ?? "Belirtilmedi";
  const title =
    input.data.title?.trim() ||
    input.data.itinerary?.titleSuggestion?.trim() ||
    (cities.length === 1 ? `${primary.nameTr} planı` : `${stopNames} planı`);

  let destinationId: string | null = null;
  if (primary.destinationSlug) {
    const catalog = await findActiveDestinationBySlug(primary.destinationSlug);
    destinationId = catalog?.id ?? null;
  }

  const stopCreates: Array<{
    position: number;
    name: string;
    countryCode: string;
    iataCode: string | null;
    destinationId: string | null;
  }> = [];
  for (let index = 0; index < cities.length; index += 1) {
    const city = cities[index]!;
    let destId: string | null = null;
    if (city.destinationSlug) {
      const d = await findActiveDestinationBySlug(city.destinationSlug);
      destId = d?.id ?? null;
    }
    stopCreates.push({
      position: index,
      name: city.nameTr,
      countryCode: city.countryCode,
      iataCode: city.iata ?? null,
      destinationId: destId,
    });
  }

  const geocodedPlaces = input.data.itinerary
    ? await geocodeGeneratedItineraryPlaces(input.data.itinerary)
    : [];

  const trip = await prisma.$transaction(
    async (tx) => {
      const created = await tx.trip.create({
        data: {
          ownerId: input.ownerId,
          title,
          originName,
          originCountryCode: input.data.origin?.countryCode ?? "TR",
          destinationId,
          destinationName: stopNames,
          destinationCountryCode: primary.countryCode,
          destinationSource: destinationId ? "CATALOG" : "MANUAL",
          startDate,
          endDate,
          travelerCount: input.data.travelerCount,
          currencyCode: input.data.currencyCode,
          travelPace: input.data.travelPace,
          interests: input.data.interests,
          additionalNotes: input.data.flight
            ? `Uçuş: ${input.data.flight.routeSummary}`
            : input.data.itinerary?.summary
              ? input.data.itinerary.summary.slice(0, 500)
              : undefined,
          days: {
            create: days.map((day) => ({
              date: day.date,
              title: day.title,
              position: day.position,
            })),
          },
          stops: {
            create: stopCreates,
          },
          ...(input.data.flight
            ? {
                flightQuote: {
                  create: {
                    outboundOrigin: input.data.flight.outboundOrigin,
                    outboundDest: input.data.flight.outboundDest,
                    outboundDate: parseDateOnly(input.data.flight.outboundDate),
                    returnOrigin: input.data.flight.returnOrigin,
                    returnDest: input.data.flight.returnDest,
                    returnDate: parseDateOnly(input.data.flight.returnDate),
                    entryCityName: input.data.flight.entryCityName,
                    exitCityName: input.data.flight.exitCityName,
                    priceAmount: input.data.flight.priceAmount,
                    priceCurrency: input.data.flight.priceCurrency,
                    priceStatus: input.data.flight.priceStatus,
                    ignavId: input.data.flight.ignavId,
                    routeSummary: input.data.flight.routeSummary,
                    carrierSummary: input.data.flight.carrierSummary,
                  },
                },
              }
            : {}),
        },
        include: { days: { orderBy: { position: "asc" } } },
      });

      if (input.data.itinerary) {
        await persistGeneratedItinerary(tx, {
          days: created.days,
          itinerary: input.data.itinerary,
          currencyCode: input.data.currencyCode,
          geocodedPlaces,
        });
      }

      return created;
    },
    { timeout: 60_000, maxWait: 10_000 },
  );

  log.info("Plan trip created", {
    tripId: trip.id,
    userId: input.ownerId,
    dayCount,
    stopCount: cities.length,
    withItinerary: Boolean(input.data.itinerary),
  });

  let previewId: string | undefined;
  let itineraryError:
    | {
        code: string;
        message: string;
        details?: string;
        debug?: {
          systemPrompt?: string;
          userPrompt?: string;
          schemaHint?: string;
          rawResponse?: string | null;
        };
      }
    | undefined;

  // Legacy path: generate after create (prefer client preview + itinerary payload).
  if (input.data.generateItinerary && !input.data.itinerary) {
    try {
      const preview = await generateItineraryPreviewService({
        userId: input.ownerId,
        tripId: trip.id,
        expectedTripVersion: trip.updatedAt.toISOString(),
        correlationId: input.correlationId,
      });
      previewId = preview.previewId;
    } catch (error) {
      const code = error instanceof AppError ? error.code : "AI_GENERATION_FAILED";
      const message =
        error instanceof AppError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Günlük program üretilemedi.";
      itineraryError = { code, message };
      log.warn("Itinerary preview failed after plan trip create", {
        tripId: trip.id,
        errorCode: code,
        errorMessage: message,
        error,
      });
    }
  }

  const refreshed = await prisma.trip.findFirstOrThrow({
    where: { id: trip.id },
    include: tripDetailInclude,
  });

  void awardTravelerScore({
    userId: input.ownerId,
    action: "TRIP_SAVE",
    tripId: trip.id,
    referenceKey: trip.id,
    correlationId: input.correlationId,
  });

  return { trip: toTripDetailDto(refreshed), previewId, itineraryError };
}
