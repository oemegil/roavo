import { z } from "zod";

import {
  DESTINATION_TYPES as TRIP_DEST_TYPES,
  TRAVEL_INTERESTS,
} from "@/server/domain/trips/constants";

const itineraryItemType = z.enum([
  "ATTRACTION",
  "RESTAURANT",
  "CAFE",
  "TRANSPORTATION",
  "ACCOMMODATION",
  "SHOPPING",
  "NIGHTLIFE",
  "FREE_TIME",
  "NOTE",
  "CUSTOM",
]);

const transportationMode = z.enum([
  "WALK",
  "PUBLIC_TRANSIT",
  "TAXI",
  "CAR",
  "BICYCLE",
  "TRAIN",
  "FLIGHT",
  "FERRY",
  "OTHER",
]);

const ITEM_TYPE_ALIASES: Record<string, z.infer<typeof itineraryItemType>> = {
  ACTIVITY: "ATTRACTION",
  ACTIVITIES: "ATTRACTION",
  SIGHTSEEING: "ATTRACTION",
  MUSEUM: "ATTRACTION",
  LANDMARK: "ATTRACTION",
  MEAL: "RESTAURANT",
  FOOD: "RESTAURANT",
  LUNCH: "RESTAURANT",
  DINNER: "RESTAURANT",
  BREAKFAST: "RESTAURANT",
  BRUNCH: "RESTAURANT",
  TAPAS: "RESTAURANT",
  DRINK: "CAFE",
  COFFEE: "CAFE",
  HOTEL: "ACCOMMODATION",
  LODGING: "ACCOMMODATION",
  CLUB: "NIGHTLIFE",
  BAR: "NIGHTLIFE",
  TRANSIT: "TRANSPORTATION",
  TRANSPORT: "TRANSPORTATION",
  TRANSFER: "TRANSPORTATION",
  REST: "FREE_TIME",
  BREAK: "FREE_TIME",
};

const TRANSPORT_MODE_ALIASES: Record<string, z.infer<typeof transportationMode>> = {
  SUBWAY: "PUBLIC_TRANSIT",
  METRO: "PUBLIC_TRANSIT",
  BUS: "PUBLIC_TRANSIT",
  TRAM: "PUBLIC_TRANSIT",
  UNDERGROUND: "PUBLIC_TRANSIT",
  WALKING: "WALK",
  ON_FOOT: "WALK",
  FOOT: "WALK",
  CAB: "TAXI",
  UBER: "TAXI",
  RIDESHARE: "TAXI",
};

function normalizeEnumAlias<T extends string>(
  value: unknown,
  aliases: Record<string, T>,
  allowed: readonly T[],
): unknown {
  if (typeof value !== "string") return value;
  const upper = value
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  if ((allowed as readonly string[]).includes(upper)) return upper;
  return aliases[upper] ?? value;
}

const hhMm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm");

const itineraryItemTypeSchema = z.preprocess(
  (value) => normalizeEnumAlias(value, ITEM_TYPE_ALIASES, itineraryItemType.options),
  itineraryItemType,
);

const transportationModeSchema = z.preprocess(
  (value) =>
    normalizeEnumAlias(value, TRANSPORT_MODE_ALIASES, transportationMode.options),
  transportationMode,
);

export const destinationRecommendationResultSchema = z.object({
  summary: z.string().min(1).max(500),
  recommendations: z
    .array(
      z.object({
        rank: z.number().int().min(1).max(5),
        destinationMode: z.enum(["CATALOG", "MANUAL"]),
        destinationId: z.string().min(1).max(64).nullable(),
        manualDestination: z
          .object({
            name: z.string().min(1).max(120),
            countryCode: z.string().length(2).optional(),
            regionName: z.string().max(120).optional(),
          })
          .nullable(),
        name: z.string().min(1).max(120),
        countryCode: z.string().length(2),
        reason: z.string().min(1).max(600),
        matchingInterests: z.array(z.string()).max(12),
        budgetFit: z.enum(["UNDER", "FIT", "STRETCH"]),
        durationFit: z.enum(["SHORT", "FIT", "LONG"]),
        potentialTradeoffs: z.array(z.string().max(200)).max(5),
        suggestedTripTitle: z.string().min(1).max(100),
        confidence: z.enum(["LOW", "MEDIUM", "HIGH"]),
      }),
    )
    .min(3)
    .max(5),
});

export type DestinationRecommendationResult = z.infer<
  typeof destinationRecommendationResultSchema
>;

export const generatedItineraryItemSchema = z.object({
  temporaryId: z.string().min(1).max(64),
  type: itineraryItemTypeSchema,
  title: z.string().min(1).max(120),
  description: z.string().max(1500).nullable(),
  locationName: z.string().max(160).nullable(),
  startTime: hhMm.nullable(),
  endTime: hhMm.nullable(),
  durationMinutes: z
    .number()
    .int()
    .min(15)
    .max(24 * 60)
    .nullable(),
  estimatedCostMinor: z.number().int().min(0).nullable(),
  currencyCode: z.string().length(3).nullable(),
  transportationMode: transportationModeSchema.nullable(),
  notes: z.string().max(1500).nullable(),
  rationale: z.string().max(400).nullable(),
});

/** Named stops for OSM geocoding — no coordinates from the model. */
export const generatedItineraryPlaceSchema = z.object({
  name: z.string().min(1).max(160),
  city: z.string().min(1).max(120).optional().nullable(),
});

export type GeneratedItineraryPlace = z.infer<typeof generatedItineraryPlaceSchema>;

/** Day-level textual itinerary (preferred). Timed items are optional/legacy. */
export const generatedItinerarySchema = z.object({
  titleSuggestion: z.string().min(1).max(100).nullable(),
  summary: z.string().min(1).max(1500),
  assumptions: z.array(z.string().max(400)).max(10),
  warnings: z.array(z.string().max(400)).max(10),
  days: z
    .array(
      z.object({
        dayNumber: z.number().int().min(1).max(30),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        theme: z.string().max(120).nullable(),
        cityName: z.string().max(120).nullable().optional(),
        /** Guidebook-style day narrative with timed blocks + context */
        scheduleText: z.string().min(120).max(8000),
        /** Concerts/festivals/fairs in that city on that date, if any */
        eventsHighlight: z.string().max(1000).nullable(),
        notes: z.string().max(2000).nullable(),
        /**
         * Real, searchable place names for map pins (geocoded via Nominatim).
         * Prefer landmark/restaurant names over vague neighborhood labels.
         */
        places: z.array(generatedItineraryPlaceSchema).max(12).optional().default([]),
        items: z.array(generatedItineraryItemSchema).max(12).optional().default([]),
      }),
    )
    .min(1)
    .max(30),
});

export type GeneratedItinerary = z.infer<typeof generatedItinerarySchema>;

const editItemPayload = generatedItineraryItemSchema
  .omit({ temporaryId: true })
  .partial({
    rationale: true,
  })
  .extend({
    temporaryId: z.string().min(1).max(64).optional(),
    type: itineraryItemTypeSchema,
    title: z.string().min(1).max(120),
  });

export const itineraryEditPlanSchema = z.object({
  summary: z.string().min(1).max(500),
  warnings: z.array(z.string().max(300)).max(10),
  operations: z
    .array(
      z.discriminatedUnion("operation", [
        z.object({
          operation: z.literal("ADD_ITEM"),
          targetDayId: z.string().min(1),
          afterItemId: z.string().min(1).nullable(),
          item: editItemPayload,
          reason: z.string().max(300),
        }),
        z.object({
          operation: z.literal("UPDATE_ITEM"),
          itemId: z.string().min(1),
          changes: z.object({
            type: itineraryItemTypeSchema.optional(),
            title: z.string().min(1).max(120).optional(),
            description: z.string().max(1500).nullable().optional(),
            locationName: z.string().max(160).nullable().optional(),
            startTime: hhMm.nullable().optional(),
            endTime: hhMm.nullable().optional(),
            durationMinutes: z
              .number()
              .int()
              .min(15)
              .max(24 * 60)
              .nullable()
              .optional(),
            estimatedCostMinor: z.number().int().min(0).nullable().optional(),
            currencyCode: z.string().length(3).nullable().optional(),
            transportationMode: transportationModeSchema.nullable().optional(),
            notes: z.string().max(1500).nullable().optional(),
          }),
          reason: z.string().max(300),
        }),
        z.object({
          operation: z.literal("DELETE_ITEM"),
          itemId: z.string().min(1),
          reason: z.string().max(300),
        }),
        z.object({
          operation: z.literal("MOVE_ITEM"),
          itemId: z.string().min(1),
          targetDayId: z.string().min(1),
          targetIndex: z.number().int().min(0).max(50),
          reason: z.string().max(300),
        }),
        z.object({
          operation: z.literal("REORDER_ITEMS"),
          dayId: z.string().min(1),
          orderedItemIds: z.array(z.string().min(1)).min(1).max(50),
          reason: z.string().max(300),
        }),
        z.object({
          operation: z.literal("UPDATE_DAY"),
          dayId: z.string().min(1),
          changes: z.object({
            title: z.string().max(120).nullable().optional(),
            notes: z.string().max(1500).nullable().optional(),
          }),
          reason: z.string().max(300),
        }),
        z.object({
          operation: z.literal("REPLACE_DAY_ITEMS"),
          dayId: z.string().min(1),
          preservedItemIds: z.array(z.string().min(1)).max(50),
          replacementItems: z.array(editItemPayload).max(12),
          reason: z.string().max(300),
        }),
      ]),
    )
    .min(1)
    .max(40),
});

export type ItineraryEditPlan = z.infer<typeof itineraryEditPlanSchema>;

export const dayRegenerationResultSchema = z.object({
  summary: z.string().min(1).max(500),
  warnings: z.array(z.string().max(300)).max(10),
  dayId: z.string().min(1),
  theme: z.string().max(120).nullable(),
  notes: z.string().max(1500).nullable(),
  preservedItemIds: z.array(z.string().min(1)).max(50),
  replacementItems: z.array(editItemPayload).min(1).max(12),
});

export type DayRegenerationResult = z.infer<typeof dayRegenerationResultSchema>;

export const itemReplacementResultSchema = z.object({
  summary: z.string().min(1).max(500),
  warnings: z.array(z.string().max(300)).max(10),
  itemId: z.string().min(1),
  replacement: editItemPayload,
  reason: z.string().max(400),
});

export type ItemReplacementResult = z.infer<typeof itemReplacementResultSchema>;

export const recommendationInterestHint = TRAVEL_INTERESTS;
export const recommendationTypeHint = TRIP_DEST_TYPES;
