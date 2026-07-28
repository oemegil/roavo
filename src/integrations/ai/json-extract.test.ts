import { describe, expect, it } from "vitest";

import { parseJsonSafe, repairTruncatedJson } from "@/integrations/ai/json-extract";
import { generatedItinerarySchema } from "@/integrations/ai/output-schemas";

describe("parseJsonSafe", () => {
  it("repairs missing final closing brace", () => {
    const truncated = '{"a":1,"b":[{"c":2}]';
    expect(repairTruncatedJson(truncated)).toBe('{"a":1,"b":[{"c":2}]}');
    expect(parseJsonSafe(truncated)).toEqual({ a: 1, b: [{ c: 2 }] });
  });

  it("accepts narrative itinerary days", () => {
    const raw = JSON.stringify({
      titleSuggestion: "Test",
      summary: "Özet metni burada yeterince uzun ve rehber gibi.",
      assumptions: [],
      warnings: [],
      days: [
        {
          dayNumber: 1,
          date: "2026-10-29",
          theme: "Keşif",
          cityName: "Madrid",
          scheduleText:
            "10:00-12:00 — Plaza Mayor\nMadrid'in Habsburg döneminden kalma ana meydanı; çevresindeki kemerler altında yürürken şehrin kalbini hissedersiniz.\nİpucu: Öğleden önce daha sakindir.\n\n12:30-14:00 — Tapas molası\nYakın bir lokantada yerel lezzetlerle öğle molası. Bölgenin ritmini yakalamak için kısa bir yürüyüş daha ekleyin.",
          eventsHighlight: null,
          notes: null,
          places: [{ name: "Plaza Mayor", city: "Madrid" }],
        },
      ],
    }).slice(0, -1);

    const parsed = parseJsonSafe(raw);
    const result = generatedItinerarySchema.safeParse(parsed);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.days[0]?.scheduleText).toContain("Plaza Mayor");
      expect(result.data.days[0]?.cityName).toBe("Madrid");
    }
  });
});
