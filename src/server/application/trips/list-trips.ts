import "server-only";

import { TRIP_LIMITS } from "@/server/domain/trips/constants";
import { toTripSummaryDto, type TripSummaryDto } from "@/features/trips/dto";
import { listOwnedTrips } from "@/server/repositories/trip-repository";
import type { TripStatus } from "@prisma/client";

export async function listUserTripsService(input: {
  ownerId: string;
  status: TripStatus;
  limit?: number;
  cursor?: string;
}): Promise<{ trips: TripSummaryDto[]; nextCursor: string | null }> {
  const limit = Math.min(
    input.limit ?? TRIP_LIMITS.listDefaultLimit,
    TRIP_LIMITS.listMaxLimit,
  );

  const rows = await listOwnedTrips({
    ownerId: input.ownerId,
    status: input.status,
    limit,
    cursor: input.cursor,
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return {
    trips: page.map(toTripSummaryDto),
    nextCursor: hasMore ? page[page.length - 1]!.id : null,
  };
}
