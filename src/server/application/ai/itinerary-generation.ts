import "server-only";

import { AppError } from "@/lib/errors";
import { getServerEnv } from "@/lib/env/server";
import { createRequestLogger } from "@/lib/logging/logger";
import { executeStructuredAiOperation } from "@/integrations/ai/orchestrate";
import {
  itineraryGenerationPromptV1,
  type ItineraryDayDescriptor,
} from "@/integrations/ai/prompts/itinerary-generation/v1";
import type { GeneratedItinerary } from "@/integrations/ai/output-schemas";
import { AI_LIMITS } from "@/server/domain/ai/constants";
import {
  createRequestFingerprint,
  previewExpiresAt,
} from "@/server/domain/ai/fingerprint";
import { formatDateOnly } from "@/server/domain/trips/date-only";
import { requireMutableOwnedTrip } from "@/server/application/trips/get-trip";
import {
  geocodeGeneratedItineraryPlaces,
  persistGeneratedItinerary,
} from "@/server/application/plan/persist-generated-itinerary";
import { toTripDetailDto } from "@/features/trips/dto";
import {
  countUserAiOperationsToday,
  createAiPreview,
  findOwnedAiPreview,
  markAiPreviewStatus,
  prisma,
} from "@/server/repositories/ai-repository";
import { tripDetailInclude } from "@/server/repositories/trip-repository";

const WEEKDAYS_EN = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;
const WEEKDAYS_TR = [
  "Pazar",
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
] as const;

function buildDayDescriptors(
  days: Array<{ date: Date; position: number }>,
): ItineraryDayDescriptor[] {
  const sorted = [...days].sort((a, b) => a.position - b.position);
  return sorted.map((day, index) => {
    const weekdayIndex = day.date.getUTCDay();
    const role: ItineraryDayDescriptor["role"] =
      sorted.length === 1
        ? "FULL"
        : index === 0
          ? "ARRIVAL"
          : index === sorted.length - 1
            ? "DEPARTURE"
            : "FULL";
    return {
      dayNumber: index + 1,
      date: formatDateOnly(day.date),
      weekday: WEEKDAYS_EN[weekdayIndex]!,
      weekdayTr: WEEKDAYS_TR[weekdayIndex]!,
      role,
    };
  });
}

function assertDailyLimit(count: number) {
  const limit = getServerEnv().AI_DAILY_OPERATION_LIMIT;
  if (count >= limit) {
    throw new AppError({
      code: "AI_RATE_LIMITED",
      message: "Bugünkü AI kullanım limitine ulaştın. Yarın tekrar dene.",
      status: 429,
    });
  }
}

function validateGeneratedItinerary(
  output: GeneratedItinerary,
  days: Array<{ date: string; dayNumber: number }>,
) {
  if (output.days.length !== days.length) {
    throw new AppError({
      code: "AI_DOMAIN_VALIDATION_FAILED",
      message: "Generated itinerary day count does not match the trip.",
      status: 422,
    });
  }

  for (let i = 0; i < days.length; i += 1) {
    const expected = days[i]!;
    const actual = output.days[i]!;
    if (actual.dayNumber !== expected.dayNumber || actual.date !== expected.date) {
      throw new AppError({
        code: "AI_DOMAIN_VALIDATION_FAILED",
        message: "Generated day dates or numbers do not match the trip.",
        status: 422,
      });
    }
    if (!actual.scheduleText || actual.scheduleText.trim().length < 120) {
      throw new AppError({
        code: "AI_DOMAIN_VALIDATION_FAILED",
        message: "Each day must include a readable guidebook-style scheduleText.",
        status: 422,
      });
    }
  }
}

export async function generateItineraryPreviewService(input: {
  userId: string;
  tripId: string;
  expectedTripVersion: string;
  existingItemsPolicy?: "REQUIRE_EMPTY" | "FILL_EMPTY_DAYS" | "PROPOSE_REPLACEMENT";
  correlationId?: string;
  signal?: AbortSignal;
}) {
  const log = createRequestLogger(input.correlationId ?? "ai-generate");
  assertDailyLimit(await countUserAiOperationsToday(input.userId));

  const trip = await requireMutableOwnedTrip({
    ownerId: input.userId,
    tripId: input.tripId,
  });

  if (trip.updatedAt.toISOString() !== input.expectedTripVersion) {
    throw new AppError({
      code: "AI_TRIP_VERSION_CONFLICT",
      message: "This trip changed elsewhere. Reload and try again.",
      status: 409,
    });
  }

  if (!trip.destinationName) {
    throw new AppError({
      code: "AI_INVALID_INPUT",
      message: "Select a destination before generating an itinerary.",
      status: 400,
      metadata: { missingFields: ["destination"] },
    });
  }

  if (trip.days.length === 0) {
    throw new AppError({
      code: "AI_INVALID_INPUT",
      message: "Trip days are missing.",
      status: 400,
    });
  }

  const policy = input.existingItemsPolicy ?? "REQUIRE_EMPTY";
  const itemCount = trip.days.reduce((sum, day) => sum + day.items.length, 0);
  if (policy === "REQUIRE_EMPTY" && itemCount > 0) {
    throw new AppError({
      code: "AI_EDIT_CONFLICT",
      message:
        "This trip already has itinerary items. Clear them or use AI edit instead of full generation.",
      status: 409,
    });
  }

  const dayDescriptors = buildDayDescriptors(trip.days);

  const executed = await executeStructuredAiOperation({
    userId: input.userId,
    tripId: trip.id,
    prompt: itineraryGenerationPromptV1,
    promptInput: {
      trip: {
        title: trip.title,
        originName: trip.originName,
        destinationName: trip.destinationName,
        countryCode: trip.destinationCountryCode,
        startDate: formatDateOnly(trip.startDate),
        endDate: formatDateOnly(trip.endDate),
        travelerCount: trip.travelerCount,
        currencyCode: trip.currencyCode,
        totalBudgetMinor: trip.totalBudgetMinor,
        travelPace: trip.travelPace,
        interests: trip.interests,
        dietaryNotes: trip.dietaryNotes,
        accessibilityNotes: trip.accessibilityNotes,
        additionalNotes: trip.additionalNotes,
        stops: trip.stops?.map((stop) => ({
          name: stop.name,
          countryCode: stop.countryCode,
          iataCode: stop.iataCode,
          position: stop.position,
        })),
        flightRoute: trip.flightQuote?.routeSummary ?? null,
      },
      days: dayDescriptors,
    },
    inputSummary: {
      tripId: trip.id,
      dayCount: dayDescriptors.length,
      hasBudget: trip.totalBudgetMinor != null,
    },
    requestFingerprint: createRequestFingerprint({
      op: "ITINERARY_GENERATION",
      tripId: trip.id,
      version: input.expectedTripVersion,
      prompt: "itinerary-generation:v1",
    }),
    domainValidate: (output) =>
      validateGeneratedItinerary(
        output,
        dayDescriptors.map(({ dayNumber, date }) => ({ dayNumber, date })),
      ),
    correlationId: input.correlationId,
    signal: input.signal,
  });

  const expiresAt = previewExpiresAt(AI_LIMITS.previewTtlHours);
  const preview = await createAiPreview({
    aiOperationId: executed.operationId,
    userId: input.userId,
    tripId: trip.id,
    kind: "ITINERARY_GENERATION",
    tripVersion: input.expectedTripVersion,
    validatedPayload: executed.output,
    warnings: executed.output.warnings,
    afterSummary: {
      dayCount: executed.output.days.length,
      itemCount: executed.output.days.length,
    },
    expiresAt,
  });

  log.info("Itinerary preview generated", {
    operationId: executed.operationId,
    previewId: preview.id,
    tripId: trip.id,
  });

  return {
    operationId: executed.operationId,
    previewId: preview.id,
    tripVersion: input.expectedTripVersion,
    promptVersion: executed.promptVersion,
    expiresAt: expiresAt.toISOString(),
    itinerary: executed.output,
    warnings: [
      ...executed.output.warnings,
      "Verify opening hours, prices, reservations and local requirements before traveling.",
    ],
    assumptions: executed.output.assumptions,
    disclaimer: "AI-generated itinerary preview — not yet saved to your trip.",
  };
}

export async function applyItineraryPreviewService(input: {
  userId: string;
  tripId: string;
  previewId: string;
  expectedTripVersion?: string;
  correlationId?: string;
}) {
  const preview = await findOwnedAiPreview(input.previewId, input.userId);
  if (!preview || preview.tripId !== input.tripId) {
    throw new AppError({
      code: "AI_OPERATION_NOT_FOUND",
      message: "Itinerary preview was not found.",
      status: 404,
    });
  }
  if (preview.status !== "PENDING") {
    throw new AppError({
      code: "AI_OPERATION_CONFLICT",
      message: "This preview was already applied or discarded.",
      status: 409,
    });
  }
  if (preview.expiresAt.getTime() < Date.now()) {
    await markAiPreviewStatus(preview.id, "EXPIRED");
    throw new AppError({
      code: "AI_OPERATION_CONFLICT",
      message: "This preview has expired.",
      status: 409,
    });
  }

  const trip = await requireMutableOwnedTrip({
    ownerId: input.userId,
    tripId: input.tripId,
  });
  const expected = input.expectedTripVersion ?? preview.tripVersion;
  if (trip.updatedAt.toISOString() !== expected) {
    throw new AppError({
      code: "AI_TRIP_VERSION_CONFLICT",
      message: "This trip changed after the preview was created.",
      status: 409,
    });
  }

  const itemCount = trip.days.reduce((sum, day) => sum + day.items.length, 0);
  if (itemCount > 0) {
    throw new AppError({
      code: "AI_EDIT_CONFLICT",
      message: "Cannot apply a full itinerary while items already exist.",
      status: 409,
    });
  }

  const payload = preview.validatedPayload as GeneratedItinerary;
  const orderedDays = [...trip.days].sort((a, b) => a.position - b.position);

  try {
    const geocodedPlaces = await geocodeGeneratedItineraryPlaces(payload);

    await prisma.$transaction(
      async (tx) => {
        await persistGeneratedItinerary(tx, {
          days: orderedDays.map((day) => ({
            id: day.id,
            title: day.title,
            notes: day.notes,
          })),
          itinerary: payload,
          currencyCode: trip.currencyCode,
          geocodedPlaces,
        });

        await tx.aiPreview.update({
          where: { id: preview.id },
          data: { status: "APPLIED", appliedAt: new Date() },
        });
      },
      { timeout: 60_000, maxWait: 10_000 },
    );
  } catch (error) {
    throw new AppError({
      code: "AI_PERSISTENCE_FAILED",
      message: "Günlük program kaydedilemedi. Lütfen tekrar dene.",
      status: 500,
      cause: error,
    });
  }

  const updated = await prisma.trip.findFirstOrThrow({
    where: { id: trip.id },
    include: tripDetailInclude,
  });

  return {
    trip: toTripDetailDto(updated),
    previewId: preview.id,
  };
}

export async function discardItineraryPreviewService(input: {
  userId: string;
  tripId: string;
  previewId: string;
}) {
  const preview = await findOwnedAiPreview(input.previewId, input.userId);
  if (!preview || preview.tripId !== input.tripId) {
    throw new AppError({
      code: "AI_OPERATION_NOT_FOUND",
      message: "Itinerary preview was not found.",
      status: 404,
    });
  }
  if (preview.status === "APPLIED") {
    throw new AppError({
      code: "AI_OPERATION_CONFLICT",
      message: "Applied previews cannot be discarded.",
      status: 409,
    });
  }
  await markAiPreviewStatus(preview.id, "DISCARDED");
  return { discarded: true, previewId: preview.id };
}
