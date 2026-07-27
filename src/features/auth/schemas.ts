import { z } from "zod";

import { normalizeEmail } from "@/lib/auth/normalize-email";
import { PASSWORD_POLICY_HINT, validatePasswordPolicy } from "@/lib/auth/password-policy";
import { normalizeUsername, validateUsername } from "@/lib/auth/username";

const travelPaceSchema = z.enum(["relaxed", "balanced", "packed"]).optional();
const activityCategorySchema = z
  .array(z.enum(["food", "culture", "nature", "nightlife", "shopping", "adventure"]))
  .max(12)
  .optional();
const destinationTypeSchema = z
  .array(z.enum(["city", "beach", "mountain", "countryside", "island"]))
  .max(10)
  .optional();

export const travelPreferencesSchema = z
  .object({
    travelPace: travelPaceSchema,
    activityCategories: activityCategorySchema,
    destinationTypes: destinationTypeSchema,
    budgetPreference: z.enum(["budget", "mid", "luxury"]).optional(),
    dietaryNotes: z.string().trim().max(240).optional(),
    accessibilityNotes: z.string().trim().max(240).optional(),
  })
  .strict();

export type TravelPreferences = z.infer<typeof travelPreferencesSchema>;

export const registerSchema = z
  .object({
    email: z.email("Geçerli bir e-posta adresi gir."),
    username: z.string().min(1, "Kullanıcı adı gerekli."),
    displayName: z.string().trim().min(1, "Görünen ad gerekli.").max(80),
    password: z.string().min(1, "Şifre gerekli."),
    passwordConfirmation: z.string().min(1, "Şifreni onayla."),
  })
  .superRefine((data, ctx) => {
    const emailNormalized = normalizeEmail(data.email);
    if (!emailNormalized.includes("@")) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: "Geçerli bir e-posta adresi gir.",
      });
    }

    const usernameResult = validateUsername(data.username);
    if (!usernameResult.ok) {
      ctx.addIssue({
        code: "custom",
        path: ["username"],
        message: usernameResult.message,
      });
    }

    const passwordResult = validatePasswordPolicy(data.password);
    if (!passwordResult.ok) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: passwordResult.message,
      });
    }

    if (data.password !== data.passwordConfirmation) {
      ctx.addIssue({
        code: "custom",
        path: ["passwordConfirmation"],
        message: "Şifreler eşleşmiyor.",
      });
    }
  })
  .transform((data) => {
    const usernameResult = validateUsername(data.username);
    return {
      email: data.email.trim(),
      emailNormalized: normalizeEmail(data.email),
      username: usernameResult.ok
        ? usernameResult.normalized
        : normalizeUsername(data.username),
      usernameNormalized: usernameResult.ok
        ? usernameResult.normalized
        : normalizeUsername(data.username),
      displayName: data.displayName.trim(),
      password: data.password,
    };
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z
  .object({
    email: z.string().min(1, "E-posta gerekli."),
    password: z.string().min(1, "Şifre gerekli."),
  })
  .superRefine((data, ctx) => {
    const email = data.email.trim();
    // Shortcut: email/password "1" → oemegil@gmail.com (local + deploy).
    if (email === "1" && data.password === "1") return;
    if (!z.email().safeParse(email).success) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: "Geçerli bir e-posta adresi gir.",
      });
    }
  });

export type LoginInput = z.infer<typeof loginSchema>;

export const updateProfileSchema = z
  .object({
    username: z.string().min(1).optional(),
    displayName: z.string().trim().min(1).max(80).optional(),
    bio: z.string().trim().max(280).nullable().optional(),
    avatarUrl: z
      .union([z.url(), z.literal(""), z.null()])
      .optional()
      .refine((value) => {
        if (!value) return true;
        try {
          const url = new URL(value);
          return url.protocol === "https:" || url.protocol === "http:";
        } catch {
          return false;
        }
      }, "Avatar URL must use http or https."),
    homeCountryCode: z
      .string()
      .trim()
      .length(2)
      .regex(/^[A-Za-z]{2}$/)
      .nullable()
      .optional(),
    homeCity: z.string().trim().max(80).nullable().optional(),
    preferredCurrency: z
      .string()
      .trim()
      .length(3)
      .regex(/^[A-Za-z]{3}$/)
      .optional(),
    preferredLanguage: z.string().trim().min(2).max(10).optional(),
    travelPreferences: travelPreferencesSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.username !== undefined) {
      const result = validateUsername(data.username);
      if (!result.ok) {
        ctx.addIssue({
          code: "custom",
          path: ["username"],
          message: result.message,
        });
      }
    }
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Hesabı silmek için şifre gerekli."),
  confirmation: z.string().refine((value) => value === "DELETE", {
    message: "Type DELETE to confirm account deletion.",
  }),
});

export { PASSWORD_POLICY_HINT };
