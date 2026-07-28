import { z } from "zod";

import {
  DESTINATION_TYPES,
  SUPPORTED_CURRENCIES,
  TRAVEL_INTERESTS,
  TRIP_LIMITS,
} from "@/server/domain/trips/constants";
import { isDateOnlyString } from "@/server/domain/trips/date-only";

const dateOnlySchema = z.string().refine(isDateOnlyString, "Use YYYY-MM-DD date format.");

const currencySchema = z.enum(SUPPORTED_CURRENCIES);
const destinationTypeSchema = z.enum(DESTINATION_TYPES);
const interestSchema = z.enum(TRAVEL_INTERESTS);
const travelPaceSchema = z.enum(["RELAXED", "BALANCED", "FAST_PACED"]);
const countryCodeSchema = z
  .string()
  .length(2)
  .regex(/^[A-Za-z]{2}$/)
  .transform((value) => value.toUpperCase());

export const createTripSchema = z
  .object({
    title: z.string().trim().min(TRIP_LIMITS.titleMin).max(TRIP_LIMITS.titleMax),
    description: z.string().trim().max(TRIP_LIMITS.descriptionMax).optional(),
    originName: z.string().trim().min(1).max(120),
    originCountryCode: countryCodeSchema.optional(),
    destinationId: z.string().min(1).max(64).optional(),
    destinationName: z.string().trim().min(1).max(120).optional(),
    destinationCountryCode: countryCodeSchema.optional(),
    destinationRegionName: z.string().trim().min(1).max(120).optional(),
    startDate: dateOnlySchema,
    endDate: dateOnlySchema,
    travelerCount: z
      .number()
      .int()
      .min(TRIP_LIMITS.minTravelerCount)
      .max(TRIP_LIMITS.maxTravelerCount),
    totalBudgetMajor: z.number().nonnegative().optional(),
    currencyCode: currencySchema.default("USD"),
    travelPace: travelPaceSchema.default("BALANCED"),
    destinationTypes: z.array(destinationTypeSchema).max(12).default([]),
    interests: z.array(interestSchema).max(20).default([]),
    dietaryNotes: z.string().trim().max(TRIP_LIMITS.notesMax).optional(),
    accessibilityNotes: z.string().trim().max(TRIP_LIMITS.notesMax).optional(),
    additionalNotes: z.string().trim().max(TRIP_LIMITS.notesMax).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.endDate < data.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date must be on or after the start date.",
      });
    }
    if (data.destinationId && data.destinationName) {
      ctx.addIssue({
        code: "custom",
        path: ["destinationName"],
        message:
          "Provide either a catalog destinationId or a manual destination name, not both.",
      });
    }
  });

export type CreateTripInput = z.infer<typeof createTripSchema>;

export const updateTripSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(TRIP_LIMITS.titleMin)
      .max(TRIP_LIMITS.titleMax)
      .optional(),
    description: z.string().trim().max(TRIP_LIMITS.descriptionMax).nullable().optional(),
    originName: z.string().trim().min(1).max(120).optional(),
    originCountryCode: countryCodeSchema.nullable().optional(),
    destinationName: z.string().trim().min(1).max(120).nullable().optional(),
    destinationCountryCode: countryCodeSchema.nullable().optional(),
    startDate: dateOnlySchema.optional(),
    endDate: dateOnlySchema.optional(),
    travelerCount: z
      .number()
      .int()
      .min(TRIP_LIMITS.minTravelerCount)
      .max(TRIP_LIMITS.maxTravelerCount)
      .optional(),
    totalBudgetMajor: z.number().nonnegative().nullable().optional(),
    currencyCode: currencySchema.optional(),
    travelPace: travelPaceSchema.optional(),
    destinationTypes: z.array(destinationTypeSchema).max(12).optional(),
    interests: z.array(interestSchema).max(20).optional(),
    dietaryNotes: z.string().trim().max(TRIP_LIMITS.notesMax).nullable().optional(),
    accessibilityNotes: z.string().trim().max(TRIP_LIMITS.notesMax).nullable().optional(),
    additionalNotes: z.string().trim().max(TRIP_LIMITS.notesMax).nullable().optional(),
    expectedUpdatedAt: z.string().datetime().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate && data.endDate < data.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date must be on or after the start date.",
      });
    }
  });

export type UpdateTripInput = z.infer<typeof updateTripSchema>;

export const listTripsQuerySchema = z.object({
  status: z.enum(["DRAFT", "ARCHIVED"]).optional().default("DRAFT"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(TRIP_LIMITS.listMaxLimit).optional(),
});

export const updateTripDaySchema = z.object({
  title: z.string().trim().max(100).nullable().optional(),
  notes: z.string().trim().max(TRIP_LIMITS.dayNotesMax).nullable().optional(),
});

export const reorderDaysSchema = z.object({
  orderedDayIds: z.array(z.string().min(1)).min(1),
});

const hhMmSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use HH:mm time format.");

export const createItineraryItemSchema = z
  .object({
    type: z
      .enum([
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
      ])
      .default("CUSTOM"),
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(TRIP_LIMITS.itemDescriptionMax).optional(),
    locationName: z.string().trim().max(160).optional(),
    externalPlaceId: z.string().trim().max(120).optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    startTime: hhMmSchema.optional(),
    endTime: hhMmSchema.optional(),
    durationMinutes: z
      .number()
      .int()
      .positive()
      .max(TRIP_LIMITS.maxDurationMinutes)
      .optional(),
    estimatedCostMajor: z.number().nonnegative().optional(),
    currencyCode: currencySchema.optional(),
    transportationMode: z
      .enum([
        "WALK",
        "PUBLIC_TRANSIT",
        "TAXI",
        "CAR",
        "BICYCLE",
        "TRAIN",
        "FLIGHT",
        "FERRY",
        "OTHER",
      ])
      .optional(),
    notes: z.string().trim().max(TRIP_LIMITS.itemNotesMax).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.startTime && data.endTime && data.endTime < data.startTime) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "End time must be on or after start time.",
      });
    }
    const hasLat = data.latitude != null;
    const hasLng = data.longitude != null;
    if (hasLat !== hasLng) {
      ctx.addIssue({
        code: "custom",
        path: ["latitude"],
        message: "Latitude and longitude must be provided together.",
      });
    }
  });

export const updateItineraryItemSchema = z
  .object({
    type: z
      .enum([
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
      ])
      .optional(),
    title: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(TRIP_LIMITS.itemDescriptionMax).optional(),
    locationName: z.string().trim().max(160).optional(),
    externalPlaceId: z.string().trim().max(120).nullable().optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    startTime: hhMmSchema.optional(),
    endTime: hhMmSchema.optional(),
    durationMinutes: z
      .number()
      .int()
      .positive()
      .max(TRIP_LIMITS.maxDurationMinutes)
      .optional(),
    estimatedCostMajor: z.number().nonnegative().nullable().optional(),
    currencyCode: currencySchema.optional(),
    transportationMode: z
      .enum([
        "WALK",
        "PUBLIC_TRANSIT",
        "TAXI",
        "CAR",
        "BICYCLE",
        "TRAIN",
        "FLIGHT",
        "FERRY",
        "OTHER",
      ])
      .optional(),
    notes: z.string().trim().max(TRIP_LIMITS.itemNotesMax).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.startTime && data.endTime && data.endTime < data.startTime) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "End time must be on or after start time.",
      });
    }
    const latProvided = data.latitude !== undefined;
    const lngProvided = data.longitude !== undefined;
    if (latProvided !== lngProvided) {
      ctx.addIssue({
        code: "custom",
        path: ["latitude"],
        message: "Latitude and longitude must be provided together.",
      });
    }
  });

export const reorderItemsSchema = z.object({
  orderedItemIds: z.array(z.string().min(1)).min(1),
});

export const moveItemSchema = z.object({
  targetTripDayId: z.string().min(1),
  targetIndex: z.number().int().min(0),
});

export type CreateItineraryItemInput = z.infer<typeof createItineraryItemSchema>;
export type UpdateItineraryItemInput = z.infer<typeof updateItineraryItemSchema>;
