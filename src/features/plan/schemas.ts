import { z } from "zod";

import { generatedItinerarySchema } from "@/integrations/ai/output-schemas";
import { isDateOnlyString } from "@/server/domain/trips/date-only";
import { TRAVEL_INTERESTS } from "@/server/domain/trips/constants";

const dateOnlySchema = z
  .string()
  .refine(isDateOnlyString, "YYYY-MM-DD formatında tarih kullan.");

export const flightSearchSchema = z
  .object({
    originIata: z.string().length(3).transform((v) => v.toUpperCase()),
    originName: z.string().trim().min(1).max(120),
    /** cities = selected cities; region = popular cities across a region (e.g. Europe) */
    mode: z.enum(["cities", "region"]).default("cities"),
    regionId: z.string().min(1).optional(),
    cityIds: z.array(z.string().min(1)).max(6).default([]),
    startDate: dateOnlySchema,
    endDate: dateOnlySchema,
    adults: z.number().int().min(1).max(9).default(1),
  })
  .superRefine((value, ctx) => {
    if (value.mode === "cities" && value.cityIds.length < 1) {
      ctx.addIssue({
        code: "custom",
        message: "En az bir şehir seç.",
        path: ["cityIds"],
      });
    }
    if (value.mode === "region" && !value.regionId) {
      ctx.addIssue({
        code: "custom",
        message: "Bölge seç.",
        path: ["regionId"],
      });
    }
  });

export const createPlanTripSchema = z.object({
  startDate: dateOnlySchema,
  endDate: dateOnlySchema,
  origin: z
    .object({
      name: z.string().trim().min(1).max(120),
      iata: z.string().length(3).transform((v) => v.toUpperCase()),
      countryCode: z.string().length(2).optional(),
    })
    .optional(),
  cityIds: z.array(z.string().min(1)).min(1).max(8),
  flight: z
    .object({
      entryCityName: z.string().min(1),
      exitCityName: z.string().min(1),
      outboundOrigin: z.string().length(3),
      outboundDest: z.string().length(3),
      returnOrigin: z.string().length(3),
      returnDest: z.string().length(3),
      outboundDate: dateOnlySchema,
      returnDate: dateOnlySchema,
      priceAmount: z.number().nonnegative(),
      priceCurrency: z.string().min(3).max(3),
      priceStatus: z.string().default("verified"),
      ignavId: z.string().optional(),
      routeSummary: z.string().min(1),
      carrierSummary: z.string().optional(),
    })
    .optional(),
  interests: z.array(z.enum(TRAVEL_INTERESTS)).max(12).default([]),
  travelerCount: z.number().int().min(1).max(20).default(1),
  travelPace: z.enum(["RELAXED", "BALANCED", "FAST_PACED"]).default("BALANCED"),
  currencyCode: z
    .enum(["USD", "EUR", "GBP", "TRY", "JPY", "CAD", "AUD", "CHF"])
    .default("TRY"),
  generateItinerary: z.boolean().default(false),
  title: z.string().trim().min(1).max(120).optional(),
  /** When provided, trip is created with this itinerary (no second AI call). */
  itinerary: generatedItinerarySchema.optional(),
});

/** Preview AI plan without persisting a trip. */
export const previewPlanItinerarySchema = createPlanTripSchema.omit({
  generateItinerary: true,
  itinerary: true,
});

/** Manual / past trip logging — day narratives without AI. */
export const createManualTripSchema = z.object({
  title: z.string().trim().min(1).max(120),
  startDate: dateOnlySchema,
  endDate: dateOnlySchema,
  cityIds: z.array(z.string().min(1)).max(8).default([]),
  cityNames: z.array(z.string().trim().min(1).max(80)).max(8).default([]),
  days: z
    .array(
      z.object({
        date: dateOnlySchema,
        title: z.string().trim().max(120).optional(),
        notes: z.string().trim().max(5000).optional(),
      }),
    )
    .max(30)
    .default([]),
});

export type FlightSearchInput = z.infer<typeof flightSearchSchema>;
export type CreatePlanTripInput = z.infer<typeof createPlanTripSchema>;
export type PreviewPlanItineraryInput = z.infer<typeof previewPlanItinerarySchema>;
export type CreateManualTripInput = z.infer<typeof createManualTripSchema>;
