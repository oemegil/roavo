import "server-only";

import { AppError } from "@/lib/errors";
import { createRequestLogger } from "@/lib/logging/logger";
import { toTripDetailDto, type TripDetailDto } from "@/features/trips/dto";
import { findOwnedTripById } from "@/server/repositories/trip-repository";
import { prisma } from "@/server/infrastructure/database";

export async function archiveTripService(input: {
  ownerId: string;
  tripId: string;
  correlationId?: string;
}): Promise<TripDetailDto> {
  const trip = await findOwnedTripById(input.tripId, input.ownerId);
  if (!trip) {
    throw new AppError({
      code: "TRIP_NOT_FOUND",
      message: "The requested trip could not be found.",
      status: 404,
    });
  }

  if (trip.status !== "ARCHIVED") {
    await prisma.trip.update({
      where: { id: trip.id },
      data: { status: "ARCHIVED", archivedAt: new Date() },
    });
  }

  const refreshed = await findOwnedTripById(trip.id, input.ownerId);
  createRequestLogger(input.correlationId ?? "trip-archive").info("Trip archived", {
    tripId: trip.id,
    userId: input.ownerId,
  });
  return toTripDetailDto(refreshed!);
}

export async function restoreTripService(input: {
  ownerId: string;
  tripId: string;
  correlationId?: string;
}): Promise<TripDetailDto> {
  const trip = await findOwnedTripById(input.tripId, input.ownerId);
  if (!trip) {
    throw new AppError({
      code: "TRIP_NOT_FOUND",
      message: "The requested trip could not be found.",
      status: 404,
    });
  }

  if (trip.status !== "DRAFT") {
    await prisma.trip.update({
      where: { id: trip.id },
      data: { status: "DRAFT", archivedAt: null },
    });
  }

  const refreshed = await findOwnedTripById(trip.id, input.ownerId);
  createRequestLogger(input.correlationId ?? "trip-restore").info("Trip restored", {
    tripId: trip.id,
    userId: input.ownerId,
  });
  return toTripDetailDto(refreshed!);
}

export async function deleteTripService(input: {
  ownerId: string;
  tripId: string;
  correlationId?: string;
}): Promise<void> {
  const trip = await findOwnedTripById(input.tripId, input.ownerId);
  if (!trip) {
    throw new AppError({
      code: "TRIP_NOT_FOUND",
      message: "The requested trip could not be found.",
      status: 404,
    });
  }

  await prisma.trip.update({
    where: { id: trip.id },
    data: { deletedAt: new Date(), status: "ARCHIVED", archivedAt: new Date() },
  });

  createRequestLogger(input.correlationId ?? "trip-delete").info("Trip deleted", {
    tripId: trip.id,
    userId: input.ownerId,
  });
}
