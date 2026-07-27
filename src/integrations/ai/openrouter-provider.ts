import "server-only";

import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logging/logger";
import { AI_DEFAULTS } from "@/server/domain/ai/constants";
import type {
  AiGenerateStructuredRequest,
  AiGenerateStructuredResult,
  AiProvider,
  AiProviderCapabilities,
} from "@/integrations/ai/types";

type OpenRouterChatResponse = {
  id?: string;
  model?: string;
  choices?: Array<{
    message?: { content?: string | null; role?: string };
    finish_reason?: string | null;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: { message?: string; code?: number | string; type?: string };
};

const DEBUG_PAYLOADS = process.env.AI_STORE_DEBUG_PAYLOADS === "true";
const PROMPT_LOG_LIMIT = 12_000;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

function truncateForLog(text: string, max = PROMPT_LOG_LIMIT): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…[+${text.length - max} chars]`;
}

/** gpt-oss requires reasoning; other free models prefer it off to save tokens. */
function reasoningConfigForModel(model: string) {
  if (model.includes("gpt-oss")) {
    return { effort: "low" as const, exclude: true };
  }
  return { effort: "none" as const, exclude: true };
}

/**
 * OpenAI-compatible OpenRouter client (e.g. free Nemotron via `:free` models).
 */
export class OpenRouterAiProvider implements AiProvider {
  readonly name = "openrouter";

  constructor(
    private readonly apiKey: string,
    private readonly model: string = "openai/gpt-oss-20b:free",
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
      if (DEBUG_PAYLOADS) {
        logger.info("OpenRouter request payload", {
          model: this.model,
          operation: request.operation,
          systemPrompt: truncateForLog(request.systemPrompt),
          userPrompt: truncateForLog(userContent),
          temperature: request.temperature ?? AI_DEFAULTS.temperature,
          maxOutputTokens:
            request.maxOutputTokens ?? AI_DEFAULTS.maxOutputTokens,
        });
      }

      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.APP_URL ?? "http://localhost:3000",
          "X-Title": "Roavo",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          temperature: request.temperature ?? AI_DEFAULTS.temperature,
          max_tokens: request.maxOutputTokens ?? AI_DEFAULTS.maxOutputTokens,
          response_format: { type: "json_object" },
          reasoning: reasoningConfigForModel(this.model),
          include_reasoning: false,
          messages: [
            { role: "system", content: request.systemPrompt },
            { role: "user", content: userContent },
          ],
        }),
      });

      const payload = (await response.json()) as OpenRouterChatResponse;

      if (!response.ok) {
        const status = response.status;
        const providerMessage = payload.error?.message;
        logger.warn("OpenRouter provider error response", {
          model: this.model,
          operation: request.operation,
          providerStatus: status,
          providerMessage: providerMessage ?? null,
          responseBody: truncateForLog(JSON.stringify(payload)),
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
            message:
              "OpenRouter API anahtarı geçersiz. OPENROUTER_API_KEY değerini kontrol et.",
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

      const text = payload.choices?.[0]?.message?.content?.trim() ?? "";

      if (DEBUG_PAYLOADS) {
        logger.info("OpenRouter response payload", {
          model: payload.model ?? this.model,
          operation: request.operation,
          finishReason: payload.choices?.[0]?.finish_reason ?? null,
          usage: payload.usage ?? null,
          text: truncateForLog(text),
        });
      }

      if (!text) {
        throw new AppError({
          code: "AI_OUTPUT_INVALID",
          message: "AI boş yanıt döndü.",
          status: 502,
          metadata: {
            finishReason: payload.choices?.[0]?.finish_reason ?? null,
          },
        });
      }

      // Reasoning models sometimes dump chain-of-thought instead of JSON.
      const jsonStart = text.search(/[\[{]/);
      if (jsonStart < 0) {
        throw new AppError({
          code: "AI_OUTPUT_INVALID",
          message:
            "AI JSON yerine açıklama metni döndü. Alternatif modele geçiliyor.",
          status: 502,
          metadata: {
            finishReason: payload.choices?.[0]?.finish_reason ?? null,
            preview: text.slice(0, 200),
          },
        });
      }

      return {
        text,
        usage: {
          inputTokens: payload.usage?.prompt_tokens ?? null,
          outputTokens: payload.usage?.completion_tokens ?? null,
          totalTokens: payload.usage?.total_tokens ?? null,
        },
        finishReason: payload.choices?.[0]?.finish_reason ?? null,
        providerRequestId: payload.id ?? null,
        latencyMs: Date.now() - started,
        model: payload.model ?? this.model,
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
