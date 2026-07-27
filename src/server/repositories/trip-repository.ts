import "server-only";

import type { Prisma, TripStatus } from "@prisma/client";

import { prisma } from "@/server/infrastructure/database";
import { generateDaysForRange } from "@/server/domain/trips/day-planner";
import type { CreateTripInput } from "@/features/trips/schemas";
import { parseDateOnly } from "@/server/domain/trips/date-only";
import { majorToMinor } from "@/server/domain/trips/money";

const tripDetailInclude = {
  destination: {
    select: { slug: true },
  },
  stops: {
    orderBy: [{ position: "asc" as const }],
  },
  flightQuote: true,
  days: {
    orderBy: [{ position: "asc" as const }, { id: "asc" as const }],
    include: {
      items: {
        orderBy: [{ position: "asc" as const }, { id: "asc" as const }],
      },
    },
  },
} satisfies Prisma.TripInclude;

export type TripDetailRecord = Prisma.TripGetPayload<{
  include: typeof tripDetailInclude;
}>;

export async function findOwnedTripById(
  tripId: string,
  ownerId: string,
): Promise<TripDetailRecord | null> {
  return prisma.trip.findFirst({
    where: { id: tripId, ownerId, deletedAt: null },
    include: tripDetailInclude,
  });
}

export async function listOwnedTrips(input: {
  ownerId: string;
  status: TripStatus;
  limit: number;
  cursor?: string;
}) {
  return prisma.trip.findMany({
    where: {
      ownerId: input.ownerId,
      status: input.status,
      deletedAt: null,
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: input.limit + 1,
    ...(input.cursor
      ? {
          cursor: { id: input.cursor },
          skip: 1,
        }
      : {}),
    include: {
      _count: { select: { days: true } },
      days: {
        select: {
          id: true,
          _count: { select: { items: true } },
        },
      },
    },
  });
}

export async function createTripWithDays(input: {
  ownerId: string;
  data: CreateTripInput;
  destination?: {
    destinationId: string | null;
    destinationName: string | null;
    destinationCountryCode: string | null;
    destinationRegionNameSnapshot: string | null;
    destinationSource: "CATALOG" | "MANUAL" | null;
  };
}): Promise<TripDetailRecord> {
  const startDate = parseDateOnly(input.data.startDate);
  const endDate = parseDateOnly(input.data.endDate);
  const days = generateDaysForRange(startDate, endDate);
  const totalBudgetMinor =
    input.data.totalBudgetMajor !== undefined
      ? majorToMinor(input.data.totalBudgetMajor, input.data.currencyCode)
      : null;

  const destination = input.destination ?? {
    destinationId: null,
    destinationName: input.data.destinationName ?? null,
    destinationCountryCode: input.data.destinationCountryCode ?? null,
    destinationRegionNameSnapshot: input.data.destinationRegionName ?? null,
    destinationSource: input.data.destinationName
      ? ("MANUAL" as const)
      : null,
  };

  return prisma.trip.create({
    data: {
      ownerId: input.ownerId,
      title: input.data.title,
      description: input.data.description,
      originName: input.data.originName,
      originCountryCode: input.data.originCountryCode,
      destinationId: destination.destinationId,
      destinationName: destination.destinationName,
      destinationCountryCode: destination.destinationCountryCode,
      destinationRegionNameSnapshot: destination.destinationRegionNameSnapshot,
      destinationSource: destination.destinationSource,
      startDate,
      endDate,
      travelerCount: input.data.travelerCount,
      totalBudgetMinor,
      currencyCode: input.data.currencyCode,
      travelPace: input.data.travelPace,
      destinationTypes: input.data.destinationTypes,
      interests: input.data.interests,
      dietaryNotes: input.data.dietaryNotes,
      accessibilityNotes: input.data.accessibilityNotes,
      additionalNotes: input.data.additionalNotes,
      days: {
        create: days.map((day) => ({
          date: day.date,
          title: day.title,
          position: day.position,
        })),
      },
    },
    include: tripDetailInclude,
  });
}

export { prisma, tripDetailInclude };
