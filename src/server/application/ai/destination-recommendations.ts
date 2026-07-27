import "server-only";

import { AppError } from "@/lib/errors";
import { getServerEnv } from "@/lib/env/server";
import { createRequestLogger } from "@/lib/logging/logger";
import { executeStructuredAiOperation } from "@/integrations/ai/orchestrate";
import { destinationRecommendationPromptV1 } from "@/integrations/ai/prompts/destination-recommendation/v1";
import type { DestinationRecommendationResult } from "@/integrations/ai/output-schemas";
import type { DestinationRecommendationInput } from "@/features/ai/schemas";
import { AI_LIMITS } from "@/server/domain/ai/constants";
import {
  createRequestFingerprint,
  previewExpiresAt,
} from "@/server/domain/ai/fingerprint";
import { inclusiveDayCount, parseDateOnly } from "@/server/domain/trips/date-only";
import { prisma } from "@/server/infrastructure/database";
import {
  countUserAiOperationsToday,
  createDestinationRecommendation,
  findOwnedDestinationRecommendationByOperation,
} from "@/server/repositories/ai-repository";
import { createTripService } from "@/server/application/trips/create-trip";
import { selectTripDestinationService } from "@/server/application/destinations/trip-destination";
import type { CreateTripInput } from "@/features/trips/schemas";

function assertDailyLimit(count: number) {
  const limit = getServerEnv().AI_DAILY_OPERATION_LIMIT;
  if (count >= limit) {
    throw new AppError({
      code: "AI_RATE_LIMITED",
      message: "You have reached today's AI usage limit. Please try again tomorrow.",
      status: 429,
    });
  }
}

async function loadCandidates(input: DestinationRecommendationInput) {
  const duration = inclusiveDayCount(
    parseDateOnly(input.startDate),
    parseDateOnly(input.endDate),
  );

  const destinations = await prisma.destination.findMany({
    where: {
      status: "ACTIVE",
      ...(input.excludedDestinationIds.length
        ? { id: { notIn: input.excludedDestinationIds } }
        : {}),
      ...(input.preferredCountries.length
        ? { countryCode: { in: input.preferredCountries } }
        : {}),
    },
    orderBy: [{ popularityScore: "desc" }, { name: "asc" }],
    take: 80,
  });

  const scored = destinations
    .map((destination) => {
      let score = destination.popularityScore;
      const interestHit = input.interests.some((interest) =>
        destination.categories.some((category) =>
          category.includes(interest) || interest.includes(category),
        ),
      );
      if (interestHit) score += 20;
      if (
        destination.minimumRecommendedDays &&
        destination.maximumRecommendedDays &&
        duration >= destination.minimumRecommendedDays &&
        duration <= destination.maximumRecommendedDays
      ) {
        score += 15;
      }
      return { destination, score };
    })
    .sort(
      (a, b) =>
        b.score - a.score || a.destination.name.localeCompare(b.destination.name),
    )
    .slice(0, AI_LIMITS.recommendationCandidatesMax)
    .map(({ destination }) => ({
      id: destination.id,
      name: destination.name,
      countryCode: destination.countryCode,
      countryName: destination.countryName,
      regionName: destination.regionName,
      type: destination.type,
      budgetLevel: destination.budgetLevel,
      categories: destination.categories,
      bestFor: destination.bestFor,
      shortDescription: destination.shortDescription,
      minimumRecommendedDays: destination.minimumRecommendedDays,
      maximumRecommendedDays: destination.maximumRecommendedDays,
    }));

  if (scored.length < AI_LIMITS.recommendationCandidatesMin) {
    throw new AppError({
      code: "AI_INVALID_INPUT",
      message:
        "Not enough destinations in the catalog to generate recommendations.",
      status: 400,
    });
  }

  return scored;
}

function validateRecommendationResult(
  result: DestinationRecommendationResult,
  candidateIds: Set<string>,
) {
  const ranks = new Set<number>();
  for (const item of result.recommendations) {
    if (ranks.has(item.rank)) {
      throw new AppError({
        code: "AI_DOMAIN_VALIDATION_FAILED",
        message: "Recommendation ranks must be unique.",
        status: 422,
      });
    }
    ranks.add(item.rank);
    if (item.destinationMode === "CATALOG") {
      if (!item.destinationId || !candidateIds.has(item.destinationId)) {
        throw new AppError({
          code: "AI_DOMAIN_VALIDATION_FAILED",
          message: "AI returned an unknown catalog destination.",
          status: 422,
        });
      }
    } else if (item.destinationId) {
      throw new AppError({
        code: "AI_DOMAIN_VALIDATION_FAILED",
        message: "Manual recommendations must not include a catalog destinationId.",
        status: 422,
      });
    }
  }
}

export async function generateDestinationRecommendationsService(input: {
  userId: string;
  data: DestinationRecommendationInput;
  correlationId?: string;
  signal?: AbortSignal;
}) {
  const log = createRequestLogger(input.correlationId ?? "ai-recommend");
  assertDailyLimit(await countUserAiOperationsToday(input.userId));

  const duration = inclusiveDayCount(
    parseDateOnly(input.data.startDate),
    parseDateOnly(input.data.endDate),
  );
  if (duration < 1 || duration > 30) {
    throw new AppError({
      code: "AI_INVALID_INPUT",
      message: "Trip duration must be between 1 and 30 days.",
      status: 400,
    });
  }

  const candidates = await loadCandidates(input.data);
  const candidateIds = new Set(candidates.map((c) => c.id));

  try {
    const executed = await executeStructuredAiOperation({
      userId: input.userId,
      tripId: input.data.tripId,
      prompt: destinationRecommendationPromptV1,
      promptInput: {
        request: {
          originName: input.data.originName,
          startDate: input.data.startDate,
          endDate: input.data.endDate,
          travelerCount: input.data.travelerCount,
          currencyCode: input.data.currencyCode,
          totalBudgetMajor: input.data.totalBudgetMajor,
          travelPace: input.data.travelPace,
          interests: input.data.interests,
          destinationTypes: input.data.destinationTypes,
          climatePreference: input.data.climatePreference,
          travelCompanionType: input.data.travelCompanionType,
          dietaryNotes: input.data.dietaryNotes,
          accessibilityNotes: input.data.accessibilityNotes,
          additionalPreferences: input.data.additionalPreferences,
          preferredCountries: input.data.preferredCountries,
        },
        candidates,
      },
      inputSummary: {
        originLength: input.data.originName.length,
        durationDays: duration,
        interestCount: input.data.interests.length,
        candidateCount: candidates.length,
      },
      requestFingerprint: createRequestFingerprint({
        op: "DESTINATION_RECOMMENDATION",
        prompt: "destination-recommendation:v1",
        data: input.data,
        candidateIds: candidates.map((c) => c.id),
      }),
      domainValidate: (output) =>
        validateRecommendationResult(output, candidateIds),
      correlationId: input.correlationId,
      signal: input.signal,
    });

    const expiresAt = previewExpiresAt(AI_LIMITS.recommendationTtlHours);
    await createDestinationRecommendation({
      aiOperationId: executed.operationId,
      userId: input.userId,
      requestSnapshot: input.data,
      resultSnapshot: executed.output,
      expiresAt,
    });

    log.info("Destination recommendations generated", {
      operationId: executed.operationId,
      userId: input.userId,
      resultCount: executed.output.recommendations.length,
    });

    return {
      operationId: executed.operationId,
      promptVersion: executed.promptVersion,
      provider: executed.provider,
      model: executed.model,
      generatedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      summary: executed.output.summary,
      recommendations: executed.output.recommendations,
      warnings: [
        "Recommendations are AI-generated planning suggestions and may contain inaccuracies.",
      ],
      disclaimer:
        "Verify opening hours, prices, reservations and local requirements before traveling.",
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError({
      code: "AI_DESTINATION_RECOMMENDATION_FAILED",
      message: "We couldn't generate destination recommendations.",
      status: 500,
      cause: error,
    });
  }
}

export async function selectDestinationRecommendationService(input: {
  userId: string;
  operationId: string;
  recommendationRank: number;
  tripId?: string;
  correlationId?: string;
}) {
  const stored = await findOwnedDestinationRecommendationByOperation(
    input.operationId,
    input.userId,
  );
  if (!stored || stored.aiOperation.status !== "SUCCEEDED") {
    throw new AppError({
      code: "AI_OPERATION_NOT_FOUND",
      message: "Recommendation result was not found.",
      status: 404,
    });
  }
  if (stored.expiresAt.getTime() < Date.now()) {
    throw new AppError({
      code: "AI_OPERATION_CONFLICT",
      message: "This recommendation has expired. Generate a new one.",
      status: 409,
    });
  }

  const result = stored.resultSnapshot as DestinationRecommendationResult;
  const request = stored.requestSnapshot as DestinationRecommendationInput;
  const selected = result.recommendations.find(
    (item) => item.rank === input.recommendationRank,
  );
  if (!selected) {
    throw new AppError({
      code: "AI_INVALID_INPUT",
      message: "Selected recommendation rank was not found.",
      status: 400,
    });
  }

  if (!input.tripId) {
    const createData: CreateTripInput = {
      title: selected.suggestedTripTitle,
      originName: request.originName,
      originCountryCode: request.originCountryCode,
      startDate: request.startDate,
      endDate: request.endDate,
      travelerCount: request.travelerCount,
      totalBudgetMajor: request.totalBudgetMajor,
      currencyCode: request.currencyCode,
      travelPace: request.travelPace,
      destinationTypes: request.destinationTypes,
      interests: request.interests,
      dietaryNotes: request.dietaryNotes,
      accessibilityNotes: request.accessibilityNotes,
      additionalNotes: request.additionalPreferences,
      ...(selected.destinationMode === "CATALOG" && selected.destinationId
        ? { destinationId: selected.destinationId }
        : {
            destinationName: selected.name,
            destinationCountryCode: selected.countryCode,
            destinationRegionName: selected.manualDestination?.regionName,
          }),
    };

    const trip = await createTripService({
      ownerId: input.userId,
      data: createData,
      correlationId: input.correlationId,
    });

    return { trip, recommendationRank: selected.rank };
  }

  const updated = await selectTripDestinationService({
    tripId: input.tripId,
    ownerId: input.userId,
    data:
      selected.destinationMode === "CATALOG" && selected.destinationId
        ? {
            mode: "catalog",
            destinationId: selected.destinationId,
            confirmItineraryWarning: true,
          }
        : {
            mode: "manual",
            name: selected.name,
            countryCode: selected.countryCode,
            regionName: selected.manualDestination?.regionName,
            confirmItineraryWarning: true,
          },
    correlationId: input.correlationId,
  });

  return { trip: updated.trip, recommendationRank: selected.rank };
}
