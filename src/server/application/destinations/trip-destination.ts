import "server-only";

import { AppError } from "@/lib/errors";
import { createRequestLogger } from "@/lib/logging/logger";
import type { SelectTripDestinationInput } from "@/features/destinations/schemas";
import {
  toTripDestinationDto,
  type TripDestinationDto,
} from "@/features/destinations/dto";
import { toTripDetailDto, type TripDetailDto } from "@/features/trips/dto";
import { findActiveDestinationById } from "@/server/repositories/destination-repository";
import {
  findOwnedTripById,
  prisma,
  tripDetailInclude,
} from "@/server/repositories/trip-repository";

async function assertMutableOwnedTrip(tripId: string, ownerId: string) {
  const trip = await findOwnedTripById(tripId, ownerId);
  if (!trip) {
    throw new AppError({
      code: "TRIP_NOT_FOUND",
      message: "Trip not found.",
      status: 404,
    });
  }
  if (trip.status === "ARCHIVED") {
    throw new AppError({
      code: "TRIP_ARCHIVED",
      message: "Archived trips cannot be modified. Restore the trip first.",
      status: 409,
    });
  }
  return trip;
}

function countItineraryItems(
  trip: Awaited<ReturnType<typeof findOwnedTripById>>,
): number {
  if (!trip) return 0;
  return trip.days.reduce((sum, day) => sum + day.items.length, 0);
}

export async function selectTripDestinationService(input: {
  tripId: string;
  ownerId: string;
  data: SelectTripDestinationInput;
  correlationId?: string;
}): Promise<{ trip: TripDetailDto; destination: TripDestinationDto }> {
  const log = createRequestLogger(
    input.correlationId ?? "trip-destination-select",
  );

  try {
    const trip = await assertMutableOwnedTrip(input.tripId, input.ownerId);
    const itemCount = countItineraryItems(trip);

    if (itemCount > 0 && input.data.confirmItineraryWarning !== true) {
      throw new AppError({
        code: "DESTINATION_SELECTION_INVALID",
        message:
          "Changing the destination will not update or remove your existing itinerary items. Confirm to continue.",
        status: 400,
        metadata: { requiresItineraryConfirmation: true, itemCount },
      });
    }

    if (input.data.mode === "catalog") {
      const catalog = await findActiveDestinationById(input.data.destinationId);
      if (!catalog) {
        throw new AppError({
          code: "DESTINATION_NOT_FOUND",
          message: "Selected destination is not available.",
          status: 404,
        });
      }

      const updated = await prisma.trip.update({
        where: { id: trip.id },
        data: {
          destinationId: catalog.id,
          destinationName: catalog.name,
          destinationCountryCode: catalog.countryCode,
          destinationRegionNameSnapshot: catalog.regionName,
          destinationPlaceId: null,
          destinationSource: "CATALOG",
        },
        include: tripDetailInclude,
      });

      log.info("Catalog destination selected for trip", {
        tripId: trip.id,
        userId: input.ownerId,
        destinationId: catalog.id,
        itemCount,
      });

      const destination = toTripDestinationDto({
        destinationId: updated.destinationId,
        destinationName: updated.destinationName,
        destinationCountryCode: updated.destinationCountryCode,
        destinationRegionNameSnapshot: updated.destinationRegionNameSnapshot,
        destinationSource: updated.destinationSource,
        destinationSlug: catalog.slug,
      });

      return { trip: toTripDetailDto(updated), destination };
    }

    const updated = await prisma.trip.update({
      where: { id: trip.id },
      data: {
        destinationId: null,
        destinationName: input.data.name,
        destinationCountryCode: input.data.countryCode ?? null,
        destinationRegionNameSnapshot: input.data.regionName ?? null,
        destinationPlaceId: null,
        destinationSource: "MANUAL",
      },
      include: tripDetailInclude,
    });

    log.info("Manual destination selected for trip", {
      tripId: trip.id,
      userId: input.ownerId,
      itemCount,
    });

    const destination = toTripDestinationDto({
      destinationId: null,
      destinationName: updated.destinationName,
      destinationCountryCode: updated.destinationCountryCode,
      destinationRegionNameSnapshot: updated.destinationRegionNameSnapshot,
      destinationSource: updated.destinationSource,
      destinationSlug: null,
    });

    return { trip: toTripDetailDto(updated), destination };
  } catch (error) {
    if (error instanceof AppError) throw error;
    log.error("Trip destination update failed", {
      error,
      tripId: input.tripId,
      userId: input.ownerId,
    });
    throw new AppError({
      code: "TRIP_DESTINATION_UPDATE_FAILED",
      message: "We couldn't update the trip destination. Please try again.",
      status: 500,
      cause: error,
    });
  }
}

export async function clearTripDestinationService(input: {
  tripId: string;
  ownerId: string;
  confirmItineraryWarning?: boolean;
  correlationId?: string;
}): Promise<{ trip: TripDetailDto; destination: TripDestinationDto }> {
  const log = createRequestLogger(
    input.correlationId ?? "trip-destination-clear",
  );

  try {
    const trip = await assertMutableOwnedTrip(input.tripId, input.ownerId);
    const itemCount = countItineraryItems(trip);

    if (itemCount > 0 && input.confirmItineraryWarning !== true) {
      throw new AppError({
        code: "DESTINATION_SELECTION_INVALID",
        message:
          "Clearing the destination will not update or remove your existing itinerary items. Confirm to continue.",
        status: 400,
        metadata: { requiresItineraryConfirmation: true, itemCount },
      });
    }

    const updated = await prisma.trip.update({
      where: { id: trip.id },
      data: {
        destinationId: null,
        destinationName: null,
        destinationCountryCode: null,
        destinationRegionNameSnapshot: null,
        destinationPlaceId: null,
        destinationSource: null,
      },
      include: tripDetailInclude,
    });

    log.info("Trip destination cleared", {
      tripId: trip.id,
      userId: input.ownerId,
      itemCount,
    });

    return {
      trip: toTripDetailDto(updated),
      destination: toTripDestinationDto({
        destinationId: null,
        destinationName: null,
        destinationCountryCode: null,
        destinationRegionNameSnapshot: null,
        destinationSource: null,
        destinationSlug: null,
      }),
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError({
      code: "TRIP_DESTINATION_UPDATE_FAILED",
      message: "We couldn't clear the trip destination. Please try again.",
      status: 500,
      cause: error,
    });
  }
}
