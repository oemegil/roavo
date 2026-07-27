import { z } from "zod";

import {
  DESTINATION_TYPES,
  SUPPORTED_CURRENCIES,
  TRAVEL_INTERESTS,
} from "@/server/domain/trips/constants";
import { isDateOnlyString } from "@/server/domain/trips/date-only";
import { AI_LIMITS } from "@/server/domain/ai/constants";

const dateOnly = z.string().refine(isDateOnlyString, "Use YYYY-MM-DD.");
const countryCode = z
  .string()
  .length(2)
  .regex(/^[A-Za-z]{2}$/)
  .transform((v) => v.toUpperCase());

export const destinationRecommendationInputSchema = z
  .object({
    originName: z.string().trim().min(1).max(120),
    originCountryCode: countryCode.optional(),
    startDate: dateOnly,
    endDate: dateOnly,
    travelerCount: z.number().int().min(1).max(20),
    totalBudgetMajor: z.number().nonnegative().optional(),
    currencyCode: z.enum(SUPPORTED_CURRENCIES).default("USD"),
    travelPace: z.enum(["RELAXED", "BALANCED", "FAST_PACED"]).default("BALANCED"),
    interests: z.array(z.enum(TRAVEL_INTERESTS)).max(20).default([]),
    destinationTypes: z.array(z.enum(DESTINATION_TYPES)).max(12).default([]),
    climatePreference: z
      .enum(["ANY", "WARM", "MILD", "COLD"])
      .default("ANY"),
    travelCompanionType: z
      .enum(["SOLO", "COUPLE", "FAMILY", "FRIENDS"])
      .default("SOLO"),
    dietaryNotes: z.string().trim().max(AI_LIMITS.notesMax).optional(),
    accessibilityNotes: z.string().trim().max(AI_LIMITS.notesMax).optional(),
    additionalPreferences: z
      .string()
      .trim()
      .max(AI_LIMITS.additionalPreferencesMax)
      .optional(),
    excludedDestinationIds: z.array(z.string().min(1).max(64)).max(20).default([]),
    preferredCountries: z.array(countryCode).max(10).default([]),
    tripId: z.string().min(1).max(64).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.endDate < data.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date must be on or after start date.",
      });
    }
  });

export type DestinationRecommendationInput = z.infer<
  typeof destinationRecommendationInputSchema
>;

export const selectDestinationRecommendationSchema = z.object({
  recommendationRank: z.number().int().min(1).max(5),
  tripId: z.string().min(1).max(64).optional(),
});

export const generateItinerarySchema = z.object({
  expectedTripVersion: z.string().datetime(),
  existingItemsPolicy: z
    .enum(["REQUIRE_EMPTY", "FILL_EMPTY_DAYS", "PROPOSE_REPLACEMENT"])
    .default("REQUIRE_EMPTY"),
});

export const applyPreviewSchema = z.object({
  expectedTripVersion: z.string().datetime().optional(),
});

export const aiEditSchema = z.object({
  instruction: z.string().trim().min(3).max(AI_LIMITS.instructionMax),
  scope: z
    .discriminatedUnion("type", [
      z.object({ type: z.literal("trip") }),
      z.object({ type: z.literal("day"), dayId: z.string().min(1) }),
      z.object({ type: z.literal("item"), itemId: z.string().min(1) }),
    ])
    .default({ type: "trip" }),
  preserveManualItems: z.boolean().default(true),
  expectedTripVersion: z.string().datetime(),
});

export const regenerateDaySchema = z.object({
  instruction: z.string().trim().max(AI_LIMITS.instructionMax).optional(),
  preserveManualItems: z.boolean().default(true),
  expectedTripVersion: z.string().datetime(),
});

export const replaceItemSchema = z.object({
  instruction: z.string().trim().min(3).max(AI_LIMITS.instructionMax),
  expectedTripVersion: z.string().datetime(),
});
