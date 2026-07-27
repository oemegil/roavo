import { z } from "zod";

import {
  CATALOG_DESTINATION_TYPES,
  DESTINATION_BEST_FOR,
  DESTINATION_BUDGET_LEVELS,
  DESTINATION_CATEGORIES,
  DESTINATION_LIMITS,
} from "@/server/domain/destinations/constants";

const countryCodeSchema = z
  .string()
  .length(2)
  .regex(/^[A-Za-z]{2}$/)
  .transform((value) => value.toUpperCase());

export const destinationSearchQuerySchema = z
  .object({
    q: z
      .string()
      .trim()
      .max(DESTINATION_LIMITS.searchQueryMax)
      .optional()
      .transform((value) => (value && value.length > 0 ? value : undefined)),
    type: z.enum(CATALOG_DESTINATION_TYPES).optional(),
    countryCode: countryCodeSchema.optional(),
    category: z.enum(DESTINATION_CATEGORIES).optional(),
    budgetLevel: z.enum(DESTINATION_BUDGET_LEVELS).optional(),
    bestFor: z.enum(DESTINATION_BEST_FOR).optional(),
    cursor: z.string().min(1).max(200).optional(),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(DESTINATION_LIMITS.searchMaxLimit)
      .optional()
      .default(DESTINATION_LIMITS.searchDefaultLimit),
  })
  .superRefine((data, ctx) => {
    if (
      data.q !== undefined &&
      data.q.length < DESTINATION_LIMITS.searchQueryMin
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["q"],
        message: `Search query must be at least ${DESTINATION_LIMITS.searchQueryMin} characters.`,
      });
    }
  });

export type DestinationSearchQuery = z.infer<typeof destinationSearchQuerySchema>;

export const selectTripDestinationSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("catalog"),
    destinationId: z.string().min(1).max(64),
    confirmItineraryWarning: z.boolean().optional(),
  }),
  z.object({
    mode: z.literal("manual"),
    name: z
      .string()
      .trim()
      .min(DESTINATION_LIMITS.nameMin)
      .max(DESTINATION_LIMITS.nameMax),
    countryCode: countryCodeSchema.optional(),
    countryName: z.string().trim().min(1).max(80).optional(),
    regionName: z.string().trim().min(1).max(120).optional(),
    confirmItineraryWarning: z.boolean().optional(),
  }),
]);

export type SelectTripDestinationInput = z.infer<
  typeof selectTripDestinationSchema
>;

export const clearTripDestinationSchema = z.object({
  confirmItineraryWarning: z.boolean().optional(),
});
