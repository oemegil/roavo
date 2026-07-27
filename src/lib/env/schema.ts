import { z } from "zod";

const nodeEnvSchema = z.enum(["development", "test", "production"]);

/**
 * Server-only environment schema.
 * Never import this module from client components.
 */
export const serverEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema.default("development"),
  APP_URL: z.url(),
  DATABASE_URL: z.url(),
  DIRECT_URL: z.url(),
  AI_PROVIDER: z
    .enum(["gemini", "openai", "anthropic", "ollama", "openrouter", "fake"])
    .default("gemini"),
  AI_MODEL: z.string().min(1).default("gemini-2.0-flash"),
  /** Comma-separated Gemini models tried after primary is rate-limited / unavailable. */
  AI_FALLBACK_MODELS: z.string().optional(),
  /** Comma-separated OpenRouter models (e.g. free Nemotron) used as fallback. */
  AI_OPENROUTER_FALLBACK_MODELS: z.string().optional(),
  AI_API_KEY: z.string().min(1).optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),
  OPENROUTER_API_KEY: z.string().min(1).optional(),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(300000),
  AI_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
  AI_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().default(8192),
  AI_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.4),
  AI_ENABLE_REPAIR: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  AI_DAILY_OPERATION_LIMIT: z.coerce.number().int().positive().default(40),
  AI_STORE_DEBUG_PAYLOADS: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  AUTH_SECRET: z.string().min(32),
  AUTH_TRUST_HOST: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
  /** Destination discovery provider. MVP supports internal catalog only. */
  DESTINATION_PROVIDER: z.enum(["internal"]).default("internal"),
  IGNAV_API_KEY: z.string().min(1).optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Client-exposed environment schema.
 * Only NEXT_PUBLIC_* variables may appear here.
 */
export const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url().optional(),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
