import { describe, expect, it } from "vitest";

import { extractJsonText, parseJsonSafe } from "@/integrations/ai/json-extract";
import { createRequestFingerprint } from "@/server/domain/ai/fingerprint";
import { destinationRecommendationResultSchema } from "@/integrations/ai/output-schemas";
import { destinationRecommendationPromptV1 } from "@/integrations/ai/prompts/destination-recommendation/v1";

describe("extractJsonText", () => {
  it("accepts raw JSON", () => {
    expect(extractJsonText('{"a":1}')).toBe('{"a":1}');
  });

  it("unwraps markdown fences", () => {
    expect(extractJsonText('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("parses leading prose", () => {
    const parsed = parseJsonSafe('Here you go:\n{"ok":true}');
    expect(parsed).toEqual({ ok: true });
  });
});

describe("request fingerprint", () => {
  it("is deterministic", () => {
    const a = createRequestFingerprint({ op: "x", n: 1 });
    const b = createRequestFingerprint({ n: 1, op: "x" });
    expect(a).toBe(b);
  });
});

describe("destination recommendation prompt", () => {
  it("uses versioned key and delimits user content", () => {
    expect(destinationRecommendationPromptV1.key).toBe("destination-recommendation");
    expect(destinationRecommendationPromptV1.version).toBe("v1");
    const user = destinationRecommendationPromptV1.buildUserPrompt({
      request: {
        originName: "Istanbul",
        startDate: "2026-08-01",
        endDate: "2026-08-05",
        travelerCount: 2,
        currencyCode: "EUR",
        travelPace: "BALANCED",
        interests: ["FOOD"],
        destinationTypes: ["CITY"],
        climatePreference: "MILD",
        travelCompanionType: "COUPLE",
        preferredCountries: [],
      },
      candidates: [
        {
          id: "d1",
          name: "Lisbon",
          countryCode: "PT",
          countryName: "Portugal",
          regionName: null,
          type: "CITY",
          budgetLevel: "MODERATE",
          categories: ["FOOD"],
          bestFor: ["COUPLES"],
          shortDescription: "Atlantic light",
          minimumRecommendedDays: 3,
          maximumRecommendedDays: 5,
        },
      ],
    });
    expect(user).toContain("USER_REQUEST_BEGIN");
    expect(user).toContain("CANDIDATE_DESTINATIONS_BEGIN");
    expect(user).not.toContain("@");
  });
});

describe("destinationRecommendationResultSchema", () => {
  it("accepts valid recommendations", () => {
    const parsed = destinationRecommendationResultSchema.safeParse({
      summary: "Top picks",
      recommendations: [1, 2, 3].map((rank) => ({
        rank,
        destinationMode: "CATALOG",
        destinationId: `d${rank}`,
        manualDestination: null,
        name: `City ${rank}`,
        countryCode: "PT",
        reason: "Fits interests",
        matchingInterests: ["FOOD"],
        budgetFit: "FIT",
        durationFit: "FIT",
        potentialTradeoffs: ["Crowds"],
        suggestedTripTitle: `Trip ${rank}`,
        confidence: "HIGH",
      })),
    });
    expect(parsed.success).toBe(true);
  });
});
