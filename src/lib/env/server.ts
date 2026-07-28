import "server-only";

import { serverEnvSchema, type ServerEnv } from "./schema";

function formatEnvIssues(error: {
  issues: Array<{ path: PropertyKey[]; message: string }>;
}) {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("; ");
}

let cachedEnv: ServerEnv | null = null;

/**
 * Validates and returns server environment variables.
 * Fails early with a clear message when required values are missing or invalid.
 */
export function getServerEnv(): ServerEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = serverEnvSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    APP_URL: process.env.APP_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    AI_PROVIDER: process.env.AI_PROVIDER,
    AI_MODEL: process.env.AI_MODEL,
    AI_FALLBACK_MODELS: process.env.AI_FALLBACK_MODELS || undefined,
    AI_OPENROUTER_FALLBACK_MODELS: process.env.AI_OPENROUTER_FALLBACK_MODELS || undefined,
    AI_API_KEY: process.env.AI_API_KEY || undefined,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || undefined,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || undefined,
    AI_TIMEOUT_MS: process.env.AI_TIMEOUT_MS,
    AI_MAX_RETRIES: process.env.AI_MAX_RETRIES,
    AI_MAX_OUTPUT_TOKENS: process.env.AI_MAX_OUTPUT_TOKENS,
    AI_TEMPERATURE: process.env.AI_TEMPERATURE,
    AI_ENABLE_REPAIR: process.env.AI_ENABLE_REPAIR ?? "true",
    AI_DAILY_OPERATION_LIMIT: process.env.AI_DAILY_OPERATION_LIMIT,
    AI_STORE_DEBUG_PAYLOADS: process.env.AI_STORE_DEBUG_PAYLOADS ?? "false",
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST ?? "true",
    DESTINATION_PROVIDER: process.env.DESTINATION_PROVIDER ?? "internal",
    IGNAV_API_KEY: process.env.IGNAV_API_KEY,
    TRAVELER_SCORE_FLIGHT_DAILY_CAP: process.env.TRAVELER_SCORE_FLIGHT_DAILY_CAP,
    TRAVELER_SCORE_PREVIEW_DAILY_CAP: process.env.TRAVELER_SCORE_PREVIEW_DAILY_CAP,
    TRAVELER_SCORE_LIKE_DAILY_CAP: process.env.TRAVELER_SCORE_LIKE_DAILY_CAP,
    TRAVELER_SCORE_LIKE_AMOUNT_MINOR: process.env.TRAVELER_SCORE_LIKE_AMOUNT_MINOR,
  });

  if (!parsed.success) {
    throw new Error(
      `Invalid server environment configuration: ${formatEnvIssues(parsed.error)}`,
    );
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

/** Soft validation for health checks — does not throw. */
export function getServerEnvSafe():
  { success: true; data: ServerEnv } | { success: false; error: string } {
  try {
    return { success: true, data: getServerEnv() };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Invalid environment",
    };
  }
}
