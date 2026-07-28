import { z } from "zod";

export const tripVisibilitySchema = z.enum(["PRIVATE", "PUBLIC"]);

export const setTripVisibilitySchema = z.object({
  visibility: tripVisibilitySchema,
});

export const exploreListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export type SetTripVisibilityInput = z.infer<typeof setTripVisibilitySchema>;
