import "server-only";

import { getServerEnv } from "@/lib/env/server";
import { AppError } from "@/lib/errors";
import { FakeAiProvider, getSharedFakeAiProvider } from "@/integrations/ai/fake-provider";
import { GeminiAiProvider } from "@/integrations/ai/gemini-provider";
import { OpenRouterAiProvider } from "@/integrations/ai/openrouter-provider";
import type { AiProvider } from "@/integrations/ai/types";
import { AI_DEFAULTS } from "@/server/domain/ai/constants";

let cached: AiProvider | null = null;

const DEFAULT_GEMINI_FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
] as const;

export const DEFAULT_OPENROUTER_MODEL = "openai/gpt-oss-20b:free";

export function getAiProvider(override?: AiProvider): AiProvider {
  if (override) return override;
  if (cached) return cached;

  const env = getServerEnv();
  const providerName = env.AI_PROVIDER;
  const model = env.AI_MODEL ?? AI_DEFAULTS.model;

  if (providerName === "fake" || process.env.NODE_ENV === "test") {
    cached = getSharedFakeAiProvider();
    return cached;
  }

  if (providerName === "gemini") {
    const key = env.GEMINI_API_KEY ?? env.AI_API_KEY;
    if (!key) {
      if (env.NODE_ENV === "development") {
        cached = getSharedFakeAiProvider();
        return cached;
      }
      throw new AppError({
        code: "AI_CONFIGURATION_INVALID",
        message: "AI provider is not configured.",
        status: 500,
      });
    }
    cached = new GeminiAiProvider(key, model);
    return cached;
  }

  if (providerName === "openrouter") {
    const key = env.OPENROUTER_API_KEY ?? env.AI_API_KEY;
    if (!key) {
      throw new AppError({
        code: "AI_CONFIGURATION_INVALID",
        message:
          "OpenRouter yapılandırılmamış. OPENROUTER_API_KEY ekle (ücretsiz: openrouter.ai/keys).",
        status: 500,
      });
    }
    cached = new OpenRouterAiProvider(
      key,
      env.AI_MODEL || DEFAULT_OPENROUTER_MODEL,
    );
    return cached;
  }

  throw new AppError({
    code: "AI_CONFIGURATION_INVALID",
    message: `Unsupported AI provider: ${providerName}`,
    status: 500,
  });
}

/**
 * Alternate providers/models when the primary call is rate-limited or overloaded.
 * OpenRouter is tried before other Gemini models so a broken Gemini key doesn't
 * burn through rate limits before the free fallback runs.
 */
export function getFallbackAiProviders(): AiProvider[] {
  const env = getServerEnv();
  const providers: AiProvider[] = [];
  const primaryModel = (env.AI_MODEL ?? AI_DEFAULTS.model).trim();
  const geminiKey = env.GEMINI_API_KEY ?? env.AI_API_KEY;
  const openRouterKey = env.OPENROUTER_API_KEY ?? env.AI_API_KEY;

  if (openRouterKey) {
    const openRouterModels = (
      env.AI_OPENROUTER_FALLBACK_MODELS ?? DEFAULT_OPENROUTER_MODEL
    )
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    for (const model of [...new Set(openRouterModels)]) {
      if (env.AI_PROVIDER === "openrouter" && model === primaryModel) continue;
      providers.push(new OpenRouterAiProvider(openRouterKey, model));
    }
  }

  if (geminiKey) {
    const configured = (
      env.AI_FALLBACK_MODELS ?? DEFAULT_GEMINI_FALLBACK_MODELS.join(",")
    )
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const unique = [...new Set(configured)].filter((model) => {
      if (env.AI_PROVIDER === "gemini" && model === primaryModel) return false;
      return true;
    });
    for (const model of unique) {
      providers.push(new GeminiAiProvider(geminiKey, model));
    }
  }

  return providers;
}

export function resetAiProviderCache() {
  cached = null;
}

export type { FakeAiProvider };
