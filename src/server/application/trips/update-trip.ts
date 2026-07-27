import "server-only";

import { AppError } from "@/lib/errors";
import { createRequestLogger } from "@/lib/logging/logger";
import type { UpdateTripInput } from "@/features/trips/schemas";
import { toTripDetailDto, type TripDetailDto } from "@/features/trips/dto";
import { TRIP_LIMITS } from "@/server/domain/trips/constants";
import { planDateRangeSync } from "@/server/domain/trips/day-planner";
import {
  formatDateOnly,
  inclusiveDayCount,
  parseDateOnly,
} from "@/server/domain/trips/date-only";
import { majorToMinor } from "@/server/domain/trips/money";
import { prisma } from "@/server/infrastructure/database";
import { requireMutableOwnedTrip } from "@/server/application/trips/get-trip";
import { findOwnedTripById } from "@/server/repositories/trip-repository";

export async function updateTripService(input: {
  ownerId: string;
  tripId: string;
  data: UpdateTripInput;
  correlationId?: string;
}): Promise<TripDetailDto> {
  const log = createRequestLogger(input.correlationId ?? "trip-update");
  const trip = await requireMutableOwnedTrip({
    ownerId: input.ownerId,
    tripId: input.tripId,
  });

  if (input.data.expectedUpdatedAt) {
    const expected = new Date(input.data.expectedUpdatedAt).getTime();
    if (expected !== trip.updatedAt.getTime()) {
      throw new AppError({
        code: "TRIP_VERSION_CONFLICT",
        message: "This trip was updated elsewhere. Reload and try again.",
        status: 409,
      });
    }
  }

  const nextStart = input.data.startDate
    ? parseDateOnly(input.data.startDate)
    : trip.startDate;
  const nextEnd = input.data.endDate ? parseDateOnly(input.data.endDate) : trip.endDate;
  const duration = inclusiveDayCount(nextStart, nextEnd);

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

  const dateChanged =
    formatDateOnly(nextStart) !== formatDateOnly(trip.startDate) ||
    formatDateOnly(nextEnd) !== formatDateOnly(trip.endDate);

  if (dateChanged) {
    const plan = planDateRangeSync({
      existingDays: trip.days.map((day) => ({
        id: day.id,
        date: day.date,
        itemCount: day.items.length,
      })),
      newStart: nextStart,
      newEnd: nextEnd,
    });

    if (plan.type === "apply" && plan.blockedDayIds.length > 0) {
      throw new AppError({
        code: "TRIP_DATE_RANGE_CONFLICT",
        message:
          "Shortening this trip would remove days that still have activities. Move or delete those items first.",
        status: 409,
        metadata: { blockedDayIds: plan.blockedDayIds },
      });
    }

    await prisma.$transaction(async (tx) => {
      if (plan.type === "apply") {
        if (plan.removeEmptyDayIds.length > 0) {
          await tx.tripDay.deleteMany({
            where: { id: { in: plan.removeEmptyDayIds }, tripId: trip.id },
          });
        }
        for (const update of plan.shiftUpdates) {
          await tx.tripDay.update({
            where: { id: update.dayId },
            data: {
              date: update.date,
              title: update.title,
              position: update.position,
            },
          });
        }
        if (plan.add.length > 0) {
          await tx.tripDay.createMany({
            data: plan.add.map((day) => ({
              tripId: trip.id,
              date: day.date,
              title: day.title,
              position: day.position,
            })),
          });
        }

        const remaining = await tx.tripDay.findMany({
          where: { tripId: trip.id },
          orderBy: [{ date: "asc" }, { id: "asc" }],
        });
        for (const [index, day] of remaining.entries()) {
          await tx.tripDay.update({
            where: { id: day.id },
            data: { position: index, title: day.title ?? `Gün ${index + 1}` },
          });
        }
      }

      await tx.trip.update({
        where: { id: trip.id },
        data: buildTripUpdateData(input.data, nextStart, nextEnd, trip.currencyCode),
      });
    });
  } else {
    await prisma.trip.update({
      where: { id: trip.id },
      data: buildTripUpdateData(input.data, nextStart, nextEnd, trip.currencyCode),
    });
  }

  const refreshed = await findOwnedTripById(trip.id, input.ownerId);
  if (!refreshed) {
    throw new AppError({
      code: "TRIP_UPDATE_FAILED",
      message: "Your trip changes could not be saved.",
      status: 500,
    });
  }

  log.info("Trip updated", { tripId: trip.id, userId: input.ownerId });
  return toTripDetailDto(refreshed);
}

function buildTripUpdateData(
  data: UpdateTripInput,
  startDate: Date,
  endDate: Date,
  existingCurrency: string,
) {
  const currencyCode = data.currencyCode ?? existingCurrency;
  return {
    ...(data.title !== undefined ? { title: data.title } : {}),
    ...(data.description !== undefined ? { description: data.description } : {}),
    ...(data.originName !== undefined ? { originName: data.originName } : {}),
    ...(data.originCountryCode !== undefined
      ? { originCountryCode: data.originCountryCode }
      : {}),
    ...(data.destinationName !== undefined
      ? { destinationName: data.destinationName }
      : {}),
    ...(data.destinationCountryCode !== undefined
      ? { destinationCountryCode: data.destinationCountryCode }
      : {}),
    startDate,
    endDate,
    ...(data.travelerCount !== undefined ? { travelerCount: data.travelerCount } : {}),
    ...(data.currencyCode !== undefined ? { currencyCode: data.currencyCode } : {}),
    ...(data.totalBudgetMajor !== undefined
      ? {
          totalBudgetMinor:
            data.totalBudgetMajor === null
              ? null
              : majorToMinor(data.totalBudgetMajor, currencyCode),
        }
      : {}),
    ...(data.travelPace !== undefined ? { travelPace: data.travelPace } : {}),
    ...(data.destinationTypes !== undefined
      ? { destinationTypes: data.destinationTypes }
      : {}),
    ...(data.interests !== undefined ? { interests: data.interests } : {}),
    ...(data.dietaryNotes !== undefined ? { dietaryNotes: data.dietaryNotes } : {}),
    ...(data.accessibilityNotes !== undefined
      ? { accessibilityNotes: data.accessibilityNotes }
      : {}),
    ...(data.additionalNotes !== undefined
      ? { additionalNotes: data.additionalNotes }
      : {}),
  };
}
