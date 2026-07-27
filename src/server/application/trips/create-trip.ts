import "server-only";

import { AppError } from "@/lib/errors";
import { createRequestLogger } from "@/lib/logging/logger";
import { TRIP_LIMITS } from "@/server/domain/trips/constants";
import { inclusiveDayCount, parseDateOnly } from "@/server/domain/trips/date-only";
import type { CreateTripInput } from "@/features/trips/schemas";
import { toTripDetailDto, type TripDetailDto } from "@/features/trips/dto";
import { findActiveDestinationById } from "@/server/repositories/destination-repository";
import { createTripWithDays } from "@/server/repositories/trip-repository";

export async function createTripService(input: {
  ownerId: string;
  data: CreateTripInput;
  correlationId?: string;
}): Promise<TripDetailDto> {
  const log = createRequestLogger(input.correlationId ?? "trip-create");
  const start = parseDateOnly(input.data.startDate);
  const end = parseDateOnly(input.data.endDate);
  const duration = inclusiveDayCount(start, end);

  if (duration < 1) {
    throw new AppError({
      code: "TRIP_DATE_RANGE_INVALID",
      message: "End date must be on or after the start date.",
      status: 400,
    });
  }

  if (duration > TRIP_LIMITS.maxDurationDays) {
    throw new AppError({
      code: "TRIP_DURATION_EXCEEDED",
      message: `Trips can be at most ${TRIP_LIMITS.maxDurationDays} days long.`,
      status: 400,
    });
  }

  let resolvedDestination: {
    destinationId: string | null;
    destinationName: string | null;
    destinationCountryCode: string | null;
    destinationRegionNameSnapshot: string | null;
    destinationSource: "CATALOG" | "MANUAL" | null;
  } = {
    destinationId: null,
    destinationName: input.data.destinationName ?? null,
    destinationCountryCode: input.data.destinationCountryCode ?? null,
    destinationRegionNameSnapshot: input.data.destinationRegionName ?? null,
    destinationSource: input.data.destinationName ? "MANUAL" : null,
  };

  if (input.data.destinationId) {
    const catalog = await findActiveDestinationById(input.data.destinationId);
    if (!catalog) {
      throw new AppError({
        code: "DESTINATION_NOT_FOUND",
        message: "Selected destination is not available.",
        status: 404,
      });
    }
    resolvedDestination = {
      destinationId: catalog.id,
      destinationName: catalog.name,
      destinationCountryCode: catalog.countryCode,
      destinationRegionNameSnapshot: catalog.regionName,
      destinationSource: "CATALOG",
    };
  }

  try {
    const trip = await createTripWithDays({
      ownerId: input.ownerId,
      data: input.data,
      destination: resolvedDestination,
    });

    log.info("Trip created", {
      tripId: trip.id,
      userId: input.ownerId,
      dayCount: trip.days.length,
      destinationSource: resolvedDestination.destinationSource,
    });

    return toTripDetailDto(trip);
  } catch (error) {
    if (error instanceof AppError) throw error;
    log.error("Trip creation failed", { error, userId: input.ownerId });
    throw new AppError({
      code: "TRIP_CREATION_FAILED",
      message: "We couldn't create your trip. Please try again.",
      status: 500,
      cause: error,
    });
  }
}
