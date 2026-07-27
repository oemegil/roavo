import "server-only";

import { AppError } from "@/lib/errors";
import { createRequestLogger } from "@/lib/logging/logger";
import {
  toDestinationSummaryDto,
  type DestinationSearchResponseDto,
} from "@/features/destinations/dto";
import type { DestinationSearchQuery } from "@/features/destinations/schemas";
import { searchActiveDestinations } from "@/server/repositories/destination-repository";

export async function searchDestinationsService(input: {
  criteria: DestinationSearchQuery;
  correlationId?: string;
}): Promise<DestinationSearchResponseDto> {
  const log = createRequestLogger(input.correlationId ?? "destination-search");
  const started = Date.now();

  try {
    const { items, nextCursor } = await searchActiveDestinations(input.criteria);
    const latencyMs = Date.now() - started;

    log.info(
      items.length === 0
        ? "Destination search returned no results"
        : "Destination search completed",
      {
        queryLength: input.criteria.q?.length ?? 0,
        filters: {
          type: input.criteria.type ?? null,
          countryCode: input.criteria.countryCode ?? null,
          category: input.criteria.category ?? null,
          budgetLevel: input.criteria.budgetLevel ?? null,
          bestFor: input.criteria.bestFor ?? null,
        },
        resultCount: items.length,
        latencyMs,
      },
    );

    return {
      items: items.map(toDestinationSummaryDto),
      nextCursor,
      filters: {
        q: input.criteria.q ?? null,
        type: input.criteria.type ?? null,
        countryCode: input.criteria.countryCode ?? null,
        category: input.criteria.category ?? null,
        budgetLevel: input.criteria.budgetLevel ?? null,
        bestFor: input.criteria.bestFor ?? null,
      },
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    log.error("Destination search failed", { error });
    throw new AppError({
      code: "DESTINATION_SEARCH_FAILED",
      message: "We couldn't search destinations right now. Please try again.",
      status: 500,
      cause: error,
    });
  }
}
