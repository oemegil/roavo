import "server-only";

import { AppError } from "@/lib/errors";
import { toTripDetailDto, type TripDetailDto } from "@/features/trips/dto";
import { findOwnedTripById } from "@/server/repositories/trip-repository";

export async function getTripService(input: {
  ownerId: string;
  tripId: string;
}): Promise<TripDetailDto> {
  const trip = await findOwnedTripById(input.tripId, input.ownerId);
  if (!trip) {
    throw new AppError({
      code: "TRIP_NOT_FOUND",
      message: "The requested trip could not be found.",
      status: 404,
    });
  }
  return toTripDetailDto(trip);
}

export async function requireMutableOwnedTrip(input: {
  ownerId: string;
  tripId: string;
}) {
  const trip = await findOwnedTripById(input.tripId, input.ownerId);
  if (!trip) {
    throw new AppError({
      code: "TRIP_NOT_FOUND",
      message: "The requested trip could not be found.",
      status: 404,
    });
  }
  if (trip.status === "ARCHIVED") {
    throw new AppError({
      code: "TRIP_ARCHIVED",
      message: "Restore this trip before editing it.",
      status: 409,
    });
  }
  return trip;
}
