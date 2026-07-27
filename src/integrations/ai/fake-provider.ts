import "server-only";

import type {
  AiGenerateStructuredRequest,
  AiGenerateStructuredResult,
  AiProvider,
  AiProviderCapabilities,
} from "@/integrations/ai/types";

export type FakeAiScenario =
  | "success"
  | "timeout"
  | "rate_limit"
  | "malformed"
  | "schema_invalid"
  | "safety"
  | "transient_then_success";

/**
 * Deterministic provider for tests and local development without API keys.
 */
export class FakeAiProvider implements AiProvider {
  readonly name = "fake";
  private calls = 0;
  private scenario: FakeAiScenario = "success";
  private responseFactory: ((request: AiGenerateStructuredRequest) => string) | null =
    null;

  setScenario(scenario: FakeAiScenario) {
    this.scenario = scenario;
    this.calls = 0;
  }

  setResponseFactory(factory: (request: AiGenerateStructuredRequest) => string) {
    this.responseFactory = factory;
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
    return { ok: true, provider: this.name };
  }

  async generateStructured(
    request: AiGenerateStructuredRequest,
  ): Promise<AiGenerateStructuredResult> {
    this.calls += 1;
    const started = Date.now();

    if (this.scenario === "timeout") {
      const { AppError } = await import("@/lib/errors");
      throw new AppError({
        code: "AI_PROVIDER_TIMEOUT",
        message: "The AI provider timed out. Please try again.",
        status: 504,
      });
    }
    if (this.scenario === "rate_limit") {
      const { AppError } = await import("@/lib/errors");
      throw new AppError({
        code: "AI_PROVIDER_RATE_LIMITED",
        message: "The AI provider is temporarily rate limited. Please try again shortly.",
        status: 429,
      });
    }
    if (this.scenario === "safety") {
      const { AppError } = await import("@/lib/errors");
      throw new AppError({
        code: "AI_PROVIDER_REJECTED",
        message: "The AI provider rejected this request for safety reasons.",
        status: 422,
      });
    }
    if (this.scenario === "transient_then_success" && this.calls === 1) {
      const { AppError } = await import("@/lib/errors");
      throw new AppError({
        code: "AI_PROVIDER_UNAVAILABLE",
        message: "The AI provider is temporarily unavailable.",
        status: 502,
      });
    }

    let text: string;
    if (this.scenario === "malformed") {
      text = "<<<not-json>>>";
    } else if (this.scenario === "schema_invalid") {
      text = JSON.stringify({ unexpected: true });
    } else if (this.responseFactory) {
      text = this.responseFactory(request);
    } else {
      text = defaultStructuredResponse(request);
    }

    return {
      text,
      usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 },
      finishReason: "STOP",
      providerRequestId: `fake-${this.calls}`,
      latencyMs: Date.now() - started,
      model: "fake",
      provider: this.name,
    };
  }
}

let sharedFake: FakeAiProvider | null = null;

export function getSharedFakeAiProvider(): FakeAiProvider {
  if (!sharedFake) sharedFake = new FakeAiProvider();
  return sharedFake;
}

function defaultStructuredResponse(request: AiGenerateStructuredRequest): string {
  if (request.operation === "DESTINATION_RECOMMENDATION") {
    const ids = [...request.userPrompt.matchAll(/"id":"([^"]+)"/g)].map((m) => m[1]!);
    const picks = ids.slice(0, 3);
    while (picks.length < 3) picks.push(`missing-${picks.length}`);
    return JSON.stringify({
      summary: "Fake catalog-grounded recommendations for testing.",
      recommendations: picks.map((id, index) => ({
        rank: index + 1,
        destinationMode: id.startsWith("missing") ? "MANUAL" : "CATALOG",
        destinationId: id.startsWith("missing") ? null : id,
        manualDestination: id.startsWith("missing")
          ? { name: "Test Town", countryCode: "PT" }
          : null,
        name: id.startsWith("missing") ? "Test Town" : `Destination ${index + 1}`,
        countryCode: "PT",
        reason: "Matches the stated interests in this fake response.",
        matchingInterests: ["FOOD"],
        budgetFit: "FIT",
        durationFit: "FIT",
        potentialTradeoffs: ["Crowds in peak season"],
        suggestedTripTitle: `Trip to destination ${index + 1}`,
        confidence: index === 0 ? "HIGH" : "MEDIUM",
      })),
    });
  }

  if (request.operation === "ITINERARY_GENERATION") {
    const dates = [...request.userPrompt.matchAll(/"date":"(\d{4}-\d{2}-\d{2})"/g)].map(
      (m) => m[1]!,
    );
    const cities = [
      ...request.userPrompt.matchAll(/"name(?:Tr)?":"([^"]+)"/g),
    ].map((m) => m[1]!);
    const uniqueDates = [...new Set(dates)];
    const cityName = cities[0] ?? "şehir";
    const schedulePad =
      " Yerel kafede kısa bir mola ver, ana caddelerde yürüyüş yap ve akşamüstü ışığında fotoğraf çekmek için açık bir noktaya geç. ";
    return JSON.stringify({
      titleSuggestion: `${cityName} gezi planı`,
      summary:
        "Gemini yoğun olduğu için geçici bir örnek plan üretildi. Kaydetmeden önce gözden geçir; gerçek AI ile tekrar deneyebilirsin.",
      assumptions: ["Rate-limit fallback: örnek plan"],
      warnings: ["Bu plan gerçek zamanlı AI yerine yedek senaryodan geldi"],
      days: uniqueDates.map((date, index) => {
        const focus = cities[index % Math.max(cities.length, 1)] ?? cityName;
        const scheduleText = [
          `09:30 — Güne ${focus} merkezinde kahvaltı ve kısa bir oryantasyon yürüyüşüyle başla.`,
          `11:00 — Bölgenin öne çıkan müzesi veya tarihi meydanını gez; çevredeki sokaklara da vakit ayır.`,
          `13:00 — Yerel bir restoranda öğle yemeği ye; menüde bölgesel lezzetlere bak.`,
          `15:00 — Öğleden sonra park, sahil veya bakış terası gibi daha sakin bir noktaya geç.`,
          `18:30 — Akşamüstü mahallede dolaş, hediyelik bir şey bak veya gün batımını izle.`,
          `20:00 — Akşam yemeği ve günün özeti; yarın için yakın bir semti not et.`,
          schedulePad,
          `Bu günün teması ${focus} keşfi; temponu dengeli tut, fazla koşturma.`,
        ].join("\n");
        return {
          dayNumber: index + 1,
          date,
          theme: `${focus} keşfi`,
          cityName: focus,
          scheduleText,
          eventsHighlight: null,
          notes: null,
          items: [],
        };
      }),
    });
  }

  if (request.operation === "ITINERARY_EDIT") {
    const itemId =
      request.userPrompt.match(/"id":"([^"]+)"/)?.[1] ?? "item-unknown";
    return JSON.stringify({
      summary: "Make the plan slightly more relaxed.",
      warnings: [],
      operations: [
        {
          operation: "UPDATE_ITEM",
          itemId,
          changes: { title: "Relaxed activity" },
          reason: "Reduce intensity",
        },
      ],
    });
  }

  if (request.operation === "ITINERARY_DAY_REGENERATION") {
    const dayId =
      request.userPrompt.match(/"id":"([^"]+)"/)?.[1] ?? "day-unknown";
    return JSON.stringify({
      summary: "Regenerated day with outdoor focus.",
      warnings: [],
      dayId,
      theme: "Outdoor day",
      notes: null,
      preservedItemIds: [],
      replacementItems: [
        {
          type: "NATURE",
          title: "Park visit",
          description: null,
          locationName: "Central park",
          startTime: "10:00",
          endTime: "12:00",
          durationMinutes: 120,
          estimatedCostMinor: 0,
          currencyCode: "USD",
          transportationMode: "WALK",
          notes: null,
        },
      ].map((item) => ({ ...item, type: "ATTRACTION" })),
    });
  }

  if (request.operation === "ITINERARY_ITEM_REPLACEMENT") {
    const itemId =
      request.userPrompt.match(/"id":"([^"]+)"/)?.[1] ?? "item-unknown";
    return JSON.stringify({
      summary: "Replaced with an outdoor activity.",
      warnings: [],
      itemId,
      replacement: {
        type: "ATTRACTION",
        title: "Outdoor overlook",
        description: "Fresh air stop",
        locationName: "Viewpoint",
        startTime: "10:00",
        endTime: "11:30",
        durationMinutes: 90,
        estimatedCostMinor: 0,
        currencyCode: "USD",
        transportationMode: "WALK",
        notes: null,
      },
      reason: "Matches outdoor preference",
    });
  }

  return JSON.stringify({ ok: true });
}
