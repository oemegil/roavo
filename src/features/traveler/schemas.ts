import { z } from "zod";

export const tripVisibilitySchema = z.enum(["PRIVATE", "PUBLIC"]);

export const setTripVisibilitySchema = z.object({
  visibility: tripVisibilitySchema,
});

export const exploreListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const COMMENT_BODY_MAX = 1000;
export const COMMENT_DAILY_LIMIT = 20;

export const createTripCommentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Yorum boş olamaz.")
    .max(COMMENT_BODY_MAX, `Yorum en fazla ${COMMENT_BODY_MAX} karakter olabilir.`),
});

export const listTripCommentsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export type SetTripVisibilityInput = z.infer<typeof setTripVisibilitySchema>;
export type CreateTripCommentInput = z.infer<typeof createTripCommentSchema>;
