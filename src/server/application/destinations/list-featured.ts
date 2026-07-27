import "server-only";

import { createRequestLogger } from "@/lib/logging/logger";
import {
  toDestinationSummaryDto,
  type DestinationSummaryDto,
} from "@/features/destinations/dto";
import { DESTINATION_LIMITS } from "@/server/domain/destinations/constants";
import { listFeaturedDestinations } from "@/server/repositories/destination-repository";

export async function listFeaturedDestinationsService(input?: {
  limit?: number;
  correlationId?: string;
}): Promise<{ items: DestinationSummaryDto[] }> {
  const log = createRequestLogger(input?.correlationId ?? "destination-featured");
  const limit = input?.limit ?? DESTINATION_LIMITS.featuredDefaultLimit;
  const items = await listFeaturedDestinations(limit);

  log.info("Featured destinations listed", { resultCount: items.length });

  return { items: items.map(toDestinationSummaryDto) };
}
