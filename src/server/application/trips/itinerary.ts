import "server-only";

import { AppError } from "@/lib/errors";
import type {
  CreateItineraryItemInput,
  UpdateItineraryItemInput,
} from "@/features/trips/schemas";
import { toTripDetailDto, type TripDetailDto } from "@/features/trips/dto";
import { requireMutableOwnedTrip } from "@/server/application/trips/get-trip";
import { findOwnedTripById } from "@/server/repositories/trip-repository";
import { prisma } from "@/server/infrastructure/database";
import { majorToMinor } from "@/server/domain/trips/money";
import { hhMmToMinutes } from "@/server/domain/trips/time-of-day";
import { assertPermutation, insertAtPositions } from "@/server/domain/trips/ordering";

async function refreshTrip(tripId: string, ownerId: string): Promise<TripDetailDto> {
  const trip = await findOwnedTripById(tripId, ownerId);
  if (!trip) {
    throw new AppError({
      code: "TRIP_NOT_FOUND",
      message: "The requested trip could not be found.",
      status: 404,
    });
  }
  return toTripDetailDto(trip);
}

export async function updateTripDayService(input: {
  ownerId: string;
  tripId: string;
  dayId: string;
  title?: string | null;
  notes?: string | null;
}): Promise<TripDetailDto> {
  const trip = await requireMutableOwnedTrip(input);
  const day = trip.days.find((d) => d.id === input.dayId);
  if (!day) {
    throw new AppError({
      code: "TRIP_DAY_NOT_FOUND",
      message: "The requested day could not be found.",
      status: 404,
    });
  }

  await prisma.tripDay.update({
    where: { id: day.id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  });

  return refreshTrip(trip.id, input.ownerId);
}

export async function reorderTripDaysService(input: {
  ownerId: string;
  tripId: string;
  orderedDayIds: string[];
}): Promise<TripDetailDto> {
  const trip = await requireMutableOwnedTrip(input);
  const existingIds = trip.days.map((d) => d.id);

  try {
    assertPermutation(input.orderedDayIds, existingIds);
  } catch {
    throw new AppError({
      code: "TRIP_DAY_REORDER_INVALID",
      message: "The day order is invalid.",
      status: 400,
    });
  }

  await prisma.$transaction(async (tx) => {
    for (const [index, dayId] of input.orderedDayIds.entries()) {
      await tx.tripDay.update({
        where: { id: dayId },
        data: { position: index + 10_000 },
      });
    }
    for (const [index, dayId] of input.orderedDayIds.entries()) {
      await tx.tripDay.update({
        where: { id: dayId },
        data: { position: index, title: `Gün ${index + 1}` },
      });
    }
  });

  return refreshTrip(trip.id, input.ownerId);
}

function mapItemTimes(data: {
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  estimatedCostMajor?: number | null;
  currencyCode?: string;
}) {
  return {
    startMinutes: data.startTime ? hhMmToMinutes(data.startTime) : undefined,
    endMinutes: data.endTime ? hhMmToMinutes(data.endTime) : undefined,
    durationMinutes: data.durationMinutes,
    estimatedCostMinor:
      data.estimatedCostMajor === undefined
        ? undefined
        : data.estimatedCostMajor === null
          ? null
          : majorToMinor(data.estimatedCostMajor, data.currencyCode ?? "USD"),
  };
}

export async function createItineraryItemService(input: {
  ownerId: string;
  tripId: string;
  dayId: string;
  data: CreateItineraryItemInput;
}): Promise<TripDetailDto> {
  const trip = await requireMutableOwnedTrip(input);
  const day = trip.days.find((d) => d.id === input.dayId);
  if (!day) {
    throw new AppError({
      code: "TRIP_DAY_NOT_FOUND",
      message: "The requested day could not be found.",
      status: 404,
    });
  }

  const times = mapItemTimes(input.data);

  await prisma.itineraryItem.create({
    data: {
      tripDayId: day.id,
      type: input.data.type,
      title: input.data.title,
      description: input.data.description,
      locationName: input.data.locationName,
      externalPlaceId: input.data.externalPlaceId,
      startMinutes: times.startMinutes ?? null,
      endMinutes: times.endMinutes ?? null,
      durationMinutes: times.durationMinutes ?? null,
      estimatedCostMinor: times.estimatedCostMinor ?? null,
      currencyCode: input.data.currencyCode,
      transportationMode: input.data.transportationMode,
      notes: input.data.notes,
      position: day.items.length,
      source: "MANUAL",
    },
  });

  return refreshTrip(trip.id, input.ownerId);
}

export async function updateItineraryItemService(input: {
  ownerId: string;
  tripId: string;
  dayId: string;
  itemId: string;
  data: UpdateItineraryItemInput;
}): Promise<TripDetailDto> {
  const trip = await requireMutableOwnedTrip(input);
  const day = trip.days.find((d) => d.id === input.dayId);
  const item = day?.items.find((i) => i.id === input.itemId);
  if (!day || !item) {
    throw new AppError({
      code: "ITINERARY_ITEM_NOT_FOUND",
      message: "The requested activity could not be found.",
      status: 404,
    });
  }

  const times = mapItemTimes(input.data);

  await prisma.itineraryItem.update({
    where: { id: item.id },
    data: {
      ...(input.data.type !== undefined ? { type: input.data.type } : {}),
      ...(input.data.title !== undefined ? { title: input.data.title } : {}),
      ...(input.data.description !== undefined
        ? { description: input.data.description }
        : {}),
      ...(input.data.locationName !== undefined
        ? { locationName: input.data.locationName }
        : {}),
      ...(input.data.externalPlaceId !== undefined
        ? { externalPlaceId: input.data.externalPlaceId }
        : {}),
      ...(input.data.startTime !== undefined
        ? { startMinutes: times.startMinutes ?? null }
        : {}),
      ...(input.data.endTime !== undefined
        ? { endMinutes: times.endMinutes ?? null }
        : {}),
      ...(input.data.durationMinutes !== undefined
        ? { durationMinutes: input.data.durationMinutes }
        : {}),
      ...(input.data.estimatedCostMajor !== undefined
        ? { estimatedCostMinor: times.estimatedCostMinor ?? null }
        : {}),
      ...(input.data.currencyCode !== undefined
        ? { currencyCode: input.data.currencyCode }
        : {}),
      ...(input.data.transportationMode !== undefined
        ? { transportationMode: input.data.transportationMode }
        : {}),
      ...(input.data.notes !== undefined ? { notes: input.data.notes } : {}),
    },
  });

  return refreshTrip(trip.id, input.ownerId);
}

export async function deleteItineraryItemService(input: {
  ownerId: string;
  tripId: string;
  dayId: string;
  itemId: string;
}): Promise<TripDetailDto> {
  const trip = await requireMutableOwnedTrip(input);
  const day = trip.days.find((d) => d.id === input.dayId);
  const item = day?.items.find((i) => i.id === input.itemId);
  if (!day || !item) {
    throw new AppError({
      code: "ITINERARY_ITEM_NOT_FOUND",
      message: "The requested activity could not be found.",
      status: 404,
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.itineraryItem.delete({ where: { id: item.id } });
    const remaining = await tx.itineraryItem.findMany({
      where: { tripDayId: day.id },
      orderBy: [{ position: "asc" }, { id: "asc" }],
    });
    for (const [index, row] of remaining.entries()) {
      await tx.itineraryItem.update({
        where: { id: row.id },
        data: { position: index },
      });
    }
  });

  return refreshTrip(trip.id, input.ownerId);
}

export async function reorderItineraryItemsService(input: {
  ownerId: string;
  tripId: string;
  dayId: string;
  orderedItemIds: string[];
}): Promise<TripDetailDto> {
  const trip = await requireMutableOwnedTrip(input);
  const day = trip.days.find((d) => d.id === input.dayId);
  if (!day) {
    throw new AppError({
      code: "TRIP_DAY_NOT_FOUND",
      message: "The requested day could not be found.",
      status: 404,
    });
  }

  try {
    assertPermutation(
      input.orderedItemIds,
      day.items.map((i) => i.id),
    );
  } catch {
    throw new AppError({
      code: "ITINERARY_ITEM_REORDER_INVALID",
      message: "The activity order is invalid.",
      status: 400,
    });
  }

  await prisma.$transaction(async (tx) => {
    for (const [index, itemId] of input.orderedItemIds.entries()) {
      await tx.itineraryItem.update({
        where: { id: itemId },
        data: { position: index + 10_000 },
      });
    }
    for (const [index, itemId] of input.orderedItemIds.entries()) {
      await tx.itineraryItem.update({
        where: { id: itemId },
        data: { position: index },
      });
    }
  });

  return refreshTrip(trip.id, input.ownerId);
}

export async function moveItineraryItemService(input: {
  ownerId: string;
  tripId: string;
  itemId: string;
  targetTripDayId: string;
  targetIndex: number;
}): Promise<TripDetailDto> {
  const trip = await requireMutableOwnedTrip(input);
  const sourceDay = trip.days.find((day) =>
    day.items.some((item) => item.id === input.itemId),
  );
  const targetDay = trip.days.find((day) => day.id === input.targetTripDayId);
  const item = sourceDay?.items.find((row) => row.id === input.itemId);

  if (!sourceDay || !item || !targetDay) {
    throw new AppError({
      code: "ITINERARY_ITEM_MOVE_INVALID",
      message: "The activity could not be moved.",
      status: 400,
    });
  }

  await prisma.$transaction(async (tx) => {
    const sourceIds = sourceDay.items
      .map((row) => row.id)
      .filter((id) => id !== item.id);
    const targetIds =
      sourceDay.id === targetDay.id
        ? insertAtPositions(
            sourceDay.items.map((row) => row.id),
            item.id,
            input.targetIndex,
          )
        : insertAtPositions(
            [...targetDay.items.map((row) => row.id), item.id],
            item.id,
            input.targetIndex,
          );

    if (sourceDay.id !== targetDay.id) {
      await tx.itineraryItem.update({
        where: { id: item.id },
        data: { tripDayId: targetDay.id, position: 20_000 },
      });
      for (const [index, id] of sourceIds.entries()) {
        await tx.itineraryItem.update({
          where: { id },
          data: { position: index },
        });
      }
    }

    for (const [index, id] of targetIds.entries()) {
      await tx.itineraryItem.update({
        where: { id },
        data: {
          tripDayId: targetDay.id,
          position: index + 10_000,
        },
      });
    }
    for (const [index, id] of targetIds.entries()) {
      await tx.itineraryItem.update({
        where: { id },
        data: { position: index },
      });
    }
  });

  return refreshTrip(trip.id, input.ownerId);
}
