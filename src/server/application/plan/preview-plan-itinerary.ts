import "server-only";

import { AppError } from "@/lib/errors";
import { getServerEnv } from "@/lib/env/server";
import { createRequestLogger } from "@/lib/logging/logger";
import { executeStructuredAiOperation } from "@/integrations/ai/orchestrate";
import { itineraryGenerationPromptV1 } from "@/integrations/ai/prompts/itinerary-generation/v1";
import {
  generatedItinerarySchema,
  type GeneratedItinerary,
} from "@/integrations/ai/output-schemas";
import type { PreviewPlanItineraryInput } from "@/features/plan/schemas";
import { createRequestFingerprint } from "@/server/domain/ai/fingerprint";
import {
  formatDateOnly,
  inclusiveDayCount,
  parseDateOnly,
} from "@/server/domain/trips/date-only";
import { generateDaysForRange } from "@/server/domain/trips/day-planner";
import { resolveCitiesByIds } from "@/server/domain/places/catalog";
import { countUserAiOperationsToday } from "@/server/repositories/ai-repository";
import { geocodeGeneratedItineraryPlaces } from "@/server/application/plan/persist-generated-itinerary";
import { awardTravelerScore } from "@/server/application/traveler/award-score";
import type { PlanMapPin } from "@/features/maps/google-export";

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

/** Generate itinerary preview without creating a trip (save happens later). */
export async function previewPlanItineraryService(input: {
  userId: string;
  data: PreviewPlanItineraryInput;
  correlationId?: string;
}): Promise<{
  itinerary: GeneratedItinerary;
  operationId: string;
  mapPins: PlanMapPin[];
}> {
  const log = createRequestLogger(input.correlationId ?? "plan-preview");
  assertDailyLimit(await countUserAiOperationsToday(input.userId));

  const cities = resolveCitiesByIds(input.data.cityIds);
  if (cities.length === 0) {
    throw new AppError({
      code: "VALIDATION_ERROR",
      message: "En az bir geçerli şehir seç.",
      status: 400,
    });
  }

  const startDate = parseDateOnly(input.data.startDate);
  const endDate = parseDateOnly(input.data.endDate);
  inclusiveDayCount(startDate, endDate);
  const generatedDays = generateDaysForRange(startDate, endDate);
  const dayDescriptors = generatedDays.map((day, index) => {
    const weekdayIndex = day.date.getUTCDay();
    const role =
      generatedDays.length === 1
        ? ("FULL" as const)
        : index === 0
          ? ("ARRIVAL" as const)
          : index === generatedDays.length - 1
            ? ("DEPARTURE" as const)
            : ("FULL" as const);
    return {
      dayNumber: index + 1,
      date: formatDateOnly(day.date),
      weekday: WEEKDAYS_EN[weekdayIndex]!,
      weekdayTr: WEEKDAYS_TR[weekdayIndex]!,
      role,
    };
  });

  const stopNames = cities.map((c) => c.nameTr).join(" · ");
  const primary = cities[0]!;
  const originName = input.data.origin?.name ?? "Belirtilmedi";
  const title =
    input.data.title?.trim() ||
    (cities.length === 1 ? `${primary.nameTr} planı` : `${stopNames} planı`);

  const executed = await executeStructuredAiOperation({
    userId: input.userId,
    tripId: null,
    prompt: itineraryGenerationPromptV1,
    promptInput: {
      trip: {
        title,
        originName,
        destinationName: stopNames,
        countryCode: primary.countryCode,
        startDate: input.data.startDate,
        endDate: input.data.endDate,
        travelerCount: input.data.travelerCount,
        currencyCode: input.data.currencyCode,
        totalBudgetMinor: null,
        travelPace: input.data.travelPace,
        interests: input.data.interests,
        dietaryNotes: null,
        accessibilityNotes: null,
        additionalNotes: input.data.flight?.routeSummary
          ? `Uçuş: ${input.data.flight.routeSummary}`
          : null,
        stops: cities.map((city, position) => ({
          name: city.nameTr,
          countryCode: city.countryCode,
          iataCode: city.iata ?? null,
          position,
        })),
        flightRoute: input.data.flight?.routeSummary ?? null,
      },
      days: dayDescriptors,
    },
    inputSummary: {
      mode: "plan-preview",
      dayCount: dayDescriptors.length,
      cityIds: input.data.cityIds,
    },
    requestFingerprint: createRequestFingerprint({
      op: "PLAN_ITINERARY_PREVIEW",
      userId: input.userId,
      startDate: input.data.startDate,
      endDate: input.data.endDate,
      cityIds: input.data.cityIds,
      interests: input.data.interests,
      prompt: "itinerary-generation:v5-warm-places",
    }),
    domainValidate: (output) => {
      const parsed = generatedItinerarySchema.safeParse(output);
      if (!parsed.success) {
        throw new AppError({
          code: "AI_OUTPUT_INVALID",
          message: "AI output did not match the expected format.",
          status: 502,
        });
      }
      if (parsed.data.days.length !== dayDescriptors.length) {
        throw new AppError({
          code: "AI_DOMAIN_VALIDATION_FAILED",
          message: "Generated itinerary day count does not match the trip.",
          status: 422,
        });
      }
      for (let i = 0; i < dayDescriptors.length; i += 1) {
        const expected = dayDescriptors[i]!;
        const actual = parsed.data.days[i]!;
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
    },
    correlationId: input.correlationId,
  });

  log.info("Plan itinerary preview generated (not saved)", {
    operationId: executed.operationId,
    dayCount: executed.output.days.length,
  });

  const geocoded = await geocodeGeneratedItineraryPlaces(executed.output);
  const mapPins: PlanMapPin[] = [];
  let cursor = 0;
  for (const day of executed.output.days) {
    for (const place of day.places ?? []) {
      const hit = geocoded[cursor++];
      if (!hit?.found || hit.latitude == null || hit.longitude == null) continue;
      mapPins.push({
        id: `preview-${day.dayNumber}-${place.name}-${mapPins.length}`,
        name: place.name,
        latitude: hit.latitude,
        longitude: hit.longitude,
        subtitle: place.city ?? day.cityName ?? null,
        dayNumber: day.dayNumber,
        dayLabel: `Gün ${day.dayNumber}${day.cityName ? ` · ${day.cityName}` : ""}`,
      });
    }
  }

  void awardTravelerScore({
    userId: input.userId,
    action: "PLAN_PREVIEW",
    referenceKey: executed.operationId,
    correlationId: input.correlationId,
  });

  return {
    itinerary: executed.output,
    operationId: executed.operationId,
    mapPins,
  };
}
