import "server-only";

import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logging/logger";
import {
  AI_DEFAULTS,
  AI_MODEL_PRICING_USD_PER_MILLION,
} from "@/server/domain/ai/constants";
import type {
  AiGenerateStructuredRequest,
  AiGenerateStructuredResult,
  AiProvider,
  AiProviderCapabilities,
} from "@/integrations/ai/types";

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    thoughtsTokenCount?: number;
    totalTokenCount?: number;
  };
  error?: { message?: string; code?: number; status?: string };
};

const DEBUG_PAYLOADS = process.env.AI_STORE_DEBUG_PAYLOADS === "true";
const PROMPT_LOG_LIMIT = 12_000;

function truncateForLog(text: string, max = PROMPT_LOG_LIMIT): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…[+${text.length - max} chars]`;
}

function buildThinkingConfig(model: string): Record<string, unknown> | undefined {
  const normalized = model.toLowerCase();
  // Gemini 3.x: thinking cannot be fully disabled — use minimal level for speed.
  if (normalized.includes("gemini-3") || normalized.includes("3.5-flash") || normalized.includes("3.1-")) {
    return { thinkingLevel: "minimal" };
  }
  // Gemini 2.5 Flash family: budget 0 disables thinking for faster JSON output.
  if (normalized.includes("2.5-flash") || normalized.includes("2.5-flash-lite")) {
    return { thinkingBudget: 0 };
  }
  return undefined;
}

export class GeminiAiProvider implements AiProvider {
  readonly name = "gemini";

  constructor(
    private readonly apiKey: string,
    private readonly model: string = AI_DEFAULTS.model,
  ) {}

  get modelId() {
    return this.model;
  }

  getCapabilities(): AiProviderCapabilities {
    return {
      structuredOutput: true,
      jsonMode: true,
      systemPrompt: true,
      temperature: true,
      tokenUsageReporting: true,
      cancellation: true,
    };
  }

  async healthCheck(): Promise<{ ok: boolean; provider: string }> {
    return { ok: Boolean(this.apiKey), provider: this.name };
  }

  async generateStructured(
    request: AiGenerateStructuredRequest,
  ): Promise<AiGenerateStructuredResult> {
    const started = Date.now();
    const timeoutMs = request.timeoutMs ?? AI_DEFAULTS.timeoutMs;
    const controller = new AbortController();
    let abortReason: "timeout" | "caller" | null = null;
    const timer = setTimeout(() => {
      abortReason = "timeout";
      controller.abort();
    }, timeoutMs);
    const onAbort = () => {
      abortReason = abortReason ?? "caller";
      controller.abort();
    };
    request.signal?.addEventListener("abort", onAbort);

    const userContent = `${request.userPrompt}\n\nReturn ONLY valid JSON matching this schema description:\n${request.schemaHint}`;

    try {
      const thinkingConfig = buildThinkingConfig(this.model);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

      if (DEBUG_PAYLOADS) {
        logger.info("Gemini request payload", {
          model: this.model,
          operation: request.operation,
          systemPrompt: truncateForLog(request.systemPrompt),
          userPrompt: truncateForLog(userContent),
          temperature: request.temperature ?? AI_DEFAULTS.temperature,
          maxOutputTokens:
            request.maxOutputTokens ?? AI_DEFAULTS.maxOutputTokens,
          thinkingConfig: thinkingConfig ?? null,
        });
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: request.systemPrompt }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: userContent }],
            },
          ],
          generationConfig: {
            temperature: request.temperature ?? AI_DEFAULTS.temperature,
            maxOutputTokens:
              request.maxOutputTokens ?? AI_DEFAULTS.maxOutputTokens,
            responseMimeType: "application/json",
            ...(thinkingConfig ? { thinkingConfig } : {}),
          },
        }),
      });

      const payload = (await response.json()) as GeminiResponse;

      if (!response.ok) {
        const status = response.status;
        const providerMessage = payload.error?.message;
        logger.warn("Gemini provider error response", {
          model: this.model,
          operation: request.operation,
          providerStatus: status,
          providerMessage: providerMessage ?? null,
          responseBody: truncateForLog(JSON.stringify(payload)),
          systemPrompt: truncateForLog(request.systemPrompt),
          userPrompt: truncateForLog(userContent),
        });
        if (status === 429) {
          throw new AppError({
            code: "AI_PROVIDER_RATE_LIMITED",
            message:
              "AI servisi şu an yoğun (rate limit). Birkaç dakika sonra tekrar dene.",
            status: 429,
            metadata: { providerStatus: status, providerMessage },
          });
        }
        if (status === 401 || status === 403) {
          throw new AppError({
            code: "AI_CONFIGURATION_INVALID",
            message: "AI yapılandırması geçersiz. API anahtarını kontrol et.",
            status: 500,
            metadata: { providerStatus: status, providerMessage },
          });
        }
        throw new AppError({
          code: "AI_PROVIDER_UNAVAILABLE",
          message: providerMessage
            ? `AI servisi geçici olarak kullanılamıyor: ${providerMessage}`
            : "AI servisi geçici olarak kullanılamıyor.",
          status: 502,
          metadata: { providerStatus: status, providerMessage },
        });
      }

      const text =
        payload.candidates?.[0]?.content?.parts
          ?.map((part) => part.text ?? "")
          .join("")
          .trim() ?? "";

      if (DEBUG_PAYLOADS) {
        logger.info("Gemini response payload", {
          model: this.model,
          operation: request.operation,
          finishReason: payload.candidates?.[0]?.finishReason ?? null,
          usage: payload.usageMetadata ?? null,
          text: truncateForLog(text),
        });
      }

      if (!text) {
        const finish = payload.candidates?.[0]?.finishReason ?? null;
        logger.warn("Gemini empty response", {
          model: this.model,
          operation: request.operation,
          finishReason: finish,
          responseBody: truncateForLog(JSON.stringify(payload)),
          systemPrompt: truncateForLog(request.systemPrompt),
          userPrompt: truncateForLog(userContent),
        });
        if (finish === "SAFETY") {
          throw new AppError({
            code: "AI_PROVIDER_REJECTED",
            message: "AI bu isteği güvenlik nedeniyle reddetti.",
            status: 422,
            metadata: { finishReason: finish },
          });
        }
        throw new AppError({
          code: "AI_OUTPUT_INVALID",
          message: "AI boş yanıt döndü.",
          status: 502,
          metadata: {
            finishReason: finish,
            thoughtsTokenCount: payload.usageMetadata?.thoughtsTokenCount ?? null,
          },
        });
      }

      const usage = payload.usageMetadata;
      return {
        text,
        usage: {
          inputTokens: usage?.promptTokenCount ?? null,
          outputTokens: usage?.candidatesTokenCount ?? null,
          totalTokens: usage?.totalTokenCount ?? null,
        },
        finishReason: payload.candidates?.[0]?.finishReason ?? null,
        providerRequestId: null,
        latencyMs: Date.now() - started,
        model: this.model,
        provider: this.name,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (
        error instanceof Error &&
        (error.name === "AbortError" || error.message.includes("aborted"))
      ) {
        throw new AppError({
          code: "AI_PROVIDER_TIMEOUT",
          message:
            abortReason === "caller"
              ? "İstek iptal edildi. Lütfen tekrar dene."
              : `AI yanıt vermedi (zaman aşımı, ${Math.round(timeoutMs / 1000)} sn). Lütfen tekrar dene.`,
          status: 504,
          metadata: {
            abortReason: abortReason ?? "unknown",
            timeoutMs,
            latencyMs: Date.now() - started,
            model: this.model,
          },
        });
      }
      throw new AppError({
        code: "AI_PROVIDER_UNAVAILABLE",
        message: "AI servisi geçici olarak kullanılamıyor.",
        status: 502,
        cause: error,
      });
    } finally {
      clearTimeout(timer);
      request.signal?.removeEventListener("abort", onAbort);
    }
  }
}

export function estimateCostMinorUsd(input: {
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
}): number | null {
  if (input.inputTokens == null || input.outputTokens == null) return null;
  const pricing =
    AI_MODEL_PRICING_USD_PER_MILLION[input.model] ??
    AI_MODEL_PRICING_USD_PER_MILLION["gemini-2.5-flash"];
  if (!pricing) return null;
  const usd =
    (input.inputTokens / 1_000_000) * pricing.input +
    (input.outputTokens / 1_000_000) * pricing.output;
  return Math.round(usd * 100);
}
